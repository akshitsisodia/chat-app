const { pool } = require("../config/db");
const ChatModel = require("../models/chat.model");
const ChatMemberModel = require("../models/chatMember.model");
const ChatUnreads = require("../models/chatUnread.model");
const MessageModel = require("../models/message.model");
const MessageSeenModel = require("../models/messageSeen.model");
const UserModel = require("../models/user.model");

exports.sendMessageHandler = (socket, io) => async (data) => {
  try {
    const { content, receiverId, nonce } = data;
    const senderId = socket.user.id;

    if (!content || !receiverId || !nonce) {
      return socket.emit("error", "All credentials required!");
    }

    if (!/^[0-9a-f-]{36}$/.test(receiverId)) {
      return socket.emit("error", "Invalid ID format!");
    }
    if (senderId === receiverId) {
      return socket.emit("error", "Invalid receiver");
    }

    const receiver = await UserModel.findById(receiverId);
    if (!receiver) {
      return socket.emit("error", "User not found!");
    }

    //find chat // /todo get orCreate Chat
    const chatId = await ChatMemberModel.findChatByMembers({
      senderId,
      receiverId,
    });
    if (!chatId) {
      return socket.emit("error", "Chat not found!");
    }

    // add Message to db
    const message = await MessageModel.create({
      chatId,
      senderId,
      content,
      nonce,
    });

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
      io.to(receiverId).emit("newChat", updatedReceiverChat);
    }

    io.to([chatId, receiverId, senderId]).emit("newMessage", {
      ...message,
      unread_count,
    });
  } catch (error) {
    console.log(error);
    socket.emit("error", "Something went wrong");
  }
};

exports.seenMessageHandler = (socket, io) => async (data) => {
  try {
    const { chatId, receiverId } = data;
    const senderId = socket.user.id;

    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      return socket.emit("error", "Chat not found!");
    }

    // seen logic
    await MessageSeenModel.markSeen({ chatId, senderId });

    // last message update
    await ChatUnreads.resetUnreads({ chatId, senderId });

    socket
      .to([chatId, senderId, receiverId])
      .emit("updateSeen", "message seen");
  } catch (error) {
    console.log(error);
    socket.emit("error", "Something went wrong");
  }
};
