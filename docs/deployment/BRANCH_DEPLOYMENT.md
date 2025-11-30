# Branch Deployment Strategy

**Current Branch:** `feature/consistent-typography-headers`  
**Git Repository:** `https://github.com/Armadallc/HALCYON.git`

---

## 🎯 Deployment Options

### Option 1: Preview Deployment from Feature Branch (Recommended)

Deploy the current feature branch as a **preview/staging** environment:

```bash
# Deploy current branch as preview
npm run vercel
# or
npx vercel
```

**What this does:**
- Creates a preview deployment URL
- Safe to test without affecting production
- Each branch gets its own preview URL
- Perfect for testing before merging to main

### Option 2: Production Deployment from Main Branch

For production, deploy from `main` branch:

```bash
# Switch to main branch
git checkout main
git pull origin main

# Deploy to production
npm run vercel:deploy
# or
npx vercel --prod
```

**What this does:**
- Deploys to production domain
- Only use after merging feature branch
- Requires main branch to be up-to-date

---

## 🔄 Recommended Workflow

### Step 1: Deploy Feature Branch (Preview)
```bash
# Make sure you're on your feature branch
git checkout feature/consistent-typography-headers

# Deploy as preview
npx vercel
```

This gives you a preview URL like: `https://halcyon-tms-git-feature-consistent-typography-headers.vercel.app`

### Step 2: Test Preview Deployment
- Test all functionality
- Verify environment variables work
- Check for any build issues

### Step 3: Merge to Main (if ready)
```bash
git checkout main
git pull origin main
git merge feature/consistent-typography-headers
git push origin main
```

### Step 4: Deploy Main to Production
```bash
# Deploy main branch to production
npx vercel --prod
```

---

## 🔗 GitHub Integration (Automatic)

If you connect Vercel to GitHub:

1. **Go to Vercel Dashboard**
2. **Import Project** → Select `https://github.com/Armadallc/HALCYON`
3. **Configure:**
   - Production Branch: `main`
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist/public`

**What happens:**
- ✅ Every push to `main` → Auto-deploy to production
- ✅ Every PR → Auto-deploy preview
- ✅ Every push to feature branch → Auto-deploy preview

---

## 📋 Current Setup

**Repository URL:** `https://github.com/Armadallc/HALCYON.git`  
**Current Branch:** `feature/consistent-typography-headers`  
**Recommended:** Deploy as preview first

---

## 🚀 Quick Deploy Commands

### Deploy Current Branch (Preview)
```bash
npx vercel
```

### Deploy Main Branch (Production)
```bash
git checkout main
npx vercel --prod
```

### Link Project (First Time)
```bash
npx vercel link
# When prompted:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No (create new)
# - Project name: halcyon-tms (or your choice)
# - Directory: . (current directory)
```

---

## ⚠️ Important Notes

1. **Preview Deployments:**
   - Safe for testing
   - Don't affect production
   - Each branch gets unique URL
   - Automatically cleaned up after branch deletion

2. **Production Deployments:**
   - Only deploy from `main` branch
   - Requires careful testing first
   - Affects live users
   - Use `--prod` flag carefully

3. **Environment Variables:**
   - Set separately for Preview and Production
   - Preview can use test/staging values
   - Production must use real values

---

## ✅ Recommended: Deploy Feature Branch as Preview

Since you're on a feature branch, deploy it as a preview first:

```bash
# 1. Login (if not already)
npx vercel login

# 2. Link project (first time only)
npx vercel link

# 3. Deploy current branch as preview
npx vercel
```

This will give you a preview URL to test before merging to main!

---

**Next Steps:**
1. Deploy feature branch as preview: `npx vercel`
2. Test the preview deployment
3. Merge to main when ready
4. Deploy main to production: `npx vercel --prod`

