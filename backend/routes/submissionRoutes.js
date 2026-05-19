const express = require('express');
const router = express.Router();
const { auth, roleAuth } = require('../middleware/authMiddleware');
const {
  runSubmission,
  createSubmission,
  getTeacherSubmissions,
  getStudentSubmissions,
  getStudentSubmissionById,
  patchTeacherSubmission,
} = require('../controllers/submissionController');

router.post('/run', auth, roleAuth('student'), runSubmission);
router.post('/', auth, roleAuth('student'), createSubmission);
router.get('/teacher', auth, roleAuth('teacher'), getTeacherSubmissions);
router.patch('/teacher/:id', auth, roleAuth('teacher'), patchTeacherSubmission);
router.get('/student', auth, roleAuth('student'), getStudentSubmissions);
router.get('/student/:id', auth, roleAuth('student'), getStudentSubmissionById);

module.exports = router;
