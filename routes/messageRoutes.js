const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const protect = require('../middleware/authMiddleware');

// Send message
router.post('/send', protect, async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ message: 'Recipient and message are required' });
  }

  try {
    const newMessage = await Message.create({
      from: req.user._id,
      to,
      message
    });

    // Emit Socket.IO event for real-time messaging
    const io = req.app.get('io');
    io.to(to).emit('receive_message', {
      from: req.user._id,
      to,
      message,
      timestamp: newMessage.timestamp
    });

    res.status(201).json(newMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages between two users
router.get('/conversation/:userId', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { from: req.user._id, to: req.params.userId },
        { from: req.params.userId, to: req.user._id }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all conversations for user
router.get('/conversations', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ from: req.user._id }, { to: req.user._id }]
    }).populate('from', 'name').populate('to', 'name').sort({ timestamp: -1 });

    // Group by conversation
    const conversations = {};
    messages.forEach(msg => {
      const otherUserId = msg.from._id.toString() === req.user._id.toString() ? msg.to._id : msg.from._id;
      if (!conversations[otherUserId]) {
        conversations[otherUserId] = {
          user: msg.from._id.toString() === req.user._id.toString() ? msg.to : msg.from,
          lastMessage: msg.message,
          timestamp: msg.timestamp,
          unread: msg.to._id.toString() === req.user._id.toString() && !msg.read ? 1 : 0
        };
      }
    });

    res.json(Object.values(conversations));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.put('/read/:userId', protect, async (req, res) => {
  try {
    await Message.updateMany(
      { from: req.params.userId, to: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
