const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const onlineUsers = require("../utils/onlineUsers");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password });

    // ✅ Single response – no duplicate sending
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
      mustChangePassword: user.mustChangePassword   // optional, but consistent
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  console.log("Login request received with body:", req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email });
    console.log("User found:", user ? "Yes" : "No");
    console.log("Comparing password for user:", user);

    if (user && (await bcrypt.compare(password, user.password))) {
      console.log("Password match: Yes");

      // ✅ Include mustChangePassword so frontend can redirect
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        mustChangePassword: user.mustChangePassword  
      });
    } else {
      console.log("Invalid email or password");
      res.status(401).json({ message: "Invalid email or password" });
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = password;
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: "Password updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "founder") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const users = await User.find({}, "-password").sort({ createdAt: -1 });

    const members = users.map((u) => ({
      _id: u._id,
      username: u.name,
      email: u.email,
      role: u.role,
      status: onlineUsers.has(u._id.toString()) ? "online" : "offline",
    }));

    res.json(members);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: error.message });
  }
};