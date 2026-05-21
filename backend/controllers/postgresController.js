const { getPostgresPool } = require('../config/postgres');
const { ensureEvaluationLogsTable, insertEvaluationLog } = require('../utils/postgresLog');

async function postgresHealth(req, res) {
  const pool = getPostgresPool();
  if (!pool) {
    return res.status(503).json({
      success: false,
      message: 'PostgreSQL is not configured. Set DATABASE_URL first.',
    });
  }

  try {
    const result = await pool.query('SELECT NOW() AS now');
    return res.json({
      success: true,
      message: 'PostgreSQL connected',
      now: result.rows[0].now,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'PostgreSQL health check failed',
      error: error.message,
    });
  }
}

async function createEvaluationLog(req, res) {
  const pool = getPostgresPool();
  if (!pool) {
    return res.status(503).json({
      success: false,
      message: 'PostgreSQL is not configured. Set DATABASE_URL first.',
    });
  }

  const { feature, status, notes, metadata } = req.body || {};
  if (!feature || !status) {
    return res.status(400).json({
      success: false,
      message: 'feature and status are required',
    });
  }

  try {
    await ensureEvaluationLogsTable(pool);

    const inserted = await insertEvaluationLog({
      userId: req.user.userId,
      role: req.user.role,
      feature,
      status,
      notes,
      metadata,
    });

    return res.status(201).json({
      success: true,
      message: 'Evaluation log saved in PostgreSQL',
      log: inserted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to save evaluation log in PostgreSQL',
      error: error.message,
    });
  }
}

async function listEvaluationLogs(req, res) {
  const pool = getPostgresPool();
  if (!pool) {
    return res.status(503).json({
      success: false,
      message: 'PostgreSQL is not configured. Set DATABASE_URL first.',
    });
  }

  const rawLimit = Number.parseInt(String(req.query.limit || '20'), 10);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(100, rawLimit)) : 20;

  try {
    await ensureEvaluationLogsTable(pool);

    const result = await pool.query(
      `
      SELECT id, user_id, role, feature, status, notes, metadata, created_at
      FROM evaluation_logs
      ORDER BY created_at DESC
      LIMIT $1
      `,
      [limit]
    );

    return res.json({
      success: true,
      count: result.rowCount,
      logs: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch evaluation logs from PostgreSQL',
      error: error.message,
    });
  }
}

module.exports = {
  postgresHealth,
  createEvaluationLog,
  listEvaluationLogs,
};