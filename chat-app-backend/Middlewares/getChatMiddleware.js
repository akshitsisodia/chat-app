const ChatModel = require("../models/chat.model");
const ChatMemberModel = require("../models/chatMember.model");
const UserModel = require("../models/user.model");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const CustomError = require("../utils/CustomError");

exports.getOrCreateChat = asyncErrorHandler(async (req, res, next) => {
  const senderId = req.user.id;
  const receiverId = req?.params?.receiverId;
  let chatId;

  if (!receiverId) {
    return next(new CustomError("User ID required!", 400));
  }

  if (!/^[0-9a-f-]{36}$/.test(receiverId)) {
    return next(new CustomError("Invalid ID format!", 400));
  }

  const receiver = await UserModel.findById(receiverId);
  if (!receiver) {
    return next(new CustomError("User not found!", 404));
  }

  // 1. try to find existing chat
  if (senderId === receiverId) {
    chatId = await ChatMemberModel.findChatByMember({ senderId });
  } else {
    chatId = await ChatMemberModel.findChatByMembers({
      senderId,
      receiverId,
    });
  }

  if (!chatId && receiverId === senderId) {
    //2 create own room if sender === receiver
    chatId = await ChatModel.createChat();
    await ChatMemberModel.createMember({
      chatId,
      senderId,
    });
  }

  if (!chatId) {
    // 3. if not found → create new chat
    chatId = await ChatModel.createChat();
    await ChatMemberModel.createMembers({
      chatId,
      senderId,
      receiverId,
    });
  }

  req.chatId = chatId;
  req.receiver = receiver;

  next();
});
