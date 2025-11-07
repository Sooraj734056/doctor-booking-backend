const User = require('../models/User');
const Otp = require('../models/Otp');
const { generateOTP, hashOTP } = require('../utils/otpUtil');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// ================= Register User + OTP =================
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password });

    // Generate OTP
    const otpPlain = generateOTP();
    const otpHashed = hashOTP(otpPlain);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await Otp.create({ to: email, otp: otpHashed, purpose: 'register', expiresAt });

    // Send OTP via nodemailer (Ethereal test email)
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });

    const info = await transporter.sendMail({
      from: '"Healthcare App" <no-reply@healthcare.local>',
      to: email,
      subject: 'Your OTP for Healthcare Registration',
      text: `Your OTP is ${otpPlain}. It expires in 5 minutes.`
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('OTP Email Preview URL:', previewUrl);

    res.status(201).json({ message: 'User created, OTP sent', previewUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ================= Verify OTP =================
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const otpDoc = await Otp.findOne({ to: email, used: false, purpose: 'register' }).sort({ createdAt: -1 });
    if (!otpDoc) return res.status(400).json({ message: 'OTP not found or expired' });
    if (otpDoc.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });

    const otpHashed = hashOTP(otp);
    if (otpHashed !== otpDoc.otp) return res.status(400).json({ message: 'Invalid OTP' });

    otpDoc.used = true;
    await otpDoc.save();

    const user = await User.findOne({ email });
    user.isVerified = true;
    await user.save();

    res.json({ message: 'OTP verified, account activated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ================= Login User =================
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    // Check if verified
    if (!user.isVerified) return res.status(400).json({ message: 'Account not verified' });

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
