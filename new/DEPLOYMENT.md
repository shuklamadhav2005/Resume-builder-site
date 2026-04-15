# Deployment Guide: Vercel & Render

Resume Builder deployment guide for Vercel and Render platforms.

---

## 📋 Prerequisites

### All Platforms
- Git repository initialized and pushed to GitHub/GitLab
- MongoDB Atlas account (free tier available)
- SMTP email service (Gmail, SendGrid, or other)
- Node.js 16+ (production environment)

### Environment Variables Required
```
PORT=3000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/resume-builder
JWT_SECRET=your-secret-key
NODE_ENV=production
ADMIN_EMAIL=admin@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@example.com
```

---

## 🚀 VERCEL DEPLOYMENT

### Step 1: Prepare Your Repository

1. **Add `vercel.json` configuration** at project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

2. **Update `package.json` if needed** - ensure these are present:
```json
{
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "build": "echo 'Building...'"
  },
  "engines": {
    "node": "18.x"
  }
}
```

3. **Commit and push to GitHub:**
```bash
git add vercel.json
git commit -m "Add Vercel configuration"
git push
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up/Login
2. Click **"Add New"** → **"Project"**
3. Select your GitHub repository
4. Click **"Import"**
5. Configure project:
   - Framework: **Node.js**
   - Root Directory: **`.`** (default)
   - Build Command: Leave blank or use `npm run build`
   - Output Directory: **Leave blank**

### Step 3: Add Environment Variables

In Vercel dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add all required variables (see Prerequisites):
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `ADMIN_EMAIL`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
   - `NODE_ENV` = `production`

3. **Save** and redeploy if needed

### Step 4: Deploy

1. Click **"Deploy"** - Vercel automatically deploys on git push
2. Wait for build to complete (usually 1-2 minutes)
3. Your URL will be: `https://<project-name>.vercel.app`

### Step 5: Verify Deployment

- Visit your URL: `https://<project-name>.vercel.app`
- Test login page: `/login`
- Test admin page: `/admin`
- Check Vercel logs if issues: **Deployments** → **Logs**

### Vercel Limitations & Notes

⚠️ **Important Considerations:**
- **Free tier**: Limited to 72 seconds execution time per function
- **Server-side sessions**: May not persist across function invocations
- **Database connections**: Use connection pooling in MongoDB Atlas
- **Static files**: Stored in `/public` - served correctly
- **EJS templates**: Located in `/views` - ensure paths use relative routes

**Connection Pooling (Recommended):**
Update [src/config/db.js](src/config/db.js) to use connection pooling:
```javascript
const mongooseOptions = {
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
};
```

---

## 🎯 RENDER DEPLOYMENT

### Step 1: Prepare your Repository

Render works with any Node.js app. No special config needed initially.

1. **Commit all changes:**
```bash
git add .
git commit -m "Ready for Render deployment"
git push
```

### Step 2: Create a Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended for auto-deployment)
3. Grant permissions to access your repository

### Step 3: Create a Web Service

1. Click **"New +"** → **"Web Service"**
2. Select your GitHub repository
3. Configure:
   - **Name**: `resume-builder` (or your choice)
   - **Environment**: **Node**
   - **Region**: Select closest to your users
   - **Branch**: `main` (or `master`)
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`

### Step 4: Add Environment Variables

1. Scroll to **"Environment"** section
2. Add each variable (one per line):
   ```
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/resume-builder
   JWT_SECRET=your-secret-key-here
   NODE_ENV=production
   PORT=3000
   ADMIN_EMAIL=admin@example.com
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=noreply@example.com
   ```

3. Click **"Create Web Service"**

### Step 5: Monitor Deployment

1. Render automatically builds and deploys
2. Check logs in **"Logs"** tab
3. Wait until you see: `"Resume Builder listening on port 3000!"`
4. Your URL: `https://resume-builder.onrender.com`

### Step 6: Verify Deployment

- Visit: `https://resume-builder.onrender.com`
- Test login: `/login`
- Test admin: `/admin`
- Check admin Bootstrap: Register/login with `ADMIN_EMAIL`

### Render Advantages vs Vercel

✅ **Better for this project:**
- Persistent container (better for long-running processes)
- No execution time limits
- Handles background jobs better
- More native Node.js support
- PostgreSQL/MongoDB support included

⚠️ **Render Limitations:**
- **Free tier**: Instance spins down after 15 minutes of inactivity
  - Solution: Use "Keep Alive" service or upgrade to Starter plan
- **Cold starts**: First request after inactivity may be slow
- **No static billing**: Free tier is time-limited

---

## 🔗 MONGODB ATLAS SETUP

### Create Free Tier Database

1. Go to [mongodb.com](https://mongodb.com)
2. Create account → Create organization → Create project
3. **Build a Database** → Select **M0 (Free)**
4. Choose cloud provider (AWS recommended)
5. Create username/password (save securely)
6. Add IP: **0.0.0.0/0** (allow all - or specific IPs)
7. Get connection string:
   ```
   mongodb+srv://username:password@cluster0.abc123.mongodb.net/resume-builder?retryWrites=true&w=majority
   ```

⚠️ Remove special characters in password or URL-encode them

---

## 📧 EMAIL SETUP

### Gmail SMTP (Free)

1. Enable 2-Factor Authentication on Google account
2. Generate **App Password**:
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select Mail & App
   - Copy the 16-character password
3. Use in `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   ```

### SendGrid Alternative

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key
3. Use:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=SG.xxxxxxxxxxxxx
   ```

---

## 🔧 DEPLOYMENT COMPARISON

| Feature | Vercel | Render |
|---------|--------|--------|
| **Best For** | Serverless, Static+API | Full Node.js apps |
| **Cold Start** | 2-5s | First request 10-30s |
| **Always On** | $20+/mo | Free (spins down) |
| **Execution Time** | 72s (free) | Unlimited |
| **Node.js** | Functions | Full container |
| **Background Jobs** | Limited | ✅ Better support |
| **Setup Difficulty** | Very easy | Easy |
| **Scaling** | Auto | Manual/billing |

---

## ✅ DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All code pushed to GitHub
- [ ] `.env` file NOT committed (add to `.gitignore`)
- [ ] `node_modules` NOT committed
- [ ] `ADMIN_EMAIL` set correctly
- [ ] MongoDB connection tested locally
- [ ] SMTP credentials verified

### On Platform Dashboards
- [ ] All environment variables added
- [ ] Correct build/start commands
- [ ] Logs show no errors
- [ ] Health check: Visit `/` → shows landing page

### Post-Deployment
- [ ] App loads without errors
- [ ] Login page accessible
- [ ] Email sending works (test registration)
- [ ] Admin functionality accessible
- [ ] Database operations working
- [ ] Set up auto-deploys on git push

---

## 🐛 COMMON ISSUES & FIXES

### "Cannot connect to MongoDB"
- Check `MONGODB_URI` format
- Ensure IP whitelist includes `0.0.0.0/0` on MongoDB Atlas
- Test connection locally first

### "Cannot find module"
- Run `npm install` locally
- Ensure `package.json` has all dependencies
- Check Node version matches (`node --version`)

### "Port already in use"
- Vercel/Render assigns port via `process.env.PORT`
- Ensure code uses `PORT` env var, not hardcoded port

### "Emails not sending"
- Verify SMTP credentials
- Check Gmail 2FA enabled if using Gmail
- Allow "Less secure apps" if needed (deprecated, use App Password)

### "Session/Login not working"
- Check JWT_SECRET is set
- Ensure MongoDB is connected
- Clear browser cookies and try again

### "Static files (CSS/JS) not loading"
- Files must be in `/public` directory
- Ensure express serves static: `app.use(express.static('public'))`
- Check file paths are relative: `/css/style.css`

---

## 📝 DOCUMENTATION LINKS

- [Vercel Node.js Docs](https://vercel.com/docs/frameworks/nodejs)
- [Render Docs](https://render.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
- [Express.js Guide](https://expressjs.com)
- [EJS Templates](https://ejs.co)

---

## 🎓 NEXT STEPS AFTER DEPLOYMENT

1. **Set up Custom Domain:**
   - Vercel: Settings → Domains → Add domain
   - Render: Settings → Custom Domain

2. **Enable HTTPS** (auto on both platforms)

3. **Monitor Performance:**
   - Vercel: Analytics tab
   - Render: Logs & metrics

4. **Set up Auto-Deploy:**
   - Both platforms: Connect GitHub → auto-deploy on push

5. **Backups:**
   - MongoDB Atlas: Enable automatic backups
   - Set backup frequency to daily

---

**Good luck with your deployment! 🚀**
