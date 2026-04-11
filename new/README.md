# Resume Builder

A full-stack resume builder web app with authentication, dashboard, resume CRUD, and email-based password reset using OTP.

## Features

- User registration and login (JWT auth)
- Welcome email on account creation
- Forgot password with OTP email verification
- Password reset after OTP verification
- Resume CRUD APIs (create, update, delete, list, fetch by id)
- Download counter for resumes
- EJS-based frontend views

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- EJS templates
- JWT (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- Email sending (`nodemailer`)

## Project Structure

```text
new/
  index.js
  package.json
  .env
  public/
    builder.js
    dashboard.js
    login.js
    style.css
    toast.js
  views/
    builder.ejs
    dashboard.ejs
    landing.ejs
    login.ejs
    templates.ejs
```

## Prerequisites

- Node.js 18+
- MongoDB running locally or remote connection
- Gmail App Password (or SMTP credentials) for email delivery

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root (`new/.env`) and set:

```env
MONGODB_URL=mongodb://127.0.0.1:27017/resumesite
SECRET=replace-with-strong-secret
PORT=3000
APP_URL=http://localhost:3000

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM_NAME="Resume Site"

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

### Gmail setup

Use **Google App Password** (not your normal Gmail password):

1. Enable 2-Step Verification in your Google account
2. Create an App Password for Mail
3. Put that value in `EMAIL_PASS`

## Run the App

```bash
node index.js
```

Open: `http://localhost:3000`

## Main Routes (Pages)

- `GET /` -> landing page
- `GET /login` -> login/signup/reset UI
- `GET /templates` -> templates page
- `GET /builder` -> builder page
- `GET /dashboard` -> dashboard page
- `GET /logout` -> clears local token and redirects

## Auth & User APIs

- `POST /api/register`
- `POST /api/login`
- `GET /api/me`
- `PUT /api/users`
- `DELETE /api/users`

## Password Reset APIs

- `POST /api/forgot-password` -> sends OTP email
- `POST /api/verify-otp` -> verifies OTP
- `POST /api/reset-password` -> sets new password

## Resume APIs

- `GET /api/resumes`
- `POST /api/resumes`
- `GET /api/resumes/:id`
- `PUT /api/resumes/:id`
- `DELETE /api/resumes/:id`
- `POST /api/resumes/:id/download`

## Screenshots

Add your screenshots to `new/docs/screenshots/` and keep the file names below.

```text
new/docs/screenshots/
  login-page.png
  dashboard-page.png
  builder-page.png
  otp-reset-flow.png
```

### Landing Page

![Login Page](docs/screenshots/landing-page.png)

### Dashboard

![Dashboard](docs/screenshots/dashboard-page.png)

### Builder

![Builder](docs/screenshots/builder-page.png)

### Templates Gallary

![Templates](docs/screenshots/templates.png)

## Notes

- OTP expires in 10 minutes.
- OTP resend has a 60-second cooldown.
- Do not commit `.env` with real credentials.

## License

ISC
