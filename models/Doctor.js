const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  specialty: { type: String }, // Additional field for specialty
  experience: { type: Number }, // Years of experience
  location: { type: String }, // Location of the doctor
  image: { type: String }, // URL or path to doctor's profile image
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
