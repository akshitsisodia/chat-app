const cloudinary = require("../config/cloudinary");
const CustomError = require("../utils/CustomError");
const fs = require("fs/promises");

const UserModel = require("../models/user.model");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const sanitizeUser = require("../utils/sanitizeUser");

exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {
  const search = req?.query?.search || "";
  const page = Number(req?.query?.page) || 1;
  const limit = Number(req?.query?.limit) || 10;
  const skip = (page - 1) * limit;

  let users = await UserModel.findUsers({
    search,
    limit,
    skip,
    userId: req.user.id,
  });

  const total = await UserModel.countUsers({ search });

  res.status(200).json({
    status: "success",
    total,
    page,
    limit,
    data: users,
  });
});

exports.getMe = asyncErrorHandler(async (req, res, next) => {
  const user = await UserModel.findById(req.user.id);

  if (!user || !user.is_active) {
    return next(new CustomError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: sanitizeUser(user),
  });
});

exports.updatePhoto = asyncErrorHandler(async (req, res, next) => {
  const file = req?.file

  if (!file) {
    return next(new CustomError("Photo required to update", 400))
  }
  let result
  try {
    result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto",
    });

    await UserModel.updatePhoto({
      photo: result.secure_url,
      userId: req.user.id
    })

  } catch (err) {
    return next(new CustomError(`Upload failed: ${err.message}`, 500));
  } finally {
    if (file?.path) {
      try {
        await fs.unlink(file.path);
      } catch { }
    }
  }

  return res.status(200).json({
    success: true,
    message: "Photo updated successfully",
    data: { photo: result?.secure_url }
  });
});

exports.getUserById = asyncErrorHandler(async (req, res, next) => {
  const id = req?.params?.id;

  if (!id) {
    return next(new CustomError("User ID required", 400));
  }

  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return next(new CustomError("Invalid ID format", 400));
  }

  const user = await UserModel.findById(id);

  if (!user) {
    return next(new CustomError("No user Found!", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      ...sanitizeUser(user),
      created_at: user.created_at,
    },
  });
});
