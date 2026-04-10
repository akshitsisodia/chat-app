const express = require("express");
const {
  getPrivateMessage,
  sendPrivateMessage,
} = require("../Controllers/privateMessageController");
const { protect } = require("../Middlewares/authMiddleware");
const validate = require("../Middlewares/validateMiddleware");
const { messageSchema } = require("../Utils/validators/message.schema");

const router = express.Router();

router.get("/:id", protect, getPrivateMessage);
router.post("/:id", protect, validate(messageSchema), sendPrivateMessage);

module.exports = router;
