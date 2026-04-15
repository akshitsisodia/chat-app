const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");

const {
  generateOtpSchema,
  verifyOtpSchema,
  registerSchema,
  loginSchema,
} = require("../utils/validators/auth.schema");

const {
  generateOtp,
  verifyOtp,
  register,
  login,
  logout,
} = require("../controllers/authController");

router.post("/generate-otp", validate(generateOtpSchema), generateOtp);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", protect, logout);

module.exports = router;
