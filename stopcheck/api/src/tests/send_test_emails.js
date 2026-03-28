/**
 * Send all 8 email templates to a test address.
 * Run: node src/tests/send_test_emails.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '..', '..', '.env') });

const { sendEmail } = require('../email/sender');
const {
  routeEmail, reminderEmail, complianceReportEmail,
  violationEmail, dqConfirmedEmail, noDataEmail,
} = require('../email/templates');

const TO = 'joshbshear@gmail.com';
const PREFIX = '[STOPCHECK TEST] ';

const demoData = {
  orgName: 'Gravel Worlds Racing',
  eventName: 'Gravel Worlds 2026 — 150 Mile',
  eventDate: '2026-06-15',
  riderName: 'Sarah Martinez',
  riderToken: 'demo-test-token-abc123',
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
  { name: '1/8 Route Email', ...routeEmail(demoData) },
  { name: '2/8 Reminder T-3', ...reminderEmail({ ...demoData, daysOut: 3 }) },
  { name: '3/8 Reminder T-1', ...reminderEmail({ ...demoData, daysOut: 1 }) },
  { name: '4/8 Compliance Report', ...complianceReportEmail(demoData) },
  { name: '5/8 Violation (Rider)', ...violationEmail({ ...demoData, recipientType: 'rider' }) },
  { name: '6/8 Violation (Organizer)', ...violationEmail({ ...demoData, recipientType: 'organizer' }) },
  { name: '7/8 DQ Confirmed', ...dqConfirmedEmail(demoData) },
  { name: '8/8 No Data T+24h', ...noDataEmail(demoData) },
];

async function main() {
  console.log(`Sending ${templates.length} test emails to ${TO}...`);
  console.log(`Using sender: ${process.env.RESEND_VERIFIED_DOMAIN ? process.env.FROM_EMAIL : 'onboarding@resend.dev'}`);
  console.log('');

  let sent = 0;
  let failed = 0;

  for (const t of templates) {
    try {
      const result = await sendEmail({
        to: TO,
        subject: PREFIX + t.subject,
        html: t.html,
        text: t.text,
      });
      console.log(`  SENT: ${t.name} — ${t.subject}`);
      console.log(`        ID: ${result.id}`);
      sent++;
    } catch (err) {
      console.error(`  FAIL: ${t.name} — ${err.message}`);
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('');
  console.log(`Done: ${sent} sent, ${failed} failed`);
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
