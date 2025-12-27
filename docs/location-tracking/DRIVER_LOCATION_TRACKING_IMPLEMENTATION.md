# Driver Location Tracking Implementation

## Overview
This document describes the implementation of real-time location tracking for drivers in the mobile app, with location data displayed on the fleet map in the dashboard.

## Implementation Status

### ✅ Completed

1. **Location Tracking Service** (`mobile/services/locationTracking.ts`)
   - Continuous GPS tracking using `expo-location`
   - Automatic location updates sent to backend
   - Smart update throttling (10 seconds minimum, 10 meters minimum distance)
   - Location permission requirement with user-friendly alerts
   - Background location support for iOS

2. **Mobile App Integration** (`mobile/contexts/AuthContext.tsx`)
   - Location tracking automatically starts when a driver logs in
   - Location tracking stops when driver logs out
   - Only activates for users with `role === 'driver'`

3. **Backend API Endpoints**
   - `POST /api/mobile/driver/:driverId/location` - Updates driver location
   - `GET /api/mobile/driver/profile` - Gets driver profile (includes driver ID lookup)
   - Updated `GET /api/drivers` to include latest location data

4. **Dashboard Integration** (`client/src/components/dashboard/InteractiveMapWidget.tsx`)
   - Fetches drivers with location data
   - Displays driver markers on map using latitude/longitude
   - Shows driver status and last update time

5. **Database Schema**
   - `driver_locations` table already exists with:
     - `driver_id`, `latitude`, `longitude`, `accuracy`
     - `heading`, `speed`, `timestamp`, `is_active`

## How It Works

### Mobile App Flow

1. **Driver Login**
   - User logs in via `AuthContext`
   - If `user.role === 'driver'`, location tracking is initialized
   - Location permission is requested (required)
   - If permission denied, user sees alert with option to open settings

2. **Location Tracking**
   - `LocationTrackingService` uses `watchPositionAsync` for continuous tracking
   - Location updates are sent to backend every 10 seconds (or when moved 10+ meters)
   - Updates sent via `apiClient.updateDriverLocation()`

3. **Backend Processing**
   - Location updates stored in `driver_locations` table
   - Latest location marked as `is_active: true`
   - Previous locations remain in database for history

4. **Dashboard Display**
   - Dashboard fetches drivers via `GET /api/drivers`
   - Each driver includes `latitude`, `longitude`, `last_location_update`
   - Map widget displays markers for drivers with valid coordinates
   - Markers update when query refetches (currently manual refresh)

## Configuration

### Location Update Settings
- **Time Interval**: 10 seconds minimum between updates
- **Distance Interval**: 10 meters minimum movement
- **Accuracy**: High accuracy GPS
- **Background**: Supported on iOS (requires background permission)

### API Endpoints

#### Update Driver Location
```typescript
POST /api/mobile/driver/:driverId/location
Headers: Authorization: Bearer <token>
Body: {
  latitude: number,
  longitude: number,
  accuracy: number,
  heading?: number,
  speed?: number,
  address?: string
}
```

#### Get Driver Profile (for driver ID lookup)
```typescript
GET /api/mobile/driver/profile
Headers: Authorization: Bearer <token>
Response: {
  id: string, // driver_id
  user_id: string,
  name: string,
  ...
}
```

## Next Steps

### 🔄 Real-Time Updates (Pending)
Currently, the dashboard map requires manual refresh to see updated locations. To enable real-time updates:

1. **Option A: WebSocket Updates**
   - Broadcast location updates via WebSocket when received
   - Dashboard subscribes to location updates
   - Update map markers in real-time

2. **Option B: Polling**
   - Increase query refetch interval (e.g., every 5-10 seconds)
   - Use React Query's `refetchInterval` option

3. **Option C: Hybrid**
   - Use WebSocket for real-time updates when available
   - Fall back to polling if WebSocket disconnected

### Recommended: WebSocket Implementation
- Already have WebSocket infrastructure
- More efficient than polling
- Lower latency for location updates
- Can broadcast to all connected dashboard clients

## Testing

### Mobile App Testing
1. Login as a driver
2. Grant location permission when prompted
3. Verify location updates in console logs
4. Check backend `driver_locations` table for new entries

### Dashboard Testing
1. Open dashboard with fleet map
2. Verify driver markers appear on map
3. Check that markers update when drivers move
4. Verify popup shows correct driver information

## Troubleshooting

### Location Not Updating
- Check location permission is granted
- Verify driver role is set correctly
- Check mobile app console for errors
- Verify backend endpoint is accessible

### Markers Not Appearing on Map
- Verify drivers have valid `latitude` and `longitude`
- Check `last_location_update` is recent (< 5 minutes)
- Verify map is loading correctly
- Check browser console for errors

### Permission Denied
- User must grant location permission to use app
- On iOS, may need background location permission for continuous tracking
- Check device location services are enabled

## Security Considerations

1. **Authentication**: All location endpoints require authentication
2. **Authorization**: Drivers can only update their own location
3. **Data Privacy**: Location data stored securely in database
4. **Access Control**: Dashboard location viewing requires appropriate permissions

## Performance Considerations

1. **Update Frequency**: 10-second minimum prevents excessive API calls
2. **Distance Threshold**: 10-meter minimum reduces unnecessary updates
3. **Database Indexing**: Ensure indexes on `driver_id` and `timestamp` in `driver_locations`
4. **Map Rendering**: Limit number of markers displayed simultaneously

## Files Modified

### Mobile App
- `mobile/services/locationTracking.ts` (new)
- `mobile/services/api.ts` (added `updateDriverLocation` method)
- `mobile/contexts/AuthContext.tsx` (integrated location tracking)

### Backend
- `server/routes/mobile.ts` (added location endpoint and profile endpoint)
- `server/minimal-supabase.ts` (updated `getAllDrivers` to include locations)

### Dashboard
- `client/src/components/dashboard/InteractiveMapWidget.tsx` (already supports location data)

## Future Enhancements

1. **Location History**: Store and display location history for trips
2. **Geofencing**: Alert when drivers enter/exit specific areas
3. **Route Optimization**: Use location data for route planning
4. **Analytics**: Track driver movement patterns and efficiency
5. **Offline Support**: Queue location updates when offline, sync when online

