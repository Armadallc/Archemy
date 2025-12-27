# Manual Deployment Steps

The deploy script requires "APPROVED" in the commit message. Run these commands manually:

## Step 1: Add All Files

```bash
# Add new files
git add migrations/0053_add_trip_mileage_tracking.sql
git add migrations/0054_add_trip_id_to_driver_locations.sql
git add server/services/mileage-service.ts
git add mobile/services/locationTracking.ts
git add DEPLOYMENT_CHECKLIST.md

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
git add mobile/app/\(tabs\)/trip-details.tsx
git add mobile/app/\(tabs\)/profile.tsx
git add mobile/contexts/AuthContext.tsx
git add mobile/services/api.ts
git add mobile/services/websocket.ts
```

## Step 2: Commit with APPROVED

```bash
git commit -m "APPROVED: feat: Add trip mileage tracking and location tracking features

- Add pre-trip mileage estimation and post-trip actual mileage calculation
- Link location tracking to trips for accurate mileage tracking
- Real-time driver locations on fleet map with WebSocket updates
- Mobile app location tracking with trip linking
- Calendar scrollable trips enhancement
- Program scoping for frequent locations in trip creation

Database migrations required:
- migrations/0053_add_trip_mileage_tracking.sql
- migrations/0054_add_trip_id_to_driver_locations.sql"
```

## Step 3: Merge to Main

```bash
git checkout main
git pull origin main
git merge feature/contract-analysis
git push origin main
```

## Step 4: Run Database Migrations on Render.com

**⚠️ CRITICAL: Run these BEFORE deployment completes**

1. Go to Render.com dashboard
2. Navigate to your PostgreSQL database
3. Open "Shell" or "Connect"
4. Run these SQL files in order:

```sql
-- Migration 1: Trip Mileage Tracking
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS estimated_distance_miles DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS actual_distance_miles DECIMAL(10, 2);

CREATE INDEX IF NOT EXISTS idx_trips_estimated_distance ON trips(estimated_distance_miles) WHERE estimated_distance_miles IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trips_actual_distance ON trips(actual_distance_miles) WHERE actual_distance_miles IS NOT NULL;

-- Migration 2: Link Location Tracking to Trips
ALTER TABLE driver_locations 
ADD COLUMN IF NOT EXISTS trip_id VARCHAR(50) REFERENCES trips(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_driver_locations_trip_id ON driver_locations(trip_id) WHERE trip_id IS NOT NULL;
```

## Step 5: Verify Deployment

After Render.com deployment completes, test:
- Mobile app location permissions
- Driver locations on fleet map
- Trip status updates
- Mileage calculation

See DEPLOYMENT_CHECKLIST.md for full testing checklist.

