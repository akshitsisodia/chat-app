const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const helmet = require("helmet");
const hpp = require("hpp");

const authRoute = require("./Routes/authRoute");
const userRoute = require("./Routes/userRoute");
const chatRoute = require("./Routes/chatRoute");
const messagesRoute = require("./Routes/messageRoute");

const errorHandler = require("./Middlewares/errorMiddleware");
const { multiUploadHandler } = require("./Controllers/uploadController");
const upload = require("./Config/multer");
const { protect } = require("./Middlewares/authMiddleware");

const app = express();

app.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
  }),
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
app.use(hpp());

app.use(cookieParser());

app.use(express.json({ limit: "10kb" }));

// app.use(morgan("dev"));

// app.post("/api/v0/uploads", upload.single("file"), uploadHandler); // max 1 files

app.post(
  "/api/v0/uploads/:id",
  protect,
  upload.array("files", 5),
  multiUploadHandler,
); // max 5 files

app.use("/api/v0/auth", authRoute);
app.use("/api/v0/users", userRoute);
app.use("/api/v0/chats", chatRoute);
app.use("/api/v0/messages", messagesRoute);

app.all("/{*any}", (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use(errorHandler);

module.exports = app;
