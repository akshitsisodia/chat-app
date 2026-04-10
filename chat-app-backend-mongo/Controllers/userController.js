const mongoose = require("mongoose");

const User = require("../Models/User");
const CustomError = require("../Utils/CustomError");

exports.getUsers = async (req, res, next) => {
  const search = req?.query?.search;
  const page = req?.query?.page ?? 1;
  const limit = req?.query?.limit ?? 10;
  const skip = (page - 1) * limit;

  // filters
  const filters = {
    _id: { $ne: req.user._id },
  };

  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  let users = await User.find(filters).skip(skip).limit(limit);
  const length = await User.countDocuments(filters);

  if (!users) {
    return next(new CustomError("No user Found!", 404));
  }

  res.status(200).json({
    status: "success",
    data: users,
    total: length,
  });
};

exports.getMe = (req, res) => {
  const user = req.user;

  res.status(200).json({
    status: "success",
    user,
  });
};

exports.getUserById = async (req, res, next) => {
  const id = req?.params?.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError("Invalid user Id!", 400));
  }

  const user = await User.findById(id);

  if (!user) {
    return next(new CustomError("No user Found!", 404));
  }

  res.status(200).json({
    status: "success",
    data: user,
  });
};

exports.getPrevChatUsers = async (req, res, next) => {
  const user = req.user;

  const users = await User.find({ _id: { $in: user?.previousChats } });

  if (!users) {
    return next(new CustomError("No user Found!", 404));
  }

  res.status(200).json({
    status: "success",
    data: users,
  });
};

exports.setPublicKey = async (req, res, next) => {
  let user = req.user;

  const publicKey = req?.body?.publicKey;
  user.publicKey = publicKey;

  await user.save();

  res.status(200).json({
    status: "success",
    user,
  });
};
