const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '.env') });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

app.set("views", path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET || 'your-secret-key-change-in-production';
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/resumesite';

const EMAIL_SERVICE = process.env.EMAIL_SERVICE || '';
const EMAIL_HOST = process.env.EMAIL_HOST || process.env.SMTP_HOST || '';
const EMAIL_PORT = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587);
const EMAIL_SECURE = String(process.env.EMAIL_SECURE || process.env.SMTP_SECURE || '').toLowerCase() === 'true' || EMAIL_PORT === 465;
const EMAIL_USER = process.env.EMAIL_USER || process.env.SMTP_USER || '';
const EMAIL_PASS_RAW = process.env.EMAIL_PASS || process.env.SMTP_PASS || '';
const EMAIL_PASS = EMAIL_SERVICE.toLowerCase() === 'gmail' ? EMAIL_PASS_RAW.replace(/\s+/g, '') : EMAIL_PASS_RAW;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Resume Site';
const MAIL_FROM = process.env.MAIL_FROM || `${EMAIL_FROM_NAME} <${EMAIL_USER || 'no-reply@resumesite.local'}>`;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function createTransporter() {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn('Email disabled: EMAIL_USER or EMAIL_PASS is missing.');
    return null;
  }

  if (EMAIL_SERVICE) {
    return nodemailer.createTransport({
      service: EMAIL_SERVICE,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });
  }

  if (!EMAIL_HOST) {
    console.warn('Email disabled: set EMAIL_SERVICE or EMAIL_HOST.');
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });
}

const emailTransporter = createTransporter();

async function sendEmail(options) {
  if (!emailTransporter) {
    throw new Error('Email transporter is not configured');
  }

  await emailTransporter.sendMail({
    from: MAIL_FROM,
    ...options
  });
}

async function sendWelcomeEmail(user) {
  const loginUrl = `${APP_URL}/login`;

  await sendEmail({
    to: user.email,
    subject: 'Welcome to Resume Builder',
    text: `Hi ${user.name},\n\nWelcome to Resume Builder. Your account has been created successfully.\n\nYou can login here: ${loginUrl}\n\nThanks,\nResume Builder Team`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2>Welcome, ${user.name}!</h2>
        <p>Your Resume Builder account has been created successfully.</p>
        <p><a href="${loginUrl}" style="color: #2563eb;">Click here to login</a></p>
        <p>Thanks,<br/>Resume Builder Team</p>
      </div>
    `
  });
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(email, otp) {
  return crypto.createHash('sha256').update(`${normalizeEmail(email)}:${otp}:${JWT_SECRET}`).digest('hex');
}

async function sendOtpEmail(user, otp) {
  await sendEmail({
    to: user.email,
    subject: 'Your password reset OTP',
    text: `Hi ${user.name},\n\nYour OTP for password reset is: ${otp}\nThis OTP will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2>Password Reset OTP</h2>
        <p>Hi ${user.name}, use this OTP to reset your password:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
        <p>This OTP will expire in 10 minutes.</p>
      </div>
    `
  });
}

// MongoDB Connection
main().then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log(err));

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
}

// User Schema
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

const User = mongoose.model('User', userSchema);

// Resume Schema
const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  downloads: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Resume = mongoose.model('Resume', resumeSchema);

// Middleware for Auth
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Routes
app.get('/', (req, res) => {
  res.render('landing');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/templates', (req, res) => {
  res.render('templates');
});

app.get('/builder', (req, res) => {
  res.render('builder');
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard');
});

app.get('/logout', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Logging out...</title>
</head>
<body>
  <script>
    try {
      localStorage.removeItem('token');
      sessionStorage.setItem('resumeBuilder:flashToast', JSON.stringify({
        message: 'Logged out successfully.',
        type: 'success',
        duration: 3200
      }));
    } catch (error) {
      console.error('Failed to clear auth token during logout:', error);
    }
    window.location.replace('/login');
  </script>
</body>
</html>`);
});

// API Routes
app.post('/api/register', async (req, res) => {
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

    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
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

    res.json({ token, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

app.get('/api/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email createdAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ name: user.name, email: user.email, createdAt: user.createdAt });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
  }
});

// Update user profile
app.put('/api/users', verifyToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, updatedAt: new Date() },
      { new: true }
    ).select('name email');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// Delete user account
app.delete('/api/users', verifyToken, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    await Resume.deleteMany({ userId: req.user.id });
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete account', error: error.message });
  }
});

app.post('/api/forgot-password', async (req, res) => {
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

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP email', error: error.message });
  }
});

app.post('/api/verify-otp', async (req, res) => {
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

    res.json({ message: 'OTP verified' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
  }
});

app.post('/api/reset-password', async (req, res) => {
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

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
});

// Resume CRUD endpoints
app.get('/api/resumes', verifyToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .select('title downloads createdAt updatedAt data');
    
    const resumeList = resumes.map(resume => ({
      id: resume._id.toString(),
      title: resume.title,
      previewName: resume.data?.personal?.name || '',
      previewPhoto: resume.data?.photo || '',
      lastEdited: resume.updatedAt.toISOString().split('T')[0],
      downloads: resume.downloads
    }));
    
    res.json(resumeList);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch resumes', error: error.message });
  }
});

app.post('/api/resumes', verifyToken, async (req, res) => {
  try {
    const { title, data } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    const resume = new Resume({
      userId: req.user.id,
      title,
      data: data || {},
      downloads: 0
    });
    
    await resume.save();
    
    res.status(201).json({
      message: 'Resume created successfully',
      resume: {
        id: resume._id.toString(),
        title: resume.title,
        lastEdited: resume.updatedAt.toISOString().split('T')[0],
        downloads: resume.downloads
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create resume', error: error.message });
  }
});

app.get('/api/resumes/:id', verifyToken, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    res.json({ resume });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch resume', error: error.message });
  }
});

app.put('/api/resumes/:id', verifyToken, async (req, res) => {
  try {
    const { title, data } = req.body;
    
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { title, data, updatedAt: new Date() },
      { new: true }
    );
    
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    res.json({
      message: 'Resume updated successfully',
      resume: {
        id: resume._id.toString(),
        title: resume.title,
        lastEdited: resume.updatedAt.toISOString().split('T')[0],
        downloads: resume.downloads
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update resume', error: error.message });
  }
});

app.delete('/api/resumes/:id', verifyToken, async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete resume', error: error.message });
  }
});

app.post('/api/resumes/:id/download', verifyToken, async (req, res) => {
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $inc: { downloads: 1 } },
      { new: true }
    );
    
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    res.json({ message: 'Download count updated', downloads: resume.downloads });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update download count', error: error.message });
  }
});

// Return a clear JSON message when request body is too large.
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'Payload too large. Reduce image size or resume content.'
    });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`Resume Builder listening on port ${PORT}!`);
  console.log(`Access at http://localhost:${PORT}`);
});