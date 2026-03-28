/**
 * Email sending service via Resend API.
 * Falls back to console logging when RESEND_API_KEY is not set (dev mode).
 */

const https = require('https');

// Use onboarding@resend.dev until a custom domain is verified in Resend
const FROM = process.env.RESEND_VERIFIED_DOMAIN ? (process.env.FROM_EMAIL || 'noreply@stopcheck.io') : 'onboarding@resend.dev';
const API_KEY = process.env.RESEND_API_KEY;

async function sendEmail({ to, subject, html, text }) {
  if (!API_KEY) {
    console.log(`[EMAIL-DEV] To: ${to} | Subject: ${subject}`);
    console.log(`[EMAIL-DEV] (Set RESEND_API_KEY to send real emails)`);
    return { id: 'dev-' + Date.now(), status: 'dev' };
  }

  const payload = JSON.stringify({
    from: `StopCheck <${FROM}>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Resend API error ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = { sendEmail, FROM };
