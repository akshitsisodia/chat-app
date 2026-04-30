const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  getOrCreateChat,
  getUserChats,
  createGroup,
  getUserGroups,
  getGroupKeyHandler,
  getChatMembers,
  getGroupKeysHandler,
  leaveGroup,
} = require("../controllers/chatController");

const { handleUpload } = require("../controllers/uploadController");

const router = express.Router();

router.post(
  "/create-group",
  protect,
  handleUpload({ field: "photo" }),
  createGroup,
);
router.get("/get-or-create/:receiverId", protect, getOrCreateChat);
router.get("/prev-chats", protect, getUserChats);

router.get("/my-groups", protect, getUserGroups);
// router.get("/groups-key/:chatId", protect, getGroupKeyHandler);
router.get("/group-keys/:chatId", protect, getGroupKeysHandler);
router.patch("/leave-group/:chatId", protect, leaveGroup);

router.get("/:id", protect, getChatMembers);

module.exports = router;
