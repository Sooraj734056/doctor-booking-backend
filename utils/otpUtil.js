const crypto = require('crypto');

function generateOTP(digits = 6) {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOTP(otp) {
  return crypto.createHmac('sha256', process.env.OTP_HASH_SECRET)
               .update(otp)
               .digest('hex');
}

module.exports = { generateOTP, hashOTP };
