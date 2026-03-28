const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Parameterized queries only — zero string concatenation per spec 11.4
const query = (text, params) => pool.query(text, params);

const getClient = () => pool.connect();

module.exports = { pool, query, getClient };
