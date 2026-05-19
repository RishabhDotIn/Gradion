const express = require('express');
const router = express.Router();
const { auth, roleAuth } = require('../middleware/authMiddleware');
const { teacherDashboard, studentDashboard } = require('../controllers/dashboardController');

router.get('/teacher', auth, roleAuth('teacher'), teacherDashboard);
router.get('/student', auth, roleAuth('student'), studentDashboard);

module.exports = router;
