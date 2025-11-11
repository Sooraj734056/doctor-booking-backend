const User = require('../models/User');
const Otp = require('../models/Otp');
const { generateOTP, hashOTP } = require('../utils/otpUtil');
const sgMail = require('@sendgrid/mail');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// ✅ Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ================= Register User + OTP =================
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password });

    // Generate OTP
    const otpPlain = generateOTP();
    const otpHashed = hashOTP(otpPlain);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await Otp.create({
      to: email,
      otp: otpHashed,
      purpose: 'register',
      expiresAt,
    });

    // ✅ Send OTP via SendGrid
    const msg = {
      to: email,
      from: 'youremail@gmail.com', // ⚠️ Replace with your verified SendGrid sender email
      subject: 'Your OTP for Healthcare Registration',
      html: `
        <div style="font-family:Arial,sans-serif;">
          <h2>Healthcare App - OTP Verification</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your OTP for account registration is:</p>
          <h1 style="color:#2e7d32;">${otpPlain}</h1>
          <p>This OTP will expire in <strong>5 minutes</strong>.</p>
          <br/>
          <p>Regards,<br/>Healthcare App Team</p>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log('✅ OTP Email sent successfully to', email);

    res.status(201).json({ message: 'User created, OTP sent successfully' });
  } catch (err) {
    console.error('❌ Error in registerUser:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ================= Verify OTP =================
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const otpDoc = await Otp.findOne({
      to: email,
      used: false,
      purpose: 'register',
    }).sort({ createdAt: -1 });

    if (!otpDoc)
      return res.status(400).json({ message: 'OTP not found or expired' });

    if (otpDoc.expiresAt < new Date())
      return res.status(400).json({ message: 'OTP expired' });

    const otpHashed = hashOTP(otp);
    if (otpHashed !== otpDoc.otp)
      return res.status(400).json({ message: 'Invalid OTP' });

    otpDoc.used = true;
    await otpDoc.save();

    const user = await User.findOne({ email });
    user.isVerified = true;
    await user.save();

    res.json({ message: 'OTP verified, account activated' });
  } catch (err) {
    console.error('❌ Error in verifyOtp:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ================= Login User =================
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'Invalid email or password' });

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid email or password' });

    // Check if verified
    if (!user.isVerified)
      return res.status(400).json({ message: 'Account not verified' });

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('❌ Error in loginUser:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
