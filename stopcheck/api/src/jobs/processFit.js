/**
 * process_fit worker — calls Phase 1 Python engine.
 *
 * CRITICAL: The Python engine's strip_fit_records() runs BEFORE any data
 * is written to the database. Full GPS tracks never touch PostgreSQL.
 * The FIT file is deleted from S3 immediately after processing.
 */

const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { query } = require('../config/database');
const { deleteFile } = require('../services/s3');
const { decrypt } = require('../services/crypto');
const axios = require('axios');

const ENGINE_DIR = path.resolve(__dirname, '..', '..', '..', 'engine');

async function processFit(job) {
  const { rider_id, event_id, fit_file_path, platform, activity_id, fit_file_url } = job.data;

  let localFitPath = null;

  try {
    // Step 1: Acquire FIT file (from S3, platform API, or webhook URL)
    localFitPath = path.join(os.tmpdir(), `stopcheck_${rider_id}_${Date.now()}.fit`);

    if (fit_file_path) {
      // Direct upload — download from S3
      await downloadFromS3(fit_file_path, localFitPath);
    } else if (platform === 'strava' && activity_id) {
      await downloadFromStrava(rider_id, activity_id, localFitPath);
    } else if (fit_file_url) {
      // Garmin/Wahoo — download from provided URL
      await downloadFromUrl(fit_file_url, localFitPath);
    } else {
      throw new Error('No FIT file source provided');
    }

    // Step 2: Get event stop signs
    const stopSignsResult = await query(
      'SELECT * FROM stop_signs WHERE event_id = $1 ORDER BY sequence',
      [event_id]
    );
    const stopSigns = stopSignsResult.rows;

    if (stopSigns.length === 0) {
      throw new Error('No stop signs defined for this event');
    }

    // Step 3: Get event config
    const eventResult = await query('SELECT * FROM events WHERE id = $1', [event_id]);
    if (eventResult.rows.length === 0) {
      throw new Error('Event not found');
    }
    const event = eventResult.rows[0];

    // Step 4: Write stop signs to temp JSON for the Python engine
    const stopsJsonPath = path.join(os.tmpdir(), `stops_${event_id}_${Date.now()}.json`);
    const stopsJson = stopSigns.map(s => ({
      id: s.id,
      event_id: s.event_id,
      sequence: s.sequence,
      lat: s.lat,
      lon: s.lon,
      location: s.location,
      crossing_guard: s.crossing_guard,
    }));
    fs.writeFileSync(stopsJsonPath, JSON.stringify(stopsJson));

    // Step 5: Call Python engine
    // The engine strips FIT data BEFORE returning results — only stop-zone
    // speed records come back. Full GPS track is never persisted.
    const reportPath = path.join(os.tmpdir(), `report_${rider_id}_${Date.now()}.json`);

    const engineArgs = [
      '-m', 'stopcheck_engine.cli',
      '--fit', localFitPath,
      '--stops', stopsJsonPath,
      '--output', reportPath,
      '--stop-duration', String(event.stop_duration_sec || 3.0),
      '--geofence-radius', String(event.geofence_radius_m || 20.0),
    ];

    // Strava streams are JSON, not binary FIT
    if (platform === 'strava') {
      engineArgs.push('--json-input');
    }

    // Pass event window for crossing guard waiver logic
    if (event.event_window_start) {
      engineArgs.push('--event-window-start', new Date(event.event_window_start).toISOString().replace('Z', ''));
    }
    if (event.event_window_end) {
      engineArgs.push('--event-window-end', new Date(event.event_window_end).toISOString().replace('Z', ''));
    }

    await new Promise((resolve, reject) => {
      execFile('python', engineArgs, {
        cwd: ENGINE_DIR,
        timeout: 120000,
      }, (err, stdout, stderr) => {
        if (err) reject(new Error(`Engine failed: ${stderr || err.message}`));
        else resolve(stdout);
      });
    });

    // Step 6: Read results
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

    // Step 7: Store compliance results in DB (stripped records only)
    for (const stop of report.stop_results) {
      await query(
        `INSERT INTO compliance_results
           (rider_id, event_id, stop_sign_id, status, min_speed_mph,
            stop_duration_s, speed_source, raw_records)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          rider_id, event_id, stop.stop_sign_id, stop.status,
          stop.min_speed_mph, stop.stop_duration_s, stop.speed_source,
          JSON.stringify(stop.evidence_records), // stripped records only
        ]
      );
    }

    // Step 8: Store rider summary
    await query(
      `INSERT INTO rider_summaries
         (rider_id, event_id, compliance_pct, stops_passed, stops_failed,
          stops_missed, dq_recommended, activity_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (rider_id)
       DO UPDATE SET compliance_pct = $3, stops_passed = $4, stops_failed = $5,
                     stops_missed = $6, dq_recommended = $7, activity_id = $8,
                     processed_at = now()`,
      [
        rider_id, event_id, report.compliance_pct,
        report.stops_passed, report.stops_failed, report.stops_missed,
        report.dq_recommended, activity_id || null,
      ]
    );

    // Step 9: Send compliance email
    const { sendComplianceEmail } = require('./emailJobs');
    await sendComplianceEmail(rider_id, event_id).catch(err =>
      console.error('Compliance email failed:', err.message)
    );

    // Step 10: Delete FIT file from S3 — immediate, per spec 11.2
    if (fit_file_path) {
      await deleteFile(fit_file_path);
    }

    // Step 10: Delete access token — no longer needed per spec 11.3
    if (platform && platform !== 'upload') {
      await query(
        `UPDATE oauth_tokens SET access_token = 'DELETED' WHERE rider_id = $1 AND platform = $2`,
        [rider_id, platform]
      );
    }

    // Cleanup temp files
    cleanupTempFiles([localFitPath, stopsJsonPath, reportPath]);

    return { success: true, compliance_pct: report.compliance_pct };
  } catch (err) {
    if (localFitPath) cleanupTempFiles([localFitPath]);
    throw err;
  }
}

async function downloadFromS3(s3Key, localPath) {
  // In production, use S3 GetObject. For now, write placeholder.
  const { getSignedDownloadUrl } = require('../services/s3');
  const url = await getSignedDownloadUrl(s3Key);
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(localPath, Buffer.from(response.data));
}

async function downloadFromStrava(riderId, activityId, localPath) {
  // Get encrypted token, decrypt, fetch activity streams
  const tokenResult = await query(
    `SELECT access_token FROM oauth_tokens WHERE rider_id = $1 AND platform = 'strava'`,
    [riderId]
  );
  if (tokenResult.rows.length === 0) {
    throw new Error('No Strava token found for rider');
  }

  const accessToken = decrypt(tokenResult.rows[0].access_token);

  // Fetch activity streams (latlng, velocity_smooth, time)
  const response = await axios.get(
    `https://www.strava.com/api/v3/activities/${activityId}/streams`,
    {
      params: { keys: 'latlng,velocity_smooth,time', key_by_type: true },
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  // Convert Strava streams to a minimal FIT-like format for the engine
  const streams = response.data;
  const records = buildRecordsFromStravaStreams(streams, activityId);
  fs.writeFileSync(localPath, JSON.stringify(records));
}

function buildRecordsFromStravaStreams(streams, activityId) {
  // This produces a JSON file the engine can consume
  // In production, we'd generate a proper FIT file
  return { strava_streams: streams, activity_id: activityId };
}

async function downloadFromUrl(url, localPath) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(localPath, Buffer.from(response.data));
}

function cleanupTempFiles(paths) {
  for (const p of paths) {
    try { if (p && fs.existsSync(p)) fs.unlinkSync(p); } catch {}
  }
}

module.exports = { processFit };
