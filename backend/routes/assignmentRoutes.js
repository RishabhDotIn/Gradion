const express = require("express");
const { auth, roleAuth } = require("../middleware/authMiddleware");
const {
  assignmentValidations,
  validateAssignmentRequest,
} = require("../middleware/assignmentMiddleware");
const {
  createAssignment,
  getTeacherAssignments,
  getRecentAssignments,
  getAssignmentPerformance,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getStudentAssignments,
  getStudentAssignmentById,
} = require("../controllers/assignmentController");

const router = express.Router();

// Teacher routes
router.get("/teacher", auth, roleAuth("teacher"), getTeacherAssignments);
router.get("/teacher/recent", auth, roleAuth("teacher"), getRecentAssignments);
router.get("/teacher/performance", auth, roleAuth("teacher"), getAssignmentPerformance);
router.get("/teacher/:id", auth, roleAuth("teacher"), getAssignmentById);
router.post("/", auth, roleAuth("teacher"), assignmentValidations, validateAssignmentRequest, createAssignment);
router.put("/:id", auth, roleAuth("teacher"), assignmentValidations, validateAssignmentRequest, updateAssignment);
router.delete("/:id", auth, roleAuth("teacher"), deleteAssignment);

// Student routes
router.get("/", auth, roleAuth("student"), getStudentAssignments);
router.get("/:id", auth, roleAuth("student"), getStudentAssignmentById);

module.exports = router;
