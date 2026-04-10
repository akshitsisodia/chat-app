const express = require("express");
const { protect } = require("../Middlewares/authMiddleware");
const {
  getOrCreateChat,
  getPreviousChats,
} = require("../Controllers/chatController");

const router = express.Router();

router.get("/", protect, getPreviousChats);
router.post("/get-or-create ", protect, getOrCreateChat);

module.exports = router;
