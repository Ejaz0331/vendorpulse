const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// Get all notifications (sorted by newest, filterable by supplierId)
router.get('/', async (req, res) => {
  try {
    const query = req.query.supplierId ? { supplier: req.query.supplierId } : {};
    const notifications = await Notification.find(query).populate('supplier').sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }
    const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Create a generic notification (utility endpoint)
router.post('/', async (req, res) => {
  try {
    const notification = new Notification(req.body);
    const saved = await notification.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
