# Vercel Project Settings

**Repository:** `https://github.com/Armadallc/HALCYON.git`  
**Framework Preset:** Vite

---

## 📁 Project Settings

### Root Directory
```
./
```
*(Leave empty or set to `.` - deploy from repository root)*

### Framework Preset
```
Vite
```
*(Select from dropdown)*

### Build Command
```
npm run build
```

### Output Directory
```
dist/public
```

### Install Command
```
npm install
```

### Development Command
```
npm run dev
```

---

## 🔧 Environment Variables

Add these in **Settings → Environment Variables**:

### Required Variables

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NODE_ENV` | `production` | Production, Preview, Development |
| `SUPABASE_URL` | `https://iuawurdssgbkbavyyvbs.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1YXd1cmRzc2dia2Jhdnl5dmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDU1MzEsImV4cCI6MjA3NDQyMTUzMX0.JLcuSTI1mfEMGu_mP9UBnGQyG33vcoU2SzvKo8olkL4` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1YXd1cmRzc2dia2Jhdnl5dmJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg0NTUzMSwiZXhwIjoyMDc0NDIxNTMxfQ.p43LNk28V9bTfvWsbdW8ByZw_lb26-IKoDrHxkvp9fg` | Production, Preview, Development |

### Optional Variables (if needed)

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_API_URL` | `https://your-api-url.com` | Production, Preview, Development |
| `VITE_WS_URL` | `wss://your-websocket-url.com` | Production, Preview, Development |

**Note:** Variables prefixed with `VITE_` are exposed to the client bundle.

---

## 📋 Step-by-Step Setup

### 1. Import Project
- Go to https://vercel.com/dashboard
- Click **"Add New"** → **"Project"**
- Import from GitHub: `https://github.com/Armadallc/HALCYON.git`

### 2. Configure Project
- **Project Name:** `halcyon-tms` (or your choice)
- **Framework Preset:** `Vite`
- **Root Directory:** `.` (or leave empty)
- **Build Command:** `npm run build`
- **Output Directory:** `dist/public`
- **Install Command:** `npm install`

### 3. Set Environment Variables
- Go to **Settings → Environment Variables**
- Add each variable listed above
- Select environments: **Production**, **Preview**, **Development**

### 4. Deploy
- Click **"Deploy"**
- Vercel will build and deploy your project

---

## ⚙️ Advanced Settings

### Node.js Version
```
18.x
```
*(Set in Settings → General → Node.js Version)*

### Production Branch
```
main
```
*(Set in Settings → Git → Production Branch)*

### Automatic Deployments
- ✅ **Production:** Deploy on push to `main`
- ✅ **Preview:** Deploy on pull requests
- ✅ **Preview:** Deploy on push to other branches

---

## 🔍 Verification

After deployment, verify:
1. ✅ Build completes successfully
2. ✅ Site is accessible
3. ✅ Environment variables are loaded
4. ✅ API connections work
5. ✅ No console errors

---

## 📝 Quick Reference

**Root Directory:** `.`  
**Build Command:** `npm run build`  
**Output Directory:** `dist/public`  
**Framework:** Vite  
**Node Version:** 18.x

---

**Ready to deploy!** 🚀

