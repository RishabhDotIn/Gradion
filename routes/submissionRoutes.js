const express = require("express");
const router = express.Router();

const submissionController = require("../controllers/submissionController");
const authMiddleware = require("../middleware/authMiddleware");

// Submit code
router.post("/", authMiddleware, submissionController.submitCode);

// Get submissions for an assignment
router.get("/:assignmentId", authMiddleware, submissionController.getSubmissions);

module.exports = router;