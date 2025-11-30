# Vercel Build Fix

## Issue
Build failing with: `sh: line 1: vite: command not found`

## Solution
Updated build command to use `npx` to ensure commands are found.

## Updated Settings

### Build Command
```
npm run build
```

The `package.json` build script now uses:
```json
"build": "npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
```

This ensures that `vite` and `esbuild` are found via `npx` even if they're not in the global PATH.

## Alternative: Update Vercel Settings Directly

If you prefer to set it directly in Vercel:

**Build Command:**
```
npx vite build
```

**Note:** This will only build the frontend. The full build command includes both frontend and server builds.

## Verification

After updating, the build should:
1. ✅ Install all dependencies (including devDependencies)
2. ✅ Find `vite` via `npx vite`
3. ✅ Build frontend to `dist/public`
4. ✅ Build server bundle to `dist/`

---

**Status:** ✅ Fixed in `package.json`

