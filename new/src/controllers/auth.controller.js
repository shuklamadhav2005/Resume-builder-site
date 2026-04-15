const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { JWT_SECRET } = require('../config/env');
const { normalizeEmail, generateOtp, hashOtp } = require('../services/auth.service');
const { sendWelcomeEmail, sendOtpEmail } = require('../services/email.service');

async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email: normalizedEmail, password: hashedPassword });
    await user.save();

    let mailWarning = null;
    try {
      await sendWelcomeEmail(user);
    } catch (mailError) {
      console.warn('Welcome email failed:', mailError.message);
      mailWarning = 'Account created, but welcome email could not be sent.';
    }

    const payload = { message: 'User registered successfully' };
    if (mailWarning) {
      payload.mailWarning = mailWarning;
    }

    return res.status(201).json(payload);
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ token, message: 'Login successful' });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).select('name email createdAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ name: user.name, email: user.email, createdAt: user.createdAt });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const lastSentAt = user.resetPasswordOtpLastSentAt ? new Date(user.resetPasswordOtpLastSentAt).getTime() : 0;
    if (lastSentAt && Date.now() - lastSentAt < 60000) {
      return res.status(429).json({ message: 'Please wait a minute before requesting another OTP' });
    }

    const otp = generateOtp();
    user.resetPasswordOtpHash = hashOtp(user.email, otp);
    user.resetPasswordOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.resetPasswordOtpAttempts = 0;
    user.resetPasswordOtpLastSentAt = new Date();
    await user.save();

    try {
      await sendOtpEmail(user, otp);
    } catch (mailError) {
      user.resetPasswordOtpHash = null;
      user.resetPasswordOtpExpiresAt = null;
      user.resetPasswordOtpAttempts = 0;
      user.resetPasswordOtpLastSentAt = null;
      await user.save();
      throw mailError;
    }

    return res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send OTP email', error: error.message });
  }
}

async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const cleanedOtp = String(otp || '').trim();

    if (!normalizedEmail || !cleanedOtp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }

    if (!user.resetPasswordOtpHash || !user.resetPasswordOtpExpiresAt) {
      return res.status(400).json({ message: 'No active OTP request found' });
    }

    if (new Date(user.resetPasswordOtpExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({ message: 'OTP expired. Please request a new OTP' });
    }

    if ((user.resetPasswordOtpAttempts || 0) >= 5) {
      return res.status(429).json({ message: 'Too many invalid attempts. Request a new OTP.' });
    }

    const otpHash = hashOtp(user.email, cleanedOtp);
    if (otpHash !== user.resetPasswordOtpHash) {
      user.resetPasswordOtpAttempts = (user.resetPasswordOtpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    return res.json({ message: 'OTP verified' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
  }
}

async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const cleanedOtp = String(otp || '').trim();

    if (!normalizedEmail || !cleanedOtp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }

    if (!user.resetPasswordOtpHash || !user.resetPasswordOtpExpiresAt) {
      return res.status(400).json({ message: 'No active OTP request found' });
    }

    if (new Date(user.resetPasswordOtpExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({ message: 'OTP expired. Please request a new OTP' });
    }

    if ((user.resetPasswordOtpAttempts || 0) >= 5) {
      return res.status(429).json({ message: 'Too many invalid attempts. Request a new OTP.' });
    }

    const otpHash = hashOtp(user.email, cleanedOtp);
    if (otpHash !== user.resetPasswordOtpHash) {
      user.resetPasswordOtpAttempts = (user.resetPasswordOtpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordOtpHash = null;
    user.resetPasswordOtpExpiresAt = null;
    user.resetPasswordOtpAttempts = 0;
    user.resetPasswordOtpLastSentAt = null;
    user.updatedAt = new Date();
    await user.save();

    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
}

module.exports = {
  register,
  login,
  me,
  forgotPassword,
  verifyOtp,
  resetPassword
};
