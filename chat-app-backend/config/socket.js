const { Server } = require("socket.io");
const CustomError = require("../utils/CustomError");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");

const {
  sendMessageHandler,
  seenMessageHandler,
} = require("../controllers/socketController");
const UserModel = require("../models/user.model");

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

      const user = await UserModel.findById(decoded.id);

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
    socket.join(socket.user.id);
    console.log(`${socket.user.name} Connected`, socket.id);

    socket.on("joinChat", async (chatId) => {
      socket.join(chatId);
      // console.log(`${socket.user.name} joins ${chatId}`);
    });

    socket.on("sendMessage", sendMessageHandler(socket, io));

    socket.on("seenMessage", seenMessageHandler(socket, io));

    //! for Streaming
    // connect users
    socket.on("ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("ice-candidate", { candidate });
    });

    // receive call request
    socket.on("call-user", ({ to, offer, type }) => {
      io.to(to).emit("incoming-call", {
        from: socket.id,
        user: socket.user,
        offer,
        type,
      });
    });

    // send Answer to caller
    socket.on("answer-call", ({ to, answer }) => {
      io.to(to).emit("call-accepted", { answer });
    });

    // send reject to caller
    socket.on("reject-call", ({ to }) => {
      io.to(to).emit("call-rejected");
    });

    // end call
    socket.on("end-call", ({ to }) => {
      io.to(to).emit("end-call");
    });

    //! for Streaming
    socket.on("disconnect", () => {
      console.log(`${socket?.user?.name} disconnected:`, socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

module.exports = { initSocket, getIO };
