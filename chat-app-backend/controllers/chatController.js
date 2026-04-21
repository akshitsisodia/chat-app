const CustomError = require("../utils/CustomError");
const cloudinary = require("../config/cloudinary");
const fs = require("fs/promises");
const crypto = require("crypto");

const UserModel = require("../models/user.model");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const ChatModel = require("../models/chat.model");
const ChatMemberModel = require("../models/chatMember.model");
const GroupKeyModel = require("../models/groupKey.model");
const { encryptWithPublicKey } = require("../utils/encryptWithPublicKey");
const { pool } = require("../config/db");
const { validate: isUUID } = require("uuid");
const { getIO } = require("../config/socket");

function sanitizeChat(chat, receiver) {
  return {
    chat_id: chat.id,
    type: chat.type,
    chat_name: receiver.name,
    chat_photo: receiver.photo,
    email: receiver.email,
    public_key: receiver.public_key,
    user_id: receiver.id,
  };
}

exports.getOrCreateChat = asyncErrorHandler(async (req, res, next) => {
  const type = "private";
  const name = null;
  const photo = null;
  const created_by = null;

  const senderId = req.user.id;
  const receiverId = req?.params?.receiverId;

  if (!receiverId) {
    return next(new CustomError("User ID required!", 400));
  }

  if (!isUUID(receiverId)) {
    return next(new CustomError("Invalid ID format!", 400));
  }

  if (senderId === receiverId) {
    return next(new CustomError("Self Chat not allowed!", 400));
  }

  const pairKey =
    senderId === receiverId
      ? senderId
      : [senderId, receiverId].sort().join("_");

  // 1. try find
  let chat = await ChatModel.findByPairKey(pairKey);

  // 2. create if not exists
  if (!chat) {
    try {
      const receiver = await UserModel.findById(receiverId);
      if (!receiver) {
        return next(new CustomError("User not found!", 404));
      }

      chat = await ChatModel.create({
        type,
        name,
        photo,
        created_by,
        pair_key: pairKey,
      });

      if (senderId === receiverId) {
        await ChatMemberModel.addMember({
          chat_id: chat.id,
          user_id: senderId,
        });
      } else {
        await ChatMemberModel.createMembers({
          chatId: chat.id,
          senderId,
          receiverId,
        });
      }
      const newChatSender = sanitizeChat(chat, receiver);
      getIO().to(senderId).emit("newChat", newChatSender);
      const newChatReceiver = sanitizeChat(chat, req.user);
      getIO().to(receiverId).emit("newChat", newChatReceiver);
    } catch (err) {
      // race condition safe fallback
      chat = await ChatModel.findByPairKey(pairKey);
    }
  }

  res.status(200).json({
    status: "success",
    data: chat.id,
  });
});

exports.getUserChats = asyncErrorHandler(async (req, res, next) => {
  const chats = await ChatMemberModel.findChatsByUID(req.user.id);

  res.status(200).json({
    status: "success",
    total: chats.length,
    data: chats,
  });
});
exports.getChatMembers = asyncErrorHandler(async (req, res, next) => {
  const chatId = req.params.id;
  const userId = req.user.id;

  const data = await ChatMemberModel.getChatMembers({ chatId, userId });
  if (!data) {
    return next(new CustomError("Chat not found or access denied", 404));
  }

  res.status(200).json({
    status: "success",
    data: data.members,
  });
});

exports.getUserGroups = asyncErrorHandler(async (req, res, next) => {
  const chats = await ChatMemberModel.findGroupsByUID(req.user.id);

  res.status(200).json({
    status: "success",
    total: chats.length,
    data: chats,
  });
});
exports.getGroupKeyHandler = asyncErrorHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const userId = req.user.id;

  const key = await GroupKeyModel.getGroupKey({ chatId, userId });

  if (!key) {
    return next(new CustomError("Key not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      encryptedKey: key.encrypted_key,
      nonce: key.nonce,
      ephemeralPublicKey: key.ephemeral_public_key,
      keyVersion: key.key_version,
    },
  });
});

exports.createGroup = asyncErrorHandler(async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const type = "group";
    const name = req?.body?.name || "My-Group";
    const created_by = req.user.id;
    const pair_key = null;

    let photoUrl = "https://clipground.com/images/group-icon-png-7.jpg";

    // --- parse members ---
    let memberIds = [];
    try {
      memberIds = JSON.parse(req.body.members || "[]");
    } catch {
      throw new CustomError("Invalid members format!", 400);
    }

    // include creator + remove duplicates
    memberIds = [...new Set([...memberIds, created_by])];

    if (!memberIds.length) {
      throw new CustomError("Members required!", 400);
    }

    // --- upload photo ---
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          resource_type: "auto",
        });
        photoUrl = result.secure_url;
      } catch (err) {
        throw new CustomError(`Upload failed: ${err.message}`, 500);
      } finally {
        // always try to delete temp file
        try {
          await fs.unlink(req.file.path);
        } catch {}
      }
    }

    // --- create chat ---
    const group = await ChatModel.create(
      {
        type,
        name,
        photo: photoUrl,
        created_by,
        pair_key,
      },
      client,
    );

    // --- add all members (bulk) ---
    await ChatMemberModel.addMembers(
      {
        chatId: group.id,
        memberIds,
        adminId: req.user.id,
      },
      client,
    );

    // --- fetch users + public keys ---
    const users = await UserModel.findByIds(memberIds, client);
    // users: [{ id, public_key }]

    // --- generate group key ---
    const groupKey = crypto.randomBytes(32);

    // --- encrypt key for each user ---
    const encryptedKeys = await Promise.all(
      users.map(async (user) => {
        const { encryptedKey, nonce, ephemeralPublicKey } =
          encryptWithPublicKey(groupKey, user.public_key);

        return {
          userId: user.id,
          encryptedKey,
          nonce,
          ephemeralPublicKey,
        };
      }),
    );

    // --- store group keys ---
    await GroupKeyModel.insertGroupKeys(
      {
        chatId: group.id,
        keys: encryptedKeys,
      },
      client,
    );

    await client.query("COMMIT");

    res.status(201).json({
      status: "success",
      data: group,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});
