# Logout and Location Tracking

## What Happens When a Driver Logs Out

When a driver logs out of the mobile app, the following sequence occurs:

### 1. Logout Process (`mobile/contexts/AuthContext.tsx`)

```typescript
const logout = async () => {
  // 1. Stop location tracking BEFORE logout
  locationTrackingService.cleanup();
  
  // 2. Clear user state
  setUser(null);
  
  // 3. Call API logout
  await apiClient.logout();
  
  // 4. Clear tokens
  // ... token cleanup
}
```

### 2. Location Tracking Cleanup (`mobile/services/locationTracking.ts`)

```typescript
cleanup() {
  this.stopTracking();  // Stops watchPositionAsync and clears interval
  this.driverId = null; // Clears driver ID
}

stopTracking() {
  // Remove location watch
  if (this.locationWatchId) {
    this.locationWatchId.remove();
    this.locationWatchId = null;
  }
  
  // Clear periodic timer
  if (this.updateInterval) {
    clearInterval(this.updateInterval);
    this.updateInterval = null;
  }
  
  this.isTracking = false;
  this.lastSentLocation = null;
  console.log('🛑 Location tracking stopped');
}
```

## Logout Log Messages

When a driver logs out, you should see these log messages:

```
🔍 [AuthContext] Starting logout...
🛑 Location tracking stopped
✅ [AuthContext] User state cleared
✅ [AuthContext] API logout successful
✅ [AuthContext] Logout completed successfully
```

## Identifying the Same Device

To verify if the device that logged out is the same one being tracked:

### Method 1: Check Logout Timestamp vs Last Location

1. **Find logout time**: Look for `"🔍 [AuthContext] Starting logout..."` in mobile app logs
2. **Check last location**: Run diagnostic script:
   ```bash
   node server/scripts/diagnose-location-tracking.js driver_monarch_1758946085589
   ```
3. **Compare**: If the last location timestamp matches or is just before the logout time, it's the same device

### Method 2: Check Location Update Pattern

- **Before logout**: Location updates should be coming in every 10 seconds
- **After logout**: Location updates stop immediately
- **Pattern**: If updates stop at the same time as logout logs appear, it's the same device

### Method 3: Check Driver ID

- The driver ID in location updates should match the driver ID in logout logs
- Both should be: `driver_monarch_1758946085589`

## What Happens to Location Data After Logout

1. **Location tracking stops**: No new location updates are sent
2. **Last location remains**: The most recent location stays in the database with `is_active = true`
3. **Map display**: The driver's location marker remains on the map at the last known position
4. **No automatic cleanup**: Old locations are NOT automatically deactivated on logout

## Important Notes

- **Location data persists**: Even after logout, the last location remains `is_active = true`
- **Multiple devices**: If the same driver logs in on a different device, new locations will be stored
- **Map display**: The map will show the last known location until the driver logs back in and sends new updates

## Troubleshooting: "Device Logged Out But Location Still Showing"

If you see a location on the map but the driver has logged out:

1. **Check last location timestamp**:
   ```sql
   SELECT timestamp, is_active 
   FROM driver_locations 
   WHERE driver_id = 'driver_monarch_1758946085589' 
   AND is_active = true
   ORDER BY timestamp DESC 
   LIMIT 1;
   ```

2. **Verify logout time**: Check mobile app logs for logout messages

3. **Time difference**: If location is older than logout time, it's the last location before logout (expected behavior)

4. **If location is newer than logout**: This indicates:
   - Driver logged back in on same or different device
   - Or location updates are still being sent (shouldn't happen after cleanup)

## Expected Behavior

✅ **Correct**: Last location remains on map after logout (shows where driver was when they logged out)
✅ **Correct**: No new location updates after logout
✅ **Correct**: Location updates resume when driver logs back in

❌ **Problem**: Location continues updating after logout (indicates cleanup didn't work)
❌ **Problem**: Location disappears immediately on logout (should remain until new login)



