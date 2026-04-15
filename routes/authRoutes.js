const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const validate = require('../middleware/validateMiddleware');
const { registerUser, verifyOtp, loginUser } = require('../controllers/authController');

router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    validate,
  ],
  registerUser
);

router.post(
  '/verify-otp',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('otp', 'OTP is required').not().isEmpty(),
    validate,
  ],
  verifyOtp
);

router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
    validate,
  ],
  loginUser
);

module.exports = router;
