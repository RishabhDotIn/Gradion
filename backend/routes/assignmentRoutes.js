const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment
} = require('../controllers/assignmentController');
const { auth, roleAuth } = require('../middleware/auth');

// Get all assignments - accessible to all authenticated users
router.get('/', auth, getAllAssignments);

// Get single assignment - accessible to all authenticated users
router.get('/:id', auth, getAssignmentById);

// Create assignment - only teachers
router.post('/', auth, roleAuth('teacher'), createAssignment);

// Update assignment - only teachers (creator)
router.put('/:id', auth, roleAuth('teacher'), updateAssignment);

// Delete assignment - only teachers (creator)
router.delete('/:id', auth, roleAuth('teacher'), deleteAssignment);

module.exports = router;