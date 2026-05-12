const express = require("express");
const { body } = require("express-validator");
const { auth } = require("../middleware/authMiddleware");
const {
  register,
  login,
  verifyToken,
  logout,
  refreshToken,
} = require("../controllers/authController");

const router = express.Router();

const registerValidations = [
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("role")
    .isIn(["student", "teacher"])
    .withMessage("Role must be either student or teacher"),
];

const loginValidations = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

router.post("/register", registerValidations, register);
router.post("/login", loginValidations, login);
router.get("/verify", auth, verifyToken);
router.post("/logout", auth, logout);
router.post("/refresh", auth, refreshToken);

module.exports = router;
