const User = require('../models/user.model');
const Resume = require('../models/resume.model');

async function updateProfile(req, res) {
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

    return res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
}

async function deleteAccount(req, res) {
  try {
    await User.findByIdAndDelete(req.user.id);
    await Resume.deleteMany({ userId: req.user.id });

    return res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete account', error: error.message });
  }
}

module.exports = {
  updateProfile,
  deleteAccount
};
