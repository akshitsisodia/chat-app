const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  getMessages,
  postMessage,
} = require("../controllers/messageController");
const { getOrCreateChat } = require("../middlewares/getChatMiddleware");

const router = express.Router();

// router.get("/:chatId", protect, getOrCreateChat, getMessages);
router.get("/:chatId", protect, getMessages);
router.post("/:chatId", protect, postMessage);

module.exports = router;
