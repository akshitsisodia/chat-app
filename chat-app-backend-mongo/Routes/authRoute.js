const express = require("express");
const {
  register,
  forgetPassword,
  resetPassword,
  logout,
  generateOtp,
  verifyOtp,
  login,
} = require("../Controllers/authController");
const { protect } = require("../Middlewares/authMiddleware");
const validate = require("../Middlewares/validateMiddleware");
const {
  generateOtpSchema,
  verifyOtpSchema,
  loginSchema,
  registerSchema,
} = require("../Utils/validators/auth.schema");

const router = express.Router();

router.post("/generate-otp", validate(generateOtpSchema), generateOtp);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/register", validate(registerSchema), register);

router.post("/login", validate(loginSchema), login);
router.post("/logout", protect, logout);

// router.post("/forget-password", protect, forgetPassword);
// router.post("/reset-password", protect, resetPassword);

module.exports = router;
