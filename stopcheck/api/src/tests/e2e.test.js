/**
 * End-to-end test against live Supabase database.
 *
 * Tests the full flow:
 *   1. Register an organization
 *   2. Create an event with stop signs
 *   3. Register a rider
 *   4. Simulate FIT processing through Phase 1 engine
 *   5. Store compliance results in DB
 *   6. Verify all records via API queries
 *   7. Test DQ workflow (two-step confirmation)
 *   8. Clean up test data
 *
 * Run with: node src\tests\e2e.test.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '..', '..', '.env') });

// Set required env vars for crypto
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'e2e-test-jwt-secret-key-256bits!!!!!';
if (!process.env.TOKEN_ENCRYPTION_KEY) process.env.TOKEN_ENCRYPTION_KEY = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { encrypt, decrypt } = require('../services/crypto');
const { generateToken } = require('../middleware/auth');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const query = (text, params) => pool.query(text, params);

// Test state
const state = {};
let passed = 0;
let failed = 0;

async function assert(name, fn) {
  try {
    await fn();
    console.log('  PASS:', name);
    passed++;
  } catch (err) {
    console.error('  FAIL:', name);
    console.error('       ', err.message);
    failed++;
  }
}

function eq(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function ok(val, msg) {
  if (!val) throw new Error(msg || 'Expected truthy value');
}

async function cleanup() {
  console.log('\n--- Cleanup ---');
  try {
    if (state.orgId) {
      await query('DELETE FROM organizations WHERE id = $1', [state.orgId]);
      console.log('  Cleaned up test data.');
    }
  } catch (err) {
    console.error('  Cleanup error:', err.message);
  }
}

async function run() {
  console.log('StopCheck Phase 2 — End-to-End Test');
  console.log('===================================\n');

  // Verify DB connection
  console.log('--- Database Connection ---');
  await assert('Connect to Supabase', async () => {
    const r = await query('SELECT NOW() as t');
    ok(r.rows[0].t, 'Should return current timestamp');
    console.log('         Connected at:', r.rows[0].t);
  });

  // 1. Register organization
  console.log('\n--- Organization Registration ---');
  await assert('Create organization', async () => {
    const passwordHash = await bcrypt.hash('TestPassword123!', 12);
    const r = await query(
      `INSERT INTO organizations (name, email, password_hash)
       VALUES ($1, $2, $3) RETURNING *`,
      ['E2E Test Racing', 'e2e-test@stopcheck.io', passwordHash]
    );
    state.orgId = r.rows[0].id;
    eq(r.rows[0].name, 'E2E Test Racing');
    eq(r.rows[0].plan, 'free');
    ok(state.orgId, 'Should have UUID');
  });

  await assert('Generate JWT for organizer', async () => {
    const token = generateToken({ id: state.orgId, email: 'e2e-test@stopcheck.io' });
    ok(token.length > 50, 'JWT should be a long string');
    state.jwt = token;
  });

  await assert('Verify password hash with bcrypt', async () => {
    const r = await query('SELECT password_hash FROM organizations WHERE id = $1', [state.orgId]);
    const valid = await bcrypt.compare('TestPassword123!', r.rows[0].password_hash);
    eq(valid, true, 'Password should match');
  });

  // 2. Create event
  console.log('\n--- Event Creation ---');
  await assert('Create event with stop duration and geofence config', async () => {
    const r = await query(
      `INSERT INTO events (org_id, name, event_date, location, stop_duration_sec,
         geofence_radius_m, event_window_start, event_window_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        state.orgId, 'Gravel Worlds E2E', '2026-06-15', 'Lincoln, NE',
        3.0, 20.0,
        '2026-06-15T07:00:00Z', '2026-06-15T16:00:00Z',
      ]
    );
    state.eventId = r.rows[0].id;
    eq(r.rows[0].name, 'Gravel Worlds E2E');
    eq(r.rows[0].stop_duration_sec, 3.0);
    eq(r.rows[0].geofence_radius_m, 20.0);
    eq(r.rows[0].status, 'setup');
    ok(r.rows[0].event_window_start, 'Event window start should be set');
    ok(r.rows[0].event_window_end, 'Event window end should be set');
  });

  // 3. Add stop signs (including one with crossing guard)
  console.log('\n--- Stop Signs ---');
  await assert('Add 3 stop signs (1 with crossing guard)', async () => {
    const stops = [
      { seq: 1, lat: 40.8000, lon: -96.6700, loc: 'Hwy 6 & CR 110', guard: false },
      { seq: 2, lat: 40.8100, lon: -96.6800, loc: 'W Van Dorn & SW 27th', guard: true },
      { seq: 3, lat: 40.8200, lon: -96.6900, loc: 'Pioneers Blvd & S 56th', guard: false },
    ];
    for (const s of stops) {
      await query(
        `INSERT INTO stop_signs (event_id, sequence, lat, lon, location, source,
           crossing_guard, guard_confirmed_by, guard_confirmed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [state.eventId, s.seq, s.lat, s.lon, s.loc, 'osm',
         s.guard, s.guard ? 'Race Director' : null, s.guard ? new Date() : null]
      );
    }
    const r = await query('SELECT * FROM stop_signs WHERE event_id = $1 ORDER BY sequence', [state.eventId]);
    eq(r.rows.length, 3, 'Should have 3 stop signs');
    eq(r.rows[1].crossing_guard, true, 'Stop 2 should have crossing guard');
    state.stopSignIds = r.rows.map(s => s.id);
  });

  // 4. Register rider
  console.log('\n--- Rider Registration ---');
  await assert('Register rider with auth token', async () => {
    const r = await query(
      `INSERT INTO riders (event_id, bib_number, name, email)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [state.eventId, '42', 'Jane TestRider', 'jane@test.com']
    );
    state.riderId = r.rows[0].id;
    state.riderAuthToken = r.rows[0].auth_token;
    ok(state.riderAuthToken, 'Should have auto-generated auth token');
    eq(r.rows[0].platform, null, 'Should not be connected yet');
  });

  // 5. Simulate OAuth token storage (encrypted)
  console.log('\n--- OAuth Token Encryption ---');
  await assert('Store encrypted Strava tokens', async () => {
    const accessToken = 'strava_access_abc123xyz';
    const refreshToken = 'strava_refresh_def456';
    const encAccess = encrypt(accessToken);
    const encRefresh = encrypt(refreshToken);

    // Verify encrypted is NOT plaintext
    ok(!encAccess.includes(accessToken), 'Access token must be encrypted');
    ok(!encRefresh.includes(refreshToken), 'Refresh token must be encrypted');

    await query(
      `INSERT INTO oauth_tokens (rider_id, platform, access_token, refresh_token, expires_at, platform_user_id)
       VALUES ($1, 'strava', $2, $3, $4, $5)`,
      [state.riderId, encAccess, encRefresh, new Date(Date.now() + 6 * 3600000), '12345678']
    );

    // Mark rider as connected
    await query(
      `UPDATE riders SET connected_at = now(), platform = 'strava' WHERE id = $1`,
      [state.riderId]
    );
  });

  await assert('Decrypt tokens from DB matches originals', async () => {
    const r = await query(
      'SELECT access_token, refresh_token FROM oauth_tokens WHERE rider_id = $1',
      [state.riderId]
    );
    eq(decrypt(r.rows[0].access_token), 'strava_access_abc123xyz');
    eq(decrypt(r.rows[0].refresh_token), 'strava_refresh_def456');
  });

  // 6. Simulate FIT processing — write compliance results
  // (In production, the BullMQ worker calls the Python engine which strips
  //  the FIT file BEFORE these records are written. We simulate the output.)
  console.log('\n--- Compliance Results (simulated engine output) ---');
  await assert('Store per-stop compliance results', async () => {
    const results = [
      {
        stopId: state.stopSignIds[0], status: 'pass',
        minSpeed: 0.0, duration: 4.2, source: 'sensor',
        records: [{ timestamp: '2026-06-15T09:15:00Z', speed: 0.0, dist_from_stop: 8.3 }],
      },
      {
        stopId: state.stopSignIds[1], status: 'guard_waived',
        minSpeed: 2.1, duration: null, source: 'sensor',
        records: [{ timestamp: '2026-06-15T09:25:00Z', speed: 2.1, dist_from_stop: 12.0 }],
      },
      {
        stopId: state.stopSignIds[2], status: 'fail',
        minSpeed: 4.2, duration: 0.8, source: 'sensor',
        records: [{ timestamp: '2026-06-15T09:35:00Z', speed: 1.88, dist_from_stop: 5.5 }],
      },
    ];

    for (const r of results) {
      await query(
        `INSERT INTO compliance_results
           (rider_id, event_id, stop_sign_id, status, min_speed_mph, stop_duration_s, speed_source, raw_records)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [state.riderId, state.eventId, r.stopId, r.status, r.minSpeed, r.duration, r.source, JSON.stringify(r.records)]
      );
    }
  });

  await assert('Store rider summary with DQ recommendation', async () => {
    await query(
      `INSERT INTO rider_summaries
         (rider_id, event_id, compliance_pct, stops_passed, stops_failed, stops_missed, dq_recommended)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [state.riderId, state.eventId, 66.7, 2, 1, 0, true]
    );
  });

  // 7. Verify stored data
  console.log('\n--- Data Verification ---');
  await assert('Compliance results in DB match expected', async () => {
    const r = await query(
      `SELECT cr.status, cr.min_speed_mph, cr.stop_duration_s, cr.speed_source, ss.location, ss.crossing_guard
       FROM compliance_results cr
       JOIN stop_signs ss ON ss.id = cr.stop_sign_id
       WHERE cr.rider_id = $1
       ORDER BY ss.sequence`,
      [state.riderId]
    );
    eq(r.rows.length, 3, 'Should have 3 compliance results');

    // Stop 1: pass
    eq(r.rows[0].status, 'pass');
    eq(r.rows[0].min_speed_mph, 0.0);
    eq(r.rows[0].stop_duration_s, 4.2);

    // Stop 2: guard_waived (crossing guard posted, within event window)
    eq(r.rows[1].status, 'guard_waived');
    eq(r.rows[1].crossing_guard, true);

    // Stop 3: fail (4.2 mph rolling stop)
    eq(r.rows[2].status, 'fail');
    eq(r.rows[2].min_speed_mph, 4.2);

    console.log('         Stop 1:', r.rows[0].location, '->', r.rows[0].status, '(stopped', r.rows[0].stop_duration_s + 's)');
    console.log('         Stop 2:', r.rows[1].location, '->', r.rows[1].status, '(guard posted)');
    console.log('         Stop 3:', r.rows[2].location, '->', r.rows[2].status, '(min speed', r.rows[2].min_speed_mph, 'mph)');
  });

  await assert('Rider summary shows DQ recommended', async () => {
    const r = await query(
      'SELECT * FROM rider_summaries WHERE rider_id = $1',
      [state.riderId]
    );
    eq(r.rows.length, 1);
    eq(r.rows[0].compliance_pct, 66.7);
    eq(r.rows[0].stops_passed, 2);
    eq(r.rows[0].stops_failed, 1);
    eq(r.rows[0].dq_recommended, true);
    eq(r.rows[0].dq_confirmed, false, 'DQ must NOT be auto-confirmed');
    console.log('         Compliance:', r.rows[0].compliance_pct + '%');
    console.log('         DQ recommended:', r.rows[0].dq_recommended, '| DQ confirmed:', r.rows[0].dq_confirmed);
  });

  await assert('Raw records contain only stripped data (no lat/lon, no biometrics)', async () => {
    const r = await query(
      'SELECT raw_records FROM compliance_results WHERE rider_id = $1',
      [state.riderId]
    );
    for (const row of r.rows) {
      const records = row.raw_records;
      for (const rec of records) {
        ok(!('lat' in rec), 'Stripped records must not contain lat');
        ok(!('lon' in rec), 'Stripped records must not contain lon');
        ok(!('heart_rate' in rec), 'Stripped records must not contain heart_rate');
        ok(!('power' in rec), 'Stripped records must not contain power');
        ok(('timestamp' in rec), 'Stripped records must contain timestamp');
        ok(('speed' in rec), 'Stripped records must contain speed');
        ok(('dist_from_stop' in rec), 'Stripped records must contain dist_from_stop');
      }
    }
  });

  // 8. DQ workflow — two human steps
  console.log('\n--- DQ Workflow (two-step confirmation) ---');
  await assert('DQ is NOT auto-confirmed (requires organizer action)', async () => {
    const r = await query(
      'SELECT dq_confirmed, dq_confirmed_by FROM rider_summaries WHERE rider_id = $1',
      [state.riderId]
    );
    eq(r.rows[0].dq_confirmed, false, 'Must not be auto-confirmed');
    eq(r.rows[0].dq_confirmed_by, null, 'No confirming user yet');
  });

  await assert('Organizer confirms DQ (step 2)', async () => {
    await query(
      `UPDATE rider_summaries SET
         dq_confirmed = true,
         dq_confirmed_by = $1,
         dq_confirmed_at = now()
       WHERE rider_id = $2`,
      [state.orgId, state.riderId]
    );
    const r = await query(
      'SELECT dq_confirmed, dq_confirmed_by, dq_confirmed_at FROM rider_summaries WHERE rider_id = $1',
      [state.riderId]
    );
    eq(r.rows[0].dq_confirmed, true);
    eq(r.rows[0].dq_confirmed_by, state.orgId);
    ok(r.rows[0].dq_confirmed_at, 'Should have confirmation timestamp');
    console.log('         DQ confirmed by org:', r.rows[0].dq_confirmed_by);
    console.log('         DQ confirmed at:', r.rows[0].dq_confirmed_at);
  });

  await assert('Organizer can waive DQ (override)', async () => {
    await query(
      `UPDATE rider_summaries SET
         dq_confirmed = false,
         dq_confirmed_by = null,
         dq_confirmed_at = null
       WHERE rider_id = $1`,
      [state.riderId]
    );
    const r = await query(
      'SELECT dq_confirmed FROM rider_summaries WHERE rider_id = $1',
      [state.riderId]
    );
    eq(r.rows[0].dq_confirmed, false, 'DQ should be waived');
  });

  // 9. OAuth token lifecycle
  console.log('\n--- OAuth Token Lifecycle ---');
  await assert('Delete access token after FIT retrieval (simulated)', async () => {
    await query(
      `UPDATE oauth_tokens SET access_token = 'DELETED' WHERE rider_id = $1 AND platform = 'strava'`,
      [state.riderId]
    );
    const r = await query(
      'SELECT access_token FROM oauth_tokens WHERE rider_id = $1',
      [state.riderId]
    );
    eq(r.rows[0].access_token, 'DELETED');
  });

  await assert('Rider lookup by auth token works (rider-facing URL)', async () => {
    const r = await query(
      `SELECT r.name, r.platform, r.connected_at, e.name as event_name
       FROM riders r JOIN events e ON e.id = r.event_id
       WHERE r.auth_token = $1`,
      [state.riderAuthToken]
    );
    eq(r.rows[0].name, 'Jane TestRider');
    eq(r.rows[0].platform, 'strava');
    eq(r.rows[0].event_name, 'Gravel Worlds E2E');
    ok(r.rows[0].connected_at, 'Should show connected timestamp');
  });

  // 10. CASCADE delete test
  console.log('\n--- Cascade Delete ---');
  await assert('Deleting org cascades to events, stops, riders, results', async () => {
    // Count before
    const before = await query('SELECT COUNT(*) as n FROM compliance_results WHERE event_id = $1', [state.eventId]);
    eq(parseInt(before.rows[0].n), 3, 'Should have 3 results before delete');

    await query('DELETE FROM organizations WHERE id = $1', [state.orgId]);

    const afterEvents = await query('SELECT COUNT(*) as n FROM events WHERE id = $1', [state.eventId]);
    eq(parseInt(afterEvents.rows[0].n), 0, 'Events should be deleted');

    const afterResults = await query('SELECT COUNT(*) as n FROM compliance_results WHERE event_id = $1', [state.eventId]);
    eq(parseInt(afterResults.rows[0].n), 0, 'Compliance results should be deleted');

    state.orgId = null; // Already cleaned up
  });

  // Done
  await cleanup();
  await pool.end();

  console.log('\n===================================');
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log('===================================');

  if (failed > 0) process.exit(1);
}

run().catch(async (err) => {
  console.error('\nFATAL:', err.message);
  await cleanup();
  await pool.end();
  process.exit(1);
});
