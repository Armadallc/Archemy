# Location Permission Troubleshooting

## Issue: Location Permission Prompt Not Showing

If you logged into the mobile app as a driver and weren't prompted for location sharing, check the following:

### 1. Check Your User Role
The location tracking only activates for users with `role === 'driver'`.

**To verify:**
- Check the console logs when logging in
- Look for: `🔍 Checking user role for location tracking: <role>`
- If role is not exactly `'driver'`, location tracking won't start

**Common issues:**
- Role might be `'Driver'` (capitalized) - needs to be lowercase `'driver'`
- Role might be `'driver_role'` or similar - needs to be exactly `'driver'`

### 2. Check Driver Profile
The app needs to find a driver record associated with your user ID.

**To verify:**
- Check console logs for: `✅ Found driver ID: <id>`
- If you see: `❌ No driver record found for user: <userId>`, the driver profile endpoint is failing

**Auto-Creation:**
- **NEW:** The system now automatically creates a driver record if one doesn't exist
- When you log in, if you have `role = 'driver'` but no driver record, it will be created automatically
- Look for: `⚠️ Mobile: No driver record found for user: <userId> - creating one automatically`
- Then: `✅ Mobile: Created driver record: <driverId>`

**Manual Fix (if auto-creation fails):**
- Ensure your user account has a `primary_program_id` (required for driver records)
- If auto-creation fails, manually create driver record in database
- Check that `/api/mobile/driver/profile` endpoint is working

### 3. Permission Already Granted
If location permission was previously granted, the system prompt won't show again.

**To verify:**
- Check console logs for: `📍 Current location permission status: granted`
- If status is `granted`, tracking should start automatically without a prompt

**To test:**
- Reset location permissions in device settings
- Log out and log back in
- You should see the permission prompt

### 4. App Configuration
The `app.json` file must include location permission descriptions.

**Required configuration:**
```json
{
  "ios": {
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "...",
      "NSLocationAlwaysAndWhenInUseUsageDescription": "..."
    }
  },
  "android": {
    "permissions": [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION"
    ]
  }
}
```

**Note:** After adding these, you may need to rebuild the app (not just restart).

### 5. Platform-Specific Issues

#### iOS
- Permission prompts only show once per app install
- If denied, must be changed in Settings app
- Background location requires additional permission

#### Android
- Permission prompts may not show if already granted
- Check app permissions in device Settings
- Background location requires special permission on Android 10+

#### Web/PWA
- Uses browser geolocation API
- Browser will show its own permission prompt
- May require HTTPS in production

### 6. Debug Steps

1. **Check Console Logs:**
   ```
   Look for these log messages:
   - 🔍 Checking user role for location tracking: <role>
   - ✅ User is a driver, initializing location tracking...
   - 📍 LocationTrackingService.initialize called for userId: <id>
   - 📍 Requesting location permissions...
   - 📍 Location permission status after request: <status>
   ```

2. **Verify Role:**
   - Check your user's role in the database
   - Ensure it's exactly `'driver'` (lowercase)

3. **Test Permission Status:**
   - Go to device Settings > Apps > HALCYON DRIVE > Permissions
   - Check Location permission status
   - Reset if needed and try again

4. **Rebuild App:**
   - If you just added permission descriptions to `app.json`
   - Run: `expo prebuild --clean` (for native builds)
   - Or rebuild the app completely

### 7. Manual Testing

To manually trigger location permission request:

1. **Check if tracking is running:**
   ```javascript
   // In React Native debugger or console
   locationTrackingService.getStatus()
   // Should return: { isTracking: true, driverId: '<id>' }
   ```

2. **Manually request permission:**
   ```javascript
   import * as Location from 'expo-location';
   const { status } = await Location.requestForegroundPermissionsAsync();
   console.log('Permission status:', status);
   ```

### 8. Common Solutions

**Solution 1: Role Mismatch**
- Update user role in database to exactly `'driver'`
- Log out and log back in

**Solution 2: Missing Driver Record**
- Create driver record associated with user account
- Ensure driver record has `user_id` matching your user account

**Solution 3: Permission Already Granted**
- This is actually fine - tracking should work
- Check console logs to confirm tracking started
- Verify location updates are being sent

**Solution 4: App Not Rebuilt**
- After adding permission descriptions, rebuild the app
- Native permissions require app rebuild, not just restart

### Next Steps

1. Check console logs when logging in
2. Verify your user role is exactly `'driver'`
3. Check if permission was already granted (no prompt needed)
4. If still not working, check driver profile endpoint
5. Rebuild app if you just added permission descriptions

