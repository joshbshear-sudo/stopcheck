const express = require('express');
const { query } = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');
const { routeEmail, reminderEmail, complianceReportEmail, violationEmail, dqConfirmedEmail, noDataEmail } = require('../email/templates');
const { sendEmail } = require('../email/sender');

const router = express.Router();

// GET /api/email/preview/route/:eventId — preview route email for organizer
router.get('/preview/route/:eventId', authenticateJWT, async (req, res) => {
  try {
    const event = await query(
      `SELECT e.*, o.name as org_name FROM events e
       JOIN organizations o ON o.id = e.org_id
       WHERE e.id = $1 AND e.org_id = $2`,
      [req.params.eventId, req.org.id]
    );
    if (event.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    const e = event.rows[0];
    const email = routeEmail({
      orgName: e.org_name,
      eventName: e.name,
      eventDate: e.event_date,
      riderName: 'Rider Name',
      riderToken: 'PREVIEW_TOKEN',
      courseFileUrl: e.course_file_url,
    });

    if (req.query.format === 'text') return res.type('text/plain').send(email.text);
    res.type('html').send(email.html);
  } catch (err) {
    res.status(500).json({ error: 'Preview failed' });
  }
});

// GET /api/email/preview/all — render all templates with demo data (for testing)
router.get('/preview/all', async (req, res) => {
  const demoData = {
    orgName: 'Gravel Worlds Racing',
    eventName: 'Gravel Worlds 2026 — 150 Mile',
    eventDate: '2026-06-15',
    riderName: 'Sarah Martinez',
    riderToken: 'demo-token-abc123',
    courseFileUrl: '/course.gpx',
    compliancePct: 80,
    stopsPassed: 4,
    stopsFailed: 1,
    stopsMissed: 0,
    failedStops: [
      { sequence: 3, location: 'Pioneers Blvd & S 56th (Mile 38.7)', min_speed_mph: 4.03 },
    ],
  };

  const templates = [
    { name: 'Route Email', ...routeEmail(demoData) },
    { name: 'Reminder (T-3)', ...reminderEmail({ ...demoData, daysOut: 3 }) },
    { name: 'Reminder (T-1)', ...reminderEmail({ ...demoData, daysOut: 1 }) },
    { name: 'Compliance Report', ...complianceReportEmail(demoData) },
    { name: 'Violation (Rider)', ...violationEmail({ ...demoData, recipientType: 'rider' }) },
    { name: 'Violation (Organizer)', ...violationEmail({ ...demoData, recipientType: 'organizer' }) },
    { name: 'DQ Confirmed', ...dqConfirmedEmail(demoData) },
    { name: 'No Data (T+24h)', ...noDataEmail(demoData) },
  ];

  // Render an index page with links to each template
  const indexHtml = `<!DOCTYPE html>
<html><head><title>StopCheck Email Templates</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 600px; margin: 40px auto; padding: 0 16px; }
  h1 { color: #16a34a; }
  .card { border: 1px solid #e2e8f0; border-radius: 8px; margin: 12px 0; padding: 16px; }
  .card h3 { margin: 0 0 4px; }
  .card p { margin: 0; color: #64748b; font-size: 14px; }
  a { color: #16a34a; }
  iframe { width: 100%; height: 600px; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 8px; }
</style></head><body>
<h1>&#128721; StopCheck Email Templates</h1>
<p>All ${templates.length} email templates rendered with demo data.</p>
${templates.map((t, i) => `
  <div class="card">
    <h3>${i + 1}. ${t.name}</h3>
    <p>Subject: ${t.subject}</p>
    <a href="/api/email/preview/all/${i}">View HTML</a> |
    <a href="/api/email/preview/all/${i}?format=text">View Plain Text</a>
  </div>
`).join('')}
</body></html>`;

  res.type('html').send(indexHtml);
});

// GET /api/email/preview/all/:index — render a specific template
router.get('/preview/all/:index', (req, res) => {
  const demoData = {
    orgName: 'Gravel Worlds Racing',
    eventName: 'Gravel Worlds 2026 — 150 Mile',
    eventDate: '2026-06-15',
    riderName: 'Sarah Martinez',
    riderToken: 'demo-token-abc123',
    courseFileUrl: '/course.gpx',
    compliancePct: 80,
    stopsPassed: 4,
    stopsFailed: 1,
    stopsMissed: 0,
    failedStops: [
      { sequence: 3, location: 'Pioneers Blvd & S 56th (Mile 38.7)', min_speed_mph: 4.03 },
    ],
  };

  const templates = [
    routeEmail(demoData),
    reminderEmail({ ...demoData, daysOut: 3 }),
    reminderEmail({ ...demoData, daysOut: 1 }),
    complianceReportEmail(demoData),
    violationEmail({ ...demoData, recipientType: 'rider' }),
    violationEmail({ ...demoData, recipientType: 'organizer' }),
    dqConfirmedEmail(demoData),
    noDataEmail(demoData),
  ];

  const idx = parseInt(req.params.index);
  if (idx < 0 || idx >= templates.length) return res.status(404).send('Template not found');

  const t = templates[idx];
  if (req.query.format === 'text') return res.type('text/plain').send(t.text);
  res.type('html').send(t.html);
});

// POST /api/email/send-route/:eventId — organizer sends route email to all riders
router.post('/send-route/:eventId', authenticateJWT, async (req, res) => {
  try {
    const event = await query(
      `SELECT e.*, o.name as org_name FROM events e
       JOIN organizations o ON o.id = e.org_id
       WHERE e.id = $1 AND e.org_id = $2`,
      [req.params.eventId, req.org.id]
    );
    if (event.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    const riders = await query(
      'SELECT id, name, email, auth_token FROM riders WHERE event_id = $1',
      [req.params.eventId]
    );

    const e = event.rows[0];
    let sent = 0;
    let failed = 0;

    for (const rider of riders.rows) {
      try {
        const email = routeEmail({
          orgName: e.org_name,
          eventName: e.name,
          eventDate: e.event_date,
          riderName: rider.name,
          riderToken: rider.auth_token,
          courseFileUrl: e.course_file_url,
        });
        await sendEmail({ to: rider.email, ...email });
        sent++;
      } catch {
        failed++;
      }
    }

    res.json({ sent, failed, total: riders.rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send emails' });
  }
});

module.exports = router;
