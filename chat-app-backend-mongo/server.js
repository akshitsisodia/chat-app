require("dotenv").config();
const http = require("http");

const connectDB = require("./Config/db");
const { initSocket } = require("./Config/socket");

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

const app = require("./app");

const port = process.env.PORT || 8000;

let httpServer;

const setServer = async () => {
  try {
    await connectDB();

    httpServer = http.createServer(app);

    initSocket(httpServer);

    httpServer.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};
setServer();

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! Shutting down...");
  console.error(err.name, err.message);
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
