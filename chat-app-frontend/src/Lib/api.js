import axios from "axios";

const API = axios.create({
  // baseURL: "http://localhost:8000/api/v0",
  baseURL: "https://chat-app-6h3y.onrender.com/api/v0",
  withCredentials: true,
});

export default API;
