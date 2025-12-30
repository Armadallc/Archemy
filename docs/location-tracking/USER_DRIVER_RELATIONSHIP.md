# User and Driver Record Relationship

## Overview

In the HALCYON system, drivers have **two separate records** that are linked together:

1. **User Record** (`users` table) - Authentication and user account
2. **Driver Record** (`drivers` table) - Driver-specific information

These are **NOT the same record** - they are separate entities that reference each other.

## Record Structure

### User Record (`users` table)
- **Primary Key**: `user_id` (e.g., `driver_monarch_1758946085589`)
- **Display ID**: `MM-DRV-001` (user-level display ID, role-based format)
- **Purpose**: Authentication, login, user account management
- **Role**: `'driver'` (indicates this user is a driver)

### Driver Record (`drivers` table)
- **Primary Key**: `id` (e.g., `driver_monarch_1758946085589`)
- **Foreign Key**: `user_id` (references `users.user_id`)
- **Display ID**: `DRV-MM-001` (driver entity display ID, different format)
- **Purpose**: Driver-specific data (license, vehicle, availability, location tracking)

## How They're Linked

The `drivers.user_id` field links to `users.user_id`:

```sql
users.user_id = 'driver_monarch_1758946085589'
drivers.user_id = 'driver_monarch_1758946085589'  -- References users.user_id
drivers.id = 'driver_monarch_1758946085589'       -- Driver's own ID
```

**Important**: The `drivers.id` and `drivers.user_id` can be the same value, but they serve different purposes:
- `drivers.id` = The driver record's primary key
- `drivers.user_id` = Foreign key linking to the user record

## Why Different Display IDs?

Display IDs serve different purposes:

1. **User Display ID** (`MM-DRV-001`):
   - Format: `[TENANT]-[ROLE]-[SEQ]`
   - Used for user identification across the system
   - Based on user's role (DRV = driver role)

2. **Driver Display ID** (`DRV-MM-001`):
   - Format: `DRV-[TENANT]-[SEQ]`
   - Used specifically for driver entity identification
   - Follows driver-specific naming convention

This is **intentional** and **correct** - they are different entities with different display ID systems.

## Location Tracking Flow

When a driver logs in and enables location tracking:

1. **Login**: User authenticates with `user_id = driver_monarch_1758946085589`
2. **Lookup**: System looks up driver record where `drivers.user_id = driver_monarch_1758946085589`
3. **Driver ID Found**: `drivers.id = driver_monarch_1758946085589`
4. **Location Tracking**: Uses `drivers.id` for all location updates

### Code Flow

```typescript
// 1. User logs in
const userId = 'driver_monarch_1758946085589'; // From users table

// 2. Location tracking initialized
locationTrackingService.initialize(userId);

// 3. Lookup driver by user_id
const driver = await supabase
  .from('drivers')
  .select('id')
  .eq('user_id', userId)  // Lookup by user_id
  .single();

// 4. Get driver ID
const driverId = driver.id; // 'driver_monarch_1758946085589'

// 5. Use driverId for location updates
await apiClient.updateDriverLocation(driverId, locationData);
```

## Common Issues

### Issue 1: Driver Record Not Found

**Symptom**: Location tracking fails with "No driver record found for user"

**Cause**: Driver record doesn't exist or `drivers.user_id` doesn't match `users.user_id`

**Check**:
```sql
-- Verify driver record exists
SELECT * FROM drivers WHERE user_id = 'driver_monarch_1758946085589';

-- If no results, driver record is missing
```

**Fix**: The system should auto-create driver records, but if it doesn't:
```sql
INSERT INTO drivers (id, user_id, program_id, is_active, is_available)
VALUES (
  'driver_monarch_1758946085589',
  'driver_monarch_1758946085589',
  'monarch_competency',
  true,
  true
);
```

### Issue 2: Mismatched IDs

**Symptom**: Driver record exists but lookup fails

**Cause**: `drivers.user_id` doesn't match `users.user_id`

**Check**:
```sql
-- Compare user_id values
SELECT 
  u.user_id as user_user_id,
  d.user_id as driver_user_id,
  d.id as driver_id
FROM users u
LEFT JOIN drivers d ON u.user_id = d.user_id
WHERE u.user_id = 'driver_monarch_1758946085589';
```

**Fix**: Update driver record to match:
```sql
UPDATE drivers 
SET user_id = 'driver_monarch_1758946085589'
WHERE id = 'driver_monarch_1758946085589';
```

### Issue 3: Location Not Updating

**Symptom**: Location appears but doesn't update

**Cause**: Usually `is_available = false` or location updates not being sent

**Check**:
```sql
-- Check availability
SELECT id, name, is_available FROM drivers WHERE id = 'driver_monarch_1758946085589';

-- Check if locations are being stored
SELECT * FROM driver_locations 
WHERE driver_id = 'driver_monarch_1758946085589' 
ORDER BY timestamp DESC 
LIMIT 5;
```

**Fix**: 
- Set `is_available = true` in database
- Toggle "Available" ON in mobile app
- Check mobile app logs for location update errors

## Verification Queries

### Check User-Driver Link
```sql
SELECT 
  u.user_id,
  u.user_name,
  u.role,
  u.display_id as user_display_id,
  d.id as driver_id,
  d.user_id as driver_user_id,
  d.is_available,
  d.display_id as driver_display_id
FROM users u
LEFT JOIN drivers d ON u.user_id = d.user_id
WHERE u.user_id = 'driver_monarch_1758946085589';
```

### Check Location Tracking Status
```sql
SELECT 
  d.id,
  d.name,
  d.is_available,
  dl.latitude,
  dl.longitude,
  dl.timestamp,
  dl.is_active
FROM drivers d
LEFT JOIN driver_locations dl ON d.id = dl.driver_id AND dl.is_active = true
WHERE d.id = 'driver_monarch_1758946085589';
```

## Summary

- ✅ User and Driver records are **separate entities** (this is correct)
- ✅ They are linked via `drivers.user_id = users.user_id`
- ✅ Different display IDs are **expected and correct**
- ✅ Location tracking uses `drivers.id` (not `users.user_id`)
- ⚠️ If location tracking fails, check:
  1. Driver record exists
  2. `drivers.user_id` matches `users.user_id`
  3. `drivers.is_available = true`
  4. Location updates are being sent from mobile app

## Your Specific Case

For driver `driver_monarch_1758946085589`:

- ✅ User record exists: `users.user_id = driver_monarch_1758946085589`
- ✅ Driver record exists: `drivers.id = driver_monarch_1758946085589`
- ✅ Records are linked: `drivers.user_id = driver_monarch_1758946085589`
- ✅ `is_available = true` in drivers table
- ✅ Different display IDs are correct:
  - User: `MM-DRV-001`
  - Driver: `DRV-MM-001`

**Everything looks correct!** If location tracking still isn't working, the issue is likely:
1. Location updates not being sent from mobile app
2. Location updates failing to reach the server
3. Map not refreshing to show new locations

Use the diagnostic script to check:
```bash
node server/scripts/diagnose-location-tracking.js driver_monarch_1758946085589
```



