/**
 * All StopCheck email templates.
 * Each returns { html, text, subject }.
 *
 * HTML emails use inline styles only — no external CSS.
 * Table-based layout for Gmail/Outlook compatibility.
 * Mobile-first: 100% width, large tap targets.
 */

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// ─── Shared layout wrapper ────────────────────────────────
function wrap(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:#16a34a;padding:20px 24px;text-align:center;">
              <span style="color:#ffffff;font-size:22px;font-weight:bold;">&#128721; StopCheck</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:24px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 24px;background:#f8fafc;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                StopCheck — Gravel Event Stop Sign Compliance<br>
                Only stop-zone speed data is stored. No full GPS tracks. No tracking.<br>
                <a href="${APP_URL}/privacy" style="color:#94a3b8;">Privacy Policy</a> &middot;
                <a href="${APP_URL}/data-deletion" style="color:#94a3b8;">Delete My Data</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function btn(href, label, color = '#16a34a') {
  return `<a href="${href}" style="display:inline-block;padding:14px 28px;background:${color};color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;border-radius:10px;text-align:center;min-width:200px;">${label}</a>`;
}

// ─── 1. Route & Authorization Email ───────────────────────
function routeEmail({ orgName, eventName, eventDate, riderName, riderToken, courseFileUrl }) {
  const hubUrl = `${APP_URL}/r/${riderToken}`;
  const dateStr = new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const html = wrap(`${eventName} — Course & Compliance Setup`, `
    <h1 style="margin:0 0 4px;font-size:22px;color:#1e293b;">${eventName}</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#64748b;">${dateStr} &middot; ${orgName}</p>

    <p style="margin:0 0 16px;font-size:15px;color:#334155;">
      Hi ${riderName},<br><br>
      Your course files and stop sign compliance setup are ready.
      Download your course file and connect your platform below — it takes under 30 seconds.
    </p>

    ${courseFileUrl ? `
    <h2 style="margin:20px 0 12px;font-size:16px;color:#1e293b;">Course Files</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:6px 0;">
          ${btn(hubUrl, '&#128506; Download Course GPX', '#0f766e')}
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0;">
          ${btn(hubUrl, '&#128506; Download Course FIT', '#1d4ed8')}
        </td>
      </tr>
    </table>
    ` : ''}

    <h2 style="margin:24px 0 8px;font-size:16px;color:#1e293b;">Connect Your Platform</h2>
    <p style="margin:0 0 12px;font-size:13px;color:#64748b;">
      Choose one. Your ride data syncs automatically after the event.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:6px 0;" align="center">
        ${btn(`${APP_URL}/api/oauth/strava/authorize?rider_token=${riderToken}`, 'Connect Strava', '#fc4c02')}
      </td></tr>
      <tr><td style="padding:6px 0;" align="center">
        ${btn(`${APP_URL}/api/oauth/garmin/authorize?rider_token=${riderToken}`, 'Connect Garmin', '#007cc3')}
      </td></tr>
      <tr><td style="padding:6px 0;" align="center">
        ${btn(`${APP_URL}/api/oauth/wahoo/authorize?rider_token=${riderToken}`, 'Connect Wahoo', '#00A8E0')}
      </td></tr>
    </table>

    <p style="margin:20px 0 0;font-size:13px;color:#94a3b8;text-align:center;">
      Or <a href="${hubUrl}" style="color:#16a34a;">upload your FIT file manually</a> after the ride.
    </p>
  `);

  const text = `${eventName}
${dateStr} — ${orgName}

Hi ${riderName},

Your course files and stop compliance setup are ready.

Connect your platform (choose one):
  Strava:  ${APP_URL}/api/oauth/strava/authorize?rider_token=${riderToken}
  Garmin:  ${APP_URL}/api/oauth/garmin/authorize?rider_token=${riderToken}
  Wahoo:   ${APP_URL}/api/oauth/wahoo/authorize?rider_token=${riderToken}

Or upload your FIT file manually: ${hubUrl}

— StopCheck`;

  return { html, text, subject: `${eventName} — Course Files & Compliance Setup` };
}

// ─── 2. Reminder Email (T-3 or T-1) ──────────────────────
function reminderEmail({ eventName, eventDate, riderName, riderToken, daysOut }) {
  const hubUrl = `${APP_URL}/r/${riderToken}`;
  const dateStr = new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const urgency = daysOut <= 1 ? 'tomorrow' : `in ${daysOut} days`;

  const html = wrap(`Reminder: Connect before ${eventName}`, `
    <h1 style="margin:0 0 8px;font-size:20px;color:#1e293b;">&#9200; ${eventName} is ${urgency}</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;">
      Hi ${riderName},<br><br>
      You haven't connected your platform yet for stop sign compliance.
      ${daysOut <= 1 ? 'This is your last reminder — please connect now or plan to upload your FIT file after the ride.' : 'It takes under 30 seconds.'}
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:6px 0;" align="center">
        ${btn(`${APP_URL}/api/oauth/strava/authorize?rider_token=${riderToken}`, 'Connect Strava', '#fc4c02')}
      </td></tr>
      <tr><td style="padding:6px 0;" align="center">
        ${btn(`${APP_URL}/api/oauth/garmin/authorize?rider_token=${riderToken}`, 'Connect Garmin', '#007cc3')}
      </td></tr>
      <tr><td style="padding:6px 0;" align="center">
        ${btn(`${APP_URL}/api/oauth/wahoo/authorize?rider_token=${riderToken}`, 'Connect Wahoo', '#00A8E0')}
      </td></tr>
    </table>

    <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;text-align:center;">
      Or <a href="${hubUrl}" style="color:#16a34a;">upload your FIT file</a> after the ride.
    </p>
  `);

  const text = `Reminder: ${eventName} is ${urgency}

Hi ${riderName},

You haven't connected your platform yet for stop sign compliance.

Connect now:
  Strava:  ${APP_URL}/api/oauth/strava/authorize?rider_token=${riderToken}
  Garmin:  ${APP_URL}/api/oauth/garmin/authorize?rider_token=${riderToken}
  Wahoo:   ${APP_URL}/api/oauth/wahoo/authorize?rider_token=${riderToken}

Or upload your FIT file: ${hubUrl}

— StopCheck`;

  return { html, text, subject: `Reminder: Connect before ${eventName} (${dateStr})` };
}

// ─── 3. Compliance Report Email ───────────────────────────
function complianceReportEmail({ eventName, riderName, riderToken, compliancePct, stopsPassed, stopsFailed, stopsMissed }) {
  const resultsUrl = `${APP_URL}/r/${riderToken}/results`;
  const allClear = stopsFailed === 0 && stopsMissed === 0;
  const statusColor = allClear ? '#16a34a' : '#dc2626';
  const statusText = allClear ? 'ALL STOPS COMPLIANT' : 'VIOLATIONS DETECTED';
  const statusIcon = allClear ? '&#10004;' : '&#10006;';

  const html = wrap(`${eventName} — Compliance Report`, `
    <div style="text-align:center;padding:16px 0;">
      <div style="display:inline-block;padding:12px 24px;background:${statusColor};color:#ffffff;font-size:18px;font-weight:bold;border-radius:12px;">
        ${statusIcon} ${statusText}
      </div>
    </div>

    <p style="margin:16px 0;font-size:15px;color:#334155;">
      Hi ${riderName},<br><br>
      Your compliance report for <strong>${eventName}</strong> is ready.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="text-align:center;padding:8px;">
          <div style="font-size:36px;font-weight:bold;color:${statusColor};">${compliancePct.toFixed(0)}%</div>
          <div style="font-size:12px;color:#64748b;">Compliance</div>
        </td>
        <td style="text-align:center;padding:8px;">
          <div style="font-size:24px;font-weight:bold;color:#16a34a;">${stopsPassed}</div>
          <div style="font-size:12px;color:#64748b;">Passed</div>
        </td>
        <td style="text-align:center;padding:8px;">
          <div style="font-size:24px;font-weight:bold;color:#dc2626;">${stopsFailed}</div>
          <div style="font-size:12px;color:#64748b;">Failed</div>
        </td>
      </tr>
    </table>

    <div style="text-align:center;padding:8px 0;">
      ${btn(resultsUrl, 'View Full Report')}
    </div>
  `);

  const text = `${eventName} — Compliance Report

Hi ${riderName},

Result: ${statusText}
Compliance: ${compliancePct.toFixed(0)}%
Passed: ${stopsPassed} | Failed: ${stopsFailed} | Missed: ${stopsMissed}

View full report: ${resultsUrl}

— StopCheck`;

  return { html, text, subject: `${eventName} — ${statusText}` };
}

// ─── 4. Violation Notification Email ──────────────────────
function violationEmail({ eventName, riderName, riderToken, failedStops, compliancePct, recipientType }) {
  const isOrganizer = recipientType === 'organizer';
  const resultsUrl = `${APP_URL}/r/${riderToken}/results`;

  const stopsHtml = failedStops.map(s =>
    `<tr>
      <td style="padding:8px;border-bottom:1px solid #fecaca;font-size:14px;">
        #${s.sequence} ${s.location}
      </td>
      <td style="padding:8px;border-bottom:1px solid #fecaca;font-size:14px;font-weight:bold;color:#dc2626;">
        ${s.min_speed_mph.toFixed(1)} mph
      </td>
    </tr>`
  ).join('');

  const html = wrap(`${eventName} — Stop Violation${isOrganizer ? ` (${riderName})` : ''}`, `
    <div style="background:#fef2f2;border:2px solid #fecaca;border-radius:12px;padding:16px;margin-bottom:16px;">
      <h1 style="margin:0;font-size:18px;color:#991b1b;">&#9888; Violation Detected</h1>
      <p style="margin:4px 0 0;font-size:14px;color:#dc2626;">
        ${isOrganizer ? `${riderName} has` : 'You have'} ${failedStops.length} stop sign violation${failedStops.length > 1 ? 's' : ''} at ${eventName}.
      </p>
    </div>

    <h2 style="margin:0 0 8px;font-size:15px;color:#1e293b;">Failed Stops</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff5f5;border-radius:8px;overflow:hidden;">
      <tr style="background:#fecaca;">
        <th style="padding:8px;text-align:left;font-size:12px;color:#991b1b;">Stop</th>
        <th style="padding:8px;text-align:left;font-size:12px;color:#991b1b;">Min Speed</th>
      </tr>
      ${stopsHtml}
    </table>

    <p style="margin:16px 0 0;font-size:13px;color:#64748b;">
      Compliance: ${compliancePct.toFixed(0)}%
    </p>

    <div style="text-align:center;padding:12px 0;">
      ${btn(resultsUrl, isOrganizer ? 'Review Rider Detail' : 'View Full Report')}
    </div>
  `);

  const stopsText = failedStops.map(s => `  #${s.sequence} ${s.location}: ${s.min_speed_mph.toFixed(1)} mph`).join('\n');
  const text = `${eventName} — Stop Violation${isOrganizer ? ` (${riderName})` : ''}

${isOrganizer ? `${riderName} has` : 'You have'} ${failedStops.length} violation(s):

${stopsText}

Compliance: ${compliancePct.toFixed(0)}%
View report: ${resultsUrl}

— StopCheck`;

  return { html, text, subject: `${eventName} — Stop Violation${isOrganizer ? `: ${riderName}` : ''}` };
}

// ─── 5. DQ Confirmed Email ───────────────────────────────
function dqConfirmedEmail({ eventName, orgName, riderName, riderToken, failedStops, compliancePct }) {
  const resultsUrl = `${APP_URL}/r/${riderToken}/results`;

  const stopsHtml = failedStops.map(s =>
    `<li style="padding:4px 0;font-size:14px;">
      #${s.sequence} ${s.location} — ${s.min_speed_mph.toFixed(1)} mph recorded
    </li>`
  ).join('');

  const html = wrap(`${eventName} — Disqualification Notice`, `
    <div style="background:#fef2f2;border:2px solid #dc2626;border-radius:12px;padding:16px;margin-bottom:16px;text-align:center;">
      <div style="font-size:28px;">&#10006;</div>
      <h1 style="margin:8px 0 0;font-size:20px;color:#991b1b;">Disqualification Confirmed</h1>
    </div>

    <p style="margin:0 0 16px;font-size:15px;color:#334155;">
      Hi ${riderName},<br><br>
      The race organizer (<strong>${orgName}</strong>) has confirmed your disqualification
      from <strong>${eventName}</strong> based on the following stop sign violations:
    </p>

    <ul style="margin:0 0 16px;padding-left:20px;color:#334155;">
      ${stopsHtml}
    </ul>

    <p style="margin:0 0 8px;font-size:14px;color:#64748b;">
      Overall compliance: ${compliancePct.toFixed(0)}%
    </p>

    <div style="text-align:center;padding:8px 0;">
      ${btn(resultsUrl, 'View Evidence & Report')}
    </div>

    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">
      If you believe this is an error, contact your race organizer directly.
      All compliance data and evidence are available at the link above.
    </p>
  `);

  const stopsText = failedStops.map(s => `  #${s.sequence} ${s.location}: ${s.min_speed_mph.toFixed(1)} mph`).join('\n');
  const text = `${eventName} — Disqualification Confirmed

Hi ${riderName},

The organizer (${orgName}) has confirmed your disqualification based on:

${stopsText}

Compliance: ${compliancePct.toFixed(0)}%
View evidence: ${resultsUrl}

Contact your race organizer if you believe this is an error.

— StopCheck`;

  return { html, text, subject: `${eventName} — Disqualification Confirmed` };
}

// ─── 6. No Data Reminder (T+24h) ─────────────────────────
function noDataEmail({ eventName, riderName, riderToken }) {
  const hubUrl = `${APP_URL}/r/${riderToken}`;

  const html = wrap(`${eventName} — We haven't received your ride data`, `
    <h1 style="margin:0 0 8px;font-size:20px;color:#1e293b;">&#128230; Ride Data Not Received</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;">
      Hi ${riderName},<br><br>
      It's been 24 hours since <strong>${eventName}</strong> and we haven't received
      your ride data yet. If you completed the course, please upload your FIT file.
    </p>

    <div style="text-align:center;padding:8px 0;">
      ${btn(hubUrl, 'Upload FIT File')}
    </div>

    <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;text-align:center;">
      If your platform is connected, your data may still be syncing.
      No action needed if it appears within the next few hours.
    </p>
  `);

  const text = `${eventName} — Ride Data Not Received

Hi ${riderName},

It's been 24h since the event and we haven't received your data.
Upload your FIT file: ${hubUrl}

If your platform is connected, data may still be syncing.

— StopCheck`;

  return { html, text, subject: `${eventName} — Upload your ride data` };
}

module.exports = {
  routeEmail,
  reminderEmail,
  complianceReportEmail,
  violationEmail,
  dqConfirmedEmail,
  noDataEmail,
};
