const express = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');
const {
  register,
  login,
  me,
  forgotPassword,
  verifyOtp,
  resetPassword
} = require('../controllers/auth.controller');
const { updateProfile, deleteAccount } = require('../controllers/user.controller');
const {
  listResumes,
  createResume,
  getResume,
  updateResume,
  deleteResume,
  incrementDownload
} = require('../controllers/resume.controller');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, me);
router.put('/users', verifyToken, updateProfile);
router.delete('/users', verifyToken, deleteAccount);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.get('/resumes', verifyToken, listResumes);
router.post('/resumes', verifyToken, createResume);
router.get('/resumes/:id', verifyToken, getResume);
router.put('/resumes/:id', verifyToken, updateResume);
router.delete('/resumes/:id', verifyToken, deleteResume);
router.post('/resumes/:id/download', verifyToken, incrementDownload);

module.exports = router;
