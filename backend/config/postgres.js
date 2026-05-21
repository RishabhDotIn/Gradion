const { Pool } = require('pg');

let pool = null;

function getPostgresPool() {
  if (!process.env.DATABASE_URL) return null;
  if (pool) return pool;

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  return pool;
}

async function checkPostgresHealth() {
  const pg = getPostgresPool();
  if (!pg) {
    return { enabled: false, connected: false, message: 'DATABASE_URL not set' };
  }

  try {
    await pg.query('SELECT 1');
    return { enabled: true, connected: true };
  } catch (err) {
    return { enabled: true, connected: false, error: err.message };
  }
}

async function closePostgresPool() {
  if (!pool) return;
  try {
    await pool.end();
  } finally {
    pool = null;
  }
}

module.exports = {
  getPostgresPool,
  checkPostgresHealth,
  closePostgresPool,
};