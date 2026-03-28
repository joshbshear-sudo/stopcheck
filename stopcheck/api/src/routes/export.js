const express = require('express');
const { query } = require('../config/database');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

// GET /api/events/:eventId/export/pdf
router.get('/:eventId/export/pdf', authenticateJWT, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify event belongs to org
    const eventResult = await query(
      'SELECT * FROM events WHERE id = $1 AND org_id = $2',
      [eventId, req.org.id]
    );
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const event = eventResult.rows[0];

    // Get stop signs
    const stopsResult = await query(
      'SELECT * FROM stop_signs WHERE event_id = $1 ORDER BY sequence',
      [eventId]
    );

    // Get riders with summaries
    const ridersResult = await query(
      `SELECT r.*, rs.compliance_pct, rs.stops_passed, rs.stops_failed,
              rs.stops_missed, rs.dq_recommended, rs.dq_confirmed
       FROM riders r
       LEFT JOIN rider_summaries rs ON rs.rider_id = r.id
       WHERE r.event_id = $1
       ORDER BY r.name`,
      [eventId]
    );

    // Get per-stop compliance for all riders
    const complianceResult = await query(
      `SELECT cr.rider_id, cr.status, cr.min_speed_mph, cr.stop_duration_s,
              ss.sequence, ss.location, ss.crossing_guard
       FROM compliance_results cr
       JOIN stop_signs ss ON ss.id = cr.stop_sign_id
       WHERE cr.event_id = $1
       ORDER BY cr.rider_id, ss.sequence`,
      [eventId]
    );

    // Group compliance by rider
    const complianceByRider = {};
    for (const row of complianceResult.rows) {
      if (!complianceByRider[row.rider_id]) complianceByRider[row.rider_id] = [];
      complianceByRider[row.rider_id].push(row);
    }

    // Generate HTML report
    const html = generateReportHTML(event, stopsResult.rows, ridersResult.rows, complianceByRider);

    // Try Puppeteer for PDF, fallback to HTML
    try {
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'Letter',
        margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
        printBackground: true,
      });
      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="StopCheck_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
      res.send(pdf);
    } catch {
      // Puppeteer not available — serve HTML report
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    }
  } catch (err) {
    console.error('PDF export error:', err.message);
    res.status(500).json({ error: 'Export failed' });
  }
});

function generateReportHTML(event, stops, riders, complianceByRider) {
  const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const processed = riders.filter(r => r.compliance_pct !== null);
  const violations = riders.filter(r => r.dq_recommended);

  const riderRows = riders.map(rider => {
    const stops = complianceByRider[rider.id] || [];
    const stopDots = stops.map(s => {
      const colors = { pass: '#16a34a', fail: '#dc2626', guard_waived: '#ea580c', missed: '#9ca3af', not_applicable: '#d1d5db' };
      return `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${colors[s.status] || '#d1d5db'};margin:0 2px" title="${s.location}: ${s.status}"></span>`;
    }).join('');

    return `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${rider.bib_number || '—'}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:500">${rider.name}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${rider.compliance_pct != null ? rider.compliance_pct.toFixed(0) + '%' : '—'}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${stopDots}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">
          ${rider.dq_confirmed ? '<strong style="color:#dc2626">DQ CONFIRMED</strong>'
            : rider.dq_recommended ? '<span style="color:#ea580c">DQ Recommended</span>'
            : rider.compliance_pct != null ? '<span style="color:#16a34a">Clear</span>' : '—'}
        </td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>StopCheck Compliance Report - ${event.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; margin: 0; padding: 20px; }
    h1 { font-size: 24px; margin: 0; }
    h2 { font-size: 16px; margin: 20px 0 10px; color: #374151; }
    table { border-collapse: collapse; width: 100%; font-size: 13px; }
    th { background: #f8fafc; text-align: left; padding: 8px; border-bottom: 2px solid #e5e7eb; font-size: 11px; text-transform: uppercase; color: #6b7280; }
    .stat { display: inline-block; margin-right: 24px; }
    .stat-value { font-size: 28px; font-weight: bold; }
    .stat-label { font-size: 12px; color: #6b7280; }
    .footer { margin-top: 30px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    .legend { font-size: 11px; color: #6b7280; margin-top: 8px; }
    .legend span { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin: 0 4px 0 12px; vertical-align: middle; }
  </style>
</head>
<body>
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
    <div>
      <h1>${event.name}</h1>
      <div style="color:#6b7280;font-size:14px">${eventDate}${event.location ? ' — ' + event.location : ''}</div>
    </div>
    <div style="font-size:18px;font-weight:bold;color:#16a34a">&#128721; StopCheck</div>
  </div>

  <div style="margin-bottom:20px">
    <div class="stat"><div class="stat-value">${riders.length}</div><div class="stat-label">Riders</div></div>
    <div class="stat"><div class="stat-value">${processed.length}</div><div class="stat-label">Processed</div></div>
    <div class="stat"><div class="stat-value" style="color:#dc2626">${violations.length}</div><div class="stat-label">Violations</div></div>
    <div class="stat"><div class="stat-value">${stops.length}</div><div class="stat-label">Stop Signs</div></div>
  </div>

  <h2>Stop Sign Locations</h2>
  <table>
    <thead><tr><th>#</th><th>Location</th><th>Guard</th></tr></thead>
    <tbody>
      ${stops.map(s => `
        <tr>
          <td style="padding:6px;border-bottom:1px solid #e5e7eb">${s.sequence}</td>
          <td style="padding:6px;border-bottom:1px solid #e5e7eb">${s.location || `${s.lat.toFixed(4)}, ${s.lon.toFixed(4)}`}</td>
          <td style="padding:6px;border-bottom:1px solid #e5e7eb">${s.crossing_guard ? 'Crossing guard exemption applied — event window only' : '—'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Rider Compliance</h2>
  <div class="legend">
    <span style="background:#16a34a"></span>Pass
    <span style="background:#dc2626"></span>Fail
    <span style="background:#ea580c"></span>Guard Waived
    <span style="background:#9ca3af"></span>Missed
  </div>
  <table style="margin-top:8px">
    <thead><tr><th>Bib</th><th>Name</th><th>Compliance</th><th>Stops</th><th>Status</th></tr></thead>
    <tbody>${riderRows}</tbody>
  </table>

  <div class="footer">
    Generated by StopCheck on ${new Date().toLocaleString()} — Compliance report for official records.
    Only stop-zone speed data is retained. No full GPS tracks are stored.
  </div>
</body>
</html>`;
}

module.exports = router;
