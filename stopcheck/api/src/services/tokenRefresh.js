/**
 * OAuth token refresh — handles expired access tokens.
 * Strava tokens expire every 6 hours and require refresh.
 * Garmin tokens expire after 3 months.
 * Per spec sections 4.1 and 4.2.
 */
const axios = require('axios');
const { query } = require('../config/database');
const { encrypt, decrypt } = require('./crypto');

async function refreshStravaToken(riderId) {
  const tokenResult = await query(
    `SELECT id, refresh_token, expires_at FROM oauth_tokens
     WHERE rider_id = $1 AND platform = 'strava'`,
    [riderId]
  );

  if (tokenResult.rows.length === 0) {
    throw new Error('No Strava token found for rider');
  }

  const row = tokenResult.rows[0];

  // Check if token is still valid
  if (row.expires_at && new Date(row.expires_at) > new Date()) {
    return; // Token still valid, no refresh needed
  }

  if (!row.refresh_token) {
    throw new Error('No refresh token available — rider must re-authorize');
  }

  const refreshToken = decrypt(row.refresh_token);

  const response = await axios.post('https://www.strava.com/oauth/token', {
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const { access_token, refresh_token: newRefresh, expires_at } = response.data;

  const encryptedAccess = encrypt(access_token);
  const encryptedRefresh = newRefresh ? encrypt(newRefresh) : encrypt(refreshToken);

  await query(
    `UPDATE oauth_tokens SET
       access_token = $1,
       refresh_token = $2,
       expires_at = to_timestamp($3),
       updated_at = now()
     WHERE id = $4`,
    [encryptedAccess, encryptedRefresh, expires_at, row.id]
  );

  return { access_token: encryptedAccess, expires_at };
}

async function refreshGarminToken(riderId) {
  const tokenResult = await query(
    `SELECT id, refresh_token, expires_at FROM oauth_tokens
     WHERE rider_id = $1 AND platform = 'garmin'`,
    [riderId]
  );

  if (tokenResult.rows.length === 0) {
    throw new Error('No Garmin token found for rider');
  }

  const row = tokenResult.rows[0];

  if (row.expires_at && new Date(row.expires_at) > new Date()) {
    return;
  }

  if (!row.refresh_token) {
    throw new Error('No refresh token available — rider must re-authorize');
  }

  const refreshToken = decrypt(row.refresh_token);

  const response = await axios.post('https://connect.garmin.com/oauth2/token',
    new URLSearchParams({
      client_id: process.env.GARMIN_CLIENT_ID,
      client_secret: process.env.GARMIN_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token, refresh_token: newRefresh, expires_in } = response.data;

  const encryptedAccess = encrypt(access_token);
  const encryptedRefresh = newRefresh ? encrypt(newRefresh) : encrypt(refreshToken);
  const expiresAt = new Date(Date.now() + (expires_in || 7776000) * 1000);

  await query(
    `UPDATE oauth_tokens SET
       access_token = $1,
       refresh_token = $2,
       expires_at = $3,
       updated_at = now()
     WHERE id = $4`,
    [encryptedAccess, encryptedRefresh, expiresAt, row.id]
  );

  return { access_token: encryptedAccess, expires_at: expiresAt };
}

module.exports = { refreshStravaToken, refreshGarminToken };
