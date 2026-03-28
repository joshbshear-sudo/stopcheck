/**
 * Resend all 8 test emails with detailed logging and longer delays.
 * Also checks delivery status of previous sends.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '..', '..', '.env') });

const https = require('https');
const {
  routeEmail, reminderEmail, complianceReportEmail,
  violationEmail, dqConfirmedEmail, noDataEmail,
} = require('../email/templates');

const TO = 'joshbshear@gmail.com';
const PREFIX = '[STOPCHECK TEST] ';
const API_KEY = process.env.RESEND_API_KEY;

// Previous send IDs to check status
const previousIds = [
  'c9a4c461-fc91-458c-a6eb-171388e09f3e',
  '75ab3757-90f9-4c3d-998a-60707d93bbf9',
  '9eb709ea-f624-445d-a6c1-9d3beb65b3c8',
  '94baf092-698f-4ff7-8a50-6412363cac1e',
  'd190ac43-a047-4a94-aaec-eae6fa126c07',
  '64013699-af6e-4d00-8295-281908a4fa6b',
  'e6e03288-a877-42a9-88c5-51c07a9c492c',
  '59976aa3-a4f9-4894-8bd9-f441b998b28a',
];

const templateNames = [
  '1/8 Route Email',
  '2/8 Reminder T-3',
  '3/8 Reminder T-1',
  '4/8 Compliance Report',
  '5/8 Violation (Rider)',
  '6/8 Violation (Organizer)',
  '7/8 DQ Confirmed',
  '8/8 No Data T+24h',
];

function apiGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.resend.com',
      path,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function apiPost(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

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

async function main() {
  console.log('=== STEP 1: Check delivery status of previous sends ===\n');

  for (let i = 0; i < previousIds.length; i++) {
    try {
      const result = await apiGet(`/emails/${previousIds[i]}`);
      const status = result.last_event || result.status || 'unknown';
      console.log(`  ${templateNames[i]}: ${status}`);
      if (result.last_event) console.log(`    last_event: ${result.last_event}`);
    } catch (err) {
      console.log(`  ${templateNames[i]}: ERROR checking - ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n=== STEP 2: Resend all 8 with 2-second delays ===\n');

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

  let sent = 0;
  let failed = 0;

  for (const t of templates) {
    const result = await apiPost({
      from: 'StopCheck <onboarding@resend.dev>',
      to: [TO],
      subject: PREFIX + t.subject,
      html: t.html,
      text: t.text,
    });

    if (result.status >= 200 && result.status < 300) {
      console.log(`  SENT: ${t.name}`);
      console.log(`    Subject: ${PREFIX}${t.subject}`);
      console.log(`    ID: ${result.data.id}`);
      console.log(`    HTTP: ${result.status}`);
      sent++;
    } else {
      console.log(`  FAIL: ${t.name}`);
      console.log(`    HTTP: ${result.status}`);
      console.log(`    Error: ${JSON.stringify(result.data)}`);
      failed++;
    }

    // 2-second delay between sends
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\nDone: ${sent} sent, ${failed} failed`);

  // Verify Wahoo color
  console.log('\n=== STEP 3: Wahoo button color check ===');
  const routeHtml = routeEmail(demoData).html;
  const wahooMatch = routeHtml.match(/Connect Wahoo.*?background:(#[0-9a-fA-F]+)/s);
  console.log(`  Wahoo button background: ${wahooMatch ? wahooMatch[1] : 'NOT FOUND'}`);
  console.log(`  Expected: #00A8E0`);
  console.log(`  Match: ${wahooMatch && wahooMatch[1] === '#00A8E0' ? 'YES' : 'NO'}`);
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
