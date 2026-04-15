function renderLanding(req, res) {
  return res.render('pages/landing');
}

function renderLogin(req, res) {
  return res.render('pages/login');
}

function renderTemplates(req, res) {
  return res.render('pages/templates');
}

function renderBuilder(req, res) {
  return res.render('pages/builder');
}

function renderDashboard(req, res) {
  return res.render('pages/dashboard');
}

function logout(req, res) {
  return res.send(`<!DOCTYPE html>
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
}

module.exports = {
  renderLanding,
  renderLogin,
  renderTemplates,
  renderBuilder,
  renderDashboard,
  logout
};
