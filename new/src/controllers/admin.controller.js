const User = require('../models/user.model');
const Resume = require('../models/resume.model');

function toUserSummary(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function toResumeSummary(resume) {
  return {
    id: resume._id.toString(),
    title: resume.title,
    ownerId: resume.userId?._id?.toString?.() || resume.userId?.toString?.() || '',
    ownerName: resume.userId?.name || 'Unknown user',
    ownerEmail: resume.userId?.email || '',
    downloads: resume.downloads,
    updatedAt: resume.updatedAt,
    createdAt: resume.createdAt
  };
}

async function getSummary(req, res) {
  try {
    const [userCount, adminCount, resumeCount, downloadAgg] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      Resume.countDocuments(),
      Resume.aggregate([{ $group: { _id: null, totalDownloads: { $sum: '$downloads' } } }])
    ]);

    return res.json({
      users: userCount,
      admins: adminCount,
      resumes: resumeCount,
      downloads: downloadAgg[0]?.totalDownloads || 0
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load admin summary', error: error.message });
  }
}

async function listUsers(req, res) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select('name email role createdAt updatedAt');
    return res.json({ users: users.map(toUserSummary) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load users', error: error.message });
  }
}

async function updateUserRole(req, res) {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'You cannot change your own role from the admin panel' });
    }

    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const currentUser = await User.findById(req.params.id).select('role');
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser.role === 'admin' && role === 'user') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'At least one admin account must remain active' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, updatedAt: new Date() },
      { new: true }
    ).select('name email role createdAt updatedAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'User role updated', user: toUserSummary(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update user role', error: error.message });
  }
}

async function deleteUser(req, res) {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete your own account from admin panel' });
    }

    const targetUser = await User.findById(req.params.id).select('role');
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'At least one admin account must remain active' });
      }
    }

    const user = await User.findByIdAndDelete(req.params.id);

    await Resume.deleteMany({ userId: req.params.id });

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
}

async function listResumes(req, res) {
  try {
    const resumes = await Resume.find()
      .sort({ updatedAt: -1 })
      .populate('userId', 'name email role');

    return res.json({ resumes: resumes.map(toResumeSummary) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load resumes', error: error.message });
  }
}

async function deleteResume(req, res) {
  try {
    const resume = await Resume.findByIdAndDelete(req.params.id);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    return res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete resume', error: error.message });
  }
}

module.exports = {
  getSummary,
  listUsers,
  updateUserRole,
  deleteUser,
  listResumes,
  deleteResume
};