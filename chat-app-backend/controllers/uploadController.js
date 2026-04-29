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
const { pool } = require("../config/db");

const getResourceType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  return "raw"; // everything else
};

// Helper to normalize single values or arrays
const normalizeToArray = (value) => (Array.isArray(value) ? value : [value]);

exports.multiUploadHandler = asyncErrorHandler(async (req, res, next) => {
  const client = await pool.connect();
  try {
    const files = req.files;
    const chatId = req.params.id;
    const senderId = req.user.id;

    // Validate files exist
    if (!files || files.length === 0) {
      return next(new CustomError("No files uploaded", 400));
    }

    // Extract and normalize metadata arrays
    const content = req?.body?.content;
    const nonce = req?.body?.nonce;

    const metasRaw = req.body.meta
      ? (Array.isArray(req.body.meta) ? req.body.meta : [req.body.meta])
      : [];

    if (!metasRaw || metasRaw.length !== files.length) {
      return next(new CustomError("File metadata mismatch", 400));
    }

    const metas = metasRaw.map((m) => {
      try {
        return typeof m === "string" ? JSON.parse(m) : m;
      } catch {
        throw new CustomError("Invalid metadata format", 400);
      }
    });

    metas.forEach((m, i) => {
      if (!m.iv || !m.type || !m.name) {
        throw new CustomError(`Missing encryption data for file ${i}`, 400);
      }
    });

    // 1. Upload files to Cloudinary (before transaction to avoid blocking DB)
    const uploadResultsRaw = await Promise.allSettled(
      files.map(async (file, i) => {
        try {
          const resourceType = getResourceType(file.mimetype);
          const result = await cloudinary.uploader.upload(file.path, {
            resource_type: resourceType,
            timeout: 60000,
          });

          if (!result?.secure_url) {
            throw new Error("Cloudinary returned invalid response");
          }
          const meta = metas[i];
          return {
            url: result.secure_url,
            type: meta.type,
            name: meta.name,
            encrypted_key: meta.key,
            iv: meta.iv,
            nonce: meta.nonce,
          };
        } catch (err) {
          throw new CustomError(
            `Failed to upload ${file.originalname}: ${err.message}`,
            500,
          );
        } finally {
          // Cleanup temp file
          try {
            await fs.unlink(file.path);
          } catch (err) {
            if (err.code !== "ENOENT") {
              console.error("File cleanup error:", err.message);
            }
          }
        }
      }),
    );

    const failed = uploadResultsRaw.find(r => r.status === "rejected");
    if (failed) {
      // optionally delete successful uploads from cloudinary
      return next(new CustomError("File upload failed", 500));
    }

    const uploadResults = uploadResultsRaw.map(r => r.value);

    console.log(uploadResults)
    // 2. Fetch chat and receivers in parallel before transaction
    const [chat, receivers] = await Promise.all([
      ChatModel.findById(chatId),
      ChatMemberModel.findReceiversByChatId({ chatId, senderId }),
    ]);

    if (!chat) {
      return next(new CustomError("Chat not found", 404));
    }

    const receiverIds = receivers.map((r) => r.user_id);

    // 3. Start transaction for database operations
    await client.query("BEGIN");

    // 4. Create message
    const message = await MessageModel.create(
      {
        chatId,
        senderId,
        content,
        nonce,
      },
      client,
    );

    // 5. Create file records and update unread in parallel
    const files_data = [];
    for (const curr of uploadResults) {
      const file = await FileModel.create(
        {
          message_id: message.id,
          url: curr.url,
          type: curr.type,
          name: curr.name,
          iv: curr.iv,
          encrypted_key: curr.encrypted_key,
          file_nonce: curr.nonce,
        },
        client
      );

      files_data.push(file);
    }

    // run this AFTER file inserts
    await ChatUnreads.createOrupdateUnreads(
      {
        chatId,
        receiverIds,
      },
      client
    );

    // 6. Update chat metadata
    await ChatModel.updateChat(chatId, client);

    await client.query("COMMIT");

    const emitMessage = chat.type === "private" ? "newMessage" : "groupMessage";

    // send to sender
    getIO()
      .to([senderId, ...receiverIds])
      .emit(emitMessage, {
        ...message,
        files: files_data,
      });

    res.status(200).json({
      status: "success",
      message: "Data sent successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    return next(new CustomError("Upload failed!", 500));
  } finally {
    client.release();
  }
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
          let message = error.message;

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
