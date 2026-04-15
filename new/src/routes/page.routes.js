const express = require('express');
const {
  renderLanding,
  renderLogin,
  renderTemplates,
  renderBuilder,
  renderDashboard,
  logout
} = require('../controllers/page.controller');

const router = express.Router();

router.get('/', renderLanding);
router.get('/login', renderLogin);
router.get('/templates', renderTemplates);
router.get('/builder', renderBuilder);
router.get('/dashboard', renderDashboard);
router.get('/logout', logout);

module.exports = router;
