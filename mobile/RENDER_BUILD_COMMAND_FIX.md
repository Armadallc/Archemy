# Render Build Command Fix

## Issue
Render is running the build command from the root directory instead of the `mobile` directory, even when Root Directory is set to `mobile`.

## Solution: Update Build Command

In Render Dashboard → Settings → Build Command, use:

```
cd mobile && npm install && npm run build:web:prod
```

## Complete Render Settings

1. **Root Directory**: Leave **empty** (or set to `/`)
2. **Build Command**: 
   ```
   cd mobile && npm install && npm run build:web:prod
   ```
3. **Publish Directory**: 
   ```
   mobile/web-build
   ```
4. **Environment Variables**:
   - `EXPO_PUBLIC_API_URL` = `https://halcyon-backend.onrender.com`
   - `EXPO_PUBLIC_WS_URL` = `wss://halcyon-backend.onrender.com`

## Why This Works

By explicitly using `cd mobile` in the build command, we ensure the build runs from the correct directory regardless of Render's Root Directory setting. This is more reliable than relying on the Root Directory setting alone.

