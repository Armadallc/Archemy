# Testing PWA on Mobile Device Home Screen

## Overview

To test the PWA by adding it to your mobile device's home screen, you need to:
1. Access the dev server from your mobile device (not `localhost`)
2. Add the URL to your home screen
3. Test the PWA functionality

## Step 1: Find Your Mac's Local IP Address

**On your Mac, run:**
```bash
ipconfig getifaddr en0
```

This will output something like: `192.168.12.227`

**Alternative methods:**
- System Settings → Network → WiFi → Details → IP Address
- Or check the Expo CLI output when you start the server

## Step 2: Start Expo with Network Access

Make sure Expo is running with network access enabled:

```bash
cd mobile
npm run web
```

The `--lan` flag is now included automatically, which allows devices on your local network to access the server.

## Step 3: Access from Mobile Device

**On your mobile device's browser (Safari/Chrome):**

1. Make sure your mobile device is on the **same WiFi network** as your Mac
2. Open the browser and navigate to:
   ```
   http://YOUR_MAC_IP:8082
   ```
   
   **Example:**
   ```
   http://192.168.12.227:8082
   ```

3. The app should load (you may need to wait a moment for it to connect)

## Step 4: Add to Home Screen

### iOS (Safari):
1. Tap the **Share** button (square with arrow pointing up)
2. Scroll down and tap **"Add to Home Screen"**
3. Customize the name if needed (default: "HALCYON DRIVE")
4. Tap **"Add"**

### Android (Chrome):
1. Tap the **Menu** (three dots)
2. Tap **"Add to Home Screen"** or **"Install App"**
3. Tap **"Add"** or **"Install"**

## Step 5: Test PWA Home Screen

1. **Close the browser** (or switch to home screen)
2. **Tap the PWA icon** on your home screen
3. **Expected behavior:**
   - ✅ App opens in standalone mode (no browser UI)
   - ✅ Should redirect to login if not authenticated
   - ✅ Should redirect to dashboard if authenticated
   - ✅ Should NOT show "Not Found" error

## Troubleshooting

### "Cannot Connect" or "Connection Refused"

**Problem:** Mobile device can't reach your Mac

**Solutions:**
1. **Verify same network**: Both devices must be on the same WiFi
2. **Check firewall**: Mac firewall might be blocking port 8082
3. **Verify IP address**: Make sure you're using the correct IP
4. **Check Expo output**: Look for network URL in Expo CLI

**To allow firewall access (macOS):**
- System Settings → Network → Firewall → Options
- Allow incoming connections for Node/Expo

### "Not Found" Error When Opening from Home Screen

**Problem:** PWA is trying to access a route that doesn't exist

**Solution:** 
- The catch-all route (`[...missing].tsx`) should handle this
- If you still see "Not Found", check browser console for routing logs
- Make sure you've restarted the dev server after adding the catch-all route

### Routes Not Working

**Problem:** Routes like `/login` don't work

**Solution:**
- ✅ Use: `http://YOUR_IP:8082/login` (redirects to `/(auth)/login`)
- ✅ Use: `http://YOUR_IP:8082/` (root, auto-redirects)
- ✅ Use: `http://YOUR_IP:8082/(auth)/login` (direct route)

### PWA Not Updating

**Problem:** Changes not reflected in PWA

**Solution:**
1. **Uninstall PWA**: Remove from home screen
2. **Clear browser cache**: Clear site data in browser settings
3. **Re-add to home screen**: Add the PWA again
4. **Hard refresh**: In browser, do a hard refresh before adding

## Quick Reference

### Find IP Address
```bash
ipconfig getifaddr en0  # WiFi
ipconfig getifaddr en1  # Ethernet
```

### Start Server
```bash
cd mobile
npm run web  # Now includes --lan flag
```

### Access from Mobile
```
http://YOUR_MAC_IP:8082
```

### Test PWA
1. Add to home screen from mobile browser
2. Open PWA from home screen
3. Verify it works (no "Not Found" error)

## Important Notes

⚠️ **Development Only**: This setup is for testing only. For production, you'll need to:
- Build the PWA: `npm run build:web:prod`
- Deploy to a hosting service (Render, etc.)
- Use HTTPS (required for PWA features like location tracking)

✅ **Same Network Required**: Your Mac and mobile device must be on the same WiFi network for this to work.

✅ **Location Tracking**: When testing location tracking on mobile device, make sure to:
- Allow location permissions in the browser
- Enable availability in the app
- Check that location updates are being sent (check console logs)



