require("dotenv").config();
const http = require("http");

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err);
  process.exit(1);
});

const app = require("./app");
const { initDB } = require("./config/db");
const { initSocket } = require("./config/socket");

let httpServer;
const port = process.env.PORT || 8000;

const startServer = () => {
  try {
    initDB();

    httpServer = http.createServer(app);

    initSocket(httpServer);

    httpServer.listen(port, "0.0.0.0", () => {
      console.log(`Server is listening on port ${port}`);
    });
  } catch (error) {
    console.log("Failed to create server:", error);
    process.exit(1);
  }
};

startServer();

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! Shutting down...");
  console.error(err.name, err);
  httpServer.close(() => process.exit(1));
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down...");
  httpServer.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down...");
  httpServer.close(() => process.exit(0));
});
