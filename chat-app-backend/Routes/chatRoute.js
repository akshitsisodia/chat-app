const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  getOrCreateChat,
  getUserChats,
} = require("../controllers/chatController");

const router = express.Router();

router.get("/get-or-create/:receiverId", protect, getOrCreateChat);
router.get("/prev-chats", protect, getUserChats);

module.exports = router;
