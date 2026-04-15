const Resume = require('../models/resume.model');

async function listResumes(req, res) {
  try {
    const resumes = await Resume.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .select('title downloads createdAt updatedAt data');

    const resumeList = resumes.map((resume) => ({
      id: resume._id.toString(),
      title: resume.title,
      previewName: resume.data?.personal?.name || '',
      previewPhoto: resume.data?.photo || '',
      lastEdited: resume.updatedAt.toISOString().split('T')[0],
      downloads: resume.downloads
    }));

    return res.json(resumeList);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch resumes', error: error.message });
  }
}

async function createResume(req, res) {
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

    return res.status(201).json({
      message: 'Resume created successfully',
      resume: {
        id: resume._id.toString(),
        title: resume.title,
        lastEdited: resume.updatedAt.toISOString().split('T')[0],
        downloads: resume.downloads
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create resume', error: error.message });
  }
}

async function getResume(req, res) {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    return res.json({ resume });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch resume', error: error.message });
  }
}

async function updateResume(req, res) {
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

    return res.json({
      message: 'Resume updated successfully',
      resume: {
        id: resume._id.toString(),
        title: resume.title,
        lastEdited: resume.updatedAt.toISOString().split('T')[0],
        downloads: resume.downloads
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update resume', error: error.message });
  }
}

async function deleteResume(req, res) {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    return res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete resume', error: error.message });
  }
}

async function incrementDownload(req, res) {
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $inc: { downloads: 1 } },
      { new: true }
    );

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    return res.json({ message: 'Download count updated', downloads: resume.downloads });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update download count', error: error.message });
  }
}

module.exports = {
  listResumes,
  createResume,
  getResume,
  updateResume,
  deleteResume,
  incrementDownload
};
