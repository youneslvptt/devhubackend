// routes/chat.routes.js
const express = require("express");
const router = express.Router();

const {
  createChannel,
  getChannels,
  getChannelMessages,
  addMemberToChannel   // <-- imported
} = require("../controllers/chat.controller");

const protect = require("../middleware/auth.middleware");

// Existing routes
router.post("/channel", protect, createChannel);
router.get("/channels", protect, getChannels);
router.get("/messages/:channelId", protect, getChannelMessages);

// ✅ NEW: Add a member to a channel (admin only)
router.post("/channel/add-member", protect, addMemberToChannel);

module.exports = router;