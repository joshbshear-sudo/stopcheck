/**
 * Seeds demo data for Phase 3 visual testing.
 * Creates an org, event, stops, rider with compliance results.
 * Prints the rider hub URL to visit.
 *
 * Run: node src/tests/seed_demo.js
 * Cleanup: node src/tests/seed_demo.js --cleanup
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '..', '..', '.env') });

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { encrypt } = require('../services/crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const query = (text, params) => pool.query(text, params);

const DEMO_EMAIL = 'phase3-demo@stopcheck.io';

async function cleanup() {
  await query("DELETE FROM organizations WHERE email = $1", [DEMO_EMAIL]);
  console.log('Demo data cleaned up.');
}

async function seed() {
  // Clean any previous demo data
  await cleanup();

  // Org
  const hash = await bcrypt.hash('Demo123!', 12);
  let r = await query(
    `INSERT INTO organizations (name, email, password_hash)
     VALUES ($1, $2, $3) RETURNING id`,
    ['Gravel Worlds Demo', DEMO_EMAIL, hash]
  );
  const orgId = r.rows[0].id;

  // Event
  r = await query(
    `INSERT INTO events (org_id, name, event_date, location, stop_duration_sec,
       geofence_radius_m, event_window_start, event_window_end)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [orgId, 'Gravel Worlds 2026 - 150 Mile', '2026-06-15', 'Lincoln, Nebraska',
     3.0, 20.0, '2026-06-15T07:00:00Z', '2026-06-15T16:00:00Z']
  );
  const eventId = r.rows[0].id;

  // Stop signs
  const stops = [
    { seq: 1, lat: 40.8000, lon: -96.6700, loc: 'Hwy 6 & CR 110 (Mile 12.4)', guard: false },
    { seq: 2, lat: 40.8100, lon: -96.6800, loc: 'W Van Dorn & SW 27th (Mile 24.1)', guard: true },
    { seq: 3, lat: 40.8200, lon: -96.6900, loc: 'Pioneers Blvd & S 56th (Mile 38.7)', guard: false },
    { seq: 4, lat: 40.8300, lon: -96.7000, loc: 'Old Cheney & S 70th (Mile 52.3)', guard: false },
    { seq: 5, lat: 40.8400, lon: -96.7100, loc: 'Pine Lake & S 84th (Mile 67.9)', guard: false },
  ];
  for (const s of stops) {
    await query(
      `INSERT INTO stop_signs (event_id, sequence, lat, lon, location, source, crossing_guard,
         guard_confirmed_by, guard_confirmed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [eventId, s.seq, s.lat, s.lon, s.loc, 'osm',
       s.guard, s.guard ? 'Race Director' : null, s.guard ? new Date() : null]
    );
  }
  const stopsResult = await query(
    'SELECT id, sequence FROM stop_signs WHERE event_id = $1 ORDER BY sequence', [eventId]
  );

  // Rider
  r = await query(
    `INSERT INTO riders (event_id, bib_number, name, email)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [eventId, '42', 'Sarah Martinez', 'sarah@example.com']
  );
  const riderId = r.rows[0].id;
  const authToken = r.rows[0].auth_token;

  // Simulate Strava connection
  await query(
    `INSERT INTO oauth_tokens (rider_id, platform, access_token, refresh_token, expires_at, platform_user_id)
     VALUES ($1, 'strava', $2, $3, $4, $5)`,
    [riderId, 'DELETED', encrypt('refresh_demo_xyz'), new Date(Date.now() + 86400000), '12345']
  );
  await query(
    `UPDATE riders SET connected_at = now(), platform = 'strava' WHERE id = $1`, [riderId]
  );

  // Compliance results
  const results = [
    { stopIdx: 0, status: 'pass', minSpeed: 0.0, duration: 4.2, source: 'sensor' },
    { stopIdx: 1, status: 'guard_waived', minSpeed: 4.47, duration: null, source: 'sensor' },
    { stopIdx: 2, status: 'fail', minSpeed: 4.03, duration: 0.0, source: 'sensor' },
    { stopIdx: 3, status: 'pass', minSpeed: 0.0, duration: 3.8, source: 'sensor' },
    { stopIdx: 4, status: 'pass', minSpeed: 0.15, duration: 5.1, source: 'gps_derived' },
  ];

  for (const cr of results) {
    const stopId = stopsResult.rows[cr.stopIdx].id;
    await query(
      `INSERT INTO compliance_results
         (rider_id, event_id, stop_sign_id, status, min_speed_mph, stop_duration_s, speed_source, raw_records)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [riderId, eventId, stopId, cr.status, cr.minSpeed, cr.duration, cr.source,
       JSON.stringify([
         { timestamp: '2026-06-15T09:15:00Z', speed: cr.minSpeed / 2.237, speed_mph: cr.minSpeed, dist_from_stop: 5.5 },
       ])]
    );
  }

  await query(
    `INSERT INTO rider_summaries
       (rider_id, event_id, compliance_pct, stops_passed, stops_failed, stops_missed, dq_recommended, activity_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [riderId, eventId, 80.0, 4, 1, 0, true, 'strava_demo_123']
  );

  console.log('\nDemo data seeded!');
  console.log('─────────────────────────────────────────────');
  console.log(`Rider Hub:     http://localhost:3000/r/${authToken}`);
  console.log(`Results Page:  http://localhost:3000/r/${authToken}/results`);
  console.log('─────────────────────────────────────────────');
  console.log(`Auth Token:    ${authToken}`);
  console.log(`Org ID:        ${orgId}`);
  console.log(`Event:         Gravel Worlds 2026 - 150 Mile`);
  console.log(`Rider:         Sarah Martinez (Bib #42)`);
  console.log(`Compliance:    80% (4 pass, 1 fail, DQ recommended)`);
  console.log('');
}

async function main() {
  try {
    if (process.argv.includes('--cleanup')) {
      await cleanup();
    } else {
      await seed();
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
