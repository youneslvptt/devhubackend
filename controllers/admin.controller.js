const User = require("../models/User");
const Message = require("../models/Message");
const Channel = require("../models/Channel");
const onlineUsers = require("../utils/onlineUsers");
const { sendTemporaryPassword } = require("../utils/email");
const crypto = require("crypto");

// Generate a random temporary password
function generateTempPassword(length = 10) {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
}

// POST /api/admin/create-user
exports.createUser = async (req, res) => {
  try {
    console.log("Create user request received with body:", req.body);
    const { name, email, role } = req.body;

    // Only admin/founder can create users
    if (req.user.role !== "admin" && req.user.role !== "founder") {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!name || !email || !role) {
      return res.status(400).json({ message: "Name, email, and role are required" });
    }

    // Validate role
    if (!["admin", "developer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if user exists
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const tempPassword = generateTempPassword();

    const user = await User.create({
      name,
      email,
      password: tempPassword,   // will be hashed by pre-save hook
      role,
      mustChangePassword: true,
    });

    // Send email (don't block the response if it fails)
    try {
      await sendTemporaryPassword(email, name, tempPassword);
    } catch (emailErr) {
      console.error("Failed to send email:", emailErr);
    }

    res.status(201).json({
      message: "User created",
      user: { _id: user._id, name, email, role },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/online-users
exports.getOnlineUsers = (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "founder") {
    return res.status(403).json({ message: "Not authorized" });
  }

  const userIds = Array.from(onlineUsers.keys());
  res.json({ onlineUserIds: userIds });
};

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "founder") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const messagesToday = await Message.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
    });
    const totalUsers = await User.countDocuments();
    const totalChannels = await Channel.countDocuments();

    res.json({
      messagesToday,
      totalUsers,
      totalChannels,
      engagement: totalUsers > 0 ? parseFloat((messagesToday / totalUsers).toFixed(2)) : 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};