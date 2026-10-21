const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Seed default users if they don't exist
const seedUsers = async () => {
  try {
    const defaultUsers = [
      { username: 'admin', password: 'password123', role: 'Admin' },
      { username: 'manager', password: 'password123', role: 'Manager' },
      { username: 'staff', password: 'password123', role: 'Staff' },
      { username: 'management', password: 'password123', role: 'Management' }
    ];

    for (const u of defaultUsers) {
      const exists = await User.findOne({ username: u.username });
      if (!exists) {
        await User.create(u);
        console.log(`Created default user: ${u.username}`);
      }
    }
  } catch (err) {
    console.warn('Could not auto-seed users:', err.message);
  }
};

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user (case-insensitive for convenience)
    const user = await User.findOne({ username: { $regex: new RegExp(`^${username.trim()}$`, 'i') } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Return user info (excluding password)
    res.json({
      _id: user._id,
      username: user.username,
      role: user.role
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.seedUsers = seedUsers;
module.exports = router;
