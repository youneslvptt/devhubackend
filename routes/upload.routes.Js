const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const protect = require("../middleware/auth.middleware");

// Configure where and how to store files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");   // folder must exist
  },
  filename: (req, file, cb) => {
    // Unique filename: timestamp + original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

// Filter to only accept images (optional – adjust to your needs)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },  // 20MB
  fileFilter,
});

// POST /api/upload – protected route
router.post("/", protect, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // Build the public URL
  const url = `/uploads/${req.file.filename}`;

  res.json({
    url,
    name: req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size,
  });
});

module.exports = router;