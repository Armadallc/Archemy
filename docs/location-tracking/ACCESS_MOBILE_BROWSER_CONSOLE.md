# How to Access Mobile Browser Console on iPhone

## Prerequisites
- iPhone connected to Mac via USB cable
- iPhone and Mac on the same Wi-Fi network (or USB connection)
- Safari browser on both devices

## Step-by-Step Instructions

### Step 1: Enable Web Inspector on iPhone

1. **On your iPhone:**
   - Open **Settings** app
   - Scroll down and tap **Safari**
   - Scroll down to the **Advanced** section (at the bottom)
   - Tap **Advanced**
   - Toggle **Web Inspector** to **ON** (green)

### Step 2: Open the PWA on iPhone

1. **On your iPhone:**
   - Open **Safari** browser
   - Navigate to your app: `http://192.168.12.227:8082`
   - Log in if needed
   - **Keep Safari open** on this page (don't close it or switch apps)

### Step 3: Enable Developer Menu in Safari on Mac

1. **On your Mac:**
   - Open **Safari** browser
   - If you don't see a **Develop** menu in the menu bar:
     - Go to **Safari** → **Settings** (or **Preferences**)
     - Click the **Advanced** tab
     - Check the box: **"Show Develop menu in menu bar"**
     - Close the Settings window

### Step 4: Access iPhone Console from Mac

1. **On your Mac:**
   - In Safari, click **Develop** in the menu bar (top of screen)
   - You should see your iPhone listed (e.g., "Sef's iPhone" or similar)
   - Hover over your iPhone name
   - A submenu will appear showing open Safari tabs/pages
   - Look for the page showing your app (e.g., "192.168.12.227:8082" or the page title)
   - Click on that page

### Step 5: Open Web Inspector Console

1. **After clicking the page:**
   - A new window will open: **Web Inspector**
   - This shows the developer tools for your iPhone's Safari tab
   - Click the **Console** tab at the top of the Web Inspector window
   - You should now see all console logs from your iPhone's Safari browser

### Step 6: View Location Tracking Logs

1. **In the Console tab:**
   - You'll see real-time console logs from your iPhone
   - Look for logs starting with `📍` (location emoji)
   - These are location tracking logs
   - You can also filter by typing "Location" or "📍" in the search box

### What to Look For

**Successful Location Tracking Initialization:**
```
📍 LocationTrackingService.initialize called for userId: driver_monarch_...
📍 Platform: web
📍 Current location permission status: undetermined
📍 Requesting location permissions...
📍 Location permission status after request: granted
📍 Web platform detected - location tracking will work while browser tab is active
📍 Driver availability status loaded: true
✅ Location tracking initialized for driver: driver_monarch_...
📍 Starting location tracking...
📍 Platform: web
📍 Driver ID: driver_monarch_...
✅ Location watch started
✅ Location tracking started (with periodic updates every 10s)
```

**If Permission is Denied:**
```
📍 Location permission status after request: denied
⚠️ Location permission denied: HALCYON DRIVE requires location access...
```

**If Location Tracking Starts:**
```
📍 Location watch triggered: {lat: 39.739235, lng: -104.990250, accuracy: 10m}
📍 Sending location update to backend...
```

## Troubleshooting

### "Develop" menu doesn't appear
- Make sure you enabled it in Safari → Settings → Advanced
- Restart Safari if needed

### iPhone doesn't appear in Develop menu
- Make sure iPhone is connected via USB
- Make sure Web Inspector is enabled on iPhone (Step 1)
- Make sure Safari is open on iPhone with your app loaded
- Try unplugging and reconnecting the USB cable
- Try restarting Safari on both devices

### No console logs appear
- Make sure you clicked the correct page in the Develop menu
- Make sure the Console tab is selected in Web Inspector
- Try refreshing the page on iPhone
- Check if there's a filter applied in the console

### Console shows errors
- Look for red error messages
- These will help identify what's failing
- Common errors:
  - `Location permission denied` - Need to allow location access
  - `Failed to initialize location tracking` - Check error details
  - Network errors - Check API connectivity

## Alternative: Use Chrome DevTools (if Safari doesn't work)

If Safari Web Inspector doesn't work, you can try:

1. **On iPhone:** Use Chrome browser instead of Safari
2. **On Mac:** Use Chrome's remote debugging:
   - Open Chrome on Mac
   - Go to `chrome://inspect`
   - Enable "Discover USB devices"
   - Your iPhone should appear if Chrome is open on it

## Next Steps

Once you can see the console:
1. **Refresh the page** on iPhone to see initialization logs
2. **Look for location permission prompts** in the console
3. **Check for errors** that might explain why location tracking isn't working
4. **Share the console logs** so we can diagnose the issue


