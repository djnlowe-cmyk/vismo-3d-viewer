# Cloud Deployment Guide - Vismo 3D BIM Viewer

Your project is now ready to deploy to the cloud! Here are your options:

## 🚀 Option 1: Render.com (Recommended - Easiest)

**Free tier includes:**
- Free hosting
- Auto-deploys from GitHub
- SSL/HTTPS included
- No credit card required initially

### Steps:

1. **Create GitHub account** (if you don't have one)
   - Go to https://github.com/signup
   - Create account and verify email

2. **Create a new repository on GitHub**
   - Go to https://github.com/new
   - Name: `vismo-3d-viewer`
   - Description: "IFC/BIM 3D Model Viewer with Three.js"
   - Make it **Public** (required for free tier)
   - Click "Create repository"

3. **Push code to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/vismo-3d-viewer.git
   git branch -M main
   git push -u origin main
   ```

4. **Deploy on Render.com**
   - Go to https://render.com (sign up with GitHub)
   - Click "New" → "Web Service"
   - Connect your GitHub repo
   - Select `vismo-3d-viewer` repository
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - Choose **Free** plan
   - Click "Deploy"
   - Wait 3-5 minutes for build to complete

5. **Your app will be live at:** `https://vismo-3d-viewer.onrender.com`

---

## 🟦 Option 2: Railway.app

**Free tier includes:**
- $5/month free credits (plenty for this app)
- Auto-deploys from GitHub
- Simple setup

### Steps:

1. Push to GitHub (same as above)
2. Go to https://railway.app (sign up with GitHub)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Node.js and deploys
6. Gets a free .railway.app domain

---

## 🔧 Option 3: AWS Free Tier (More Control)

**Free tier includes:**
- EC2 micro instance (750 hours/month)
- S3 storage
- CloudFront CDN

For more control but more complex setup.

---

## 🧪 Testing Before Deployment

Build and test locally first:
```bash
npm install
npm run build
npm start
```

Then visit: http://localhost:3000

---

## 📋 What Gets Deployed

✅ IFC BIM file support
✅ LAS/LAZ point cloud support
✅ Three.js 3D viewer
✅ Model loading and management
✅ Interactive controls
✅ Full responsive design

---

## 🔒 Environment Variables

No environment variables needed for basic setup. The app runs on whatever port Render.com assigns (defaults to 3000).

---

## 💾 For Production Updates

After making changes:
```bash
git add .
git commit -m "Your change description"
git push
```

Render automatically redeploys on push to main branch!

---

## 📞 Support

- Render.com Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app
- Project Repo: Check this directory's README.md

---

**Ready?** Start with Option 1 (Render.com) - it's the easiest! 🚀
