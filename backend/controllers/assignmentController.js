const Assignment = require("../models/Assignment");
const Class = require("../models/Class");
const Submission = require("../models/Submission");
const MailboxNotification = require("../models/MailboxNotification");
const User = require("../models/User");
const mongoose = require("mongoose");
const { coerceQuestionsInput, questionsAreComplete } = require("../utils/assignmentQuestions");

const makeShortLabel = (value, maxLength = 14) => {
  const text = String(value || "Assignment").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
};

const createAssignment = async (req, res) => {
  try {
    const cls = await Class.findOne({
      _id: req.body.classId,
      teacher: req.user.userId,
    });
    if (!cls) {
      return res.status(403).json({
        success: false,
        message: "You can only publish assignments to classes you teach.",
      });
    }

    const questions = coerceQuestionsInput(req.body.questions);
    if (!questionsAreComplete(questions)) {
      return res.status(400).json({
        success: false,
        message:
          "Each question must have a title, description (or examples, 5+ characters), a programming language, and at least one test case with both input and output.",
      });
    }

    const assignment = await Assignment.create({
      title: String(req.body.title || "").trim(),
      description: String(req.body.description || "").trim(),
      topic: String(req.body.topic || "").trim(),
      difficulty: req.body.difficulty,
      deadline: new Date(req.body.deadline),
      classId: req.body.classId,
      status: req.body.status || "published",
      questions,
      teacher: req.user.userId,
    });

    const classStudents = Array.isArray(cls.students) ? cls.students : [];
    if (classStudents.length > 0) {
      const teacher = await User.findById(req.user.userId).select("fullName").lean();
      const teacherName = teacher?.fullName || "Your teacher";
      await MailboxNotification.insertMany(
        classStudents.map((studentId) => ({
          user: studentId,
          assignment: assignment._id,
          classId: cls._id,
          title: "New assignment posted",
          message: `${teacherName} posted "${assignment.title}". Deadline: ${new Date(assignment.deadline).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`,
        }))
      );
    }

    return res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      assignment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create assignment",
      error: error.message,
    });
  }
};

const getTeacherAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacher: req.user.userId })
      .populate("classId", "name inviteCode")
      .sort({ createdAt: -1 })
      .lean();

    // compute attempted counts per assignment and class student counts
    const assignmentIds = assignments.map((a) => a._id);
    const classIds = assignments.map((a) => a.classId && a.classId._id).filter(Boolean);

    const attemptedAgg = await Submission.aggregate([
      { $match: { assignment: { $in: assignmentIds } } },
      { $group: { _id: "$assignment", students: { $addToSet: "$student" } } },
      { $project: { attemptedCount: { $size: "$students" } } },
    ]);
    const attemptedMap = new Map(attemptedAgg.map((r) => [String(r._id), r.attemptedCount]));

    const classes = classIds.length
      ? await Class.find({ _id: { $in: classIds } }).select('students').lean()
      : [];
    const classCountMap = new Map(classes.map((c) => [String(c._id), (c.students || []).length]));

    const enhanced = assignments.map((assignment) => {
      const attempted = attemptedMap.get(String(assignment._id)) || 0;
      const classStudentCount = assignment.classId && assignment.classId._id
        ? classCountMap.get(String(assignment.classId._id)) || 0
        : 0;
      return {
        ...assignment,
        attemptedCount: attempted,
        classStudentCount,
      };
    });

    return res.json({
      success: true,
      assignments: enhanced,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assignments",
      error: error.message,
    });
  }
};

const getRecentAssignments = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);
    const assignments = await Assignment.find({ teacher: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("title deadline createdAt")
      .lean();

    const assignmentIds = assignments.map((assignment) => assignment._id);
    const submissionCounts = assignmentIds.length
      ? await Submission.aggregate([
          { $match: { assignment: { $in: assignmentIds } } },
          { $group: { _id: "$assignment", students: { $addToSet: "$student" } } },
          { $project: { submissionCount: { $size: "$students" } } },
        ])
      : [];

    const countMap = new Map(submissionCounts.map((row) => [String(row._id), row.submissionCount]));

    const enhancedAssignments = assignments.map((assignment) => ({
      ...assignment,
      submissionCount: countMap.get(String(assignment._id)) || 0,
    }));

    return res.json({
      success: true,
      assignments: enhancedAssignments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recent assignments",
      error: error.message,
    });
  }
};

const getAssignmentPerformance = async (req, res) => {
  try {
    const teacherId = new mongoose.Types.ObjectId(req.user.userId);

    const recentAssignments = await Assignment.find({ teacher: teacherId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("_id title createdAt")
      .lean();

    const assignmentIds = recentAssignments.map((assignment) => assignment._id);
    const scoreRows = assignmentIds.length
      ? await Submission.aggregate([
          {
            $match: {
              assignment: { $in: assignmentIds },
              score: { $ne: null },
            },
          },
          {
            $group: {
              _id: "$assignment",
              averageScore: { $avg: "$score" },
              submissionCount: { $sum: 1 },
            },
          },
        ])
      : [];

    const scoreMap = new Map(scoreRows.map((row) => [String(row._id), row]));
    const chart = [...recentAssignments]
      .reverse()
      .map((assignment) => {
        const stats = scoreMap.get(String(assignment._id)) || {};
        const hasSubmissions = (stats.submissionCount || 0) > 0;
        return {
          name: assignment.title,
          shortName: makeShortLabel(assignment.title),
          score: Math.round(stats.averageScore || 0),
          submissionCount: stats.submissionCount || 0,
          attempted: hasSubmissions,
          createdAt: assignment.createdAt,
        };
      });

    while (chart.length < 5) {
      chart.unshift({
        name: "",
        shortName: "",
        score: null,
        submissionCount: 0,
        attempted: false,
        empty: true,
      });
    }

    const current = chart[chart.length - 1]?.score || 0;
    const previous = chart[chart.length - 2]?.score || 0;
    const improvement = previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);

    return res.json({
      success: true,
      chart,
      improvement,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assignment performance",
      error: error.message,
    });
  }
};

const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      teacher: req.user.userId,
    })
      .populate('classId', 'name inviteCode')
      .lean();

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    return res.json({
      success: true,
      assignment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assignment",
      error: error.message,
    });
  }
};

const updateAssignment = async (req, res) => {
  try {
    if (req.body.classId) {
      const cls = await Class.findOne({
        _id: req.body.classId,
        teacher: req.user.userId,
      });
      if (!cls) {
        return res.status(403).json({
          success: false,
          message: "You can only assign work to your own classes.",
        });
      }
    }

    const questions = coerceQuestionsInput(req.body.questions);
    if (!questionsAreComplete(questions)) {
      return res.status(400).json({
        success: false,
        message:
          "Each question must have a title, description (or examples, 5+ characters), a programming language, and at least one test case with both input and output.",
      });
    }

    const doc = {
      title: String(req.body.title || "").trim(),
      description: String(req.body.description || "").trim(),
      topic: String(req.body.topic || "").trim(),
      difficulty: req.body.difficulty,
      deadline: new Date(req.body.deadline),
      status: req.body.status || "published",
      questions,
    };
    if (req.body.classId) {
      doc.classId = req.body.classId;
    }

    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user.userId },
      { $set: doc },
      { new: true, runValidators: true }
    ).lean();

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    return res.json({
      success: true,
      message: "Assignment updated successfully",
      assignment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update assignment",
      error: error.message,
    });
  }
};

const getPublicAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ status: "published" })
      .select("title description topic difficulty deadline questions status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const normalizedAssignments = assignments.map((assignment) => ({
      id: assignment._id,
      title: assignment.title,
      description: assignment.description,
      topic: assignment.topic,
      difficulty: assignment.difficulty.charAt(0).toUpperCase() + assignment.difficulty.slice(1),
      deadline: new Date(assignment.deadline).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      questionsCount: assignment.questions?.length || 0,
      status: "Not started", // Default status for students
    }));

    return res.json({
      success: true,
      assignments: normalizedAssignments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assignments",
      error: error.message,
    });
  }
};

const getPublicAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ 
      _id: req.params.id, 
      status: "published" 
    })
      .select("title description topic difficulty deadline questions status createdAt")
      .lean();

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const normalizedAssignment = {
      id: assignment._id,
      title: assignment.title,
      description: assignment.description,
      topic: assignment.topic,
      difficulty: assignment.difficulty.charAt(0).toUpperCase() + assignment.difficulty.slice(1),
      deadline: new Date(assignment.deadline).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      questions: assignment.questions || [],
      status: "Not started", // Default status for students
    };

    return res.json({
      success: true,
      assignment: normalizedAssignment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assignment",
      error: error.message,
    });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const deleted = await Assignment.findOneAndDelete({
      _id: req.params.id,
      teacher: req.user.userId,
    }).lean();

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    return res.json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete assignment",
      error: error.message,
    });
  }
};

// Student assignment routes
const getStudentAssignments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const studentOid = new mongoose.Types.ObjectId(req.user.userId);
    const enrolledClasses = await Class.find({ students: studentOid }).select("_id").lean();
    const classIds = enrolledClasses.map((c) => c._id);

    if (!classIds.length) {
      return res.json({
        success: true,
        assignments: [],
        pagination: {
          current: page,
          pages: 0,
          total: 0,
          limit,
        },
      });
    }

    const query = {
      status: "published",
      classId: { $in: classIds },
    };

    const assignments = await Assignment.find(query)
      .select("title description topic difficulty deadline createdAt classId status")
      .populate("classId", "name")
      .sort({ deadline: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Assignment.countDocuments(query);

    // fetch latest submission per assignment for this student
    const assignmentIds = assignments.map((a) => a._id);
    const subs = await Submission.aggregate([
      { $match: { student: studentOid, assignment: { $in: assignmentIds } } },
      { $sort: { submittedAt: -1 } },
      {
        $group: {
          _id: '$assignment',
          submissionId: { $first: '$_id' },
          status: { $first: '$status' },
          score: { $first: '$score' },
          submittedAt: { $first: '$submittedAt' },
        },
      },
    ]);
    const subsMap = new Map(subs.map((s) => [String(s._id), s]));

    return res.json({
      success: true,
      assignments: assignments.map((assignment) => ({
        ...assignment,
        hasSubmission: !!subsMap.get(String(assignment._id)),
        submission: subsMap.get(String(assignment._id)) || null,
      })),
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assignments",
      error: error.message,
    });
  }
};

const getStudentAssignmentById = async (req, res) => {
  try {
    const studentOid = new mongoose.Types.ObjectId(req.user.userId);
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      status: 'published'
    })
      .select('title description topic difficulty deadline questions createdAt classId')
      .lean();

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const enrolled = await Class.exists({
      _id: assignment.classId,
      students: studentOid,
    });
    if (!enrolled) {
      return res.status(403).json({
        success: false,
        message: "Join the class for this assignment to access it.",
      });
    }

    const canSubmit = new Date(assignment.deadline) > new Date();

    return res.json({
      success: true,
      assignment,
      canSubmit,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assignment",
      error: error.message,
    });
  }
};

module.exports = {
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
};
