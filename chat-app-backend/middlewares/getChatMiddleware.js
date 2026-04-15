const ChatModel = require("../models/chat.model");
const ChatMemberModel = require("../models/chatMember.model");
const UserModel = require("../models/user.model");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const CustomError = require("../utils/CustomError");
const { validate: isUUID } = require("uuid");

exports.getOrCreateChat = asyncErrorHandler(async (req, res, next) => {
  const senderId = req.user.id;
  const receiverId = req?.params?.receiverId;

  if (!receiverId) {
    return next(new CustomError("User ID required!", 400));
  }

  if (!isUUID(receiverId)) {
    return next(new CustomError("Invalid ID format!", 400));
  }

  const pairKey =
    senderId === receiverId
      ? senderId
      : [senderId, receiverId].sort().join("_");

  // 1. try find
  let chat = await ChatModel.findByPairKey(pairKey);

  // 2. create if not exists
  if (!chat) {
    try {
      const receiver = await UserModel.findById(receiverId);
      if (!receiver) {
        return next(new CustomError("User not found!", 404));
      }

      chat = await ChatModel.create({
        type: "private",
        name: null,
        photo: null,
        created_by: null,
        pair_key: pairKey,
      });

      if (senderId === receiverId) {
        await ChatMemberModel.addMember({
          chat_id: chat.id,
          user_id: senderId,
        });
      } else {
        await ChatMemberModel.createMembers({
          chatId: chat.id,
          senderId,
          receiverId,
        });
      }
    } catch (err) {
      // race condition safe fallback
      chat = await ChatModel.findByPairKey(pairKey);
    }
  }

  req.chatId = chat.id;

  next();
});
