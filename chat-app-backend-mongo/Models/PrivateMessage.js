const mongoose = require("mongoose");

const privateMessageSchema = mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    nonce: {
      type: String,
      // required: true,
    },
    files: {
      type: [Object],
    },
    seen: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

privateMessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

module.exports = mongoose.model("PrivateMessage", privateMessageSchema);
