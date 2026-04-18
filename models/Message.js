const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Channel",
    required: true
  },

  content: {
    type: String,
    required: true
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Message", messageSchema);