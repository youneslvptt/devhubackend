const express = require("express");
const router = express.Router();
const Message = require("../models/Message");


router.get("/:channelId", async (req, res) => {
  try {
    const messages = await Message.find({
      channel: req.params.channelId
    })
    .populate("sender", "name email")
    .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;