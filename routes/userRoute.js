const express = require("express");
const {
  getAllUsers,
  getMe,
  getUserById,
  updatePhoto,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const { handleUpload } = require("../controllers/uploadController");

const router = express.Router();

router.get("/", protect, getAllUsers);
router.get("/me", protect, getMe);

router.post(
  "/update-photo",
  protect,
  handleUpload({ field: "photo" }),
  updatePhoto,
);

router.get("/:id", protect, getUserById);

module.exports = router;
