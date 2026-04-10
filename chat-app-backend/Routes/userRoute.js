const express = require("express");
const {
  getAllUsers,
  getMe,
  getUserById,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, getAllUsers);
router.get("/me", protect, getMe);
router.get("/:id", protect, getUserById);

module.exports = router;
