/**
 * Database initialization — creates all tables from schema.sql.
 * Run with: node src/db/init.js
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  try {
    await pool.query(schema);
    console.log('Database schema created successfully');
  } catch (err) {
    console.error('Schema creation failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
