import { io } from "socket.io-client";
import { useAuth } from "../Context/AuthContext";

let socket = null;

// const api = "https://chat-app-6h3y.onrender.com"
const api = "http://localhost:8000";

export const connectSocket = () => {

  if (!socket || !socket.connected) {
    socket = io(api, {
      transports: ["websocket"],
      withCredentials: true,
    });
  }
  return socket;
};

export const getSocket = () => socket;

