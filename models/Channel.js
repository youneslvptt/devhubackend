const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],

  isPrivate: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("Channel", channelSchema);