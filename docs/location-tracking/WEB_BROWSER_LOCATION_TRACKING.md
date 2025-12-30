# Web Browser Location Tracking

## Overview

The mobile app's location tracking service now supports web browsers using the browser's Geolocation API (via `expo-location`). This allows drivers to use the web version of the mobile app (`http://localhost:8082`) and still send location updates to the backend.

## Requirements

1. **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge) support the Geolocation API
2. **HTTPS or Localhost**: Browsers require HTTPS (or localhost) for geolocation to work
3. **Location Permission**: Browser must request and receive location permission from the user
4. **Driver Availability**: Driver must have `is_available = true` (or have an active trip)

## How It Works

1. **Initialization**: When a driver logs in, `locationTrackingService.initialize()` is called
2. **Permission Request**: Browser shows native permission prompt for location access
3. **Location Watch**: `Location.watchPositionAsync()` starts watching for position changes
4. **Periodic Updates**: Every 10 seconds, `getCurrentPositionAsync()` forces a fresh location update
5. **Backend Updates**: Location updates are sent to `/api/mobile/driver/:driverId/location`

## Enhanced Logging

The location tracking service now includes detailed logging for web browsers:

```
📍 LocationTrackingService.initialize called for userId: driver_monarch_1758946085589
📍 Platform: web
✅ Driver ID found: driver_monarch_1758946085589
📍 Current location permission status: undetermined
📍 Requesting location permissions...
📍 Location permission status after request: granted
📍 Web platform detected - location tracking will work while browser tab is active
📍 Driver availability status loaded: true
✅ Location tracking initialized for driver: driver_monarch_1758946085589
📍 Starting location tracking...
📍 Platform: web
📍 Driver ID: driver_monarch_1758946085589
✅ Location watch started
✅ Location tracking started (with periodic updates every 10s)
```

## Troubleshooting

### Issue: Location updates not being sent

**Check 1: Browser Console Logs**
- Open browser DevTools (F12)
- Check Console tab for location tracking logs
- Look for:
  - `📍 Location watch triggered:` - Location is being detected
  - `📍 Periodic location update:` - Periodic updates are working
  - `📍 Sending location update to backend...` - Update is being sent
  - `✅ Location update sent successfully:` - Update was successful

**Check 2: Browser Permissions**
- Click the lock icon in the browser address bar
- Verify "Location" permission is set to "Allow"
- If blocked, click "Reset permissions" and refresh the page

**Check 3: Driver Availability**
- Check if `is_available = true` in the database
- Or check if driver has an active trip (location sharing is mandatory during trips)
- Location updates are only sent if `isAvailable = true` OR `activeTripId !== null`

**Check 4: Network Tab**
- Open DevTools → Network tab
- Filter for "location"
- Look for `POST /api/mobile/driver/:driverId/location` requests
- Check if requests are being sent and what the response is

**Check 5: Backend Logs**
- Look for `📍 [Mobile API] Received location update:` in server logs
- If not present, location updates are not reaching the backend

### Issue: "Location Permission Required" alert

**Solution:**
1. Click "OK" in the alert
2. Browser will show native permission prompt
3. Click "Allow" in the browser prompt
4. Refresh the page if needed

### Issue: Location updates stop when browser tab is inactive

**Expected Behavior:**
- Web browsers throttle or pause geolocation when the tab is inactive
- This is a browser security feature
- Location tracking will resume when the tab becomes active again

**Workaround:**
- Keep the browser tab active and visible
- Or use a native mobile app (iOS/Android) for continuous tracking

### Issue: Location accuracy is poor

**Possible Causes:**
- Browser is using IP geolocation instead of GPS
- Device doesn't have GPS (desktop computers)
- Browser is using cached location data

**Solutions:**
- Use a device with GPS (mobile device, tablet)
- Ensure browser has permission to use precise location
- Check browser settings for location accuracy

## Testing

### Test Location Tracking on Web

1. **Open mobile app in browser**: `http://localhost:8082`
2. **Log in as driver**: Use driver credentials
3. **Check console logs**: Should see initialization logs
4. **Allow location permission**: Browser will prompt
5. **Verify location updates**: Check console for `📍 Location update sent successfully:`
6. **Check backend logs**: Should see `📍 [Mobile API] Received location update:`
7. **Check database**: Run diagnostic script to verify location is being stored

### Diagnostic Script

```bash
SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." \
node server/scripts/diagnose-location-tracking.js driver_monarch_1758946085589
```

## Differences from Native Mobile

| Feature | Native Mobile | Web Browser |
|---------|---------------|-------------|
| Background tracking | ✅ Supported (with permissions) | ❌ Only when tab is active |
| High accuracy GPS | ✅ Yes | ⚠️ Depends on device |
| Continuous updates | ✅ Yes | ⚠️ May throttle when tab inactive |
| Permission handling | Native OS prompt | Browser prompt |
| Battery usage | Higher (GPS active) | Lower (browser managed) |

## Code Changes

### Enhanced Logging

- Added `Platform.OS` logging throughout
- Added detailed location update logging
- Added error logging with platform context

### Web-Specific Handling

- Web platform detection in `initialize()`
- Web-specific permission message in alert
- No background permission request on web (not applicable)

### Periodic Updates

- Every 10 seconds, `getCurrentPositionAsync()` forces a fresh update
- This ensures location stays current even when stationary
- Works on both native and web platforms

## Next Steps

If location tracking still doesn't work on web:

1. **Check browser console** for errors
2. **Verify location permission** in browser settings
3. **Check backend logs** for received location updates
4. **Run diagnostic script** to verify database state
5. **Test on different browser** (Chrome, Firefox, Safari)
6. **Test on different device** (mobile device with GPS vs desktop)



