/**
 * Verify tables — run after migrate.js to confirm all tables and columns.
 * Run with: node src/db/verify.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '..', '..', '.env') });

const { Pool } = require('pg');

async function verify() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const result = await pool.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);

    let currentTable = '';
    for (const row of result.rows) {
      if (row.table_name !== currentTable) {
        currentTable = row.table_name;
        console.log('\n' + currentTable + ':');
      }
      console.log('  ' + row.column_name + ' (' + row.data_type + ')');
    }

    console.log('\nDone.');
  } catch (err) {
    console.error('Verify failed:', err.message);
  } finally {
    await pool.end();
  }
}

verify();
