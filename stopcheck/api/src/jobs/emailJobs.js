/**
 * Email automation jobs.
 *
 * - Reminder: T-3 and T-1 days before event for unconnected riders
 * - No-data: T+24h after event for riders without results
 * - Compliance/violation/DQ emails triggered from processFit and DQ routes
 */

const { query } = require('../config/database');
const { sendEmail } = require('../email/sender');
const {
  reminderEmail, complianceReportEmail, violationEmail,
  dqConfirmedEmail, noDataEmail,
} = require('../email/templates');

// ─── Scheduled: Check for upcoming events and send reminders ──────
async function runReminderCheck() {
  try {
    // Find events happening in 3 days or 1 day
    const events = await query(`
      SELECT e.id, e.name, e.event_date, o.name as org_name
      FROM events e
      JOIN organizations o ON o.id = e.org_id
      WHERE e.event_date = CURRENT_DATE + INTERVAL '3 days'
         OR e.event_date = CURRENT_DATE + INTERVAL '1 day'
    `);

    for (const event of events.rows) {
      const daysOut = Math.round((new Date(event.event_date) - new Date()) / 86400000);

      // Find unconnected riders
      const riders = await query(
        'SELECT id, name, email, auth_token FROM riders WHERE event_id = $1 AND connected_at IS NULL',
        [event.id]
      );

      console.log(`[REMINDERS] ${event.name}: ${riders.rows.length} unconnected riders, ${daysOut} days out`);

      for (const rider of riders.rows) {
        const email = reminderEmail({
          eventName: event.name,
          eventDate: event.event_date,
          riderName: rider.name,
          riderToken: rider.auth_token,
          daysOut,
        });

        await sendEmail({ to: rider.email, ...email });
      }
    }
  } catch (err) {
    console.error('[REMINDERS] Error:', err.message);
  }
}

// ─── Scheduled: Check for events 24h ago with no rider data ───────
async function runNoDataCheck() {
  try {
    const events = await query(`
      SELECT e.id, e.name, e.event_date
      FROM events e
      WHERE e.event_date = CURRENT_DATE - INTERVAL '1 day'
    `);

    for (const event of events.rows) {
      const riders = await query(
        `SELECT r.id, r.name, r.email, r.auth_token
         FROM riders r
         LEFT JOIN rider_summaries rs ON rs.rider_id = r.id
         WHERE r.event_id = $1 AND rs.id IS NULL`,
        [event.id]
      );

      console.log(`[NO-DATA] ${event.name}: ${riders.rows.length} riders without data`);

      for (const rider of riders.rows) {
        const email = noDataEmail({
          eventName: event.name,
          riderName: rider.name,
          riderToken: rider.auth_token,
        });

        await sendEmail({ to: rider.email, ...email });
      }
    }
  } catch (err) {
    console.error('[NO-DATA] Error:', err.message);
  }
}

// ─── Triggered: Send compliance report after processing ───────────
async function sendComplianceEmail(riderId, eventId) {
  try {
    const riderResult = await query(
      `SELECT r.name, r.email, r.auth_token, e.name as event_name, o.name as org_name, o.email as org_email,
              rs.compliance_pct, rs.stops_passed, rs.stops_failed, rs.stops_missed, rs.dq_recommended
       FROM riders r
       JOIN events e ON e.id = r.event_id
       JOIN organizations o ON o.id = e.org_id
       LEFT JOIN rider_summaries rs ON rs.rider_id = r.id
       WHERE r.id = $1 AND r.event_id = $2`,
      [riderId, eventId]
    );

    if (riderResult.rows.length === 0) return;
    const data = riderResult.rows[0];

    // Send compliance report to rider
    const reportEmail = complianceReportEmail({
      eventName: data.event_name,
      riderName: data.name,
      riderToken: data.auth_token,
      compliancePct: data.compliance_pct,
      stopsPassed: data.stops_passed,
      stopsFailed: data.stops_failed,
      stopsMissed: data.stops_missed,
    });
    await sendEmail({ to: data.email, ...reportEmail });

    // If violations, send violation email to both rider and organizer
    if (data.stops_failed > 0 || data.stops_missed > 0) {
      const failedStops = await query(
        `SELECT cr.min_speed_mph, ss.sequence, ss.location
         FROM compliance_results cr
         JOIN stop_signs ss ON ss.id = cr.stop_sign_id
         WHERE cr.rider_id = $1 AND cr.event_id = $2 AND cr.status IN ('fail', 'missed')
         ORDER BY ss.sequence`,
        [riderId, eventId]
      );

      // To rider
      const riderViolation = violationEmail({
        eventName: data.event_name,
        riderName: data.name,
        riderToken: data.auth_token,
        failedStops: failedStops.rows,
        compliancePct: data.compliance_pct,
        recipientType: 'rider',
      });
      await sendEmail({ to: data.email, ...riderViolation });

      // To organizer
      const orgViolation = violationEmail({
        eventName: data.event_name,
        riderName: data.name,
        riderToken: data.auth_token,
        failedStops: failedStops.rows,
        compliancePct: data.compliance_pct,
        recipientType: 'organizer',
      });
      await sendEmail({ to: data.org_email, ...orgViolation });
    }
  } catch (err) {
    console.error('[COMPLIANCE-EMAIL] Error:', err.message);
  }
}

// ─── Triggered: Send DQ notification ──────────────────────────────
async function sendDqEmail(riderId, eventId) {
  try {
    const result = await query(
      `SELECT r.name, r.email, r.auth_token, e.name as event_name, o.name as org_name,
              rs.compliance_pct
       FROM riders r
       JOIN events e ON e.id = r.event_id
       JOIN organizations o ON o.id = e.org_id
       LEFT JOIN rider_summaries rs ON rs.rider_id = r.id
       WHERE r.id = $1 AND r.event_id = $2`,
      [riderId, eventId]
    );

    if (result.rows.length === 0) return;
    const data = result.rows[0];

    const failedStops = await query(
      `SELECT cr.min_speed_mph, ss.sequence, ss.location
       FROM compliance_results cr
       JOIN stop_signs ss ON ss.id = cr.stop_sign_id
       WHERE cr.rider_id = $1 AND cr.event_id = $2 AND cr.status IN ('fail', 'missed')
       ORDER BY ss.sequence`,
      [riderId, eventId]
    );

    const email = dqConfirmedEmail({
      eventName: data.event_name,
      orgName: data.org_name,
      riderName: data.name,
      riderToken: data.auth_token,
      failedStops: failedStops.rows,
      compliancePct: data.compliance_pct || 0,
    });

    await sendEmail({ to: data.email, ...email });
  } catch (err) {
    console.error('[DQ-EMAIL] Error:', err.message);
  }
}

// ─── Schedule runner (called from server.js) ──────────────────────
function startEmailSchedule() {
  // Run reminder and no-data checks every hour
  setInterval(async () => {
    await runReminderCheck();
    await runNoDataCheck();
  }, 3600000); // 1 hour

  // Initial run after 10 seconds
  setTimeout(async () => {
    await runReminderCheck();
    await runNoDataCheck();
  }, 10000);

  console.log('Email reminder schedule started (hourly check)');
}

module.exports = {
  runReminderCheck,
  runNoDataCheck,
  sendComplianceEmail,
  sendDqEmail,
  startEmailSchedule,
};
