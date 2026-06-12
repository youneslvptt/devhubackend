const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  attachments: [{
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      default: 'file'
    },
    type: {
      type: String,
      default: 'application/octet-stream'
    },
    size: {
      type: Number,
      default: 0
    }
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Validation: either content or attachments must be present
MessageSchema.pre('validate', function() {
  if (!this.content && (!this.attachments || this.attachments.length === 0)) {
    throw new Error('Message must have either content or attachments');
  }
});

// Indexes for faster queries
MessageSchema.index({ channel: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, channel: 1 });
MessageSchema.index({ createdAt: -1 });


MessageSchema.virtual('sender', {
  ref: 'User',
  localField: 'senderId',
  foreignField: '_id',
  justOne: true
});

MessageSchema.set('toJSON', { virtuals: true });
MessageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Message', MessageSchema);