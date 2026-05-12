const { body, validationResult } = require("express-validator");

const assignmentValidations = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("topic").trim().notEmpty().withMessage("Topic is required"),
  body("difficulty")
    .isIn(["easy", "medium", "hard"])
    .withMessage("Difficulty must be easy, medium, or hard"),
  body("deadline")
    .notEmpty()
    .withMessage("Deadline is required")
    .isISO8601()
    .withMessage("Deadline must be a valid date")
    .custom((value) => {
      const deadline = new Date(value);
      if (deadline <= new Date()) {
        throw new Error("Deadline must be in the future");
      }
      return true;
    }),
];

const validateAssignmentRequest = (req, res, next) => {
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

module.exports = {
  assignmentValidations,
  validateAssignmentRequest,
};
