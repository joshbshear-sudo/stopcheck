const express = require('express');
const { query } = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

// POST /api/events/:eventId/riders (batch register)
// Requires organizer auth
// Free tier: max 50 riders per event unless unlocked or on paid plan
router.post('/:eventId/riders', authenticateJWT, async (req, res) => {
  try {
    const { eventId } = req.params;

    const eventCheck = await query(
      `SELECT e.id, e.unlocked, o.plan, o.sponsored, o.plan_expires_at
       FROM events e
       JOIN organizations o ON o.id = e.org_id
       WHERE e.id = $1 AND e.org_id = $2`,
      [eventId, req.org.id]
    );
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventCheck.rows[0];

    const { riders } = req.body;
    if (!Array.isArray(riders) || riders.length === 0) {
      return res.status(400).json({ error: 'riders array is required' });
    }

    // Free tier enforcement — sponsored orgs bypass all checks
    if (!event.sponsored) {
      const isPaid = event.unlocked
        || event.plan === 'season_pro'
        || event.plan === 'series'
        || (event.plan_expires_at && new Date(event.plan_expires_at) > new Date());

      if (!isPaid) {
        const currentCount = await query(
          'SELECT COUNT(*) as n FROM riders WHERE event_id = $1',
          [eventId]
        );
        const current = parseInt(currentCount.rows[0].n);
        const newTotal = current + riders.length;

        if (newTotal > 50) {
          return res.status(402).json({
            error: 'Free tier limit reached',
            message: `Free events support up to 50 riders. You have ${current} riders and are trying to add ${riders.length}. Upgrade to add more.`,
            current_count: current,
            limit: 50,
            upgrade_required: true,
          });
        }
      }
    }

    const results = [];
    for (const r of riders) {
      if (!r.name || !r.email) {
        return res.status(400).json({ error: 'Each rider needs name and email' });
      }
      const result = await query(
        `INSERT INTO riders (event_id, bib_number, name, email)
         VALUES ($1, $2, $3, $4)
         RETURNING id, event_id, bib_number, name, email, auth_token, connected_at, platform`,
        [eventId, r.bib_number || null, r.name, r.email]
      );
      results.push(result.rows[0]);
    }

    res.status(201).json(results);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/events/:eventId/riders/with-stops — riders + per-stop status for dashboard dots
// Must be before /:id route to avoid Express treating "with-stops" as an :id param
router.get('/:eventId/riders/with-stops', authenticateJWT, async (req, res) => {
  try {
    const riders = await query(
      `SELECT r.id, r.bib_number, r.name, r.email, r.auth_token, r.connected_at, r.platform,
              rs.compliance_pct, rs.dq_recommended, rs.dq_confirmed, rs.stops_passed, rs.stops_failed
       FROM riders r
       LEFT JOIN rider_summaries rs ON rs.rider_id = r.id
       WHERE r.event_id = $1
       ORDER BY r.name`,
      [req.params.eventId]
    );

    const compliance = await query(
      `SELECT cr.rider_id, cr.status, ss.sequence
       FROM compliance_results cr
       JOIN stop_signs ss ON ss.id = cr.stop_sign_id
       WHERE cr.event_id = $1
       ORDER BY ss.sequence`,
      [req.params.eventId]
    );

    const stopsByRider = {};
    for (const row of compliance.rows) {
      if (!stopsByRider[row.rider_id]) stopsByRider[row.rider_id] = [];
      stopsByRider[row.rider_id].push({ sequence: row.sequence, status: row.status });
    }

    const result = riders.rows.map(r => ({
      ...r,
      stop_statuses: stopsByRider[r.id] || [],
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/events/:eventId/riders
router.get('/:eventId/riders', authenticateJWT, async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, rs.compliance_pct, rs.dq_recommended, rs.dq_confirmed
       FROM riders r
       LEFT JOIN rider_summaries rs ON rs.rider_id = r.id
       WHERE r.event_id = $1
       ORDER BY r.name`,
      [req.params.eventId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/events/:eventId/riders/:id
router.get('/:eventId/riders/:id', authenticateJWT, async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, rs.compliance_pct, rs.stops_passed, rs.stops_failed,
              rs.stops_missed, rs.dq_recommended, rs.dq_confirmed,
              rs.dq_confirmed_at, rs.processed_at
       FROM riders r
       LEFT JOIN rider_summaries rs ON rs.rider_id = r.id
       WHERE r.id = $1 AND r.event_id = $2`,
      [req.params.id, req.params.eventId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/events/:eventId/riders/:id/compliance
router.get('/:eventId/riders/:id/compliance', authenticateJWT, async (req, res) => {
  try {
    const result = await query(
      `SELECT cr.*, ss.sequence, ss.location as stop_location, ss.crossing_guard
       FROM compliance_results cr
       JOIN stop_signs ss ON ss.id = cr.stop_sign_id
       WHERE cr.rider_id = $1 AND cr.event_id = $2
       ORDER BY ss.sequence`,
      [req.params.id, req.params.eventId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/events/:eventId/riders/:id/dq — Two-step DQ: recommend
// Per spec: no automatic DQ — organizer must click confirm
router.post('/:eventId/riders/:id/dq', authenticateJWT, async (req, res) => {
  try {
    const { action } = req.body; // 'confirm' or 'waive'

    if (action === 'confirm') {
      const result = await query(
        `UPDATE rider_summaries SET
           dq_confirmed = true,
           dq_confirmed_by = $1,
           dq_confirmed_at = now()
         WHERE rider_id = $2 AND event_id = $3
         RETURNING *`,
        [req.org.id, req.params.id, req.params.eventId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Rider summary not found' });
      }

      // Send DQ notification email
      const { sendDqEmail } = require('../jobs/emailJobs');
      sendDqEmail(req.params.id, req.params.eventId).catch(err =>
        console.error('DQ email failed:', err.message)
      );

      res.json(result.rows[0]);
    } else if (action === 'waive') {
      const result = await query(
        `UPDATE rider_summaries SET
           dq_confirmed = false,
           dq_confirmed_by = null,
           dq_confirmed_at = null
         WHERE rider_id = $1 AND event_id = $2
         RETURNING *`,
        [req.params.id, req.params.eventId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Rider summary not found' });
      }
      res.json(result.rows[0]);
    } else {
      res.status(400).json({ error: 'action must be "confirm" or "waive"' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rider-facing route — no JWT required, auth via URL token
// GET /api/rider/:authToken
router.get('/by-token/:authToken', async (req, res) => {
  try {
    const result = await query(
      `SELECT r.id, r.event_id, r.bib_number, r.name, r.connected_at, r.platform,
              e.name as event_name, e.event_date, e.course_file_url
       FROM riders r
       JOIN events e ON e.id = r.event_id
       WHERE r.auth_token = $1`,
      [req.params.authToken]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/rider/:authToken/results
router.get('/by-token/:authToken/results', async (req, res) => {
  try {
    const riderResult = await query(
      'SELECT id, event_id FROM riders WHERE auth_token = $1',
      [req.params.authToken]
    );
    if (riderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    const rider = riderResult.rows[0];

    const summary = await query(
      'SELECT * FROM rider_summaries WHERE rider_id = $1',
      [rider.id]
    );

    const details = await query(
      `SELECT cr.*, ss.sequence, ss.location as stop_location, ss.crossing_guard
       FROM compliance_results cr
       JOIN stop_signs ss ON ss.id = cr.stop_sign_id
       WHERE cr.rider_id = $1 AND cr.event_id = $2
       ORDER BY ss.sequence`,
      [rider.id, rider.event_id]
    );

    res.json({
      summary: summary.rows[0] || null,
      stops: details.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
