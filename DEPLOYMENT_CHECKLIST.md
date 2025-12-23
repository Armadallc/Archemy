# Deployment Checklist - Trip Tracking & Location Features

## Date: December 18, 2024
## Features to Deploy:
1. ✅ Trip mileage tracking (pre-trip estimation & post-trip actual calculation)
2. ✅ Location tracking in fleet map (real-time driver locations)
3. ✅ Mobile app location tracking integration
4. ✅ Trip status updates with mileage calculation
5. ✅ Calendar scrollable trips enhancement

---

## Pre-Deployment Steps

### 1. Database Migrations (CRITICAL - Run First!)

**⚠️ IMPORTANT:** These migrations must be run on Render.com's database BEFORE deploying the code.

#### Migration 1: Trip Mileage Tracking
```sql
-- File: migrations/0053_add_trip_mileage_tracking.sql
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS estimated_distance_miles DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS actual_distance_miles DECIMAL(10, 2);

CREATE INDEX IF NOT EXISTS idx_trips_estimated_distance ON trips(estimated_distance_miles) WHERE estimated_distance_miles IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trips_actual_distance ON trips(actual_distance_miles) WHERE actual_distance_miles IS NOT NULL;
```

#### Migration 2: Link Location Tracking to Trips
```sql
-- File: migrations/0054_add_trip_id_to_driver_locations.sql
ALTER TABLE driver_locations 
ADD COLUMN IF NOT EXISTS trip_id VARCHAR(50) REFERENCES trips(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_driver_locations_trip_id ON driver_locations(trip_id) WHERE trip_id IS NOT NULL;
```

**How to Run on Render.com:**
1. Go to Render.com dashboard
2. Navigate to your PostgreSQL database
3. Open the "Shell" or "Connect" option
4. Run each migration SQL file in order

---

### 2. Code Changes Summary

#### Backend Changes:
- ✅ `server/services/mileage-service.ts` (NEW) - Mileage calculation service
- ✅ `server/enhanced-trips-storage.ts` - Trip status updates with mileage calculation
- ✅ `server/mobile-api.ts` - Location tracking with trip_id linking
- ✅ `server/routes/mobile.ts` - Mobile API endpoints for location updates
- ✅ `server/routes/legacy.ts` - Frequent locations POST endpoint

#### Frontend Changes:
- ✅ `client/src/components/dashboard/InteractiveMapWidget.tsx` - Real-time driver locations on fleet map
- ✅ `client/src/components/EnhancedTripCalendar.tsx` - Scrollable trips in calendar
- ✅ `client/src/components/booking/quick-add-location.tsx` - Program scoping for frequent locations
- ✅ `client/src/components/booking/simple-booking-form.tsx` - Pass program context to location form

#### Mobile App Changes:
- ✅ `mobile/services/locationTracking.ts` (NEW) - Continuous location tracking service
- ✅ `mobile/app.json` - Location permissions configuration
- ✅ `mobile/app/(tabs)/trip-details.tsx` - Link location tracking to trips
- ✅ `mobile/app/(tabs)/profile.tsx` - Manual location tracking trigger
- ✅ `mobile/contexts/AuthContext.tsx` - Auto-initialize location tracking for drivers
- ✅ `mobile/services/api.ts` - Location update API with trip_id support
- ✅ `mobile/services/websocket.ts` - Handle driver_update messages

---

## Deployment Steps

### Step 1: Commit Changes
```bash
# Add all new files
git add migrations/0053_add_trip_mileage_tracking.sql
git add migrations/0054_add_trip_id_to_driver_locations.sql
git add server/services/mileage-service.ts
git add mobile/services/locationTracking.ts

# Add modified files
git add client/src/components/dashboard/InteractiveMapWidget.tsx
git add client/src/components/EnhancedTripCalendar.tsx
git add client/src/components/booking/quick-add-location.tsx
git add client/src/components/booking/simple-booking-form.tsx
git add server/enhanced-trips-storage.ts
git add server/mobile-api.ts
git add server/routes/mobile.ts
git add server/routes/legacy.ts
git add mobile/app.json
git add mobile/app/(tabs)/trip-details.tsx
git add mobile/app/(tabs)/profile.tsx
git add mobile/contexts/AuthContext.tsx
git add mobile/services/api.ts
git add mobile/services/websocket.ts

# Commit
git commit -m "feat: Add trip mileage tracking and location tracking features

- Add pre-trip mileage estimation and post-trip actual mileage calculation
- Link location tracking to trips for accurate mileage tracking
- Real-time driver locations on fleet map with WebSocket updates
- Mobile app location tracking with trip linking
- Calendar scrollable trips enhancement
- Program scoping for frequent locations in trip creation"
```

### Step 2: Merge to Main Branch
```bash
# Switch to main branch
git checkout main
git pull origin main

# Merge feature branch
git merge feature/contract-analysis

# Push to main (this will trigger Render.com deployment)
git push origin main
```

### Step 3: Run Database Migrations on Render.com
**⚠️ DO THIS BEFORE THE DEPLOYMENT COMPLETES**

1. Connect to Render.com PostgreSQL database
2. Run `migrations/0053_add_trip_mileage_tracking.sql`
3. Run `migrations/0054_add_trip_id_to_driver_locations.sql`

### Step 4: Verify Deployment
After Render.com deployment completes:

1. **Backend Health Check:**
   - Test: `GET /api/health`
   - Test: `GET /api/mobile/test`

2. **Location Tracking:**
   - Mobile app should request location permissions
   - Driver locations should appear on fleet map
   - Location updates should be linked to active trips

3. **Trip Mileage:**
   - Create a new trip
   - Start trip (should calculate estimated mileage)
   - Complete trip (should calculate actual mileage from location tracking)

4. **Calendar:**
   - Days with >3 trips should be scrollable
   - "See More" indicator should appear

---

## Rollback Plan (If Needed)

If issues occur after deployment:

1. **Database Rollback:**
   ```sql
   -- Remove mileage columns (if needed)
   ALTER TABLE trips DROP COLUMN IF EXISTS estimated_distance_miles;
   ALTER TABLE trips DROP COLUMN IF EXISTS actual_distance_miles;
   
   -- Remove trip_id from driver_locations (if needed)
   ALTER TABLE driver_locations DROP COLUMN IF EXISTS trip_id;
   ```

2. **Code Rollback:**
   - Revert to previous commit on main branch
   - Push to trigger new deployment

---

## Post-Deployment Testing

### Mobile App Testing:
- [ ] Location permissions prompt appears
- [ ] Location tracking starts automatically for drivers
- [ ] Location updates appear on fleet map
- [ ] Trip status updates work (start/complete)
- [ ] Mileage is calculated when trip starts
- [ ] Actual mileage is calculated when trip completes

### Dashboard Testing:
- [ ] Fleet map shows driver locations in real-time
- [ ] Driver icons update with status colors
- [ ] Calendar trips are scrollable
- [ ] "See More" indicator appears for days with >3 trips

### Backend Testing:
- [ ] `/api/mobile/driver/profile` endpoint works
- [ ] `/api/mobile/driver/:driverId/location` endpoint accepts trip_id
- [ ] Trip status updates calculate mileage
- [ ] Location updates are linked to trips

---

## Notes

- Location tracking requires location permissions on mobile devices
- Mileage calculation requires location data during trip (may be null if insufficient data)
- Estimated mileage uses address geocoding (may be null if addresses can't be geocoded)
- All features are backward compatible (existing trips will have null mileage until updated)

