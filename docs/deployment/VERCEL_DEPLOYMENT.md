# Vercel Deployment Guide

**Last Updated:** 2025-01-19  
**Status:** Ready for Deployment

---

## 🚀 Quick Start

### Prerequisites
- Vercel CLI installed: `npm install -g vercel`
- Vercel account created
- Project built successfully: `npm run build`

### Initial Deployment

```bash
# 1. Login to Vercel
vercel login

# 2. Link project (first time only)
vercel link

# 3. Deploy to preview
vercel

# 4. Deploy to production
vercel --prod
```

---

## 📋 Deployment Steps

### Step 1: Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```
This will open your browser to authenticate.

### Step 3: Link Your Project
```bash
# From project root
vercel link
```
You'll be prompted to:
- Link to existing project or create new
- Set project name
- Set organization

### Step 4: Configure Environment Variables
```bash
# Add environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
# Add any other required env vars
```

Or add them via Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all required variables for Production, Preview, and Development

### Step 5: Deploy
```bash
# Preview deployment (staging)
vercel

# Production deployment
vercel --prod
```

---

## ⚙️ Configuration

### vercel.json
The project includes a `vercel.json` configuration file that:
- Sets build command: `npm run build`
- Sets output directory: `dist/public`
- Configures SPA routing (all routes → index.html)
- Sets cache headers for static assets
- Configures font file caching

### Build Settings
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist/public`
- **Install Command:** `npm install`
- **Node Version:** 18.x (recommended)

---

## 🔧 Environment Variables

Required environment variables for production:

```bash
NODE_ENV=production
SUPABASE_URL=https://iuawurdssgbkbavyyvbs.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
VITE_API_URL=https://your-api-url.com  # If using separate API
```

**Note:** Variables prefixed with `VITE_` are exposed to the client bundle.

---

## 📁 Project Structure

Vercel will:
1. Run `npm install` in the root
2. Run `npm run build` (which builds client)
3. Serve files from `dist/public`
4. Route all requests to `index.html` (SPA routing)

---

## 🔄 Continuous Deployment

### GitHub Integration
1. Connect your GitHub repository in Vercel Dashboard
2. Enable automatic deployments:
   - **Production:** Deploys on push to `main` branch
   - **Preview:** Deploys on pull requests

### Manual Deployment
```bash
# Deploy current branch
vercel

# Deploy to production
vercel --prod
```

---

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Verify all dependencies are in `package.json`
- Ensure build command works locally: `npm run build`

### Environment Variables Not Working
- Verify variables are set in Vercel Dashboard
- Check variable names match exactly
- Redeploy after adding variables

### Routing Issues (404 on refresh)
- Verify `vercel.json` includes SPA rewrite rules
- Check that `index.html` is in output directory

### API Calls Failing
- Verify API URL is correct
- Check CORS settings on backend
- Ensure environment variables are set

---

## 📊 Deployment Status

Check deployment status:
```bash
vercel ls
```

View deployment logs:
```bash
vercel logs [deployment-url]
```

---

## 🔐 Security Notes

- Never commit `.env` files
- Use Vercel's environment variables for secrets
- Variables prefixed with `VITE_` are public (client-side)
- Use server-side variables for sensitive data

---

## ✅ Pre-Deployment Checklist

- [ ] Build succeeds locally: `npm run build`
- [ ] All environment variables configured
- [ ] API endpoints accessible from Vercel
- [ ] CORS configured on backend
- [ ] No console errors in production build
- [ ] All routes work correctly
- [ ] Static assets load correctly
- [ ] Fonts load correctly

---

## 🚀 Post-Deployment

After deployment:
1. Test all critical workflows
2. Verify API connections
3. Check console for errors
4. Test authentication flow
5. Verify real-time features (if applicable)

---

**Deployment URL:** _________________  
**Deployed By:** _________________  
**Date:** _________________

