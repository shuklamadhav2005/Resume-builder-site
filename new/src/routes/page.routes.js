const express = require('express');
const {
  renderLanding,
  renderLogin,
  renderTemplates,
  renderBuilder,
  renderDashboard,
  renderAdminDashboard,
  logout
} = require('../controllers/page.controller');

const router = express.Router();

router.get('/', renderLanding);
router.get('/login', renderLogin);
router.get('/templates', renderTemplates);
router.get('/builder', renderBuilder);
router.get('/dashboard', renderDashboard);
router.get('/admin', renderAdminDashboard);
router.get('/admin/dashboard', renderAdminDashboard);
router.get('/logout', logout);

module.exports = router;
