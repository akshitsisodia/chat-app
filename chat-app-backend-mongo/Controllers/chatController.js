const Chat = require("../Models/Chat");
const User = require("../Models/User");
const asyncErrorHandler = require("../Utils/asyncErrorHandler");

exports.getOrCreateChat = asyncErrorHandler(async (req, res) => {
  const senderId = req.user._id.toString();
  const receiverId = req?.body?.receiverId.toString();

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return next(new CustomError("User not found!!", 404));
  }

  // 1. try to find existing chat
  let chat = await Chat.findOne({
    members: { $all: [senderId, receiverId] },
  })?.populate("members", "name email photo");

  // 2. if not found → create new chat
  if (!chat) {
    chat = await Chat.create({
      members: [senderId, receiverId],
      lastMessage: null, // no messages yet
    });
  }

  res.status(200).json({
    status: "success",
    data: chat,
  });
});

exports.getPreviousChats = asyncErrorHandler(async (req, res, next) => {
  const sender = req.user;

  const chats = await Chat.find({
    _id: { $in: sender?.previousChats },
  })
    .populate("members", "name email photo publicKey")
    // .populate("lastMessage.sender", "name email photo publicKey")
    .sort({ updatedAt: -1 });

  if (!chats) {
    return next(new CustomError("No prev chats!", 404));
  }

  res.status(200).json({
    status: "success",
    data: chats,
  });
});
