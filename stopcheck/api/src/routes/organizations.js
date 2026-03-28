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
    const token = generateToken(org);
    res.json({ org, token });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/organizations/me
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, plan, sponsored, sponsor_charity_name, created_at FROM organizations WHERE id = $1',
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

module.exports = router;
