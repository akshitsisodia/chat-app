const mongoose = require("mongoose");

const chatSchema = mongoose.Schema(
  {
    members: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    unreads: {
      type: Number,
      default: 0,
    },
    lastMessage: {
      type: {
        content: String,
        nonce: {
          type: String,
          required: true,
        },
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: Date,
      },
      default: null,
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

chatSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);
