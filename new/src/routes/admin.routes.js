const express = require('express');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const {
  getSummary,
  listUsers,
  updateUserRole,
  deleteUser,
  listResumes,
  deleteResume
} = require('../controllers/admin.controller');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/summary', getSummary);
router.get('/users', listUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/resumes', listResumes);
router.delete('/resumes/:id', deleteResume);

module.exports = router;