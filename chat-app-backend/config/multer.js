const multer = require("multer");
const fs = require("fs");
const path = require("path");
const CustomError = require("../utils/CustomError");

// Resolve to an absolute path (more reliable than "uploads/")
const uploadDir = path.join(__dirname, "..", "uploads");

// Create the folder if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new CustomError("Only image files are allowed", 400), false);
  }
};

const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, //5mb
});
const uploadAny = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

module.exports = { uploadImage, uploadAny };
