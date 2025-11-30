# Create Pull Request to Merge Build Fix to Main

## ✅ Changes Ready

All build fixes have been committed and pushed to:
- **Branch:** `feature/consistent-typography-headers`
- **Repository:** `https://github.com/Armadallc/HALCYON.git`

## 📋 Changes Included

1. **package.json**: Updated build script to use `npx vite build`
2. **vercel.json**: Set buildCommand to `npx vite build` directly

## 🚀 Create Pull Request

### Option 1: Via GitHub Web Interface (Recommended)

1. **Go to GitHub Repository**
   - https://github.com/Armadallc/HALCYON

2. **Create Pull Request**
   - You should see a banner: "feature/consistent-typography-headers had recent pushes"
   - Click **"Compare & pull request"**
   
   OR
   
   - Click **"Pull requests"** tab
   - Click **"New pull request"**
   - **Base:** `main`
   - **Compare:** `feature/consistent-typography-headers`
   - Click **"Create pull request"**

3. **Fill PR Details**
   - **Title:** `Fix Vercel build: use npx for vite and esbuild`
   - **Description:**
     ```markdown
     ## Problem
     Vercel build failing with "vite: command not found" error
     
     ## Solution
     - Updated build script to use `npx vite build` instead of `vite build`
     - Updated vercel.json to use `npx vite build` directly
     
     ## Changes
     - `package.json`: Build script now uses `npx` for vite and esbuild
     - `vercel.json`: BuildCommand set to `npx vite build`
     
     ## Testing
     - Build should now succeed on Vercel
     - Frontend will be built to `dist/public`
     ```

4. **Create Pull Request**
   - Click **"Create pull request"**

5. **Review and Merge**
   - Review the changes
   - If everything looks good, click **"Merge pull request"**
   - Confirm merge

### Option 2: Via GitHub CLI (if installed)

```bash
gh pr create \
  --base main \
  --head feature/consistent-typography-headers \
  --title "Fix Vercel build: use npx for vite and esbuild" \
  --body "Fixes Vercel build error by using npx for vite and esbuild commands"
```

---

## ✅ After Merging

Once the PR is merged to `main`:

1. **Vercel will automatically detect the merge**
2. **Vercel will trigger a new deployment**
3. **Build should succeed** with the fixed commands
4. **You can remove the override** in Vercel dashboard (if you set one)

---

## 🔍 Verify PR

Before merging, verify:
- ✅ `package.json` has `"build": "npx vite build && npx esbuild..."`
- ✅ `vercel.json` has `"buildCommand": "npx vite build"`
- ✅ No other breaking changes in the PR

---

**Ready to create PR?** Go to: https://github.com/Armadallc/HALCYON/compare/main...feature/consistent-typography-headers

