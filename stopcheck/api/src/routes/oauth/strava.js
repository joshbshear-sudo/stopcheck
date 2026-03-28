const express = require('express');
const axios = require('axios');
const { query } = require('../../config/database');
const { encrypt } = require('../../services/crypto');
const { oauthLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

// GET /api/oauth/strava/authorize
// Rider clicks Strava Connect button — redirect to Strava OAuth
router.get('/authorize', oauthLimiter, (req, res) => {
  const { rider_token } = req.query;
  if (!rider_token) {
    return res.status(400).json({ error: 'rider_token is required' });
  }

  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    redirect_uri: `${process.env.APP_URL || 'http://localhost:3000'}/api/oauth/strava/callback`,
    response_type: 'code',
    scope: 'activity:read_all',
    state: rider_token,
  });

  res.redirect(`https://www.strava.com/oauth/authorize?${params}`);
});

// GET /api/oauth/strava/callback
router.get('/callback', oauthLimiter, async (req, res) => {
  try {
    const { code, state: riderToken } = req.query;

    if (!code || !riderToken) {
      return res.status(400).json({ error: 'Invalid OAuth callback' });
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token, expires_at, athlete } = tokenResponse.data;

    // Look up rider by auth token
    const riderResult = await query(
      'SELECT id, event_id FROM riders WHERE auth_token = $1',
      [riderToken]
    );
    if (riderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    const rider = riderResult.rows[0];

    // Encrypt tokens before storing — AES-256-GCM per spec section 11.3
    const encryptedAccess = encrypt(access_token);
    const encryptedRefresh = refresh_token ? encrypt(refresh_token) : null;

    // Store encrypted tokens
    await query(
      `INSERT INTO oauth_tokens (rider_id, platform, access_token, refresh_token, expires_at, platform_user_id)
       VALUES ($1, 'strava', $2, $3, to_timestamp($4), $5)
       ON CONFLICT (rider_id, platform)
       DO UPDATE SET access_token = $2, refresh_token = $3, expires_at = to_timestamp($4),
                     platform_user_id = $5, updated_at = now()`,
      [rider.id, encryptedAccess, encryptedRefresh, expires_at, String(athlete.id)]
    );

    // Mark rider as connected
    await query(
      `UPDATE riders SET connected_at = now(), platform = 'strava' WHERE id = $1`,
      [rider.id]
    );

    // Redirect rider back to their hub page
    res.redirect(`/r/${riderToken}?connected=strava`);
  } catch (err) {
    res.status(500).json({ error: 'OAuth callback failed' });
  }
});

module.exports = router;
