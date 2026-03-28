/**
 * Diagnose database connection issues.
 * Run with: node src\db\diagnose.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '..', '..', '.env') });

const dns = require('dns');

// Force Node.js to try IPv6 when IPv4 is not available
dns.setDefaultResultOrder('verbatim');

const connStr = process.env.DATABASE_URL;
console.log('DATABASE_URL loaded:', connStr ? 'yes (' + connStr.length + ' chars)' : 'NO - missing!');

if (!connStr) {
  console.error('Set DATABASE_URL in C:\\Users\\joshb\\STOP_Check\\.env');
  process.exit(1);
}

const parsed = new URL(connStr);
console.log('\nParsed connection string:');
console.log('  Hostname:', parsed.hostname);
console.log('  Port:', parsed.port);
console.log('  Password:', parsed.password ? '***' + parsed.password.slice(-4) : 'EMPTY');

console.log('\nResolving hostname...');
dns.lookup(parsed.hostname, { all: true }, (err, addresses) => {
  if (err) {
    console.error('DNS FAILED:', err.message);
    return;
  }
  console.log('DNS results:', addresses.map(a => a.address + ' (IPv' + a.family + ')').join(', '));

  console.log('\nConnecting to database...');
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  pool.query('SELECT NOW() as t')
    .then(r => {
      console.log('CONNECTION SUCCESS:', r.rows[0].t);
      pool.end();
    })
    .catch(e => {
      console.error('CONNECTION FAILED:', e.message);
      console.log('\nTip: If using Supabase, try the connection pooler URL (port 6543) from Settings > Database > Connection Pooling');
      pool.end();
    });
});
