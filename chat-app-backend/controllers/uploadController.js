const CustomError = require("../utils/CustomError");
const cloudinary = require("../config/cloudinary");
const fs = require("fs/promises");

const asyncErrorHandler = require("../utils/asyncErrorHandler");
const { getIO } = require("../config/socket");
const ChatMemberModel = require("../models/chatMember.model");
const MessageModel = require("../models/message.model");
const FileModel = require("../models/file.model");
const ChatUnreads = require("../models/chatUnread.model");
const ChatModel = require("../models/chat.model");
const { uploadImage, uploadAny } = require("../config/multer");

const getResourceType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "video";
  return "raw"; // everything else
};

exports.multiUploadHandler = asyncErrorHandler(async (req, res, next) => {
  const content = req?.body?.content;
  const nonce = req?.body?.nonce;
  const chatId = req.params.id;
  const senderId = req.user.id;

  const keys = Array.isArray(req.body?.keys) ? req.body.keys : [req.body.keys];
  const nonces = Array.isArray(req.body?.nonces)
    ? req.body.nonces
    : [req.body.nonces];

  const ivs = Array.isArray(req.body.ivs) ? req.body.ivs : [req.body.ivs];
  const types = Array.isArray(req.body.types)
    ? req.body.types
    : [req.body.types];

  const names = Array.isArray(req.body.names)
    ? req.body.names
    : [req.body.names];

  const files = req.files;

  if (!req.files || req.files.length === 0) {
    return next(new CustomError("No files uploaded", 400));
  }

  if (
    files.length !== types.length ||
    files.length !== names.length ||
    files.length !== ivs.length
  ) {
    return next(new CustomError("Invalid file metadata", 400));
  }

  const receivers = await ChatMemberModel.findReceiversByChatId({
    chatId,
    senderId,
  });
  const receiverIds = receivers.map((r) => r.user_id);

  // 1. find
  let chat = await ChatModel.findById(chatId);

  if (!chat) {
    return next(new CustomError("chat not found!", 404));
  }

  const results = await Promise.all(
    files.map(async (file, i) => {
      try {
        const resourceType = getResourceType(file.mimetype);

        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: resourceType,
          timeout: 60000,
        });

        // delete file after upload
        await fs.unlink(file.path);

        return {
          url: result.secure_url,
          type: types[i],
          name: names[i],
          encrypted_key: keys[i],
          iv: ivs[i],
          nonce: nonces[i],
        };
      } catch (err) {
        // cleanup even if upload fails
        try {
          await fs.unlink(file.path);
        } catch (_) {}

        throw err;
      }
    }),
  );

  // 2. create message
  const message = await MessageModel.create({
    chatId,
    senderId,
    content,
    nonce,
  });

  const files_data = await Promise.all(
    results.map((curr) => {
      return FileModel.create({
        message_id: message.id,
        url: curr.url,
        type: curr.type,
        name: curr.name,
        iv: curr.iv,
        encrypted_key: curr?.encrypted_key,
        nonce: curr?.nonce,
      });
    }),
  );

  // 3. update unread
  const unreadCounts = await ChatUnreads.createOrupdateUnreads({
    chatId,
    receiverIds,
  });

  // 4. update chat
  await ChatModel.updateChat(chatId);

  getIO()
    .to(chatId)
    .to(senderId)
    // .to(receiverIds)
    .emit("newMessage", {
      ...message,
      files: files_data,
      // unread_count: 0,
    });

  // send to receivers
  if (chat.type === "private") {
    receiverIds.forEach((receiverId) => {
      const userUnread =
        unreadCounts.find((u) => u.user_id === receiverId)?.unread_count || 0;

      getIO()
        .to(receiverId)
        .emit("newMessage", {
          ...message,
          unread_count: userUnread,
          files: files_data,
        });
    });
  }

  // getIO()
  //   .to(chat.id)
  //   .to(receivers)
  //   .emit("newMessage", {
  //     ...message,
  //     unread_count,
  //     files: files_data,
  //   });

  res.status(200).json({
    status: "success",
    message: "Data sent successfully",
  });
});

exports.handleUpload =
  ({ field, type = "single", maxCount = 5 }) =>
  (req, res, next) => {
    let multerMiddleware;

    if (type === "single") {
      multerMiddleware = uploadImage.single(field);
    } else if (type === "array") {
      multerMiddleware = uploadAny.array(field, maxCount);
    }

    multerMiddleware(req, res, (error) => {
      if (!error) return next();

      if (error.name === "MulterError") {
        let message;

        if (error.code === "LIMIT_UNEXPECTED_FILE") {
          message =
            type === "array"
              ? `File limit exceeded (max ${maxCount} files allowed)`
              : `Unexpected field: ${error.field}`;
        } else if (error.code === "LIMIT_FILE_SIZE") {
          message = "File too large";
        } else {
          message = error.message;
        }

        return next(new CustomError(message, 400));
      }

      return next(new CustomError(`Upload failed ${error}`, 400));
    });
  };
