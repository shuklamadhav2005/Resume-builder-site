const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(process.cwd(), '.env') });

const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET || 'your-secret-key-change-in-production';
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/resumesite';

const EMAIL_SERVICE = process.env.EMAIL_SERVICE || '';
const EMAIL_HOST = process.env.EMAIL_HOST || process.env.SMTP_HOST || '';
const EMAIL_PORT = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587);
const EMAIL_SECURE = String(process.env.EMAIL_SECURE || process.env.SMTP_SECURE || '').toLowerCase() === 'true' || EMAIL_PORT === 465;
const EMAIL_USER = process.env.EMAIL_USER || process.env.SMTP_USER || '';
const EMAIL_PASS_RAW = process.env.EMAIL_PASS || process.env.SMTP_PASS || '';
const EMAIL_PASS = EMAIL_SERVICE.toLowerCase() === 'gmail' ? EMAIL_PASS_RAW.replace(/\s+/g, '') : EMAIL_PASS_RAW;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Resume Site';
const MAIL_FROM = process.env.MAIL_FROM || `${EMAIL_FROM_NAME} <${EMAIL_USER || 'no-reply@resumesite.local'}>`;

module.exports = {
  PORT,
  JWT_SECRET,
  APP_URL,
  MONGODB_URI,
  EMAIL_SERVICE,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_SECURE,
  EMAIL_USER,
  EMAIL_PASS,
  MAIL_FROM
};
