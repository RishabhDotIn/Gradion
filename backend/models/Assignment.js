const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, default: "" },
    output: { type: String, default: "" },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    problemTitle: { type: String, default: "" },
    problemDescription: { type: String, default: "" },
    constraints: { type: String, default: "" },
    examples: { type: String, default: "" },
    language: { type: String, default: "" },
    starterCode: { type: String, default: "" },
    testCases: { type: [testCaseSchema], default: [] },
  },
  { _id: false }
);

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    topic: {
      type: String,
      required: [true, "Topic is required"],
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: [true, "Difficulty is required"],
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
      validate: {
        validator: function(value) {
          return value > new Date();
        },
        message: "Deadline must be in the future"
      }
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["published", "closed"],
      default: "published",
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Create indexes for better performance
assignmentSchema.index({ teacher: 1, createdAt: -1 });
assignmentSchema.index({ status: 1, deadline: 1 });
assignmentSchema.index({ topic: 1 });
assignmentSchema.index({ difficulty: 1 });
assignmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Assignment", assignmentSchema);
