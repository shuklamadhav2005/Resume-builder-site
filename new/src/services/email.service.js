const nodemailer = require('nodemailer');
const {
  APP_URL,
  EMAIL_SERVICE,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_SECURE,
  EMAIL_USER,
  EMAIL_PASS,
  MAIL_FROM
} = require('../config/env');

function createTransporter() {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn('Email disabled: EMAIL_USER or EMAIL_PASS is missing.');
    return null;
  }

  if (EMAIL_SERVICE) {
    return nodemailer.createTransport({
      service: EMAIL_SERVICE,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });
  }

  if (!EMAIL_HOST) {
    console.warn('Email disabled: set EMAIL_SERVICE or EMAIL_HOST.');
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });
}

const emailTransporter = createTransporter();

async function sendEmail(options) {
  if (!emailTransporter) {
    throw new Error('Email transporter is not configured');
  }

  await emailTransporter.sendMail({
    from: MAIL_FROM,
    ...options
  });
}

async function sendWelcomeEmail(user) {
  const loginUrl = `${APP_URL}/login`;

  await sendEmail({
    to: user.email,
    subject: 'Welcome to Resume Builder',
    text: `Hi ${user.name},\n\nWelcome to Resume Builder. Your account has been created successfully.\n\nYou can login here: ${loginUrl}\n\nThanks,\nResume Builder Team`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2>Welcome, ${user.name}!</h2>
        <p>Your Resume Builder account has been created successfully.</p>
        <p><a href="${loginUrl}" style="color: #2563eb;">Click here to login</a></p>
        <p>Thanks,<br/>Resume Builder Team</p>
      </div>
    `
  });
}

async function sendOtpEmail(user, otp) {
  await sendEmail({
    to: user.email,
    subject: 'Your password reset OTP',
    text: `Hi ${user.name},\n\nYour OTP for password reset is: ${otp}\nThis OTP will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2>Password Reset OTP</h2>
        <p>Hi ${user.name}, use this OTP to reset your password:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
        <p>This OTP will expire in 10 minutes.</p>
      </div>
    `
  });
}

module.exports = {
  sendWelcomeEmail,
  sendOtpEmail
};
