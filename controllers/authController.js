const User = require('../models/User');
const Otp = require('../models/Otp');
const { generateOTP, hashOTP } = require('../utils/otpUtil');
const sgMail = require('@sendgrid/mail');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// ✅ Set SendGrid API Key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.error('❌ SENDGRID_API_KEY missing in environment variables');
}

// ================= Register User + OTP =================
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  console.log('📩 Incoming register request:', { name, email });

  try {
    // Step 1: Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('⚠️ User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Step 2: Create new user
    const user = await User.create({ name, email, password });
    console.log('✅ User created in DB:', user.email);

    // Step 3: Generate OTP
    const otpPlain = generateOTP();
    const otpHashed = hashOTP(otpPlain);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await Otp.create({
      to: email,
      otp: otpHashed,
      purpose: 'register',
      expiresAt,
    });
    console.log('📨 OTP generated and stored for:', email);

    // Step 4: Send OTP Email
    const msg = {
      to: email,
      from: process.env.SENDGRID_SENDER || 'youremail@gmail.com', // ⚠️ must be verified sender
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
      console.error('❌ SendGrid Email Error:', emailError.message);
      console.error('🧩 Full SendGrid Error:', emailError);
      return res.status(500).json({
        message: 'Failed to send OTP email. Check SendGrid settings.',
        error: emailError.message,
      });
    }

    // Step 5: Response to client
    res.status(201).json({
      message: 'User created successfully. OTP sent to email.',
    });
  } catch (err) {
    console.error('❌ Error in registerUser main catch:', err);
    res.status(500).json({
      message: 'Server error during registration',
      error: err.message,
    });
  }
};

// ================= Verify OTP =================
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  console.log('🔍 Verifying OTP for:', email);

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

    console.log('✅ OTP verified and user activated:', email);
    res.json({ message: 'OTP verified, account activated' });
  } catch (err) {
    console.error('❌ Error in verifyOtp:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ================= Login User =================
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log('🔑 Login attempt for:', email);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ No user found with email:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('❌ Incorrect password for:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if verified
    if (!user.isVerified) {
      console.log('⚠️ Unverified account login attempt:', email);
      return res.status(400).json({ message: 'Account not verified' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    console.log('✅ Login successful for:', email);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('❌ Error in loginUser:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
