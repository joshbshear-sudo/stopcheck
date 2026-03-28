/**
 * Token cleanup job — runs every 6 hours per spec section 11.3.
 *
 * - Purge expired access tokens
 * - Delete access tokens already marked DELETED (post-FIT-retrieval)
 * - Delete refresh tokens after event_window_end + 48 hours
 */

const { query } = require('../config/database');

async function cleanupTokens() {
  // 1. Delete access tokens that have expired
  const expiredResult = await query(
    `DELETE FROM oauth_tokens
     WHERE expires_at < now() AND access_token != 'DELETED'
     RETURNING id`
  );

  // 2. Delete refresh tokens for events whose window has closed + 48h
  const staleRefreshResult = await query(
    `DELETE FROM oauth_tokens ot
     USING riders r, events e
     WHERE ot.rider_id = r.id
       AND r.event_id = e.id
       AND e.event_window_end IS NOT NULL
       AND e.event_window_end + interval '48 hours' < now()
     RETURNING ot.id`
  );

  // 3. Clean up fully-deleted token rows (access_token = 'DELETED' and no refresh)
  const deletedResult = await query(
    `DELETE FROM oauth_tokens
     WHERE access_token = 'DELETED' AND (refresh_token IS NULL OR refresh_token = '')
     RETURNING id`
  );

  return {
    expired_removed: expiredResult.rowCount,
    stale_refresh_removed: staleRefreshResult.rowCount,
    deleted_cleaned: deletedResult.rowCount,
  };
}

// Schedule: every 6 hours
function startCleanupSchedule() {
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  setInterval(async () => {
    try {
      const result = await cleanupTokens();
      console.log('Token cleanup completed:', result);
    } catch (err) {
      console.error('Token cleanup error:', err.message);
    }
  }, SIX_HOURS);

  // Run once on startup
  cleanupTokens().catch(err => console.error('Initial token cleanup error:', err.message));
}

module.exports = { cleanupTokens, startCleanupSchedule };
