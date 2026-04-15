# Resume Builder

Resume Builder is a Node.js and Express web app for creating, managing, and downloading resumes. It includes user authentication, profile management, OTP-based password reset, and a dashboard-driven resume workflow.

## Features

- User registration, login, and JWT-based session handling
- Account welcome email after successful signup
- Forgot-password flow with OTP email verification
- Resume create, read, update, delete, and download counter APIs
- EJS-rendered pages for landing, login, templates, builder, and dashboard
- Modular Express structure with controllers, services, middleware, and models

## Tech Stack

- Node.js
- Express 5
- MongoDB with Mongoose
- EJS templates
- JSON Web Tokens
- bcryptjs for password hashing
- nodemailer for email delivery

## Project Structure

```text
new/
  index.js
  package.json
  README.md
  docs/
    screenshots/
  public/
    css/
      style.css
    js/
      builder.js
      dashboard.js
      login.js
      toast.js
  src/
    app.js
    server.js
    config/
      db.js
      env.js
    controllers/
      auth.controller.js
      page.controller.js
      resume.controller.js
      user.controller.js
    middlewares/
      auth.middleware.js
      error.middleware.js
    models/
      resume.model.js
      user.model.js
    routes/
      api.routes.js
      page.routes.js
    services/
      auth.service.js
      email.service.js
    utils/
  views/
    builder.ejs
    dashboard.ejs
    landing.ejs
    login.ejs
    templates.ejs
    errors/
    layouts/
    pages/
      builder.ejs
      dashboard.ejs
      landing.ejs
      login.ejs
      templates.ejs
    partials/
```

## Requirements

- Node.js 18 or newer
- MongoDB local instance or remote connection
- SMTP credentials or Gmail App Password for email sending

## Install

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root and set the values below.

```env
PORT=3000
APP_URL=http://localhost:3000

MONGODB_URI=mongodb://127.0.0.1:27017/resumesite
JWT_SECRET=replace-with-a-strong-secret

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM_NAME=Resume Site

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

The app also accepts these legacy aliases if you already use them:

- `SECRET` for `JWT_SECRET`
- `MONGODB_URL` for `MONGODB_URI`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, and `SMTP_PASS` for email settings

### Gmail Setup

If you use Gmail, create a Google App Password and place it in `EMAIL_PASS`. Do not use your normal account password.

## Run

```bash
npm start
```

This starts the app through `src/server.js`. The development script in `package.json` runs `index.js`.

Open http://localhost:3000 after the server starts.

## Pages

- `GET /` landing page
- `GET /login` login, signup, and reset UI
- `GET /templates` resume templates page
- `GET /builder` resume builder page
- `GET /dashboard` user dashboard
- `GET /logout` clears the local token and redirects

## API Routes

### Auth and User

- `POST /api/register`
- `POST /api/login`
- `GET /api/me`
- `PUT /api/users`
- `DELETE /api/users`

### Password Reset

- `POST /api/forgot-password`
- `POST /api/verify-otp`
- `POST /api/reset-password`

### Resumes

- `GET /api/resumes`
- `POST /api/resumes`
- `GET /api/resumes/:id`
- `PUT /api/resumes/:id`
- `DELETE /api/resumes/:id`
- `POST /api/resumes/:id/download`

## Screenshots

Place screenshots in `docs/screenshots/` if you want to document the UI.

Suggested filenames:

- `landing-page.png`
- `login-page.png`
- `dashboard-page.png`
- `builder-page.png`
- `templates-page.png`
- `otp-reset-flow.png`

## Notes

- OTPs expire after 10 minutes.
- OTP resend has a 60-second cooldown.
- Keep `.env` out of version control.

## License

ISC
