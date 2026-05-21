const express = require('express');
const { auth } = require('../middleware/authMiddleware');
const {
  postgresHealth,
  createEvaluationLog,
  listEvaluationLogs,
} = require('../controllers/postgresController');

const router = express.Router();

router.get('/health', postgresHealth);
router.post('/evaluation-logs', auth, createEvaluationLog);
router.get('/evaluation-logs', auth, listEvaluationLogs);

module.exports = router;