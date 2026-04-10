const crypto = require("crypto");

const User = require("../Models/User");
const CustomError = require("../Utils/CustomError");
const { sendAccessToken } = require("../Utils/token");
const { cookieOptions, logoutOptions } = require("../Utils/cookieOptions");
const Otp = require("../Models/Otp");
const asyncErrorHandler = require("../Utils/asyncErrorHandler");
const mongoose = require("mongoose");
const VerifiedUser = require("../Models/VerifiedUser");

const sendResponse = async (user, res, statusCode) => {
  const token = await sendAccessToken(user._id);
  res.cookie("token", token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({ status: "success", data: user });
};

exports.generateOtp = asyncErrorHandler(async (req, res, next) => {
  const name = req?.body?.name;
  const email = req?.body?.email.toLowerCase();

  if (!name || !email) {
    return next(new CustomError("All credentials required!", 400));
  }

  if (await User.findOne({ email })) {
    return next(
      new CustomError("User already exist with this email! Please login", 400),
    );
  }

  const isOtpExist = await Otp.findOne({ email });
  if (isOtpExist) {
    return next(new CustomError("Please wait before requesting again!", 400));
  }

  // const otp = Math.floor(1000 + Math.random() * 9000);
  const otp = "0000";

  const hashOtp = crypto.createHash("sha256").update(otp).digest("hex");

  const otpData = await Otp.create({
    name,
    email,
    // password,
    otp: hashOtp,
    expiresAt: Date.now() + 2 * 60 * 1000,
  });

  try {
    // sending Email Logic (pending)

    //response
    res.status(200).json({
      status: "success",
      message: "An OTP is send to the registered email!",
      data: otpData._id,
    });
  } catch (error) {
    return next(
      new CustomError("Error sending email. Please try again later.", 500),
    );
  }
});

exports.verifyOtp = asyncErrorHandler(async (req, res, next) => {
  const otpId = req?.body?.id;
  const otp = req?.body?.otp;

  if (!otpId || !otp) {
    return next(new CustomError("All credentials required!", 400));
  }

  const record = await Otp.findById(otpId);

  if (!record) return next(new CustomError("Invalid or expired OTP!", 400));

  if (record.attempts >= 5) {
    return next(
      new CustomError("Varification limit crossed! Try again later", 400),
    );
  }

  const hashOtp = crypto.createHash("sha256").update(otp).digest("hex");

  if (hashOtp !== record.otp) {
    record.attempts += 1;
    record.save();
    return next(new CustomError("Invalid or expired OTP!", 400));
  }

  const verifiedUser = await VerifiedUser.create({
    name: record.name,
    email: record.email,
    expiresAt: Date.now() + 2 * 60 * 1000,
  });

  await Otp.findByIdAndDelete(otpId);

  res.status(200).json({
    status: "success",
    message: "Otp verified successfully",
    data: verifiedUser._id,
  });
});

exports.register = asyncErrorHandler(async (req, res, next) => {
  const userId = req?.body?.userId;
  const password = req?.body?.password;
  const publicKey = req?.body?.publicKey;
  const encryptedPrivateKey = req?.body?.encryptedPrivateKey;
  const salt = req?.body?.salt;
  const iv = req?.body?.iv;

  if (
    !userId ||
    !password ||
    !publicKey ||
    !encryptedPrivateKey ||
    !salt ||
    !iv
  ) {
    return next(new CustomError("All credentials required!", 400));
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return next(new CustomError("Invalid receiver Id!", 400));
  }

  const verifiedUser = await VerifiedUser.findById(userId);

  if (!verifiedUser) {
    return next(new CustomError("Authentication timeout!", 404));
  }

  const user = await User.create({
    name: verifiedUser.name,
    email: verifiedUser.email,
    password,
    publicKey,  
    encryptedPrivateKey,
    salt,
    iv,
  });

  sendResponse(user, res, 201);
});

exports.login = asyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new CustomError("All credentials required!", 400));

  const user = await User.findOne({ email }).select("+password");

  if (!user) return next(new CustomError("Invalid credentials!", 400));

  if (!(await user.isPasswordCorrect(password)))
    return next(new CustomError("Invalid credentials!", 400));

  sendResponse(user, res, 200);
});

exports.logout = asyncErrorHandler(async (req, res) => {
  res.cookie("token", "", logoutOptions);
  res.status(200).json({ status: "success", message: "Logout successfully" });
});

// todo updates for later
// exports.forgetPassword = (req, res) => {
//   res.status(200).json({
//     status: "success",
//   });
// };
// exports.resetPassword = (req, res) => {
//   res.status(200).json({
//     status: "success",
//   });
// };
