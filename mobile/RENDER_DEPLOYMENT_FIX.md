# Render Deployment Fix

## Issue
Render is running the build command from the root directory instead of the `mobile` directory, causing "Missing script: 'build:web:prod'" error.

## Solution

Update your Render Static Site build command to:

```
cd mobile && npm install && npm run build:web:prod
```

## Steps to Fix in Render Dashboard

1. Go to your Render Dashboard
2. Click on your Static Site service (`halcyon-mobile-pwa`)
3. Go to **Settings** tab
4. Scroll to **Build Command**
5. Update it to:
   ```
   cd mobile && npm install && npm run build:web:prod
   ```
6. Make sure **Publish Directory** is still: `mobile/web-build`
7. Click **Save Changes**
8. Render will automatically trigger a new deployment

## Alternative: Update Root Directory

If you prefer, you can also:
1. Set **Root Directory** to: `mobile`
2. Keep **Build Command** as: `npm install && npm run build:web:prod`
3. Keep **Publish Directory** as: `web-build` (not `mobile/web-build`)

Both approaches work - choose whichever you prefer!

