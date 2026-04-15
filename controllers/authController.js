const User = require('../models/User');
const Otp = require('../models/Otp');
const { generateOTP, hashOTP } = require('../utils/otpUtil');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const adminEmails = new Set(
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

const getUserRole = (email, existingRole = "patient") => {
  if (adminEmails.has(String(email).trim().toLowerCase())) {
    return "admin";
  }
  return existingRole || "patient";
};

// ✅ Nodemailer transporter (uses Gmail or falls back to console)
const createTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return null;
};

// ✅ Send OTP Email via Nodemailer (or log to console as fallback)
const sendOtpEmail = async (to, name, otpPlain) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`⚠️  No email credentials set. OTP for ${to}: ${otpPlain}`);
    return { consoleOnly: true };
  }

  await transporter.sendMail({
    from: `"Healthcare App" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your OTP for Healthcare Registration',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1976d2;">Healthcare App - OTP Verification</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your OTP for account registration is:</p>
        <h1 style="color:#2e7d32;letter-spacing:8px;">${otpPlain}</h1>
        <p>This OTP will expire in <strong>5 minutes</strong>.</p>
        <p>Regards,<br/>Healthcare App Team</p>
      </div>
    `,
  });

  return { consoleOnly: false };
};

// ================= REGISTER USER + SEND OTP =================
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  console.log('📩 Incoming register request:', { name, email });

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    // ✅ If user exists but is NOT verified → delete and allow re-registration
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified) {
        console.log('⚠️ Verified user already exists:', email);
        return res.status(400).json({ message: 'User already exists. Please login.' });
      }
      // Unverified — clean up and let them retry
      await User.deleteOne({ email });
      await Otp.deleteMany({ to: email });
      console.log('🧹 Cleaned up unverified user for re-registration:', email);
    }

    const userRole = getUserRole(email);
    const user = await User.create({ name, email, password, role: userRole });
    console.log('✅ New user created in DB:', user.email);

    const otpPlain = generateOTP();
    const otpHashed = hashOTP(otpPlain);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    await Otp.create({ to: email, otp: otpHashed, purpose: 'register', expiresAt });
    console.log('📨 OTP generated and stored for:', email);

    // ✅ Send OTP email (falls back to console log if no email config)
    try {
      const result = await sendOtpEmail(email, name, otpPlain);
      if (result.consoleOnly) {
        console.log(`🔑 [DEV MODE] OTP for ${email}: ${otpPlain}`);
      } else {
        console.log('✅ OTP Email sent successfully to:', email);
      }
    } catch (emailError) {
      // Email failed — log OTP to console so dev can still test
      console.error('❌ Email sending failed:', emailError.message);
      console.log(`🔑 [FALLBACK] OTP for ${email}: ${otpPlain}`);
    }

    // Always return preview in development
    const previewUrl = `OTP (Dev Preview - check server console): ${otpPlain}`;

    res.status(201).json({
      message: 'Registration started. OTP sent to email (check server console if not received).',
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

    // ✅ Issue JWT so user is logged in immediately after verification
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    const resolvedRole = getUserRole(user.email, user.role);
    if (user.role !== resolvedRole) {
      user.role = resolvedRole;
      await user.save();
    }

    console.log('✅ OTP verified and user activated:', email);
    res.json({
      message: 'OTP verified! Account activated. Welcome!',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: resolvedRole },
    });
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

    const resolvedRole = getUserRole(user.email, user.role);
    if (user.role !== resolvedRole) {
      user.role = resolvedRole;
      await user.save();
    }

    console.log('✅ Login successful:', email);
    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: resolvedRole },
    });
  } catch (err) {
    console.error('❌ loginUser Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
