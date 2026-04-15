const express = require('express');
const protect = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Message = require('../models/Message');

const router = express.Router();

router.get('/stats', protect, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalDoctors,
      totalAppointments,
      totalMessages,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      recentAppointments,
      recentMessages,
      recentDoctors,
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Message.countDocuments(),
      Appointment.countDocuments({ status: 'Pending' }),
      Appointment.countDocuments({ status: 'Confirmed' }),
      Appointment.countDocuments({ status: 'Completed' }),
      Appointment.countDocuments({ status: 'Cancelled' }),
      Appointment.find()
        .populate('user', 'name email')
        .populate('doctor', 'name specialization')
        .sort({ createdAt: -1 })
        .limit(5),
      Message.find()
        .populate('from', 'name email')
        .populate('to', 'name email')
        .sort({ createdAt: -1 })
        .limit(5),
      Doctor.find().sort({ createdAt: -1 }).limit(5),
    ]);

    res.json({
      summary: {
        totalUsers,
        totalDoctors,
        totalAppointments,
        totalMessages,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments,
      },
      recentAppointments,
      recentMessages,
      recentDoctors,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ message: 'Failed to load admin dashboard' });
  }
});

module.exports = router;
