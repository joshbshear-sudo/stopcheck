const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const { query } = require('../../config/database');
const { encrypt } = require('../../services/crypto');
const { oauthLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

// In-memory PKCE verifier store (short-lived, per-request)
const pkceStore = new Map();

// GET /api/oauth/garmin/authorize
// Garmin uses OAuth2 with PKCE per spec section 4.2
router.get('/authorize', oauthLimiter, (req, res) => {
  const { rider_token } = req.query;
  if (!rider_token) {
    return res.status(400).json({ error: 'rider_token is required' });
  }

  // Generate PKCE challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  // Store verifier keyed by rider token (TTL: 10 minutes)
  pkceStore.set(rider_token, codeVerifier);
  setTimeout(() => pkceStore.delete(rider_token), 600000);

  const params = new URLSearchParams({
    client_id: process.env.GARMIN_CLIENT_ID,
    redirect_uri: `${process.env.APP_URL || 'http://localhost:3000'}/api/oauth/garmin/callback`,
    response_type: 'code',
    scope: 'activity:read',
    state: rider_token,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  res.redirect(`https://connect.garmin.com/oauth2Confirm?${params}`);
});

// GET /api/oauth/garmin/callback
router.get('/callback', oauthLimiter, async (req, res) => {
  try {
    const { code, state: riderToken } = req.query;
    if (!code || !riderToken) {
      return res.status(400).json({ error: 'Invalid OAuth callback' });
    }

    const codeVerifier = pkceStore.get(riderToken);
    if (!codeVerifier) {
      return res.status(400).json({ error: 'PKCE verifier expired or not found' });
    }
    pkceStore.delete(riderToken);

    // Exchange code for tokens with PKCE verifier
    const tokenResponse = await axios.post('https://connect.garmin.com/oauth2/token',
      new URLSearchParams({
        client_id: process.env.GARMIN_CLIENT_ID,
        client_secret: process.env.GARMIN_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.APP_URL || 'http://localhost:3000'}/api/oauth/garmin/callback`,
        code_verifier: codeVerifier,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

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
    const expiresAt = new Date(Date.now() + (expires_in || 7776000) * 1000); // default 90 days

    await query(
      `INSERT INTO oauth_tokens (rider_id, platform, access_token, refresh_token, expires_at)
       VALUES ($1, 'garmin', $2, $3, $4)
       ON CONFLICT (rider_id, platform)
       DO UPDATE SET access_token = $2, refresh_token = $3, expires_at = $4, updated_at = now()`,
      [rider.id, encryptedAccess, encryptedRefresh, expiresAt]
    );

    await query(
      `UPDATE riders SET connected_at = now(), platform = 'garmin' WHERE id = $1`,
      [rider.id]
    );

    res.redirect(`/r/${riderToken}?connected=garmin`);
  } catch (err) {
    res.status(500).json({ error: 'OAuth callback failed' });
  }
});

module.exports = router;
