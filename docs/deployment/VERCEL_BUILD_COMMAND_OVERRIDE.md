# Vercel Build Command Override (Quick Fix)

## Issue
Build still failing because Vercel is using old commit. Need immediate fix.

## Solution: Override Build Command in Vercel Dashboard

Instead of waiting for git push, you can override the build command directly in Vercel:

### Steps:
1. Go to Vercel Dashboard → Your Project
2. Go to **Settings** → **General**
3. Scroll to **Build & Development Settings**
4. Find **Build Command**
5. **Override** it with:

```
npx vite build
```

### Why This Works:
- `npx` will find `vite` in `node_modules` even if it's not in PATH
- This only builds the frontend (which is what Vercel needs)
- Skips the server build (not needed for static hosting)

### Alternative: Full Build Command
If you want to keep the server build (though not needed for Vercel):

```
npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

## Recommended: Frontend-Only Build

For Vercel (static hosting), you only need:

**Build Command:**
```
npx vite build
```

**Output Directory:**
```
dist/public
```

This will:
- ✅ Build only the frontend
- ✅ Output to `dist/public`
- ✅ Work immediately without git push

---

## After Override

1. Save the settings
2. Trigger a new deployment
3. Build should succeed

---

**Note:** This is a temporary fix. The proper fix is to commit and push the updated `package.json`, but this gets you deployed immediately!

