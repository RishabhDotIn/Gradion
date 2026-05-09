const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Assignment = require("../models/Assignment");

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

const performance = (req, res) => {
  res.json({
    success: true,
    scores: [65, 72, 80, 75, 90],
  });
};

const dashboardStats = async (req, res) => {
  try {
    const totalAssignments = await Assignment.countDocuments({ teacher: req.user.userId });
    const totalStudents = await User.countDocuments({ role: "student", isActive: true });

    return res.json({
      success: true,
      totalAssignments,
      totalStudents,
      totalSubmissions: 0,
      pendingReviews: 0,
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
  studentDashboard,
  teacherDashboard,
  performance,
  dashboardStats,
};
