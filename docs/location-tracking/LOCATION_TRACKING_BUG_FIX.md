# Location Tracking Bug Fix

## Issue
Driver location was being tracked and displayed on the fleet map, but the location never moved throughout the day, even though the driver was actively using the app and updating trip statuses.

## Root Cause
The location tracking system uses **GPS coordinates from the mobile device** (via `expo-location`), NOT IP geolocation. However, there was a critical bug in the database update logic:

### The Bug
When a new location update was inserted into the `driver_locations` table:
1. The new location was correctly marked as `is_active: true`
2. **BUT** previous locations were never set to `is_active: false`

This meant multiple location records could be marked as active simultaneously. When the dashboard queried for the latest location using:
```sql
SELECT * FROM driver_locations 
WHERE driver_id = ? AND is_active = true 
ORDER BY timestamp DESC LIMIT 1
```

It could return:
- The first location ever recorded (if ordering wasn't working correctly)
- An old location if multiple were marked active
- The wrong location due to database query ambiguity

## The Fix
Modified `server/mobile-api.ts` in the `updateDriverLocation` function to:

1. **Deactivate all previous locations** before inserting the new one:
   ```typescript
   // Set all previous locations for this driver to is_active=false
   await supabase
     .from('driver_locations')
     .update({ is_active: false })
     .eq('driver_id', driverId)
     .eq('is_active', true);
   ```

2. **Then insert the new location** with `is_active: true`

3. **Added logging** to track location updates for debugging:
   - Logs GPS coordinates received
   - Logs when previous locations are deactivated
   - Confirms location source is GPS (not IP)

## Verification
The location tracking system:
- ✅ Uses GPS from mobile device (`expo-location` with `watchPositionAsync`)
- ✅ Sends latitude/longitude coordinates to backend
- ✅ Stores coordinates in `driver_locations` table
- ✅ Dashboard queries for `is_active: true` locations
- ✅ Now correctly ensures only the most recent location is active

## Testing
After deploying this fix:
1. Driver should see location updates in mobile app console logs
2. Backend should log location updates with GPS coordinates
3. Dashboard should display the driver's current location
4. Location should update as driver moves (every 10 seconds or 10 meters)

## Additional Notes
- Location tracking uses **GPS coordinates**, not IP geolocation
- Updates are sent every 10 seconds minimum, or when driver moves 10+ meters
- Location permission is required on mobile device
- Background location permission is required for iOS to track when app is in background


