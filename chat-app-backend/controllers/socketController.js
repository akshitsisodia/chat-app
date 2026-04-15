const { pool } = require("../config/db");
const ChatModel = require("../models/chat.model");
const ChatMemberModel = require("../models/chatMember.model");
const ChatUnreads = require("../models/chatUnread.model");
const MessageModel = require("../models/message.model");
const MessageSeenModel = require("../models/messageSeen.model");
const UserModel = require("../models/user.model");
const { validate: isUUID } = require("uuid");

exports.sendMessageHandler = (socket, io) => async (data) => {
  const client = await pool.connect();
  try {
    const { content, chatId, nonce } = data;
    const senderId = socket.user.id;

    if (!chatId || !nonce) {
      return socket.emit("error", "All credentials required!");
    }

    if (!isUUID(chatId)) {
      return socket.emit("error", "Invalid ID format!");
    }

    await client.query("BEGIN");

    const receivers = await ChatMemberModel.findReceiversByChatId({
      chatId,
      senderId,
    });
    const receiverIds = receivers.map((r) => r.user_id);
    // 1. find
    let chat = await ChatModel.findById(chatId);

    if (!chat) {
      socket.emit("error", "chat not found!");
      return;
    }

    // 2. create message
    const message = await MessageModel.create(
      {
        chatId,
        senderId,
        content,
        nonce,
      },
      client,
    );

    const unreadCounts = await ChatUnreads.createOrupdateUnreads(
      {
        chatId,
        receiverIds,
      },
      client,
    );

    await ChatModel.updateChat(chat.id, client);

    await client.query("COMMIT");

    // send to sender
    // io.to(chat.id).emit("newMessage", { ...message, unreadCounts });
    io.to(chatId)
      .to(senderId)
      .to(receiverIds)
      .emit("newMessage", {
        ...message,
        unread_count: 0,
      });

    // send to receivers
    // if (chat.type === "private") {
    //   receiverIds.forEach((receiverId) => {
    //     const userUnread =
    //       unreadCounts.find((u) => u.user_id === receiverId)?.unread_count || 0;

    //     io.to(receiverId).emit("newMessage", {
    //       ...message,
    //       unread_count: userUnread,
    //     });
    //   });
    // }
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    socket.emit("error", "Something went wrong");
  } finally {
    client.release();
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
