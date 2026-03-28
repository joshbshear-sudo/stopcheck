const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// GET /api/podium/:eventId?q=search — no JWT required (tablet at finish line)
router.get('/:eventId', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) {
      return res.json([]);
    }

    const result = await query(
      `SELECT r.id, r.bib_number, r.name,
              rs.compliance_pct, rs.stops_passed, rs.stops_failed, rs.stops_missed,
              rs.dq_recommended, rs.dq_confirmed
       FROM riders r
       LEFT JOIN rider_summaries rs ON rs.rider_id = r.id
       WHERE r.event_id = $1
         AND (r.name ILIKE $2 OR r.bib_number = $3)
       ORDER BY r.name
       LIMIT 10`,
      [req.params.eventId, `%${q}%`, q]
    );

    const riderIds = result.rows.map(r => r.id);
    let stopResults = [];
    if (riderIds.length > 0) {
      const stopsQuery = await query(
        `SELECT cr.rider_id, cr.status, cr.min_speed_mph, cr.stop_duration_s,
                ss.sequence, ss.location as stop_location, ss.crossing_guard
         FROM compliance_results cr
         JOIN stop_signs ss ON ss.id = cr.stop_sign_id
         WHERE cr.rider_id = ANY($1)
         ORDER BY ss.sequence`,
        [riderIds]
      );
      stopResults = stopsQuery.rows;
    }

    const stopsByRider = {};
    for (const row of stopResults) {
      if (!stopsByRider[row.rider_id]) stopsByRider[row.rider_id] = [];
      stopsByRider[row.rider_id].push(row);
    }

    const riders = result.rows.map(r => ({
      ...r,
      stops: stopsByRider[r.id] || [],
    }));

    res.json(riders);
  } catch (err) {
    console.error('Podium search error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
