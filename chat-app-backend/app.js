const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const morgan = require("morgan");

const authRoute = require("./routes/authRoute");
const userRoute = require("./routes/userRoute");
const chatRoute = require("./routes/chatRoute");
const messageRoute = require("./routes/messageRoute");
const errorHandler = require("./middlewares/errorMiddleware");
const { protect } = require("./middlewares/authMiddleware");

// uploads
const upload = require("./config/multer");
const { multiUploadHandler } = require("./controllers/uploadController");

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
app.use(express.json());

app.use(morgan("dev"));

app.post(
  "/api/v0/uploads/:id",
  protect,
  upload.array("files", 5),
  multiUploadHandler,
); // max 5 files

app.use("/api/v0/auth", authRoute);
app.use("/api/v0/users", userRoute);
app.use("/api/v0/chats", chatRoute);
app.use("/api/v0/messages", messageRoute);

app.all("/{*any}", (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use(errorHandler);

module.exports = app;
