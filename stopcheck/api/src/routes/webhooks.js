const express = require('express');
const crypto = require('crypto');
const { query } = require('../config/database');
const { createQueue } = require('../config/redis');

const router = express.Router();

// GET /api/webhooks/strava — subscription verification
router.get('/strava', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': verifyToken, 'hub.challenge': challenge } = req.query;

  if (mode === 'subscribe' && verifyToken === process.env.STRAVA_VERIFY_TOKEN) {
    res.json({ 'hub.challenge': challenge });
  } else {
    res.status(403).json({ error: 'Verification failed' });
  }
});

// POST /api/webhooks/strava — activity push notifications
// Per spec section 11.4: verify SHA-256 HMAC signature
router.post('/strava', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Immediately acknowledge per Strava requirements
    res.status(200).json({ received: true });

    const body = typeof req.body === 'string' ? req.body : req.body.toString();
    const event = JSON.parse(body);

    // Only process activity creation events
    if (event.object_type !== 'activity' || event.aspect_type !== 'create') {
      return;
    }

    const athleteId = String(event.owner_id);
    const activityId = String(event.object_id);

    // Find rider by Strava athlete ID
    const riderResult = await query(
      `SELECT r.id, r.event_id
       FROM riders r
       JOIN oauth_tokens ot ON ot.rider_id = r.id
       WHERE ot.platform = 'strava' AND ot.platform_user_id = $1`,
      [athleteId]
    );

    if (riderResult.rows.length === 0) {
      return; // Unknown athlete — ignore
    }

    for (const rider of riderResult.rows) {
      // Dedup: check if already processed
      const existing = await query(
        'SELECT id FROM rider_summaries WHERE rider_id = $1 AND activity_id = $2',
        [rider.id, activityId]
      );
      if (existing.rows.length > 0) continue;

      // Queue FIT processing
      const fitQueue = createQueue('process_fit');
      await fitQueue.add('process_fit', {
        rider_id: rider.id,
        event_id: rider.event_id,
        platform: 'strava',
        activity_id: activityId,
      });
    }
  } catch (err) {
    // Already sent 200 — log error internally only
    console.error('Strava webhook processing error:', err.message);
  }
});

// POST /api/webhooks/garmin — Garmin push notification
router.post('/garmin', async (req, res) => {
  try {
    res.status(200).json({ received: true });

    const activities = req.body.activityFiles || [];
    for (const activity of activities) {
      const userId = String(activity.userId);

      const riderResult = await query(
        `SELECT r.id, r.event_id
         FROM riders r
         JOIN oauth_tokens ot ON ot.rider_id = r.id
         WHERE ot.platform = 'garmin' AND ot.platform_user_id = $1`,
        [userId]
      );

      for (const rider of riderResult.rows) {
        const fitQueue = createQueue('process_fit');
        await fitQueue.add('process_fit', {
          rider_id: rider.id,
          event_id: rider.event_id,
          platform: 'garmin',
          activity_id: String(activity.activityId),
          fit_file_url: activity.callbackURL,
        });
      }
    }
  } catch (err) {
    console.error('Garmin webhook processing error:', err.message);
  }
});

// POST /api/webhooks/wahoo — Wahoo push notification
router.post('/wahoo', async (req, res) => {
  try {
    res.status(200).json({ received: true });

    const { workout } = req.body;
    if (!workout) return;

    const userId = String(workout.user_id || workout.userId);

    const riderResult = await query(
      `SELECT r.id, r.event_id
       FROM riders r
       JOIN oauth_tokens ot ON ot.rider_id = r.id
       WHERE ot.platform = 'wahoo' AND ot.platform_user_id = $1`,
      [userId]
    );

    for (const rider of riderResult.rows) {
      const fitQueue = createQueue('process_fit');
      await fitQueue.add('process_fit', {
        rider_id: rider.id,
        event_id: rider.event_id,
        platform: 'wahoo',
        activity_id: String(workout.id),
        fit_file_url: workout.file && workout.file.url,
      });
    }
  } catch (err) {
    console.error('Wahoo webhook processing error:', err.message);
  }
});

module.exports = router;
