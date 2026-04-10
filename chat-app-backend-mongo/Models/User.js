const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
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
    password: {
      type: String,
      required: true,
      select: false,
    },
    photo: {
      type: String,
      default:
        "https://i.pinimg.com/736x/62/01/0d/62010d848b790a2336d1542fcda51789.jpg",
    },
    previousChats: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Chat",
        },
      ],
      default: [],
    },
    archiveChats: {
      type: [String],
    },
    publicKey: {
      type: String,
      required: true,
    },
    encryptedPrivateKey: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    loginAttemts: {
      type: Number,
      max: 5,
      default: 0,
    },
    lockoutUntil: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetTokenExpires: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
