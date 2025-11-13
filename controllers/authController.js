const User = require('../models/User');
const Otp = require('../models/Otp');
const { generateOTP, hashOTP } = require('../utils/otpUtil');
const sgMail = require('@sendgrid/mail');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// ✅ Setup SendGrid API Key safely
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.error('❌ SENDGRID_API_KEY is missing from environment variables');
}

// ================= REGISTER USER + SEND OTP =================
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  console.log('📩 Incoming register request:', { name, email });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('⚠️ User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password });
    console.log('✅ New user created in DB:', user.email);

    const otpPlain = generateOTP();
    const otpHashed = hashOTP(otpPlain);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    await Otp.create({
      to: email,
      otp: otpHashed,
      purpose: 'register',
      expiresAt,
    });
    console.log('📨 OTP generated and stored for:', email);

    // ✅ Send OTP using SendGrid
    const msg = {
      to: email,
      from: process.env.SENDGRID_SENDER || 'youremail@gmail.com',
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

    try {
      await sgMail.send(msg);
      console.log('✅ OTP Email sent successfully to:', email);
    } catch (emailError) {
      console.error('❌ SendGrid Email Error:', emailError);
      return res.status(500).json({
        message: 'Failed to send OTP email. Please check SendGrid config.',
        error: emailError.message,
      });
    }

    // ✅ For frontend testing (console preview in dev)
    const previewUrl =
      process.env.NODE_ENV === 'development'
        ? `OTP (Dev Preview): ${otpPlain}`
        : null;

    res.status(201).json({
      message: 'User created successfully. OTP sent to email.',
      previewUrl,
    });
  } catch (err) {
    console.error('❌ registerUser Error:', err);
    res.status(500).json({
      message: 'Server error during registration',
      error: err.message,
    });
  }
};

// ================= VERIFY OTP =================
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  console.log('🔍 Verifying OTP for:', email);

  try {
    const otpDoc = await Otp.findOne({
      to: email,
      used: false,
      purpose: 'register',
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(400).json({ message: 'OTP not found or expired' });
    }

    if (otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    const otpHashed = hashOTP(otp);
    if (otpHashed !== otpDoc.otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    otpDoc.used = true;
    await otpDoc.save();

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    user.isVerified = true;
    await user.save();

    console.log('✅ OTP verified and user activated:', email);
    res.json({ message: 'OTP verified successfully, account activated.' });
  } catch (err) {
    console.error('❌ verifyOtp Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ================= LOGIN USER =================
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log('🔑 Login attempt for:', email);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('❌ Wrong password for:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      console.log('⚠️ Account not verified:', email);
      return res.status(400).json({ message: 'Please verify your email first' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    console.log('✅ Login successful:', email);
    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('❌ loginUser Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
