const app = require('./app');
const { PORT } = require('./config/env');
const { connectDatabase } = require('./config/db');

async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Resume Builder listening on port ${PORT}!`);
      console.log(`Access at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
