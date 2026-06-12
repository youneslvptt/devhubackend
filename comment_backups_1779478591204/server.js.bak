// server.js (updated with online user event fixes)
require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const dns = require("dns");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const Message = require("./models/Message");
const Channel = require("./models/Channel");
const User = require("./models/User");
const chatRoutes = require("./routes/chat.routes");
const protect = require("./middleware/auth.middleware");

const onlineUsers = require("./utils/onlineUsers");

dns.setServers(["1.1.1.1"]);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:8080", 
    credentials: true
  }
});

connectDB();

app.use(cors({
  origin: "http://localhost:8080",
  credentials: true
}));
app.use(express.json());

// Serve uploaded files statically (so they are accessible via /uploads/filename)
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Upload route
app.use("/api/upload", require("./routes/upload.routes"));

// ✅ SOCKET.IO AUTHENTICATION MIDDLEWARE
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    console.log("Socket connection rejected: No token provided");
    return next(new Error("Authentication error: No token"));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id; // string
    console.log(`Socket authenticated for user: ${socket.userId}`);
    next();
  } catch (err) {
    console.log("Socket connection rejected: Invalid token");
    next(new Error("Authentication error: Invalid token"));
  }
});

const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.send("API running...");
});

// ✅ FIXED SOCKET.IO CONNECTION HANDLING
io.on("connection", async (socket) => {
  console.log(`User connected: ${socket.id}, userId: ${socket.userId}`);
  
  // Get user info for online status
  try {
    const user = await User.findById(socket.userId).select("name email role");
    if (user) {
      socket.username = user.name;
      socket.userRole = user.role;
      socket.user = user; // attach full user object for later use
    }
  } catch (err) {
    console.error("Error fetching user:", err);
  }

  // ✅ JOIN CHANNEL - Fixed membership check
  socket.on("joinChannel", async (channelId) => {
    try {
      const channel = await Channel.findById(channelId);
      
      if (!channel) {
        return socket.emit("error", "Channel not found");
      }
      
      // 🔧 FIX: Compare string IDs instead of using .includes() (ObjectId array)
      const isMember = channel.members.some(
        (memberId) => memberId.toString() === socket.userId
      );
      if (!isMember) {
        return socket.emit("error", "Not authorized to join this channel");
      }
      
      // Leave previous rooms except the socket's own room
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room);
          console.log(`User ${socket.userId} left room: ${room}`);
        }
      });
      
      socket.join(channelId);
      socket.currentChannel = channelId;
      
      // 🔧 Emit userJoined with username object
      socket.to(channelId).emit("userJoined", {
        userId: socket.userId,
        username: socket.username
      });
      
      console.log(`User ${socket.userId} (${socket.username}) joined channel: ${channelId}`);
      
      // Send current online users in this channel
      const roomSockets = await io.in(channelId).fetchSockets();
      const onlineUsersInChannel = roomSockets.map(s => ({
        userId: s.userId,
        username: s.username
      }));
      
      socket.emit("onlineUsers", onlineUsersInChannel);
      
    } catch (err) {
      console.error("Error joining channel:", err);
      socket.emit("error", "Failed to join channel");
    }
  });

  socket.on("leaveChannel", (channelId) => {
    socket.leave(channelId);
    // 🔧 Emit userLeft with username object
    socket.to(channelId).emit("userLeft", {
      userId: socket.userId,
      username: socket.username
    });
    socket.currentChannel = null;
    console.log(`User ${socket.userId} (${socket.username}) left channel: ${channelId}`);
  });

  // ✅ TYPING INDICATORS
  socket.on("typing", ({ channel, user }) => {
    if (channel) {
      socket.to(channel).emit("typing", { 
        channel, 
        user: socket.username || user 
      });
    }
  });

  socket.on("stopTyping", ({ channel, user }) => {
    if (channel) {
      socket.to(channel).emit("stopTyping", { 
        channel, 
        user: socket.username || user 
      });
    }
  });

  // ✅ SEND MESSAGE - Fixed to properly save and emit
  socket.on("sendMessage", async (data) => {
    try {
      const { content, attachments = [], channel } = data;
      
      // Validate channel
      if (!channel) {
        return socket.emit("error", "Channel is required");
      }
      
      // Check if user is in the channel (socket.io room)
      if (!socket.rooms.has(channel)) {
        return socket.emit("error", "You must join the channel first");
      }
      
      // Validate content or attachments
      if (!content && attachments.length === 0) {
        return socket.emit("error", "Message must have content or attachments");
      }
      
      // Create message in database
      const message = await Message.create({
        senderId: socket.userId,
        channel: channel,
        content: content || "",
        attachments: attachments
      });
      
      // Populate sender info
      await message.populate("senderId", "name email");
      
      // Format message for frontend
      const messageForFrontend = {
        _id: message._id,
        content: message.content,
        sender: message.senderId.name,
        senderId: message.senderId._id,
        channel: message.channel,
        attachments: message.attachments,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      };
      
      // Emit to all users in the channel (including sender)
      socket.to(channel).emit("receiveMessage", messageForFrontend);
      
      console.log(`Message sent in channel ${channel} by ${socket.username}`);
      
    } catch (err) {
      console.error("Error sending message:", err);
      socket.emit("error", "Failed to send message: " + err.message);
    }
  });

  // ✅ MESSAGE STATUS UPDATES
  socket.on("messageDelivered", ({ messageId }) => {
    if (messageId) {
      io.emit("messageDelivered", { messageId });
    }
  });

  socket.on("messageSeen", async ({ messageId }) => {
    try {
      if (messageId) {
        await Message.findByIdAndUpdate(messageId, {
          isRead: true,
          readAt: new Date()
        });
        
        io.emit("messageSeen", { 
          messageId, 
          userId: socket.userId 
        });
      }
    } catch (err) {
      console.error("Error updating message seen status:", err);
    }
  });

  // ✅ USER ONLINE STATUS (FIXED)
  socket.on("userOnline", async () => {
    try {
      if (!onlineUsers.has(socket.userId)) {
        onlineUsers.set(socket.userId, new Set());
      }
      onlineUsers.get(socket.userId).add(socket.id);

      // Build full list of online users with usernames
      const userIds = Array.from(onlineUsers.keys());
      const users = await User.find({ _id: { $in: userIds } }).select("name email role");
      const onlineList = users.map((u) => ({
        userId: u._id.toString(),
        username: u.name,
        role: u.role,
      }));
      io.emit("onlineUsers", onlineList);
    } catch (err) {
      console.error("Error handling userOnline:", err);
    }
  });

  // ✅ DISCONNECT
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}, userId: ${socket.userId}`);
    
    // Notify current channel that user left (with username)
    if (socket.currentChannel) {
      socket.to(socket.currentChannel).emit("userLeft", {
        userId: socket.userId,
        username: socket.username
      });
    }
    
    removeSocket(socket.id);
  });
  
  // Handle socket errors
  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });

  // Helper function to clean up online users tracking
  function removeSocket(socketId) {
    for (let [userId, sockets] of onlineUsers.entries()) {
      if (sockets.has(socketId)) {
        sockets.delete(socketId);
        
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          
          // Notify others that user went offline (optional: emit with username)
          io.emit("userOffline", { userId });
        }
        
        break;
      }
    }
    
    // Re-emit updated online users list
    emitOnlineUsers();
  }

  async function emitOnlineUsers() {
    const userIds = Array.from(onlineUsers.keys());
    if (userIds.length === 0) {
      io.emit("onlineUsers", []);
      return;
    }
    try {
      const users = await User.find({ _id: { $in: userIds } }).select("name email role");
      const onlineList = users.map((u) => ({
        userId: u._id.toString(),
        username: u.name,
        role: u.role,
      }));
      io.emit("onlineUsers", onlineList);
    } catch (err) {
      console.error("Error emitting online users:", err);
    }
  }
});

const fs = require("fs");
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// ✅ PROTECTED ROUTE - Fixed
app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "Access granted",
    user: req.user
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});