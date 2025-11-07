const express = require('express');
const router = express.Router();
const { registerUser, verifyOtp } = require('../controllers/authController');
const { loginUser } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginUser);

module.exports = router;
