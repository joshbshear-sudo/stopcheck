const express = require('express');
const bcrypt = require('bcrypt');
const { query } = require('../config/database');
const { authenticateJWT, generateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/organizations/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO organizations (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, plan, created_at`,
      [name, email, passwordHash]
    );

    const org = result.rows[0];
    const token = generateToken(org);
    res.status(201).json({ org, token });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed', detail: err.message });
  }
});

// POST /api/organizations/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const result = await query(
      'SELECT id, name, email, password_hash, plan FROM organizations WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const org = result.rows[0];
    const valid = await bcrypt.compare(password, org.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    delete org.password_hash;
    if (!process.env.JWT_SECRET) {
      console.error('LOGIN FATAL: JWT_SECRET is not set');
      return res.status(500).json({ error: 'Server misconfiguration', detail: 'JWT_SECRET not set' });
    }
    const token = generateToken(org);
    res.json({ org, token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed', detail: err.message });
  }
});

// GET /api/organizations/me
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, plan, sponsored, sponsor_charity_name,
              trial_events_used, trial_active, trial_started_at,
              tutorial_completed, tutorial_step, created_at
       FROM organizations WHERE id = $1`,
      [req.org.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/organizations/tutorial — update tutorial progress
router.put('/tutorial', authenticateJWT, async (req, res) => {
  try {
    const { step, completed } = req.body;
    const updates = [];
    const values = [];
    let paramIdx = 1;

    if (step !== undefined) { updates.push(`tutorial_step = $${paramIdx++}`); values.push(step); }
    if (completed !== undefined) { updates.push(`tutorial_completed = $${paramIdx++}`); values.push(completed); }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(req.org.id);
    await query(`UPDATE organizations SET ${updates.join(', ')} WHERE id = $${paramIdx}`, values);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update tutorial' });
  }
});

// POST /api/organizations/publish-event — increment trial_events_used
router.post('/publish-event', authenticateJWT, async (req, res) => {
  try {
    const org = await query(
      'SELECT trial_active, trial_events_used, sponsored, plan FROM organizations WHERE id = $1',
      [req.org.id]
    );
    const o = org.rows[0];

    // Sponsored orgs and paid plans bypass trial
    if (o.sponsored || (o.plan && o.plan !== 'free')) {
      return res.json({ allowed: true, trial_events_used: o.trial_events_used });
    }

    if (!o.trial_active || o.trial_events_used >= 5) {
      return res.status(402).json({
        error: 'Trial expired',
        message: 'Your free trial of 5 events is complete. Upgrade to create more events.',
        trial_events_used: o.trial_events_used,
        upgrade_required: true,
      });
    }

    const newCount = o.trial_events_used + 1;
    await query(
      'UPDATE organizations SET trial_events_used = $1, trial_active = $2 WHERE id = $3',
      [newCount, newCount < 5, req.org.id]
    );

    // OSM availability for this trial event
    const osmEnabled = [1, 2, 5].includes(newCount);

    res.json({ allowed: true, trial_events_used: newCount, osm_enabled: osmEnabled });
  } catch (err) {
    res.status(500).json({ error: 'Failed to publish event' });
  }
});

// GET /api/organizations/trial-status
router.get('/trial-status', authenticateJWT, async (req, res) => {
  try {
    const result = await query(
      'SELECT trial_events_used, trial_active, sponsored, plan FROM organizations WHERE id = $1',
      [req.org.id]
    );
    const o = result.rows[0];
    const nextEvent = o.trial_events_used + 1;
    const osmEnabled = [1, 2, 5].includes(nextEvent);

    res.json({
      trial_events_used: o.trial_events_used,
      trial_active: o.trial_active,
      events_remaining: Math.max(0, 5 - o.trial_events_used),
      osm_enabled_next: osmEnabled,
      sponsored: o.sponsored,
      plan: o.plan,
      bypass_trial: o.sponsored || (o.plan && o.plan !== 'free'),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get trial status' });
  }
});

module.exports = router;
