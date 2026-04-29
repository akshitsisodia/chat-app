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
    const { chatId, content, nonce } = data;
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

    await ChatUnreads.createOrupdateUnreads(
      {
        chatId,
        receiverIds,
      },
      client,
    );

    await ChatModel.updateChat(chatId, client);

    await client.query("COMMIT");

    const emitMessage = chat.type === "private" ? "newMessage" : "groupMessage";

    // send to sender
    io.to([senderId, ...receiverIds]).emit(emitMessage, message);

  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    socket.emit("error", "Something went wrong");
  } finally {
    client.release();
  }
};

exports.seenMessageHandler = (socket, io) => async (chatId) => {
  try {
    const senderId = socket.user.id;

    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      return socket.emit("error", "Chat not found!");
    }
    const receivers = await ChatMemberModel.findReceiversByChatId({
      chatId,
      senderId,
    });
    const receiverIds = receivers.map((r) => r.user_id);

    // seen logic
    await MessageSeenModel.markSeen({ chatId, senderId });

    // last message update
    await ChatUnreads.resetUnreads({ chatId, senderId });

    socket
      .to(chatId)
      .to(senderId)
      .to(receiverIds)
      .emit("updateSeen", "message seen");
  } catch (error) {
    console.log(error);
    socket.emit("error", "Something went wrong");
  }
};
