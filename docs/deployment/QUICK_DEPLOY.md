# Quick Vercel Deployment Guide

**Status:** ✅ Ready to Deploy  
**Current Branch:** `feature/consistent-typography-headers`  
**Repository:** `https://github.com/Armadallc/HALCYON.git`

---

## 🚀 Quick Start (3 Steps)

### ⚠️ Branch Note
You're currently on a **feature branch**. For production, deploy from `main`. For testing, deploy current branch as preview.

### 1. Login to Vercel
```bash
npx vercel login
```

### 2. Deploy Current Branch (Preview/Staging) ⭐ Recommended
```bash
npm run vercel
```
or
```bash
npx vercel
```
**This creates a preview deployment from your feature branch - safe for testing!**

### 3. Deploy Main Branch to Production
```bash
# First, switch to main
git checkout main
git pull origin main

# Then deploy to production
npm run vercel:deploy
```
or
```bash
npx vercel --prod
```
**⚠️ Only deploy to production from `main` branch after testing!**

---

## 📋 First-Time Setup

### Step 1: Link Your Project
```bash
npx vercel link
```

You'll be prompted to:
- Create a new project or link to existing
- Set project name (e.g., `halcyon-tms`)
- Choose organization

### Step 2: Set Environment Variables

**Option A: Via CLI**
```bash
npx vercel env add SUPABASE_URL
npx vercel env add SUPABASE_ANON_KEY
npx vercel env add SUPABASE_SERVICE_ROLE_KEY
```

**Option B: Via Dashboard**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - `SUPABASE_URL` = `https://iuawurdssgbkbavyyvbs.supabase.co`
   - `SUPABASE_ANON_KEY` = (your anon key)
   - `SUPABASE_SERVICE_ROLE_KEY` = (your service key)
   - `NODE_ENV` = `production`

### Step 3: Deploy
```bash
# Preview deployment
npm run vercel

# Production deployment
npm run vercel:deploy
```

---

## ✅ Pre-Deployment Checklist

- [ ] Build works locally: `npm run build`
- [ ] Environment variables set in Vercel
- [ ] Project linked: `npx vercel link`
- [ ] Logged in: `npx vercel login`

---

## 🔍 Verify Deployment

After deployment, Vercel will provide:
- Preview URL (for staging)
- Production URL (for production)

Test the deployment:
1. Open the provided URL
2. Check console for errors
3. Test login functionality
4. Verify API connections

---

## 📝 Notes

- **Project Structure:** Uses `client/` folder (not `frontend/`)
- **Build Output:** `dist/public`
- **Framework:** Vite
- **SPA Routing:** Configured in `vercel.json`

---

## 🐛 Troubleshooting

### "Build failed"
- Check build logs in Vercel Dashboard
- Verify `npm run build` works locally
- Check for missing dependencies

### "Environment variables not found"
- Verify variables are set in Vercel Dashboard
- Redeploy after adding variables
- Check variable names match exactly

### "404 on page refresh"
- Verify `vercel.json` has SPA rewrite rules
- Check that `index.html` exists in build output

---

**Ready to deploy?** Run `npm run vercel` 🚀

