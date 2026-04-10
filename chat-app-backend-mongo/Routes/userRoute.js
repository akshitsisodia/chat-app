const express = require("express");
const {
  getUsers,
  getMe,
  getPrevChatUsers,
  getUserById,
  setPublicKey,
} = require("../Controllers/userController");
const { protect } = require("../Middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, getUsers);
router.get("/me", protect, getMe);
router.get("/previous-chats", protect, getPrevChatUsers);
router.post("/public-key", protect, setPublicKey);
router.get("/:id", protect, getUserById);

module.exports = router;
