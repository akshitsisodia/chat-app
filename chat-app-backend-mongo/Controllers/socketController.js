const mongoose = require("mongoose");
const Chat = require("../Models/Chat");
const PrivateMessage = require("../Models/PrivateMessage");
const User = require("../Models/User");

const updatePreviousChats = async (user, chatId) => {
  const chatIdStr = chatId.toString();

  user.previousChats = [
    chatIdStr,
    ...user.previousChats.filter((id) => id.toString() !== chatIdStr),
  ];

  await user.save();
};

exports.sendMessageHandler = (socket, io) => async (data) => {
  try {
    const { content, chatId, receiverId, nonce } = data;
    const senderId = socket.user._id.toString();
    const sender = socket.user;

    if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return socket.emit("error", "Invalid receiver");
    }
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return socket.emit("error", "User not found!");
    }


    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return socket.emit("error", "Invalid chatId");
    }
    if (!content) {
      return socket.emit("error", "Content required");
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return socket.emit("error", "Chat not found");
    }
    if (!chat.members.includes(socket.user._id)) {
      return socket.emit("error", "Unauthorized");
    }

    // add Message to db
    const message = await PrivateMessage.create({
      chatId,
      sender: senderId,
      receiver: receiverId,
      content,
      nonce,
    });

    // update prevChats list
    await updatePreviousChats(sender, chatId);
    await updatePreviousChats(receiver, chatId);

    const unreads = await PrivateMessage.countDocuments({
      chatId,
      receiver: receiverId,
      seen: false,
    });


    //  update lastMessage in db
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        unreads,
        lastMessage: {
          content: message.content,
          nonce,
          sender: message.sender,
          createdAt: message.createdAt,
        },
        seen: false,
      },
      { returnDocument: "after" },
    ).populate("members", "name email photo publicKey");
    // .populate("lastMessage.sender", "name email photo publicKey");


    io.to(chatId).emit("newMessage", message);
    io.to([receiverId, senderId]).emit("updateChat", updatedChat);
  } catch (error) {
    console.log(error);
    socket.emit("error", "Something went wrong");
  }
};

exports.seenMessageHandler = (socket, io) => async (data) => {
  try {
    const { chatId, receiverId } = data;
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return socket.emit("error", "Chat not found");
    }
    const sender = socket.user;

    const senderId = sender._id.toString();

    await PrivateMessage.updateMany(
      {
        chatId,
        sender: receiverId,
        receiver: senderId,
        seen: false,
      },
      { $set: { seen: true } },
    );

    socket.to(chatId).emit("updateSeen", "message seen");
  } catch (error) {
    console.log(error);
    socket.emit("error", "Something went wrong");
  }
};
