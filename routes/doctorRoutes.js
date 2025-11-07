const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const protect = require('../middleware/authMiddleware');

// Add new doctor (admin only for now)
router.post('/', protect, async (req, res) => {
  try {
    const { name, specialization, email, phone } = req.body;
    const doctorExists = await Doctor.findOne({ email });
    if (doctorExists) return res.status(400).json({ message: 'Doctor already exists' });

    const doctor = await Doctor.create({ name, specialization, email, phone });
    res.status(201).json(doctor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all doctors with filtering by specialization and location
router.get('/', async (req, res) => {
  try {
    const { specialization, location } = req.query;
    let filter = {};
    if (specialization) filter.specialization = specialization;
    if (location) filter.location = location;

    const doctors = await Doctor.find(filter);
    res.json(doctors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single doctor by id ← Add this
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
