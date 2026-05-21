const { getPostgresPool } = require('../config/postgres');

async function ensureEvaluationLogsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS evaluation_logs (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      feature TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function insertEvaluationLog({
  userId,
  role,
  feature,
  status,
  notes,
  metadata,
}) {
  const pool = getPostgresPool();
  if (!pool) return null;

  await ensureEvaluationLogsTable(pool);

  const result = await pool.query(
    `
    INSERT INTO evaluation_logs (user_id, role, feature, status, notes, metadata)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, user_id, role, feature, status, notes, metadata, created_at
    `,
    [
      String(userId || 'anonymous'),
      String(role || 'unknown'),
      String(feature || 'general'),
      String(status || 'info'),
      notes ? String(notes) : null,
      metadata && typeof metadata === 'object' ? metadata : {},
    ]
  );

  return result.rows[0] || null;
}

module.exports = {
  ensureEvaluationLogsTable,
  insertEvaluationLog,
};