/**
 * Database migration — connects to Supabase and creates all tables.
 * Run with: node src/db/migrate.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '..', '..', '.env') });

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Test connection
    const now = await pool.query('SELECT NOW() as connected_at');
    console.log('Connected to Supabase:', now.rows[0].connected_at);

    // Run schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(schema);
    console.log('Schema created successfully.');

    // Verify tables
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('\nTables created:');
    for (const row of tables.rows) {
      console.log('  -', row.table_name);
    }
    console.log(`\nTotal: ${tables.rows.length} tables`);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
