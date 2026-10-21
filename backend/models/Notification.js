const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  message: { type: String },
  type: { type: String, enum: ['Critical', 'Warning', 'Info'], default: 'Info' },
  details: {
    previous: { type: Number },
    current: { type: Number },
    reason: { type: String }
  },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
