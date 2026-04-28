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
const activeCalls = {};
const connectedUsers = new Map();

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
    // console.log(`${socket.user.name} Connected`, socket.id);

    const existing = connectedUsers.get(socket.user.id) || new Set();
    existing.add(socket.id);
    connectedUsers.set(socket.user.id, existing);

    socket.on("joinChat", async (chatId) => {
      socket.join(chatId);
      // console.log(`${socket.user.name} joins ${chatId}`);
    });

    socket.on("sendMessage", sendMessageHandler(socket, io));

    socket.on("seenMessage", seenMessageHandler(socket, io));

    //! for Streaming
    // connect users
    socket.on("ice-candidate", ({ to, candidate, callId }) => {
      const call = activeCalls[callId];
      if (!call || !call.participants.includes(socket.user.id)) return;

      io.to(to).emit("ice-candidate", {
        from: socket.user.id,
        candidate,
        callId,
      });
    });

    // receive call request
    socket.on("call-user", ({ to, offer, type, callId }) => {
      // create call session
      if (!activeCalls[callId]) {
        activeCalls[callId] = {
          participants: [socket.user.id, to],
          callType: type,
        };
      } else {
        const call = activeCalls[callId];
        call.participants = [
          ...new Set([...call.participants, socket.user.id, to]),
        ];
      }

      io.to(to).emit("incoming-call", {
        // from: socket.id,
        user: socket.user,
        offer,
        type,
        callId,
      });
    });

    // send Answer to caller
    socket.on("answer-call", ({ to, answer, callId }) => {
      io.to(to).emit("call-accepted", { from: socket.user.id, answer, callId });
    });

    // send reject to caller
    socket.on("reject-call", ({ to }) => {
      io.to(to).emit("call-rejected");
    });

    socket.on("reconnect-call", ({ callId }) => {
      const call = activeCalls[callId];

      if (!call || !call.participants.includes(socket.user.id)) {
        socket.emit("call-ended");
        return;
      }

      const others = call.participants.filter((id) => id !== socket.user.id);

      // using socket will send to self, so not using io.to() here
      socket.emit("reconnect-participants", {
        participants: others,
        callType: call.callType,
      });
    });

    socket.on("reconnect-offer", ({ to, offer, callId }) => {
      const call = activeCalls[callId];
      if (!call || !call.participants.includes(socket.user.id)) return;

      io.to(to).emit("reconnect-offer", {
        from: socket.user.id,
        callId,
        offer,
      });
    });

    socket.on("reconnect-answer", ({ to, answer, callId }) => {
      const call = activeCalls[callId];
      if (!call || !call.participants.includes(socket.user.id)) return;

      io.to(to).emit("reconnect-answer", {
        from: socket.user.id,
        answer,
        callId,
      });
    });

    socket.on("invite-to-call", ({ to, callId }) => {
      const call = activeCalls[callId];
      if (!call || !call.participants.includes(socket.user.id)) return;

      io.to(to).emit("invite-notification", {
        from: socket.user.id,
        callId,
        callType: call.callType,
        invitedBy: { name: socket.user.name, photo: socket.user.photo },
      });
    });

    socket.on("accept-invite", ({ callId }) => {
      const call = activeCalls[callId];
      if (!call) return;

      const userId = socket.user.id;

      if (!call.participants.includes(userId)) {
        call.participants.push(userId);
      }

      // notify existing participants
      call.participants.forEach((id) => {
        if (id !== userId) {
          io.to(id).emit("participant-joined", {
            userId,
            callId,
          });
        }
      });

      // send existing participants to new user
      const others = call.participants.filter((id) => id !== userId);

      socket.emit("join-call-success", {
        participants: others,
        callType: call.callType,
      });
    });

    socket.on("new-participant-offer", ({ to, offer, callId }) => {
      const call = activeCalls[callId];
      if (!call || !call.participants.includes(socket.user.id)) return;

      io.to(to).emit("new-participant-offer", {
        from: socket.user.id,
        offer,
        callId,
      });
    });

    socket.on("new-participant-answer", ({ to, answer, callId }) => {
      const call = activeCalls[callId];
      if (!call || !call.participants.includes(socket.user.id)) return;

      io.to(to).emit("new-participant-answer", {
        from: socket.user.id,
        answer,
        callId,
      });
    });

    socket.on("leave-call", ({ callId }) => {
      const call = activeCalls[callId];
      if (!call) return;

      const userId = socket.user.id;

      if (!call.participants.includes(userId)) return;

      // remove user
      call.participants = call.participants.filter((id) => id !== userId);

      // notify others
      call.participants.forEach((id) => {
        io.to(id).emit("user-left-call", { userId });
      });

      // ✅ handle remaining users
      if (call.participants.length === 1) {
        const lastUser = call.participants[0];

        io.to(lastUser).emit("end-call");
        delete activeCalls[callId];
        return;
      }

      if (call.participants.length === 0) {
        delete activeCalls[callId];
      }
    });

    //! for Streaming
    
    socket.on("disconnect", () => {
      const userId = socket.user.id;

      setTimeout(() => {
        const sockets = connectedUsers.get(userId);

        // If user reconnected OR socket already removed → skip
        if (!sockets || !sockets.has(socket.id)) {
          console.log("User reconnected, skipping removal:", userId);
          return;
        }

        // Remove only this socket
        sockets.delete(socket.id);

        if (sockets.size === 0) {
          connectedUsers.delete(userId);

          // 🔥 Only now treat user as offline
          for (const callId in activeCalls) {
            const call = activeCalls[callId];

            if (call.participants.includes(userId)) {
              call.participants = call.participants.filter(
                (id) => id !== userId,
              );

              const remaining = call.participants;

              remaining.forEach((id) => {
                io.to(id).emit("user-left-call", { userId });
              });

              if (remaining.length === 1) {
                io.to(remaining[0]).emit("end-call");
                delete activeCalls[callId];
                return;
              }

              if (remaining.length === 0) {
                delete activeCalls[callId];
              }
            }
          }
        } else {
          // still has other devices → keep user online
          connectedUsers.set(userId, sockets);
        }
      }, 5000);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

module.exports = { initSocket, getIO };
