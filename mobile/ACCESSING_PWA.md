# Accessing the Mobile PWA

## Deployed PWA (Render)

The deployed PWA is accessible via Render's static site URL:
- **URL**: `https://halcyon-mobile-pwa.onrender.com` (or your custom Render URL)
- **No port needed** - it's served directly on HTTPS
- **Access**: Just open the URL in any browser

### Finding Your Render URL

1. Go to Render Dashboard
2. Click on your Static Site service
3. The URL is shown at the top (e.g., `https://halcyon-mobile-pwa.onrender.com`)

## Local Development (Port 8082)

Port 8082 is **only for local development**, not for the deployed version.

### To Run Locally:

```bash
cd mobile
npm start
# Then press 'w' to open in web browser
# Or visit: http://localhost:8082
```

Or explicitly:
```bash
cd mobile
npm run web
# Opens at http://localhost:8082
```

## Testing the PWA

### On Desktop Browser:
1. Open the Render URL (e.g., `https://halcyon-mobile-pwa.onrender.com`)
2. Open browser DevTools (F12)
3. Test functionality

### On Mobile Device:
1. Open Safari (iOS) or Chrome (Android)
2. Navigate to the Render URL
3. Test the app
4. Install to home screen:
   - **iOS**: Share → "Add to Home Screen"
   - **Android**: Menu → "Add to Home Screen" or "Install App"

## Port Reference

- **Port 8082**: Local development only (`npm start` or `npm run web`)
- **Deployed PWA**: No port - uses Render's HTTPS URL directly
- **Backend API**: `https://halcyon-backend.onrender.com` (no port)




