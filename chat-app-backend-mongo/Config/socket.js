const { Server } = require("socket.io");
const CustomError = require("../Utils/CustomError");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const User = require("../Models/User");
const mongoose = require("mongoose");
const asyncErrorHandler = require("../Utils/asyncErrorHandler");
const PrivateMessage = require("../Models/PrivateMessage");
const Chat = require("../Models/Chat");
const {
  sendMessageHandler,
  seenMessageHandler,
} = require("../Controllers/socketController");
let io;

const initSocket = (server) => {
  io = new Server(server);

  io.use(async (socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;

      if (!rawCookie) {
        return next(new CustomError("Not authenticated", 401));
      }

      const parsed = cookie.parse(rawCookie);

      const token = parsed?.token;

      if (!token) {
        return next(new CustomError("Invalid or expired token!", 400));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new CustomError("User not found!", 404));
      }

      socket.user = user;
      next();
    } catch (error) {
      return next(new CustomError("Authentication failed!", 400));
    }
  });

  io.on("connection", (socket) => {
    socket.join(socket?.user?._id.toString());
    console.log(`${socket?.user?.name} Connected`,socket.id);

    socket.on("joinChat", async (chatId) => {
      socket.join(chatId);
      console.log(`${socket.user.name} joins ${chatId}`);
    });

    socket.on("sendMessage", sendMessageHandler(socket, io));

    socket.on("seenMessage", seenMessageHandler(socket, io));

    socket.on("disconnect", () => {
      console.log(`${socket?.user?.name} disconnected:`,socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

module.exports = { initSocket, getIO };
