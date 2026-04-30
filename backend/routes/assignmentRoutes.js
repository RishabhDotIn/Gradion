const express = require("express");
const { body, validationResult } = require("express-validator");
const { auth, roleAuth } = require("../middleware/auth");
const {
  createAssignment,
  getTeacherAssignments,
  getRecentAssignments,
  getAssignmentPerformance,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} = require("../controllers/assignmentController");

const router = express.Router();

const assignmentValidations = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("topic").trim().notEmpty().withMessage("Topic is required"),
  body("difficulty")
    .isIn(["easy", "medium", "hard"])
    .withMessage("Difficulty must be easy, medium, or hard"),
  body("deadline").notEmpty().withMessage("Deadline is required"),
];

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  return next();
};

router.get("/", auth, roleAuth("teacher"), getTeacherAssignments);
router.get("/recent", auth, roleAuth("teacher"), getRecentAssignments);
router.get("/performance", auth, roleAuth("teacher"), getAssignmentPerformance);
router.get("/:id", auth, roleAuth("teacher"), getAssignmentById);
router.post("/", auth, roleAuth("teacher"), assignmentValidations, validateRequest, createAssignment);
router.put("/:id", auth, roleAuth("teacher"), assignmentValidations, validateRequest, updateAssignment);
router.delete("/:id", auth, roleAuth("teacher"), deleteAssignment);

module.exports = router;
