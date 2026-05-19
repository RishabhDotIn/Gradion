const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
    index: true
  },
  questionIndex: {
    type: Number,
    default: 0,
    min: 0
  },
  code: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Graded', 'Late', 'Failed'],
    default: 'Pending'
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  aiFeedback: {
    type: String,
    default: ''
  },
  plagiarismScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  plagiarismExplanation: {
    type: String,
    default: ''
  },
  teacherFeedback: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

submissionSchema.index({ assignment: 1, student: 1, createdAt: -1 });
submissionSchema.index({ assignment: 1, student: 1, questionIndex: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
