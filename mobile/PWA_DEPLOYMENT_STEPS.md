# PWA Deployment - Step-by-Step Walkthrough

## Prerequisites

✅ Your Render backend is deployed and working  
✅ You know your Render backend URL (e.g., `https://halcyon-backend.onrender.com`)  
✅ You have access to Render Dashboard  

---

## Step 1: Get Your Render Backend URL

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Find your backend service (usually named `halcyon-backend` or similar)
3. Copy the URL (e.g., `https://halcyon-backend.onrender.com`)
4. **Note this URL** - you'll need it in the next steps

---

## Step 2: Update Environment Variables

### Option A: Update .env file (Recommended)

```bash
cd mobile
```

Edit the `.env` file and update it with your Render backend URL:

```bash
# Production - Render backend
EXPO_PUBLIC_API_URL=https://YOUR-BACKEND-URL.onrender.com
EXPO_PUBLIC_WS_URL=wss://YOUR-BACKEND-URL.onrender.com
```

**Replace `YOUR-BACKEND-URL.onrender.com` with your actual Render backend URL.**

### Option B: Use build script with inline env vars

The build script already has a template, but you'll need to update it with your actual URL.

---

## Step 3: Build the PWA Locally (Test First)

```bash
cd mobile

# Install dependencies (if not already done)
npm install

# Build the PWA for production
npm run build:web:prod
```

**Note:** If the build script has a hardcoded URL, you can override it:

```bash
EXPO_PUBLIC_API_URL=https://your-actual-backend.onrender.com \
EXPO_PUBLIC_WS_URL=wss://your-actual-backend.onrender.com \
npm run build:web
```

### Verify Build Output

After building, you should see:
```
✅ Built successfully!
📦 Output: mobile/web-build/
```

Check that the folder exists:
```bash
ls -la mobile/web-build/
```

You should see files like:
- `index.html`
- `_expo/static/...`
- `manifest.json` (or similar)

---

## Step 4: Test Locally (Optional but Recommended)

You can test the PWA build locally before deploying:

```bash
cd mobile/web-build

# Start a simple HTTP server
npx serve -s . -l 3000
```

Then open `http://localhost:3000` in your browser to test.

---

## Step 5: Deploy to Render

### Go to Render Dashboard

1. Visit [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** button (top right)
3. Select **"Static Site"**

### Configure the Static Site

1. **Connect Repository:**
   - Connect your GitHub account (if not already)
   - Select the `HALCYON` repository
   - Branch: `main` (or `feature/unified-spa-layout` if you want to test first)

2. **Basic Settings:**
   - **Name**: `halcyon-mobile-pwa` (or any name you prefer)
   - **Region**: Oregon (or closest to you)

3. **Build Settings:**
   - **Root Directory**: `mobile`
   - **Build Command**: `npm install && npm run build:web:prod`
   - **Publish Directory**: `web-build`

4. **Environment Variables:**
   Click "Advanced" → "Add Environment Variable"
   
   Add these two variables:
   ```
   EXPO_PUBLIC_API_URL = https://your-backend-url.onrender.com
   EXPO_PUBLIC_WS_URL = wss://your-backend-url.onrender.com
   ```
   
   **Replace `your-backend-url.onrender.com` with your actual Render backend URL.**

5. **Plan:**
   - Select **Free** plan (or paid if you prefer)

6. **Create Static Site:**
   - Click **"Create Static Site"**
   - Render will start building

### Wait for Deployment

- Build time: ~3-5 minutes
- You'll see build logs in real-time
- Once complete, you'll get a URL like: `https://halcyon-mobile-pwa.onrender.com`

---

## Step 6: Test the PWA

### On Desktop Browser:

1. Open your PWA URL: `https://halcyon-mobile-pwa.onrender.com`
2. Check browser console for errors
3. Try logging in
4. Test basic functionality

### On Mobile Device (iOS):

1. Open Safari on iPhone/iPad
2. Navigate to: `https://halcyon-mobile-pwa.onrender.com`
3. Tap the **Share** button (square with arrow pointing up)
4. Scroll down and tap **"Add to Home Screen"**
5. Customize the name (default: "Monarch Driver")
6. Tap **"Add"**
7. The app icon should appear on your home screen!

### On Mobile Device (Android):

1. Open Chrome on Android
2. Navigate to: `https://halcyon-mobile-pwa.onrender.com`
3. Tap the **Menu** (three dots, top right)
4. Tap **"Add to Home Screen"** or **"Install App"**
5. Tap **"Add"** or **"Install"**
6. The app icon should appear on your home screen!

---

## Step 7: Verify PWA Features

After installing:

✅ **Standalone Mode**: Opens without browser UI  
✅ **App Icon**: Shows on home screen  
✅ **Offline Support**: Should work offline (with service worker)  
✅ **API Connection**: Connects to Render backend  
✅ **WebSocket**: Connects to Render WebSocket server  

---

## Troubleshooting

### Build Fails on Render?

1. **Check Build Logs**: Look for error messages
2. **Verify Environment Variables**: Make sure URLs are correct
3. **Check Root Directory**: Should be `mobile`
4. **Check Publish Directory**: Should be `web-build`

### PWA Not Installable?

1. **HTTPS Required**: PWAs need HTTPS (Render provides this automatically)
2. **Check Manifest**: Verify `manifest.json` exists in build output
3. **Browser Support**: Use Safari (iOS) or Chrome (Android)

### API Not Connecting?

1. **Verify Backend URL**: Check `EXPO_PUBLIC_API_URL` is correct
2. **Check CORS**: Ensure Render backend allows your PWA domain
3. **Test Backend**: Verify backend is accessible: `https://your-backend.onrender.com/api/health`

### WebSocket Not Working?

1. **Use Secure WebSocket**: Must be `wss://` (not `ws://`) for production
2. **Check Backend**: Verify WebSocket server is running on Render
3. **Check URL**: Ensure `EXPO_PUBLIC_WS_URL` uses `wss://`

---

## Quick Reference Commands

```bash
# Navigate to mobile directory
cd mobile

# Build PWA locally
npm run build:web:prod

# Or with custom URL
EXPO_PUBLIC_API_URL=https://your-backend.onrender.com \
EXPO_PUBLIC_WS_URL=wss://your-backend.onrender.com \
npm run build:web

# Test build locally
cd web-build
npx serve -s . -l 3000
```

---

## Next Steps After Deployment

1. ✅ Share PWA URL with testers
2. ✅ Gather feedback
3. ✅ Fix any issues
4. ✅ Update and redeploy (Render auto-deploys on git push)
5. ✅ When ready, build native apps for app stores

---

## Need Help?

- Check build logs in Render Dashboard
- Verify environment variables are set correctly
- Test backend URL is accessible
- Check browser console for errors




