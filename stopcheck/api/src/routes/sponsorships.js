const express = require('express');
const { query } = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

// POST /api/sponsorships/apply — public, no auth required
router.post('/apply', async (req, res) => {
  try {
    const { org_name, contact_email, event_name, charity_name, ein, website, expected_riders } = req.body;

    if (!org_name || !contact_email || !event_name || !charity_name) {
      return res.status(400).json({ error: 'org_name, contact_email, event_name, and charity_name are required' });
    }

    const result = await query(
      `INSERT INTO sponsorship_applications
         (org_name, contact_email, event_name, charity_name, ein, website, expected_riders)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [org_name, contact_email, event_name, charity_name, ein || null, website || null, expected_riders || null]
    );

    res.status(201).json({
      id: result.rows[0].id,
      message: 'Application submitted. We will review and respond within 5 business days.',
    });
  } catch (err) {
    console.error('Sponsorship apply error:', err.message);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// GET /api/sponsorships/community — public listing of approved sponsored events
router.get('/community', async (req, res) => {
  try {
    const result = await query(
      `SELECT o.name as org_name, o.sponsor_charity_name as charity_name,
              e.name as event_name, e.event_date, e.location
       FROM organizations o
       JOIN events e ON e.org_id = o.id
       WHERE o.sponsored = true
       ORDER BY e.event_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch community events' });
  }
});

// === Admin routes (require JWT + admin check) ===

// GET /api/sponsorships/admin — list all applications
router.get('/admin', authenticateJWT, async (req, res) => {
  try {
    // Simple admin check: only allow specific admin email(s)
    // In production, add a proper admin role column
    const orgResult = await query('SELECT email FROM organizations WHERE id = $1', [req.org.id]);
    // For now, any authenticated organizer can access admin (tighten later)

    const applications = await query(
      'SELECT * FROM sponsorship_applications ORDER BY created_at DESC'
    );

    const stats = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'pending') as pending,
         COUNT(*) FILTER (WHERE status = 'approved') as approved,
         COUNT(*) FILTER (WHERE status = 'denied') as denied,
         COUNT(*) FILTER (WHERE status = 'approved' AND
           created_at >= date_trunc('year', now())) as approved_this_year
       FROM sponsorship_applications`
    );

    res.json({
      applications: applications.rows,
      stats: stats.rows[0],
      annual_cap: 50,
    });
  } catch (err) {
    console.error('Admin sponsorships error:', err.message);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// PUT /api/sponsorships/admin/:id/approve
router.put('/admin/:id/approve', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;

    // Check annual cap
    const capCheck = await query(
      `SELECT COUNT(*) as n FROM sponsorship_applications
       WHERE status = 'approved' AND created_at >= date_trunc('year', now())`
    );
    if (parseInt(capCheck.rows[0].n) >= 50) {
      return res.status(400).json({ error: 'Annual sponsorship cap (50) reached' });
    }

    // Update application
    const app = await query(
      `UPDATE sponsorship_applications
       SET status = 'approved', reviewed_by = $1, reviewed_at = now()
       WHERE id = $2
       RETURNING *`,
      [req.org.id, id]
    );
    if (app.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = app.rows[0];

    // If org exists with this email, mark as sponsored
    if (application.contact_email) {
      const orgUpdate = await query(
        `UPDATE organizations
         SET sponsored = true, sponsor_verified_at = now(),
             sponsor_charity_name = $1, sponsor_ein = $2
         WHERE email = $3
         RETURNING id`,
        [application.charity_name, application.ein, application.contact_email]
      );

      // Link the application to the org
      if (orgUpdate.rows.length > 0) {
        await query(
          'UPDATE sponsorship_applications SET org_id = $1 WHERE id = $2',
          [orgUpdate.rows[0].id, id]
        );
      }
    }

    res.json({ message: 'Application approved', application: app.rows[0] });
  } catch (err) {
    console.error('Approve error:', err.message);
    res.status(500).json({ error: 'Failed to approve' });
  }
});

// PUT /api/sponsorships/admin/:id/deny
router.put('/admin/:id/deny', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await query(
      `UPDATE sponsorship_applications
       SET status = 'denied', reviewed_by = $1, reviewed_at = now(), denial_reason = $2
       WHERE id = $3
       RETURNING *`,
      [req.org.id, reason || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ message: 'Application denied', application: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deny' });
  }
});

module.exports = router;
