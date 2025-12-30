# Driver Location Tracking - End-to-End Reference

## Overview
This document provides a complete reference for how driver location tracking works from mobile device to live map display, including troubleshooting steps for common issues.

## Architecture Flow

```
Mobile Device (Driver)
    ↓
1. Driver Signs In (AuthContext)
    ↓
2. Location Tracking Initialized (if role === 'driver')
    ↓
3. Location Permission Requested
    ↓
4. GPS Tracking Started (watchPositionAsync)
    ↓
5. Location Updates Sent to Backend (every 10s or 10m movement)
    ↓
Backend Server
    ↓
6. Location Stored in Database (driver_locations table)
    ↓
7. WebSocket Broadcast (if driver is_available = true)
    ↓
8. Dashboard Map Receives Update
    ↓
9. Map Markers Updated
```

## Detailed Component Flow

### 1. Mobile App - Driver Login & Initialization

**File**: `mobile/contexts/AuthContext.tsx`

**Flow**:
1. Driver logs in via `login()` function
2. System checks if `user.role === 'driver'`
3. If driver, calls `locationTrackingService.initialize(user.id)`
4. Fetches driver profile to get `is_available` status
5. Sets availability: `locationTrackingService.setAvailability(isAvailable)`
6. Starts tracking: `locationTrackingService.startTracking()`

**Key Code**:
```typescript
if (userData.role === 'driver') {
  const initialized = await locationTrackingService.initialize(userData.id);
  if (initialized) {
    // Fetch driver profile to get availability status
    const profile = await apiClient.getDriverProfile();
    const isAvailable = profile?.is_available ?? false; // ⚠️ DEFAULTS TO FALSE
    locationTrackingService.setAvailability(isAvailable);
    locationTrackingService.startTracking();
  }
}
```

**⚠️ CRITICAL**: `is_available` defaults to `false` - driver must explicitly enable it!

---

### 2. Mobile App - Location Tracking Service

**File**: `mobile/services/locationTracking.ts`

**Initialization**:
- Requests location permissions (foreground + background for iOS)
- Converts `user_id` to `driver_id` via API call
- Stores `driverId` for location updates

**Tracking**:
- Uses `Location.watchPositionAsync()` with:
  - `accuracy: Location.Accuracy.High`
  - `timeInterval: 5000` (check every 5 seconds)
  - `distanceInterval: 5` (update every 5 meters)
- Calls `handleLocationUpdate()` on each GPS update

**Update Logic**:
- Checks `shouldSendUpdate()`:
  - First update: Always send
  - Time-based: Send if ≥10 seconds since last update
  - Distance-based: Send if moved ≥10 meters
- Before sending, checks availability:
  ```typescript
  const shouldShareLocation = this.isAvailable || this.activeTripId !== null;
  if (!shouldShareLocation) {
    console.log('📍 Skipping location update - driver not available and no active trip');
    return; // ⚠️ LOCATION NOT SENT IF UNAVAILABLE
  }
  ```

**Sending Update**:
- Calls `apiClient.updateDriverLocation(driverId, locationData)`
- Includes: `latitude`, `longitude`, `accuracy`, `heading`, `speed`, `tripId`

---

### 3. Backend API - Location Update Endpoint

**File**: `server/routes/mobile.ts`
**Endpoint**: `POST /api/mobile/driver/:driverId/location`

**Flow**:
1. Validates authentication (`requireSupabaseAuth`)
2. Verifies `driverId` belongs to authenticated user
3. Validates GPS coordinates (lat: -90 to 90, lng: -180 to 180)
4. Calls `mobileApi.updateDriverLocation()`
5. Broadcasts via WebSocket (if `is_available = true`)

**Key Code**:
```typescript
// Update driver location using mobile API
const locationData = await mobileApi.updateDriverLocation(driverId, {
  latitude: lat,
  longitude: lng,
  accuracy: parseFloat(accuracy),
  heading: heading ? parseFloat(heading) : undefined,
  speed: speed ? parseFloat(speed) : undefined,
  address: address,
  tripId: tripId,
});

// Broadcast location update via WebSocket for real-time dashboard updates
// Only broadcast if driver is_available = true (privacy feature)
const { data: driver } = await supabase
  .from('drivers')
  .select('id, user_id, program_id, is_available')
  .eq('id', driverId)
  .single();

if (driver && driver.is_available === true) {
  broadcastDriverUpdate({
    id: driver.id,
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    timestamp: locationData.timestamp,
  }, {
    programId: driver.program_id,
  });
} else if (driver && driver.is_available === false) {
  console.log('🔒 Location update received but not broadcast - driver is_available = false (privacy)');
}
```

**⚠️ CRITICAL**: Location is stored in database BUT NOT broadcast if `is_available = false`

---

### 4. Backend - Database Storage

**File**: `server/mobile-api.ts`
**Function**: `updateDriverLocation()`

**Flow**:
1. Validates trip assignment (if `tripId` provided)
2. **Deactivates all previous locations** for this driver:
   ```typescript
   await supabase
     .from('driver_locations')
     .update({ is_active: false })
     .eq('driver_id', driverId)
     .eq('is_active', true);
   ```
3. Inserts new location with `is_active: true`:
   ```typescript
   await supabase
     .from('driver_locations')
     .insert({
       id: `location_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
       driver_id: driverId,
       latitude: location.latitude,
       longitude: location.longitude,
       accuracy: location.accuracy,
       heading: location.heading,
       speed: location.speed,
       address: location.address,
       trip_id: tripId || null,
       timestamp: new Date().toISOString(),
       is_active: true, // ⚠️ ONLY THE LATEST LOCATION IS ACTIVE
       created_at: new Date().toISOString()
     });
   ```

**Database Schema** (`driver_locations` table):
- `id`: Unique location ID
- `driver_id`: Foreign key to `drivers` table
- `latitude`: GPS latitude
- `longitude`: GPS longitude
- `accuracy`: GPS accuracy in meters
- `heading`: Direction in degrees (0-360)
- `speed`: Speed in m/s
- `address`: Reverse geocoded address (optional)
- `trip_id`: Associated trip (if during active trip)
- `timestamp`: When location was recorded
- `is_active`: Boolean - only latest location is `true`
- `created_at`: Record creation time

---

### 5. Backend - Driver Data Retrieval

**File**: `server/minimal-supabase.ts`
**Function**: `getAllDrivers()`

**Flow**:
1. Fetches all drivers (filtered by hierarchy)
2. For each driver, checks `is_available`:
   ```typescript
   if (driver.is_available !== true) {
     return {
       ...driver,
       latitude: null,
       longitude: null,
       last_location_update: null,
     };
   }
   ```
3. If available, fetches latest active location:
   ```typescript
   const { data: locationData } = await supabase
     .from('driver_locations')
     .select('latitude, longitude, timestamp')
     .eq('driver_id', driver.id)
     .eq('is_active', true) // ⚠️ ONLY FETCHES ACTIVE LOCATIONS
     .order('timestamp', { ascending: false })
     .limit(1)
     .single();
   ```
4. Returns driver with location data attached

**⚠️ CRITICAL**: 
- Drivers with `is_available = false` return `null` for location
- Only `is_active = true` locations are returned
- If no active location exists, returns `null`

---

### 6. WebSocket Broadcast

**File**: `server/websocket-instance.ts`
**Function**: `broadcastDriverUpdate()`

**Flow**:
1. Creates WebSocket event:
   ```typescript
   {
     type: 'driver_update',
     data: {
       id: driver.id,
       latitude: locationData.latitude,
       longitude: locationData.longitude,
       timestamp: locationData.timestamp,
     },
     timestamp: new Date().toISOString(),
     target: { programId: driver.program_id }
   }
   ```
2. Broadcasts to users in same program hierarchy
3. Dashboard receives event and invalidates query cache

**⚠️ CRITICAL**: Only broadcasts if `is_available = true` (checked in step 3)

---

### 7. Dashboard - Map Display

**File**: `client/src/components/dashboard/InteractiveMapWidget.tsx`

**WebSocket Subscription**:
```typescript
useRealtimeSubscription('drivers', {
  enabled: true,
  onMessage: (message) => {
    if (message.type === 'driver_update' && message.data) {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    }
  }
});
```

**Data Fetching**:
```typescript
const { data: drivers } = useQuery({
  queryKey: ['drivers', getFilterParams()],
  queryFn: async () => {
    const response = await apiRequest('GET', '/api/drivers');
    const data = await response.json();
    return data || [];
  },
  enabled: true,
  refetchInterval: 5000, // Refresh every 5 seconds
  staleTime: 4000,
});
```

**Map Marker Creation**:
```typescript
drivers.forEach((driver: any) => {
  if (driver.latitude && driver.longitude) {
    const marker = L.marker([driver.latitude, driver.longitude], {
      icon: getDriverIcon(driver.status),
    });
    marker.addTo(map);
  }
});
```

**⚠️ CRITICAL**: 
- Map only displays drivers with `latitude` and `longitude` values
- If location is `null`, marker is not created
- Markers are recreated on every data update (cleared and re-added)

---

## Common Issues & Troubleshooting

### Issue 1: Location Appears But Doesn't Update

**Symptoms**:
- Driver location appears on map initially
- Location stays in same place all day
- Driver is actually moving

**Root Causes**:

1. **Driver `is_available = false`**
   - **Check**: Query `drivers` table: `SELECT id, name, is_available FROM drivers WHERE id = '<driver_id>';`
   - **Fix**: Update driver: `UPDATE drivers SET is_available = true WHERE id = '<driver_id>';`
   - **Mobile**: Driver must toggle "Available" ON in mobile app

2. **Location Updates Not Being Sent**
   - **Check**: Mobile app logs - look for `"📍 Skipping location update - driver not available and no active trip"`
   - **Fix**: Ensure `is_available = true` in database AND mobile app

3. **Location Stored But Not Active**
   - **Check**: Query `driver_locations`: 
     ```sql
     SELECT * FROM driver_locations 
     WHERE driver_id = '<driver_id>' 
     ORDER BY timestamp DESC 
     LIMIT 5;
     ```
   - **Fix**: Ensure only one location has `is_active = true`. If multiple, deactivate old ones:
     ```sql
     UPDATE driver_locations 
     SET is_active = false 
     WHERE driver_id = '<driver_id>' 
     AND id != '<latest_location_id>';
     ```

4. **WebSocket Not Broadcasting**
   - **Check**: Server logs - look for `"🔒 Location update received but not broadcast - driver is_available = false"`
   - **Fix**: Ensure `is_available = true` in database

5. **Map Not Refreshing**
   - **Check**: Browser console for WebSocket connection errors
   - **Check**: Network tab - verify `/api/drivers` is being called every 5 seconds
   - **Fix**: Ensure WebSocket is connected and `refetchInterval` is working

---

### Issue 2: Location Never Appears

**Symptoms**:
- Driver signs in and enables location tracking
- No location appears on map at all

**Root Causes**:

1. **Location Permission Denied**
   - **Check**: Mobile app logs - look for permission denial messages
   - **Fix**: Driver must grant location permissions in device settings

2. **Driver ID Mismatch**
   - **Check**: Verify `user_id` maps to correct `driver_id`:
     ```sql
     SELECT d.id as driver_id, d.user_id, u.user_id as user_user_id
     FROM drivers d
     JOIN users u ON d.user_id = u.user_id
     WHERE u.user_id = '<user_id>';
     ```
   - **Fix**: Ensure driver record exists and `user_id` matches

3. **Location Updates Failing**
   - **Check**: Mobile app logs - look for `"❌ Failed to send location update"`
   - **Check**: Server logs - look for API errors
   - **Fix**: Check network connectivity, API endpoint availability

4. **No Active Location in Database**
   - **Check**: Query for any locations:
     ```sql
     SELECT * FROM driver_locations 
     WHERE driver_id = '<driver_id>' 
     ORDER BY timestamp DESC;
     ```
   - **Fix**: If no locations exist, location tracking may not be sending updates

---

### Issue 3: Location Updates But Map Doesn't Refresh

**Symptoms**:
- Location is updating in database
- Map shows old location

**Root Causes**:

1. **WebSocket Not Connected**
   - **Check**: Browser console - look for WebSocket connection errors
   - **Fix**: Ensure WebSocket server is running and accessible

2. **Query Cache Not Invalidating**
   - **Check**: React Query DevTools - verify queries are invalidating
   - **Fix**: Ensure `useRealtimeSubscription` is properly configured

3. **Map Markers Not Updating**
   - **Check**: Map component - verify markers are being cleared and recreated
   - **Fix**: Ensure `useEffect` dependency array includes `drivers` data

---

## Debugging Checklist

### Mobile App
- [ ] Driver role is `'driver'`
- [ ] Location permissions granted (foreground + background)
- [ ] `locationTrackingService.initialize()` succeeded
- [ ] `locationTrackingService.startTracking()` called
- [ ] `is_available = true` in mobile app
- [ ] Location updates being sent (check logs for `"📍 Location update sent"`)
- [ ] No errors in mobile app logs

### Backend API
- [ ] Location update endpoint receiving requests (`POST /api/mobile/driver/:driverId/location`)
- [ ] Location stored in `driver_locations` table
- [ ] Only one location has `is_active = true` per driver
- [ ] `is_available = true` in `drivers` table
- [ ] WebSocket broadcast triggered (check logs)
- [ ] No errors in server logs

### Database
- [ ] Driver record exists with correct `user_id`
- [ ] `drivers.is_available = true`
- [ ] `driver_locations` records being created
- [ ] Only latest location has `is_active = true`
- [ ] Location coordinates are valid (not null, within valid ranges)

### Dashboard
- [ ] WebSocket connection established
- [ ] `/api/drivers` endpoint returning location data
- [ ] `driver.latitude` and `driver.longitude` are not null
- [ ] Map markers being created
- [ ] Query refetching every 5 seconds
- [ ] WebSocket messages triggering query invalidation

---

## Key Configuration Values

### Mobile App
- **Update Interval**: 10 seconds minimum (`minUpdateInterval = 10000`)
- **Distance Threshold**: 10 meters minimum (`minDistanceChange = 10`)
- **GPS Accuracy**: High (`Location.Accuracy.High`)
- **Check Interval**: 5 seconds (`timeInterval: 5000`)
- **Distance Check**: 5 meters (`distanceInterval: 5`)

### Backend
- **Location Storage**: All locations stored, only latest is `is_active = true`
- **WebSocket Broadcast**: Only if `is_available = true`
- **Privacy**: Location hidden if `is_available = false`

### Dashboard
- **Refresh Interval**: 5 seconds (`refetchInterval: 5000`)
- **Stale Time**: 4 seconds (`staleTime: 4000`)
- **WebSocket**: Real-time updates via `driver_update` events

---

## Testing Steps

### Test 1: Basic Location Tracking
1. Driver signs in on mobile app
2. Verify location permission granted
3. Toggle "Available" ON
4. Check database: `SELECT * FROM driver_locations WHERE driver_id = '<id>' ORDER BY timestamp DESC LIMIT 1;`
5. Check map: Location should appear

### Test 2: Location Updates
1. Driver moves to new location
2. Wait 10 seconds or move 10 meters
3. Check database: New location should be `is_active = true`, old should be `is_active = false`
4. Check map: Location should update within 5 seconds

### Test 3: Availability Toggle
1. Driver toggles "Available" OFF
2. Check mobile logs: Should see `"📍 Skipping location update - driver not available"`
3. Check database: No new locations should be created
4. Check map: Location should disappear or stop updating
5. Driver toggles "Available" ON
6. Check map: Location should reappear and update

### Test 4: WebSocket Real-Time Updates
1. Open dashboard map
2. Driver moves to new location
3. Map should update within 5 seconds without page refresh
4. Check browser console: Should see WebSocket messages

---

## Related Files

### Mobile
- `mobile/contexts/AuthContext.tsx` - Login and initialization
- `mobile/services/locationTracking.ts` - Core tracking service
- `mobile/services/api.ts` - API client for location updates
- `mobile/app/(tabs)/profile.tsx` - Availability toggle UI

### Backend
- `server/routes/mobile.ts` - Location update endpoint
- `server/mobile-api.ts` - Location storage logic
- `server/minimal-supabase.ts` - Driver data retrieval
- `server/websocket-instance.ts` - WebSocket broadcasting

### Frontend
- `client/src/components/dashboard/InteractiveMapWidget.tsx` - Map display
- `client/src/hooks/useWebSocket.tsx` - WebSocket connection
- `client/src/services/realtimeService.ts` - Real-time message handling

### Database
- `shared/schema.ts` - `driver_locations` table schema
- `migrations/` - Database migration files

### Diagnostic Tools
- `server/scripts/diagnose-location-tracking.js` - Diagnostic script to check driver location tracking status

---

## Diagnostic Script

A diagnostic script is available to check the current state of a driver's location tracking:

**Usage**:
```bash
# Diagnose by driver ID
node server/scripts/diagnose-location-tracking.js <driver_id>

# Diagnose by user ID
node server/scripts/diagnose-location-tracking.js <user_id> --by-user-id

# List all drivers
node server/scripts/diagnose-location-tracking.js --all-drivers
```

**What it checks**:
1. Driver availability status (`is_available`)
2. User role (must be `'driver'`)
3. Location records in database
4. Active location status (only one should be active)
5. Location freshness (how recent is the latest location)
6. Multiple active locations (data integrity issue)

**Output includes**:
- Driver information
- Availability status
- Location history
- Issues found
- Specific recommendations to fix problems

---

## Summary

**The location tracking system requires:**
1. ✅ Driver signs in with `role === 'driver'`
2. ✅ Location permissions granted
3. ✅ `is_available = true` in database AND mobile app
4. ✅ Location updates being sent from mobile (every 10s or 10m)
5. ✅ Location stored in database with `is_active = true`
6. ✅ WebSocket broadcast (if `is_available = true`)
7. ✅ Dashboard fetching driver data with locations
8. ✅ Map displaying markers for drivers with valid coordinates

**Most common issue**: Driver has `is_available = false`, which prevents:
- Location updates from being sent (mobile app)
- Location from being broadcast (backend)
- Location from being returned in API (backend)
- Location from appearing on map (dashboard)

