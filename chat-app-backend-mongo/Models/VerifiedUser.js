const mongoose = require("mongoose");
const { trim } = require("zod");

const verifiedUserSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    expiresAt: {
      type: Date,
      default: Date.now() + 2 * 60 * 1000,
      required: true,
    },
  },
  { timestamps: true },
);


// index
verifiedUserSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("VerifiedUser", verifiedUserSchema);
