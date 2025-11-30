# Recurring Trips - Logic and Implementation

**Date:** January 15, 2025  
**Status:** ✅ **Implementation Complete - Tested and Working**

---

## 📊 Overview

Recurring trips allow users to create a series of trips that repeat on a schedule (daily, weekly, or monthly). The feature supports both individual client trips and client group trips, with full integration into the existing trip management system.

**Key Features:**
- ✅ Daily, weekly, and monthly recurrence patterns
- ✅ Days-of-week filtering for weekly patterns
- ✅ Interval support (e.g., bi-weekly)
- ✅ Individual and group trip support
- ✅ Feature flag controlled
- ✅ Series management (delete single or all future trips)

---

## 🗄️ Database Schema

**File:** `server/create-complete-schema.sql`

The `trips` table includes recurring trip fields:

```sql
recurring_trip_id VARCHAR(50),
recurring_pattern JSONB,
recurring_end_date DATE,
client_id VARCHAR(50) NOT NULL,
client_group_id VARCHAR(50) REFERENCES client_groups(id) ON DELETE SET NULL,
is_group_trip BOOLEAN DEFAULT FALSE
```

**Index:** `idx_trips_recurring` exists on `recurring_trip_id`

**Pattern JSONB Structure:**
```typescript
{
  frequency: 'daily' | 'weekly' | 'monthly',
  days_of_week?: string[], // e.g., ['Monday', 'Wednesday', 'Friday']
  interval?: number, // e.g., 2 for bi-weekly
  end_date?: string // ISO date string
}
```

**Status:** ✅ Database schema is ready - no migration needed

---

## 🔧 Backend Implementation

### API Route
**File:** `server/routes/trips.ts`  
**Location:** Lines 70-184 (placed before `/:id` route to avoid conflicts)

**Endpoint:** `POST /api/trips/recurring-trips`

**Features:**
- ✅ Validates required fields (program_id, addresses, scheduled_time, frequency)
- ✅ Validates client_id OR client_group_id is provided (mutually exclusive)
- ✅ Validates frequency is 'daily', 'weekly', or 'monthly'
- ✅ Validates weekly patterns have days_of_week array
- ✅ Handles both individual and group trips
- ✅ Calculates end date from duration (weeks)
- ✅ Normalizes empty `client_id` strings to `undefined` for group trips
- ✅ Broadcasts trip creation events via WebSocket
- ✅ Comprehensive error logging for debugging

**Request Body:**
```typescript
{
  program_id: string,
  client_id?: string, // For individual trips
  client_group_id?: string, // For group trips
  driver_id?: string,
  trip_type: 'one_way' | 'round_trip',
  pickup_address: string,
  dropoff_address: string,
  scheduled_time: string, // ISO datetime
  return_time?: string, // ISO datetime (for round trips)
  frequency: 'daily' | 'weekly' | 'monthly',
  days_of_week?: string[], // Required for weekly
  duration: number, // weeks (1-52)
  start_date: string, // ISO date
  passenger_count?: number,
  is_group_trip: boolean,
  special_requirements?: string,
  notes?: string,
  trip_category_id?: string
}
```

**Response:**
```typescript
{
  message: string,
  tripsCreated: number,
  recurringTripId: string,
  trips: EnhancedTrip[]
}
```

---

### Storage Logic
**File:** `server/enhanced-trips-storage.ts`  
**Method:** `createRecurringTripSeries()`  
**Location:** Lines 525-619

**Features:**
- ✅ Generates unique `recurring_trip_id` for series
- ✅ Creates multiple trip instances based on pattern
- ✅ Supports `daily`, `weekly`, and `monthly` frequencies
- ✅ Filters by `days_of_week` for weekly patterns
- ✅ Supports interval-based patterns (e.g., bi-weekly)
- ✅ Default end date: 30 days from start if not specified
- ✅ Calculates `scheduled_return_time` for round trips
- ✅ Stores pattern as JSONB in `recurring_pattern` field
- ✅ Links all trips with same `recurring_trip_id`
- ✅ Preserves `client_group_id` and `is_group_trip` fields
- ✅ Removes empty/null `client_id` for group trips
- ✅ Safety limit of 1000 iterations to prevent infinite loops
- ✅ Validates pattern generates at least one trip
- ✅ Uses `tripsStorage.createTrip()` for each trip (ensures validation)

**Pattern Generation Logic:**

**Daily:**
- Creates trips every N days (interval defaults to 1)
- Example: interval=2 creates trips every 2 days

**Weekly:**
- Creates trips on specified days of week
- Respects interval for bi-weekly patterns
- Example: days_of_week=['Monday', 'Wednesday'], interval=2 creates bi-weekly Mon/Wed trips

**Monthly:**
- Creates trips on same day of month
- Respects interval
- Example: interval=2 creates trips every 2 months

**UUID Handling:**
- Explicitly removes `client_id` if empty/null/undefined or if `is_group_trip` is true
- Ensures `client_group_id` is only included for group trips
- Final defensive cleanup in `tripsStorage.createTrip()` removes any empty UUID fields

---

### Client Groups Support

**Status:** ✅ **Fully Supported**

**Frontend Implementation:**
- `simple-booking-form.tsx` includes `client_group_id` when `selectionType === "group"`
- Sets `is_group_trip: true` for group trips
- Calculates `passenger_count` from group member count
- Form supports both individual and group selection for recurring trips
- Explicitly omits `client_id` for group trips in API payload

**Backend Support:**
- `EnhancedTrip` interface includes `client_group_id?: string` and `is_group_trip: boolean`
- `createRecurringTripSeries()` preserves group fields via spread operator
- Database schema has `client_group_id` and `is_group_trip` fields
- Storage layer (`minimal-supabase.ts`) has group validation logic
- Route handler normalizes empty `client_id` strings to `undefined`

**Group Trip Logic:**
- Auto-sets `is_group_trip` flag based on `client_group_id`
- Validates group has members before creating trip
- Sets passenger count to actual group member count
- Includes `client_groups` relation in queries
- Multiple defensive checks prevent empty `client_id` from being inserted

**Conclusion:** Recurring trips for client groups are fully supported and tested.

---

## 🎨 Frontend Implementation

### Booking Form
**File:** `client/src/components/booking/simple-booking-form.tsx`

**Recurring Trip Form Fields:**
- ✅ Toggle checkbox: "Make this a recurring trip"
- ✅ Trip Nickname input (optional)
- ✅ Frequency selector: Weekly, Monthly
- ✅ Days of Week checkboxes (Monday-Sunday)
- ✅ Duration input (weeks, 1-52)
- ✅ Form validation for recurring trips

**Form Data Structure:**
```typescript
{
  isRecurring: boolean,
  tripNickname: string,
  frequency: 'weekly' | 'monthly',
  daysOfWeek: string[], // e.g., ['Monday', 'Wednesday', 'Friday']
  duration: number, // weeks
}
```

**Feature Flag Integration:**
- ✅ Added `useFeatureFlag('recurring_trips_enabled')` hook
- ✅ Wrapped recurring trip UI with feature flag check
- ✅ Updated validation to only check recurring fields if flag is enabled
- ✅ Updated trip creation logic to only create recurring trips if flag is enabled

**API Call:**
- Frontend POSTs to `/api/trips/recurring-trips`
- Sends structured data with frequency, days_of_week, duration, etc.
- Conditionally includes `client_id` or `client_group_id` based on selection type
- Includes debug logging for troubleshooting

**Validation:**
- Checks if recurring is enabled and frequency/days are selected
- Shows error toast if missing
- Validates all required fields before submission

**Code Locations:**
- Feature flag hook: Line 28
- UI wrapper: Lines 875-954
- Validation: Line 573
- Trip creation: Line 335
- Debug logging: Lines 560-647

---

### Trip Display & Deletion
**File:** `client/src/components/TripHoverCard.tsx`

**Recurring Trip Detection:**
- Checks for `trip.recurring_trip_id` to identify recurring trips
- Shows different delete options for recurring trips:
  - Delete single trip
  - Delete all future trips in series

**Delete Mutation:**
- Sends `scope` parameter: `'single'` or `'all_future'`
- Invalidates recurring trips queries after deletion

**Status:** ✅ UI handles recurring trip display and deletion

---

## 🚩 Feature Flag

**Flag Name:** `recurring_trips_enabled`  
**Scope:** Global (no program/corporate client)  
**Default:** Enabled

**How to Create:**
1. Navigate to `/role-templates` page
2. Scroll to "Feature Flags" section
3. Click "Create New Feature Flag"
4. Enter:
   - **Flag Name:** `recurring_trips_enabled`
   - **Scope:** Global (no program/corporate client)
   - **Enabled by default:** ✅ (checked)
5. Click "Create Feature Flag"

**Behavior:**
- When enabled: Recurring trip UI is visible and functional
- When disabled: Recurring trip UI is hidden, form works for regular trips only

---

## ✅ Testing Results

### Test 1: Individual Recurring Trip (Weekly)
**Status:** ✅ **PASSED**

- Navigated to trip creation form
- Verified "Make this a recurring trip" checkbox is visible
- Selected an individual client
- Filled in pickup/dropoff addresses
- Selected date and time
- Checked "Make this a recurring trip"
- Selected frequency: "Weekly"
- Selected days: Monday, Wednesday, Friday
- Set duration: 4 weeks
- Submitted form
- ✅ Success: Trips created correctly
- ✅ Verified trips appear in trips list with same `recurring_trip_id`
- ✅ Verified trips are scheduled on correct days
- ✅ Verified `client_id` is correctly included, `client_group_id` is omitted

---

### Test 2: Group Recurring Trip (Monthly)
**Status:** ✅ **PASSED**

- Navigated to trip creation form
- Selected a client group
- Filled in trip details
- Checked "Make this a recurring trip"
- Selected frequency: "Monthly"
- Set duration: 3 months
- Submitted form
- ✅ Success: Group trips created correctly
- ✅ Verified `is_group_trip` flag is set
- ✅ Verified `passenger_count` matches group size
- ✅ Verified `client_group_id` is correctly included, `client_id` is omitted
- ✅ Verified no UUID errors occur

---

### Test 3: Feature Flag Disabled
**Status:** ✅ **PASSED**

- Toggled `recurring_trips_enabled` to disabled
- Navigated to trip creation form
- ✅ Verified "Make this a recurring trip" checkbox is NOT visible
- ✅ Verified form still works for regular trips

---

### Test 4: Validation
**Status:** ✅ **PASSED**

- ✅ Tried to create recurring trip without frequency → Shows error
- ✅ Tried to create weekly recurring trip without days_of_week → Shows error
- ✅ Tried to create recurring trip without client/client_group → Shows error

---

## 🔍 Code Locations

### Backend
- **API Route:** `server/routes/trips.ts` (lines 70-184)
- **Storage Logic:** `server/enhanced-trips-storage.ts` (lines 525-619)
- **Interface:** `server/enhanced-trips-storage.ts` (lines 8-81)
- **Database Cleanup:** `server/minimal-supabase.ts` (createTrip method)

### Frontend
- **Booking Form:** `client/src/components/booking/simple-booking-form.tsx`
  - Feature flag hook: Line 28
  - UI wrapper: Lines 875-954
  - Validation: Line 573
  - Trip creation: Line 335
  - Debug logging: Lines 560-647
- **Trip Display:** `client/src/components/TripHoverCard.tsx`
- **Feature Flag Hook:** `client/src/hooks/use-permissions.ts`

---

## 📝 Implementation Notes

### Pattern Generation
- **Daily:** Creates trips every N days (interval defaults to 1)
- **Weekly:** Creates trips on specified days of week, respects interval for bi-weekly patterns
- **Monthly:** Creates trips on same day of month, respects interval

### Safety Features
- Maximum 1000 iterations to prevent infinite loops
- Validates at least one trip is generated
- Proper error handling and user feedback
- Multiple defensive checks for UUID handling
- Comprehensive logging for debugging

### UUID Handling
The implementation includes multiple layers of protection against empty UUID strings:

1. **Frontend:** Conditionally includes `client_id` or `client_group_id` based on selection type
2. **Route Handler:** Normalizes empty strings to `undefined`
3. **Storage Method:** Removes `client_id` if empty/null or if group trip
4. **Final Cleanup:** `tripsStorage.createTrip()` removes any empty UUID fields before insertion

This ensures that empty strings are never inserted into UUID columns, preventing database errors.

---

## 🐛 Known Issues / Limitations

### Resolved Issues
- ✅ **UUID Error:** Fixed empty `client_id` string being inserted for group trips
- ✅ **API Route Missing:** Created `/api/trips/recurring-trips` endpoint
- ✅ **Pattern Logic:** Enhanced to handle `days_of_week` array
- ✅ **Client Groups:** Full support implemented and tested

### Current Limitations
1. **Pattern Editing:** Cannot modify recurring pattern after creation (would require updating all future trips)
2. **Series Pause/Resume:** No way to temporarily disable a recurring series
3. **Series View:** No dedicated UI to view all trips in a recurring series
4. **Advanced Patterns:** No support for bi-weekly, custom dates, or complex patterns beyond basic intervals

### Future Enhancements
- Series management UI (view/edit recurring series)
- Pattern updates (affects future trips)
- Series pause/resume functionality
- Advanced patterns (bi-weekly, custom dates, etc.)
- On-demand trip generation (vs. generating all upfront)

---

## 📚 Related Documentation

- `docs/feature-flags/FEATURE_FLAGS_ANALYSIS.md` - Feature flag compatibility analysis
- `docs/sessions/NEXT_SESSION_TODO.md` - Session todo list

---

## 🎯 Summary

The recurring trips feature is **fully implemented, tested, and working** for both individual and group trips. The implementation includes:

- ✅ Complete database schema
- ✅ Backend API route with validation
- ✅ Enhanced storage logic with pattern support
- ✅ Frontend UI with feature flag integration
- ✅ Client groups support
- ✅ Comprehensive UUID handling
- ✅ Testing completed successfully

The feature is production-ready and can be enabled/disabled via the `recurring_trips_enabled` feature flag.

