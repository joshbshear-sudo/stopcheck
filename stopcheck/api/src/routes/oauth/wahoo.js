const express = require('express');
const axios = require('axios');
const { query } = require('../../config/database');
const { encrypt } = require('../../services/crypto');
const { oauthLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

// GET /api/oauth/wahoo/authorize
router.get('/authorize', oauthLimiter, (req, res) => {
  const { rider_token } = req.query;
  if (!rider_token) {
    return res.status(400).json({ error: 'rider_token is required' });
  }

  const params = new URLSearchParams({
    client_id: process.env.WAHOO_CLIENT_ID,
    redirect_uri: `${process.env.APP_URL || 'http://localhost:3000'}/api/oauth/wahoo/callback`,
    response_type: 'code',
    scope: 'workouts_read',
    state: rider_token,
  });

  res.redirect(`https://api.wahooligan.com/oauth/authorize?${params}`);
});

// GET /api/oauth/wahoo/callback
router.get('/callback', oauthLimiter, async (req, res) => {
  try {
    const { code, state: riderToken } = req.query;
    if (!code || !riderToken) {
      return res.status(400).json({ error: 'Invalid OAuth callback' });
    }

    const tokenResponse = await axios.post('https://api.wahooligan.com/oauth/token', {
      client_id: process.env.WAHOO_CLIENT_ID,
      client_secret: process.env.WAHOO_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.APP_URL || 'http://localhost:3000'}/api/oauth/wahoo/callback`,
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    const riderResult = await query(
      'SELECT id, event_id FROM riders WHERE auth_token = $1',
      [riderToken]
    );
    if (riderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    const rider = riderResult.rows[0];
    const encryptedAccess = encrypt(access_token);
    const encryptedRefresh = refresh_token ? encrypt(refresh_token) : null;
    const expiresAt = new Date(Date.now() + (expires_in || 86400) * 1000);

    await query(
      `INSERT INTO oauth_tokens (rider_id, platform, access_token, refresh_token, expires_at)
       VALUES ($1, 'wahoo', $2, $3, $4)
       ON CONFLICT (rider_id, platform)
       DO UPDATE SET access_token = $2, refresh_token = $3, expires_at = $4, updated_at = now()`,
      [rider.id, encryptedAccess, encryptedRefresh, expiresAt]
    );

    await query(
      `UPDATE riders SET connected_at = now(), platform = 'wahoo' WHERE id = $1`,
      [rider.id]
    );

    res.redirect(`/r/${riderToken}?connected=wahoo`);
  } catch (err) {
    res.status(500).json({ error: 'OAuth callback failed' });
  }
});

module.exports = router;
