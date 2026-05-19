const express = require('express');
const router = express.Router();
const { auth, roleAuth } = require('../middleware/authMiddleware');
const {
  createClass,
  getTeacherClasses,
  joinClass,
  getStudentClasses,
} = require('../controllers/classController');

router.post('/', auth, roleAuth('teacher'), createClass);
router.get('/teacher', auth, roleAuth('teacher'), getTeacherClasses);
router.post('/join', auth, roleAuth('student'), joinClass);
router.get('/student', auth, roleAuth('student'), getStudentClasses);

module.exports = router;
