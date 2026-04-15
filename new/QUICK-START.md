# QUICK START: Deploy to Vercel or Render

## ⚡ Quick Commands Reference

### Before You Deploy
```bash
# 1. Ensure .env is NOT in git (must be in .gitignore)
echo ".env" >> .gitignore

# 2. Commit the configuration files
git add vercel.json .env.example package.json DEPLOYMENT.md
git commit -m "Add deployment configuration"
git push

# 3. Do NOT commit .env file with real credentials!
```

---

## 🚀 VERCEL (Recommended for beginners)

### Option 1: Dashboard (Easiest)
```
1. Go to vercel.com → Log in with GitHub
2. Click "Add New" → "Project"
3. Select your GitHub repo
4. Import & Deploy
5. Add environment variables in Settings
6. Done! Auto-deploys on git push
```

### Option 2: CLI (For Advanced Users)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables
vercel env add MONGODB_URI
vercel env add JWT_SECRET
# ... add all vars from .env.example

# Redeploy with env vars
vercel --prod
```

---

## 🎯 RENDER (Best for Full Node.js Apps)

### Dashboard Deployment
```
1. Go to render.com → Log in with GitHub
2. Click "New +" → "Web Service"
3. Select your GitHub repo
4. Configure:
   - Build Command: npm install
   - Start Command: node src/server.js
5. Add environment variables (from .env.example)
6. Click "Create Web Service"
7. Wait ~2 minutes for deployment
```

### Environment Variables to Add
```
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<generate-random-32-char-string>
NODE_ENV=production
ADMIN_EMAIL=<your-admin-email>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-gmail@gmail.com>
SMTP_PASS=<your-gmail-app-password>
SMTP_FROM=<noreply@yourdomain.com>
```

---

## 🔑 Generate JWT_SECRET

### Linux/Mac
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Windows PowerShell
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or just use a long random string like:
```
a7k9@mP2$xL8qR4#vN1$bQ6&wS3*tF9@hD5%kM7!jC2^nX4&bZ8*
```

---

## 📧 Gmail SMTP Setup (2 minutes)

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Enable 2-Factor Authentication (if not already enabled)
3. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Select "Mail" and "Windows Computer" (or your device)
5. Copy the 16-character password
6. Use this in your environment variables:
   ```
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx  (the 16-char password)
   ```

---

## 🗄️ MongoDB Atlas Setup (5 minutes)

1. Go to [mongodb.com](https://mongodb.com)
2. Create free account
3. Create Organization → Create Project → Build Database
4. Choose M0 (Free)
5. Wait for cluster to build
6. Click "Connect" → "Drivers"
7. Copy connection string
8. Replace `<password>` with your MongoDB password
9. Use as `MONGODB_URI` in your deployment platform

**Example:**
```
mongodb+srv://username:password@cluster0.abc123.mongodb.net/resume-builder?retryWrites=true&w=majority
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] App loads: Visit your URL (e.g., `https://resume-builder.onrender.com`)
- [ ] Landing page shows
- [ ] Login page: `/login` works
- [ ] Can register a new account
- [ ] Admin account created if using `ADMIN_EMAIL`
- [ ] Password hashing works (check in MongoDB)
- [ ] Email sending works (test with registration email)
- [ ] Admin page: `/admin` is accessible to admin users
- [ ] CSS/JS files load (check page source)
- [ ] No errors in platform's log viewer

---

## 🐛 Troubleshooting

### Build fails
```
-> Check build command is: npm install
-> Check start command is: node src/server.js
-> Ensure package.json exists with all dependencies
```

### App crashes after deploy
```
-> Check logs in platform dashboard
-> Verify MONGODB_URI is correct
-> Ensure all required env vars are set
-> Test locally: npm start
```

### Can't connect to MongoDB
```
-> Check MONGODB_URI format
-> Add 0.0.0.0/0 to MongoDB Atlas IP whitelist
-> Verify password has no special chars (or URL-encode them)
```

### Emails not sending
```
-> Verify SMTP credentials
-> For Gmail: Ensure 2FA enabled and app password used
-> Check logs for SMTP error messages
```

### Static files (CSS/Images) not loading
```
-> Verify files in /public directory
-> Check CSS path is relative: /css/style.css
-> Ensure express.static('public') in app.js
```

---

## 📞 Support

- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Render**: [render.com/docs](https://render.com/docs)
- **MongoDB**: [docs.mongodb.com](https://docs.mongodb.com)

---

## 📊 Platform Comparison at a Glance

| Feature | Vercel | Render |
|---------|--------|--------|
| **Setup Time** | 5 mins | 10 mins |
| **Free Tier** | Yes | Yes |
| **Always-On** | $20/mo | $7/mo |
| **Auto-Deploy** | Yes | Yes |
| **Best For** | Serverless | Full Node.js |
| **Cold Start** | 2-5s | 10-30s |

**Recommendation**: 
- **Vercel** = Easier to start, cleaner interface
- **Render** = Better for persistent Node.js apps, warmer server

---

**Deployed? Great! Now commit these files to git:**
```bash
git add DEPLOYMENT.md vercel.json .env.example QUICK-START.md
git commit -m "Complete: Deployment guides for Vercel and Render"
git push
```

**Good luck! 🚀**
