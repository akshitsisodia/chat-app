import { io } from "socket.io-client";

let socket = null;

const api = import.meta.env.VITE_API_BASE_URL;
// const api = "https://chat-app-6h3y.onrender.com"
// const api = "http://localhost:8000";

export const connectSocket = (token) => {
  if (!socket) {
    socket = io(api, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    // attach listeners ONCE
    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
    });

    socket.on("connect_error", (err) => {
      console.log("Connect error:", err.message);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket?.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
