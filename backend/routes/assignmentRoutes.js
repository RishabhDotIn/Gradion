const express = require("express");
const { auth, roleAuth } = require("../middleware/authMiddleware");

const {
  assignmentCreateValidations,
  assignmentUpdateValidations,
  validateAssignmentRequest,
} = require("../middleware/assignmentMiddleware");

const {
  createAssignment,
  getTeacherAssignments,
  getPublicAssignments,
  getPublicAssignmentById,
  getRecentAssignments,
  getAssignmentPerformance,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getStudentAssignments,
  getStudentAssignmentById,
} = require("../controllers/assignmentController");

const router = express.Router();

// Public routes
router.get("/public", getPublicAssignments);
router.get("/public/:id", getPublicAssignmentById);

// Teacher routes
router.get(
  "/teacher",
  auth,
  roleAuth("teacher"),
  getTeacherAssignments
);

router.get(
  "/teacher/recent",
  auth,
  roleAuth("teacher"),
  getRecentAssignments
);

router.get(
  "/teacher/performance",
  auth,
  roleAuth("teacher"),
  getAssignmentPerformance
);

router.get(
  "/teacher/:id",
  auth,
  roleAuth("teacher"),
  getAssignmentById
);

router.post(
  "/teacher",
  auth,
  roleAuth("teacher"),
  assignmentCreateValidations,
  validateAssignmentRequest,
  createAssignment
);

router.put(
  "/teacher/:id",
  auth,
  roleAuth("teacher"),
  assignmentUpdateValidations,
  validateAssignmentRequest,
  updateAssignment
);

router.delete(
  "/teacher/:id",
  auth,
  roleAuth("teacher"),
  deleteAssignment
);

// Student routes
router.get(
  "/student",
  auth,
  roleAuth("student"),
  getStudentAssignments
);

router.get(
  "/student/:id",
  auth,
  roleAuth("student"),
  getStudentAssignmentById
);

module.exports = router;