// controllers/chat.controller.js
const Channel = require("../models/Channel");
const Message = require("../models/Message");
const User = require("../models/User"); // <-- added for addMemberToChannel

exports.createChannel = async (req, res) => {
  try {
    const { name } = req.body;

    const channel = await Channel.create({
      name,
      createdBy: req.user.id,
      members: [req.user.id]
    });

    res.status(201).json(channel);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getChannels = async (req, res) => {
  console.log("Fetching channels for user:", req.user.id);
  try {
    // Return all channels (public discovery)
    const channels = await Channel.find().populate("members", "name email");
    res.json(channels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get messages for a specific channel
exports.getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if user is a member of the channel (using string comparison)
    const isMember = channel.members.some(
      (memberId) => memberId.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({ message: "Not authorized to view this channel" });
    }

    const messages = await Message.find({ channel: channelId })
      .populate("senderId", "name email")
      .sort({ createdAt: 1 })
      .limit(100);

    const transformedMessages = messages.map(msg => ({
      _id: msg._id,
      content: msg.content,
      sender: msg.senderId?.name || "Unknown",
      senderId: msg.senderId?._id,
      channel: msg.channel,
      attachments: msg.attachments || [],
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt
    }));

    res.json(transformedMessages);
  } catch (err) {
    console.error("Error fetching channel messages:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ NEW: Add a member to a channel (admin only)
exports.addMemberToChannel = async (req, res) => {
  try {
    const { channelId, userId } = req.body; // userId can be email or MongoID

    if (!channelId || !userId) {
      return res.status(400).json({ message: "channelId and userId are required" });
    }

    // Only admins/founders can add members
    if (req.user.role !== "admin" && req.user.role !== "founder") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Find user by ID first, then by email
    let user = await User.findById(userId);
    if (!user) {
      user = await User.findOne({ email: userId });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already a member
    const isAlreadyMember = channel.members.some(
      (memberId) => memberId.toString() === user._id.toString()
    );
    if (isAlreadyMember) {
      return res.status(409).json({ message: "User is already a member of this channel" });
    }

    channel.members.push(user._id);
    await channel.save();

    res.json({
      message: "User added to channel",
      member: {
        _id: user._id,
        username: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("addMemberToChannel error:", err);
    res.status(500).json({ message: err.message });
  }
};