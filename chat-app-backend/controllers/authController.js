const crypto = require("crypto");
const bcrypt = require("bcrypt");

const OtpModel = require("../models/otp.model");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const UserModel = require("../models/user.model");
const CustomError = require("../utils/CustomError");
const { sendAccessToken } = require("../utils/token");
const { cookieOptions, logoutOptions } = require("../utils/cookieOptions");
const sanitizeUser = require("../utils/sanitizeUser");

const sendResponse = async (user, res, statusCode) => {
  const token = await sendAccessToken(user.id);
  res.cookie("token", token, cookieOptions);
  res.status(statusCode).json({ status: "success", data: user });
};

exports.generateOtp = asyncErrorHandler(async (req, res, next) => {
  const name = req?.body?.name;
  const email = req?.body?.email.toLowerCase();

  const isUser = await UserModel.findByEmail(email);
  if (isUser && !(isUser.password_hash == null)) {
    return next(
      new CustomError("User already exist with this email! Please login", 400),
    );
  }

  if (!isUser) {
    await UserModel.createUser({ name, email });
  } else if (!isUser.is_verified) {
    // update name
    await UserModel.updateName({ email, name });
  }

  // const otp = crypto.randomInt(1000, 9999).toString();;
  const otp = "0000";

  const hashOtp = crypto.createHash("sha256").update(otp).digest("hex");

  await OtpModel.create({ email, otp: hashOtp });

  try {
    // sending Email Logic (pending)

    //response
    res.status(200).json({
      status: "success",
      message: "An OTP is send to the registered email!",
      data: email,
    });
  } catch (error) {
    return next(
      new CustomError("Error sending email. Please try again later.", 500),
    );
  }
});

exports.verifyOtp = asyncErrorHandler(async (req, res, next) => {
  const email = req?.body?.email;
  const otp = req?.body?.otp;

  const hashOtp = crypto.createHash("sha256").update(otp).digest("hex");

  const otpRecord = await OtpModel.verifyOtp({ email, otp: hashOtp });

  if (!otpRecord) {
    const result = await OtpModel.updateOtpAttempts({ email });
    if (result?.attempts >= 5) {
      return next(new CustomError("Too many attempts. Try again later.", 429));
    }
    return next(new CustomError("Invalid or expired OTP!", 400));
  }

  await UserModel.markVerified(email);
  await OtpModel.deleteOtp({ id: otpRecord.id });

  res.status(200).json({
    status: "success",
    message: "verified successfully",
  });
});

exports.register = asyncErrorHandler(async (req, res, next) => {
  const email = req?.body?.email?.toLowerCase();
  const password = req?.body?.password;
  const publicKey = req?.body?.publicKey;
  const encryptedPrivateKey = req?.body?.encryptedPrivateKey;
  const salt = req?.body?.salt;
  const iv = req?.body?.iv;

  const user = await UserModel.findByEmail(email);

  if (!user) {
    return next(new CustomError("user not found!", 400));
  }
  if (!user.is_verified) {
    return next(new CustomError("Please verify your email first", 400));
  }

  if (
    !user.verification_expires_at ||
    new Date(user.verification_expires_at).getTime() < Date.now()
  ) {
    // await UserModel.unmarkVerified({ id: user.id });
    return next(new CustomError("Authentication timeout!", 401));
  }

  if (user.password_hash) {
    return next(new CustomError("User already registered", 400));
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const updatedUser = await UserModel.setUser({
    email,
    passwordHash,
    publicKey,
    encryptedPrivateKey,
    salt,
    iv,
  });

  sendResponse(sanitizeUser(updatedUser), res, 201);
});

exports.login = asyncErrorHandler(async (req, res, next) => {
  const email = req?.body?.email.toLowerCase();
  const password = req?.body?.password;

  const user = await UserModel.findByEmail(email);

  if (!user) return next(new CustomError("Invalid credentials!", 401));

  if (!user.is_verified) {
    return next(new CustomError("Please verify your email first", 401));
  }

  if (!user.password_hash) {
    return next(new CustomError("Please complete registration first", 400));
  }

  if (
    user.lockout_until &&
    new Date(user.lockout_until).getTime() > Date.now()
  ) {
    return next(
      new CustomError("Too many attempts! Please try again later", 429),
    );
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    const userAttempts = await UserModel.incrementLoginAttempts(user.id);

    if (userAttempts.login_attempts >= 5) {
      await UserModel.lockAccount(user.id);

      return next(
        new CustomError("Too many attempts! Please try again later", 429),
      );
    }
    return next(new CustomError("Invalid credentials!", 401));
  }

  await UserModel.resetLoginAttempts(user.id);

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    photo: user.photo,
    encrypted_private_key: user.encrypted_private_key,
    salt: user.salt,
    iv: user.iv,
  };

  sendResponse(safeUser, res, 200);
});

exports.logout = asyncErrorHandler(async (req, res, next) => {
  res.cookie("token", "", logoutOptions);
  res.status(200).json({ status: "success", message: "Logout successfully" });
});
