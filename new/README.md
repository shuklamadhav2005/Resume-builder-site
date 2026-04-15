# Resume Builder

Resume Builder is a Node.js and Express web app for creating, managing, and downloading resumes. It includes user authentication, profile management, OTP-based password reset, and a dashboard-driven resume workflow.

## Features

- User registration, login, and JWT-based session handling
- Account welcome email after successful signup
- Forgot-password flow with OTP email verification
- Resume create, read, update, delete, and download counter APIs
- Admin panel for managing users, roles, and resume records
- EJS-rendered pages for landing, login, templates, builder, dashboard, and admin
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
      admin.js
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
      admin.controller.js
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
      admin.routes.js
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
      admin.ejs
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
ADMIN_EMAIL=admin1@gmail.com
PORT=3000
APP_URL=http://localhost:3000

MONGODB_URI=mongodb://127.0.0.1:27017/resumesite
JWT_SECRET=replace-with-a-strong-secret

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-google-app-password
EMAIL_FROM_NAME=Resume Site

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

The app also accepts these legacy aliases if you already use them:

- `SECRET` for `JWT_SECRET`
- `MONGODB_URL` for `MONGODB_URI`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, and `SMTP_PASS` for email settings
- `ADMIN_EMAIL` or `ADMIN_EMAILS` to bootstrap one or more admin accounts at registration time

### Gmail Setup

If you use Gmail, create a Google App Password and place it in `EMAIL_PASS`. Do not use your normal account password.

## Run

```bash
npm start
```

This starts the app through `src/server.js`. The development script in `package.json` also runs `src/server.js`.

Open http://localhost:3000 after the server starts.

## Deployment

### Before You Deploy

1. Make sure `.env` is not committed to git.
2. Create a MongoDB Atlas database or use another hosted MongoDB instance.
3. Generate a strong `JWT_SECRET`.
4. Prepare your email credentials, preferably a Gmail App Password.
5. Push the project to GitHub.

### Vercel Deployment

This project deploys on Vercel as a Node.js app.

1. Import the GitHub repository into Vercel.
2. When Vercel asks for the root directory, set it to the folder that contains `package.json`.
3. In this workspace, the project root is the current folder `new`, so the root directory should be the repository root, not a nested subfolder.
4. If Vercel leaves the root directory blank, that is also fine as long as it points to the same project root.
5. Set the framework preset to Node.js.
6. Add these environment variables in Vercel project settings:

```env
ADMIN_EMAIL=admin1@gmail.com
PORT=3000
APP_URL=https://your-vercel-domain.vercel.app
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/resumesite
JWT_SECRET=your-long-random-secret
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-google-app-password
EMAIL_FROM_NAME=Resume Site
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

7. Deploy the project.
8. Test the public URL.

Important note for Vercel: if you see a not found or root directory error, it usually means the project root was not selected correctly. Pick the directory that contains `package.json`, `src/`, `public/`, and `views/`.

### Render Deployment

Render is often simpler for this app because it runs the app as a normal Node server.

1. Create a new Web Service in Render.
2. Connect the same GitHub repository.
3. Set the build command to `npm install`.
4. Set the start command to `npm start` or `node src/server.js`.
5. Add the same production environment variables from the Vercel section.
6. Deploy the service.
7. Open the Render URL and verify the site loads.

### Production Checklist

- The homepage loads.
- `/login` works.
- `/dashboard` works after login.
- `/admin` opens for admin users.
- MongoDB writes and reads work.
- Email sending works with the configured SMTP account.
- Static files in `public/` load correctly.

## Pages

- `GET /` landing page
- `GET /login` login, signup, and reset UI
- `GET /templates` resume templates page
- `GET /builder` resume builder page
- `GET /dashboard` user dashboard
- `GET /admin` admin control panel
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

### Admin

- `GET /api/admin/summary`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/role`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/resumes`
- `DELETE /api/admin/resumes/:id`

## Screenshots

Place screenshots in `docs/screenshots/` if you want to document the UI.

Suggested filenames:

- `landing-page.png`
- `login-page.png`
- `dashboard-page.png`
- `builder-page.png`
- `admin-page.png`
- `templates-page.png`
- `otp-reset-flow.png`

## Notes

- OTPs expire after 10 minutes.
- OTP resend has a 60-second cooldown.
- Keep `.env` out of version control.

## License

ISC
