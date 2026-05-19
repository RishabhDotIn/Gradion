const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mongoose = require("mongoose");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Class = require("../models/Class");
const TokenBlacklist = require("../models/TokenBlacklist");

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { fullName, email, password, role } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const user = new User({
      fullName,
      email: email.toLowerCase(),
      password,
      role,
    });

    await user.save();

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    await user.updateLastLogin();

    const expiresIn = rememberMe ? "90d" : "30d";
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

const verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "Token is valid",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Token verification failed",
    });
  }
};

const studentDashboard = (req, res) => {
  res.json({
    success: true,
    message: "Welcome to student dashboard",
    user: req.user,
  });
};

const teacherDashboard = (req, res) => {
  res.json({
    success: true,
    message: "Welcome to teacher dashboard",
    user: req.user,
  });
};

const performance = async (req, res) => {
  try {
    const studentOid = new mongoose.Types.ObjectId(req.user.userId);
    const enrolledClasses = await Class.find({ students: studentOid }).select("_id").lean();
    const classIds = enrolledClasses.map((cls) => cls._id);

    const recentAssignments = classIds.length
      ? await Assignment.find({ status: "published", classId: { $in: classIds } })
          .select("title createdAt")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
      : [];

    const assignmentIds = recentAssignments.map((assignment) => assignment._id);
    const submissions = assignmentIds.length
      ? await Submission.find({ student: studentOid, assignment: { $in: assignmentIds } })
          .select("assignment score submittedAt")
          .sort({ submittedAt: -1 })
          .lean()
      : [];

    const submissionMap = new Map();
    submissions.forEach((submission) => {
      const key = String(submission.assignment);
      if (!submissionMap.has(key)) {
        submissionMap.set(key, submission);
      }
    });

    const chart = [...recentAssignments]
      .reverse()
      .map((assignment) => {
        const submission = submissionMap.get(String(assignment._id));
        const title = assignment.title || "Assignment";
        const attempted = !!submission && submission.score != null;
        return {
          name: title,
          shortName: title.length > 14 ? `${title.slice(0, 13)}…` : title,
          score: attempted ? Number(submission.score || 0) : 0,
          attempted,
          submittedAt: submission?.submittedAt || null,
        };
      });

    while (chart.length < 5) {
      chart.unshift({
        name: "",
        shortName: "",
        score: null,
        attempted: false,
        empty: true,
      });
    }

    const scores = chart.map((item) => item.score);

    return res.json({
      success: true,
      chart,
      scores,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch performance data",
      error: error.message,
    });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.token;
    const decoded = jwt.decode(token);
    
    // Add token to blacklist
    await TokenBlacklist.create({
      token,
      userId: decoded.userId,
      expiresAt: new Date(decoded.exp * 1000),
      reason: 'logout'
    });

    return res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.token;
    const decoded = jwt.decode(token);
    
    // Check if token is close to expiration (within 5 minutes)
    const timeUntilExpiry = decoded.exp * 1000 - Date.now();
    if (timeUntilExpiry > 5 * 60 * 1000) {
      return res.json({
        success: true,
        message: "Token is still valid",
        token: token,
      });
    }

    // Generate new token
    const newToken = jwt.sign(
      {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Blacklist old token
    await TokenBlacklist.create({
      token,
      userId: decoded.userId,
      expiresAt: new Date(decoded.exp * 1000),
      reason: 'refresh'
    });

    return res.json({
      success: true,
      message: "Token refreshed successfully",
      token: newToken,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return res.status(500).json({
      success: false,
      message: "Token refresh failed",
    });
  }
};

const dashboardStats = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const teacherOid = new mongoose.Types.ObjectId(teacherId);

    const totalAssignments = await Assignment.countDocuments({ teacher: teacherId });

    const totalStudentsAgg = await Class.aggregate([
      { $match: { teacher: teacherOid } },
      { $project: { studentCount: { $size: { $ifNull: ["$students", []] } } } },
      { $group: { _id: null, totalStudents: { $sum: "$studentCount" } } },
    ]);
    const totalStudents = (totalStudentsAgg[0] && totalStudentsAgg[0].totalStudents) || 0;

    const assignmentIds = (await Assignment.find({ teacher: teacherId }).select("_id")).map((a) => a._id);
    const totalSubmissions = await Submission.countDocuments({ assignment: { $in: assignmentIds } });
    const pendingReviews = await Submission.countDocuments({
      assignment: { $in: assignmentIds },
      $or: [{ status: "Pending" }, { plagiarismScore: { $gte: 75 } }],
    });

    return res.json({
      success: true,
      totalAssignments,
      totalStudents,
      totalSubmissions,
      pendingReviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard stats",
    });
  }
};

module.exports = {
  register,
  login,
  verifyToken,
  logout,
  refreshToken,
  studentDashboard,
  teacherDashboard,
  performance,
  dashboardStats,
};
