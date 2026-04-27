const User = require("../models/User");
const { sendTemporaryPassword } = require("../utils/email");
const crypto = require("crypto");

// Generate a random temporary password
function generateTempPassword(length = 10) {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
}

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
      // Still respond success, but you may want to notify the admin
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