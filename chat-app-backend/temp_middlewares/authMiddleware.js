const jwt = require("jsonwebtoken");

const CustomError = require("../utils/CustomError");
const UserModel = require("../models/user.model");

exports.protect = async (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return next(new CustomError("Not authenticated!", 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return next(new CustomError("Invalid or expired token", 400));
  }

  req.user = await UserModel.findById(decoded.id);

  if (!req.user) {
    return next(new CustomError("User not found!", 404));
  }

  next();
};
