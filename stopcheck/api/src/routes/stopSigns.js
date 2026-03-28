const express = require('express');
const { query } = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateJWT);

// POST /api/events/:eventId/stop-signs (batch create)
router.post('/:eventId/stop-signs', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { stop_signs } = req.body;

    // Verify event belongs to this org
    const eventCheck = await query(
      'SELECT id FROM events WHERE id = $1 AND org_id = $2',
      [eventId, req.org.id]
    );
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!Array.isArray(stop_signs) || stop_signs.length === 0) {
      return res.status(400).json({ error: 'stop_signs array is required' });
    }

    const results = [];
    for (const s of stop_signs) {
      const result = await query(
        `INSERT INTO stop_signs (event_id, sequence, lat, lon, location, mile_marker, source,
           crossing_guard, guard_confirmed_by, guard_confirmed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          eventId, s.sequence, s.lat, s.lon,
          s.location || null, s.mile_marker || null, s.source || 'osm',
          s.crossing_guard || false, s.guard_confirmed_by || null,
          s.crossing_guard ? new Date().toISOString() : null,
        ]
      );
      results.push(result.rows[0]);
    }

    res.status(201).json(results);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/events/:eventId/stop-signs
router.get('/:eventId/stop-signs', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM stop_signs WHERE event_id = $1 ORDER BY sequence',
      [req.params.eventId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/events/:eventId/stop-signs/:id
router.put('/:eventId/stop-signs/:id', async (req, res) => {
  try {
    const { lat, lon, location, mile_marker, sequence, crossing_guard, guard_confirmed_by } = req.body;

    const result = await query(
      `UPDATE stop_signs SET
         lat = COALESCE($1, lat),
         lon = COALESCE($2, lon),
         location = COALESCE($3, location),
         mile_marker = COALESCE($4, mile_marker),
         sequence = COALESCE($5, sequence),
         crossing_guard = COALESCE($6, crossing_guard),
         guard_confirmed_by = COALESCE($7, guard_confirmed_by),
         guard_confirmed_at = CASE WHEN $6 = true THEN now() ELSE guard_confirmed_at END
       WHERE id = $8 AND event_id = $9
       RETURNING *`,
      [lat, lon, location, mile_marker, sequence, crossing_guard, guard_confirmed_by,
       req.params.id, req.params.eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stop sign not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/events/:eventId/stop-signs/:id
router.delete('/:eventId/stop-signs/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM stop_signs WHERE id = $1 AND event_id = $2 RETURNING id',
      [req.params.id, req.params.eventId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stop sign not found' });
    }
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
