const Assignment = require("../models/Assignment");
const mongoose = require("mongoose");

const createAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.create({
      ...req.body,
      teacher: req.user.userId,
      status: req.body.status || "published",
    });

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
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      assignments,
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

    return res.json({
      success: true,
      assignments,
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
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 4, 1);

    const rows = await Assignment.aggregate([
      {
        $match: {
          teacher: req.user.userId ? new mongoose.Types.ObjectId(req.user.userId) : null,
          createdAt: { $gte: start, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const countsByMonth = new Map(rows.map((r) => [`${r._id.year}-${r._id.month}`, r.count]));
    const chart = [];

    for (let i = 4; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const score = countsByMonth.get(key) || 0;
      chart.push({
        shortName: monthNames[d.getMonth()],
        score,
      });
    }

    for (let i = 0; i < chart.length; i += 1) {
      const prev = chart[i - 1]?.score ?? chart[i].score;
      chart[i].trend = Math.round((prev + chart[i].score) / 2);
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
    }).lean();

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
    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user.userId },
      {
        ...req.body,
        updatedAt: new Date(),
      },
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

module.exports = {
  createAssignment,
  getTeacherAssignments,
  getRecentAssignments,
  getAssignmentPerformance,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
};
