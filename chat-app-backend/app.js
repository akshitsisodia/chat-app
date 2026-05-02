const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoute = require("./routes/authRoute");
const userRoute = require("./routes/userRoute");
const chatRoute = require("./routes/chatRoute");
const messageRoute = require("./routes/messageRoute");
const { protect } = require("./middlewares/authMiddleware");
const CustomError = require("./utils/CustomError");
const globalErrorHandler = require("./controllers/errorController");

// uploads
const upload = require("./config/multer");
const {
  multiUploadHandler,
  handleUpload,
} = require("./controllers/uploadController");

const app = express();

app.use(
  cors({
    origin: process.env.ORIGIN?.split(","),
    credentials: true,
  }),
);
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
app.use(hpp());

let limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests. Please try again after 15 minutes.",
});
if (process.env.NODE_ENV === "production") app.use(limiter);

app.use(cookieParser());
app.use(express.json());

if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));


// ! routes  routes  routes  routes routes routes routes routes routes routes routes  routes routes  routes  routes routes  routes  routes  routes

app.post(
  "/api/v0/uploads/:id",
  protect,
  handleUpload({ field: "files", type: "array", maxCount: 5 }),
  multiUploadHandler,
); // max 5 files

app.use("/api/v0/auth", authRoute);
app.use("/api/v0/users", userRoute);
app.use("/api/v0/chats", chatRoute);
app.use("/api/v0/messages", messageRoute);

// ! routes  routes  routes  routes routes routes routes routes routes routes routes  routes routes  routes  routes routes  routes  routes  routes

app.all("/{*any}", (req, res, next) => {
  next(new CustomError(`Cannot find ${req.originalUrl} on the server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
