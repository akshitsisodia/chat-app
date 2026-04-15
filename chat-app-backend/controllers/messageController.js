const { getIO } = require("../config/socket");
const ChatModel = require("../models/chat.model");
const ChatMemberModel = require("../models/chatMember.model");
const ChatUnreads = require("../models/chatUnread.model");
const MessageModel = require("../models/message.model");
const MessageSeenModel = require("../models/messageSeen.model");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const CustomError = require("../utils/CustomError");

exports.getMessages = asyncErrorHandler(async (req, res, next) => {
  const senderId = req.user.id;
  const chatId = req.params.chatId;
  // const receiverId = req.params.receiverId;

  const limit = Number(req?.query?.limit) || 20;
  const offset = Number(req?.query?.offset) || 0;

  const data = await MessageModel.find({ chatId, senderId, limit, offset });
  const length = await MessageModel.countMessages({ chatId });

  await MessageSeenModel.markSeen({ chatId, senderId });
  await ChatUnreads.resetUnreads({ chatId, senderId });

  const receivers = await ChatMemberModel.findReceiversByChatId({
    chatId,
    senderId,
  });
  const receiverIds = receivers.map((r) => r.user_id);

  getIO().to(chatId).to(senderId).emit("updateSeen", { by: senderId });
  // send to receivers
  receiverIds.forEach((receiverId) => {
    getIO().to(receiverId).emit("updateSeen", { by: senderId });
  });

  res.status(200).json({
    status: "success",
    count: length,
    data,
    receivers: receivers,
  });
});

exports.postMessage = asyncErrorHandler(async (req, res, next) => {
  const content = req.body.content;
  const receiverId = req.body.receiverId;
  const nonce = req.body.nonce;
  const chatId = req.params.chatId;

  const senderId = req.user.id;

  if (!content || receiverId || nonce || !chatId) {
    return next(new CustomError("All credemtials required!", 400));
  }

  if (!/^[0-9a-f-]{36}$/.test(chatId) || !/^[0-9a-f-]{36}$/.test(receiverId)) {
    return next(new CustomError("Invalid ID format!", 400));
  }

  // check if chat exists
  const chat = await ChatModel.findById(chatId);
  if (!chat) {
    return next(new CustomError("Chat not found!", 404));
  }

  // add Message to db
  const message = await MessageModel.create({
    chatId,
    senderId,
    content,
    nonce,
  });

  // update chat
  const updatedChat = await ChatModel.updateChat(chatId);

  //update unreads
  await ChatUnreads.updateUnreads({ chatId, receiverId });

  res.status(201).json({
    status: "success",
    data: message,
  });
});
