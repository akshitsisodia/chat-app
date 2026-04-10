const express = require("express");
const {
  generateOtp,
  verifyOtp,
  register,
  login,
  logout,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/generate-otp", generateOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);

module.exports = router;
