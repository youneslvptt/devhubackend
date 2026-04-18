require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const dns = require("dns");
const http = require("http");
const socketIo = require("socket.io");
const Message = require("./models/Message");
const chatRoutes = require("./routes/chat.routes");
const io = socketIo(http.createServer(express()));






dns.setServers(["1.1.1.1"]);


const app = express();

const server = http.createServer(app);
connectDB();


app.use(cors());
app.use(express.json());


const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);



app.get("/", (req, res) => {
  res.send("API running...");
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("sendMessage", async (data) => {
      try {
        const { sender, channel, content } = data;


        const message = await Message.create({
          sender,
          channel,
          content
        });


        io.to(channel).emit("receiveMessage", message);

      } catch (error) {
        console.log("error:", error.message);
      }
    });

    socket.on("joinChannel", (channelId) => {
      socket.join(channelId);
      console.log(`User joined channel: ${channelId}`);
    });

    socket.emit("joinChannel", channelId);



    socket.on("leaveChannel", (channelId) => {
      socket.leave(channelId);
      console.log(`User left channel: ${channelId}`);
    });

    socket.emit("leaveChannel", oldChannelId);
    socket.emit("joinChannel", newChannelId);


    socket.on("typing", ({ channel, user }) => {
      socket.to(channel).emit("typing", { user });
    });

    socket.on("stopTyping", ({ channel, user }) => {
      socket.to(channel).emit("stopTyping", { user });
    });




    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });


  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


const protect = require("./middleware/auth.middleware");

app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "Access granted",
    user: req.user
  });
});


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});