const crypto = require('crypto');
const { JWT_SECRET } = require('../config/env');

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(email, otp) {
  return crypto
    .createHash('sha256')
    .update(`${normalizeEmail(email)}:${otp}:${JWT_SECRET}`)
    .digest('hex');
}

module.exports = {
  normalizeEmail,
  generateOtp,
  hashOtp
};
