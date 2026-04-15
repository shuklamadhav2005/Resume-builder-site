const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  resetPasswordOtpHash: { type: String, default: null },
  resetPasswordOtpExpiresAt: { type: Date, default: null },
  resetPasswordOtpAttempts: { type: Number, default: 0 },
  resetPasswordOtpLastSentAt: { type: Date, default: null },
  resumeData: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
