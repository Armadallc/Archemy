# PWA Deployment Guide - Mobile App as Progressive Web App

## Overview

Deploy the mobile app as a **Progressive Web App (PWA)** so users can:
- Open it in their mobile browser
- Add it to their home screen
- Use it like a native app
- No app store approval needed!

## Benefits

✅ **Fast Deployment** - Deploy immediately, no app store wait  
✅ **Easy Updates** - Update instantly, no app store review  
✅ **Cross-Platform** - Works on iOS, Android, and desktop  
✅ **No App Store Fees** - Free to deploy and update  
✅ **Perfect for Testing** - Test with real users before app store submission  

## Step 1: Build the PWA

### Production Build (with Render backend):

```bash
cd mobile

# Set environment variables for production
export EXPO_PUBLIC_API_URL=https://halcyon-backend.onrender.com
export EXPO_PUBLIC_WS_URL=wss://halcyon-backend.onrender.com

# Build the PWA
npm run build:web:prod
```

**Note:** Replace `halcyon-backend.onrender.com` with your actual Render backend URL.

### Development Build (with localhost):

```bash
cd mobile
npm run build:web
```

## Step 2: Deploy to Render

### Option A: Deploy as Static Site on Render

1. **Create Static Site in Render:**
   - Go to Render Dashboard → New → Static Site
   - Connect your GitHub repository
   - Settings:
     - **Name**: `halcyon-mobile-pwa`
     - **Branch**: `main` (or your deployment branch)
     - **Root Directory**: `mobile/web-build`
     - **Build Command**: `cd mobile && npm install && npm run build:web:prod`
     - **Publish Directory**: `mobile/web-build`

2. **Environment Variables:**
   ```
   EXPO_PUBLIC_API_URL=https://halcyon-backend.onrender.com
   EXPO_PUBLIC_WS_URL=wss://halcyon-backend.onrender.com
   ```

3. **Deploy:**
   - Render will build and deploy automatically
   - Your PWA will be available at: `https://halcyon-mobile-pwa.onrender.com`

### Option B: Deploy to Same Render Service as Main App

You can also serve the PWA from your existing frontend service by:
1. Building the mobile app
2. Copying the build output to a subdirectory
3. Serving it from your main frontend service

## Step 3: Install on Mobile Device

### iOS (Safari):

1. Open Safari on iPhone/iPad
2. Navigate to your PWA URL (e.g., `https://halcyon-mobile-pwa.onrender.com`)
3. Tap the **Share** button (square with arrow)
4. Tap **"Add to Home Screen"**
5. Customize the name if needed
6. Tap **"Add"**

### Android (Chrome):

1. Open Chrome on Android
2. Navigate to your PWA URL
3. Tap the **Menu** (three dots)
4. Tap **"Add to Home Screen"** or **"Install App"**
5. Tap **"Add"** or **"Install"**

## Step 4: Verify PWA Features

### Check PWA Installation:

- ✅ App icon appears on home screen
- ✅ Opens in standalone mode (no browser UI)
- ✅ Works offline (with service worker)
- ✅ Fast loading (cached assets)

### Test Features:

- ✅ Login/authentication
- ✅ API calls to Render backend
- ✅ WebSocket connections
- ✅ Push notifications (if configured)
- ✅ Location services (if needed)

## Configuration

### app.json PWA Settings

The `app.json` file is already configured with:
- ✅ App name and description
- ✅ Theme colors
- ✅ Display mode (standalone)
- ✅ Icons and splash screens
- ✅ Orientation (portrait)

### Environment Variables

Create `.env` file in `mobile/` directory:

```bash
# Production (Render backend)
EXPO_PUBLIC_API_URL=https://halcyon-backend.onrender.com
EXPO_PUBLIC_WS_URL=wss://halcyon-backend.onrender.com

# Development (local)
# EXPO_PUBLIC_API_URL=http://localhost:8081
# EXPO_PUBLIC_WS_URL=ws://localhost:8081
```

## Build Output

After running `npm run build:web:prod`, the PWA will be in:
- **Location**: `mobile/web-build/`
- **Files**: Static HTML, CSS, JS, manifest.json, service worker

## Deployment Checklist

- [ ] Update `EXPO_PUBLIC_API_URL` with your Render backend URL
- [ ] Update `EXPO_PUBLIC_WS_URL` with your Render WebSocket URL
- [ ] Build the PWA: `npm run build:web:prod`
- [ ] Deploy to Render (Static Site or existing service)
- [ ] Test on iOS device (Safari)
- [ ] Test on Android device (Chrome)
- [ ] Verify "Add to Home Screen" works
- [ ] Test offline functionality
- [ ] Verify API connections work

## Troubleshooting

### PWA not installable?

1. **Check HTTPS**: PWAs require HTTPS (Render provides this)
2. **Check manifest.json**: Ensure it's properly generated
3. **Check service worker**: Should be registered automatically
4. **Browser support**: Use Safari (iOS) or Chrome (Android)

### API not connecting?

1. **Verify backend URL**: Check `EXPO_PUBLIC_API_URL` is correct
2. **Check CORS**: Ensure Render backend allows your PWA domain
3. **Check network**: Verify backend is accessible from mobile device

### WebSocket not working?

1. **Use secure WebSocket**: `wss://` for production (not `ws://`)
2. **Check backend**: Verify WebSocket server is running on Render
3. **Check firewall**: Ensure WebSocket connections aren't blocked

## PWA vs Native Apps - Important Clarification

### ✅ You Can Have Both!

**PWA and native apps are completely independent:**
- **PWA**: Web build (`expo export:web`) → Static site on Render
- **Native iOS**: Native build (`eas build --platform ios`) → App Store
- **Native Android**: Native build (`eas build --platform android`) → Play Store

**Same codebase, different build outputs.**

### Your app.json Already Supports All Three:

```json
{
  "ios": { ... },      // Native iOS app config
  "android": { ... },  // Native Android app config  
  "web": { ... }       // PWA config (just added)
}
```

### Deployment Strategy:

1. **Now**: Deploy PWA for testing (fast, no app store wait)
2. **Later**: Build native apps when ready (same codebase, different build)
3. **Both**: Can run simultaneously - users choose their preferred method

### No Conflicts:

- ✅ PWA doesn't affect native app builds
- ✅ Native app configs are separate from web config
- ✅ Can build native apps anytime using `eas build`
- ✅ Same codebase works for all platforms

## Next Steps

Once the PWA is working:
1. ✅ Test with real users
2. ✅ Gather feedback
3. ✅ Fix any issues
4. ✅ When ready, build native apps for app stores (using same codebase!)

## Advantages of PWA First

- **Faster iteration**: Update instantly without app store review
- **Broader testing**: Easy to share URL with testers
- **Lower barrier**: No app store accounts needed initially
- **Same codebase**: Can build native apps later from same code
- **No conflicts**: PWA and native apps are completely independent

