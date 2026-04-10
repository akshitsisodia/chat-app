const fs = require("fs");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const CustomError = require("../utils/CustomError");
const cloudinary = require("../config/cloudinary");
const { getIO } = require("../config/socket");
const ChatMemberModel = require("../models/chatMember.model");
const MessageModel = require("../models/message.model");
const FileModel = require("../models/file.model");
const ChatUnreads = require("../models/chatUnread.model");
const ChatModel = require("../models/chat.model");

const getResourceType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "video";
  return "raw"; // everything else
};

exports.multiUploadHandler = asyncErrorHandler(async (req, res, next) => {
  const content = req?.body?.content;
  const receiverId = req.params.id;
  const senderId = req.user.id;

  const keys = Array.isArray(req.body.keys) ? req.body.keys : [req.body.keys];
  const nonces = Array.isArray(req.body.nonces)
    ? req.body.nonces
    : [req.body.nonces];

  const ivs = Array.isArray(req.body.ivs) ? req.body.ivs : [req.body.ivs];
  const types = Array.isArray(req.body.types)
    ? req.body.types
    : [req.body.types];

  const names = Array.isArray(req.body.names)
    ? req.body.names
    : [req.body.names];

  const files = req.files;

  const results = [];

  const chatId = await ChatMemberModel.findChatByMembers({
    senderId,
    receiverId,
  });
  if (!chatId) {
    return next(new CustomError("Chat not found!", 404));
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    let resourceType = getResourceType(file.mimetype);

    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: resourceType,
      timeout: 60000,
    });

    results.push({
      url: result.secure_url,
      type: types[i],
      name: names[i],
      encrypted_key: keys[i],
      iv: ivs[i],
      nonce: nonces[i],
    });
  }

  // add Message to db
  const message = await MessageModel.create({
    chatId,
    senderId,
    content: "",
    nonce: "",
  });

  const files_data = await Promise.all(
    results.map((curr) => {
      return FileModel.create({
        message_id: message.id,
        url: curr.url,
        type: curr.type,
        name: curr.name,
        encrypted_key: curr.encrypted_key,
        iv: curr.iv,
        nonce: curr.nonce,
      });
    }),
  );

  //update unreads
  const unread_count = await ChatUnreads.createOrupdateUnreads({
    chatId,
    receiverId,
  });

  // update chat
  const chat = await ChatModel.updateChat(chatId);
  if (chat.is_first_update) {
    const updatedReceiverChat = await ChatMemberModel.findChat({
      chatId,
      userId: receiverId,
    });
    getIO().to(receiverId).emit("newChat", updatedReceiverChat);
  }

  getIO()
    .to([chatId, receiverId, senderId])
    .emit("newMessage", {
      ...message,
      unread_count,
      files: files_data,
    });

  res.status(200).json({
    status: "success",
    message: "Data sent successfully",
  });
});
