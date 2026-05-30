const express = require('express');
const { query } = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

// All event routes require organizer auth
router.use(authenticateJWT);

// POST /api/events
router.post('/', async (req, res) => {
  try {
    const {
      name, event_date, location, stop_duration_sec,
      geofence_radius_m, speed_threshold,
      event_window_start, event_window_end,
    } = req.body;

    if (!name || !event_date) {
      return res.status(400).json({ error: 'name and event_date are required' });
    }

    // Spec v2.0 §1.3/§1.4 internal-threshold defaults
    const result = await query(
      `INSERT INTO events (org_id, name, event_date, location, stop_duration_sec,
         geofence_radius_m, speed_threshold, event_window_start, event_window_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.org.id, name, event_date, location || null,
        stop_duration_sec || 0.75, geofence_radius_m || 25.0,
        speed_threshold || 0.5,
        event_window_start || null, event_window_end || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/events
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM events WHERE org_id = $1 ORDER BY event_date DESC',
      [req.org.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM events WHERE id = $1 AND org_id = $2',
      [req.params.id, req.org.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/events/:id
router.put('/:id', async (req, res) => {
  try {
    const {
      name, event_date, location, status, stop_duration_sec,
      geofence_radius_m, speed_threshold,
      course_file_url, event_window_start, event_window_end,
    } = req.body;

    const result = await query(
      `UPDATE events SET
         name = COALESCE($1, name),
         event_date = COALESCE($2, event_date),
         location = COALESCE($3, location),
         status = COALESCE($4, status),
         stop_duration_sec = COALESCE($5, stop_duration_sec),
         geofence_radius_m = COALESCE($6, geofence_radius_m),
         speed_threshold = COALESCE($7, speed_threshold),
         course_file_url = COALESCE($8, course_file_url),
         event_window_start = COALESCE($9, event_window_start),
         event_window_end = COALESCE($10, event_window_end)
       WHERE id = $11 AND org_id = $12
       RETURNING *`,
      [
        name, event_date, location, status, stop_duration_sec,
        geofence_radius_m, speed_threshold,
        course_file_url, event_window_start, event_window_end,
        req.params.id, req.org.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/events/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM events WHERE id = $1 AND org_id = $2 RETURNING id',
      [req.params.id, req.org.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
