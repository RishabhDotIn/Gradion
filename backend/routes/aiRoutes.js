const express = require('express');
const { auth, roleAuth } = require('../middleware/authMiddleware');
const { generateAssignmentQuestions } = require('../controllers/aiController');

const router = express.Router();

router.post('/assignment-questions', auth, roleAuth('teacher'), generateAssignmentQuestions);

module.exports = router;