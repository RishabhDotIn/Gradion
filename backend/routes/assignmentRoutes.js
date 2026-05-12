const express = require("express");
const { auth, roleAuth } = require("../middleware/authMiddleware");
const {
  assignmentValidations,
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
} = require("../controllers/assignmentController");

const router = express.Router();

// Public endpoint for student assignments (no authentication required)
router.get("/public", getPublicAssignments);
router.get("/public/:id", getPublicAssignmentById);
router.get("/", auth, roleAuth("teacher"), getTeacherAssignments);
router.get("/recent", auth, roleAuth("teacher"), getRecentAssignments);
router.get("/performance", auth, roleAuth("teacher"), getAssignmentPerformance);
router.get("/:id", auth, roleAuth("teacher"), getAssignmentById);
router.post("/", auth, roleAuth("teacher"), assignmentValidations, validateAssignmentRequest, createAssignment);
router.put("/:id", auth, roleAuth("teacher"), assignmentValidations, validateAssignmentRequest, updateAssignment);
router.delete("/:id", auth, roleAuth("teacher"), deleteAssignment);

module.exports = router;
