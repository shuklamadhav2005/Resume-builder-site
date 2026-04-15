const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

async function connectDatabase() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
}

module.exports = {
  connectDatabase
};
