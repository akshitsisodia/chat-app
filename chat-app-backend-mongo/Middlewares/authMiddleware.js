const jwt = require("jsonwebtoken");

const CustomError = require("../Utils/CustomError");
const User = require("../Models/User");

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

  req.user = await User.findById(decoded.id).select("-password");

  if (!req.user) {
    return next(new CustomError("User not found!", 404));
  }

  next();
};
