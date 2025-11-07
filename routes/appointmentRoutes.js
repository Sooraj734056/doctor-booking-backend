const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const protect = require('../middleware/authMiddleware');
const { sendAppointmentConfirmation } = require('../utils/emailService');

// -------------------------
// Book an appointment
// -------------------------
router.post('/', protect, async (req, res) => {
  const { doctor, date, time, notes } = req.body;

  if (!doctor || !date || !time) {
    return res.status(400).json({ message: 'Doctor, date, and time are required' });
  }

  try {
    const appointment = await Appointment.create({
      user: req.user._id,
      doctor,
      date,
      time,
      notes
    });

    // Get user and doctor details for email
    const user = await User.findById(req.user._id);
    const doctorDetails = await Appointment.findById(appointment._id).populate('doctor', 'name');

    // Send confirmation email
    await sendAppointmentConfirmation(
      user.email,
      user.name,
      doctorDetails.doctor.name,
      date,
      time
    );

    res.status(201).json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// -------------------------
// Get all appointments for logged-in user
// -------------------------
router.get('/my', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user._id })
      .populate('doctor', 'name specialization');
    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// -------------------------
// Cancel an appointment
// -------------------------
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, user: req.user._id });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (appointment.status === 'Cancelled') {
      return res.status(400).json({ message: 'Appointment already cancelled' });
    }
    appointment.status = 'Cancelled';
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
