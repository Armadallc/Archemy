# Trip Status Validation Testing Guide

## ✅ Implementation Summary

Status transition validation and automatic timestamp tracking have been implemented. All status update endpoints now validate transitions before updating.

---

## 🧪 Testing Locations

### **Option 1: Web App - Trips Management Page**
**Where**: Navigate to `/trips` (or trips management page where trips are displayed)

**How to Test**:
1. Open a trip card/detail view
2. Look for status update buttons (will show next valid statuses only)
3. Try to update status - valid transitions should work, invalid ones should show error

**Components Used**:
- `TripStatusManager` component (if visible)
- Trip detail/edit views

### **Option 2: Direct API Testing (Recommended for Validation Testing)**

You can test directly using curl or browser console:

```javascript
// In browser console (on localhost:5173 while logged in):
// Get a trip ID first
const trips = await fetch('http://localhost:8081/api/trips').then(r => r.json());
const testTrip = trips[0];

// Test 1: Valid transition (scheduled → confirmed)
fetch(`http://localhost:8081/api/trips/${testTrip.id}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'your-token-here'}`
  },
  body: JSON.stringify({ status: 'confirmed' })
}).then(r => r.json()).then(console.log);

// Test 2: Invalid transition (try completed → scheduled)
// This should fail with 400 error
fetch(`http://localhost:8081/api/trips/${testTrip.id}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'your-token-here'}`
  },
  body: JSON.stringify({ status: 'scheduled' })
}).then(r => r.json()).then(console.log);
```

### **Option 3: Create a Test Script**

Create a simple test script to validate transitions.

---

## 📋 Test Cases to Verify

### ✅ Valid Transitions (Should Work)

1. **scheduled → confirmed**
   - Should succeed
   - No automatic timestamps

2. **confirmed → in_progress**
   - Should succeed
   - Should automatically set `actual_pickup_time`

3. **in_progress → completed**
   - Should succeed
   - Should automatically set `actual_dropoff_time`
   - For round trips: should also set `actual_return_time`

4. **Any status → cancelled** (from scheduled, confirmed, or in_progress)
   - Should succeed
   - No automatic timestamps

### ❌ Invalid Transitions (Should Fail with 400 Error)

1. **completed → scheduled**
   - Should return: `"Invalid status transition: Cannot transition from 'completed' to 'scheduled'"`

2. **completed → in_progress**
   - Should return: `"Invalid status transition: Cannot transition from 'completed' to 'in_progress'"`

3. **cancelled → confirmed**
   - Should return: `"Invalid status transition: Cannot transition from 'cancelled' to 'confirmed'"`

4. **scheduled → completed** (skipping confirmed and in_progress)
   - Should return: `"Invalid status transition: Cannot transition from 'scheduled' to 'completed'"`

### 🔍 Timestamp Verification

After a valid status update, check the trip record to verify:

1. **Status changed to `in_progress`**:
   - Check: `actual_pickup_time` should be set automatically

2. **Status changed to `completed`**:
   - Check: `actual_dropoff_time` should be set automatically
   - For round trips: `actual_return_time` should also be set

3. **Manual timestamps** (if provided):
   - Manual `actualTimes.pickup` should override auto-set time
   - Manual `actualTimes.dropoff` should override auto-set time

### 📝 Status Change Logging

After each status update, verify:
- Entry created in `trip_status_logs` table (if table exists)
- Log entry includes: `previous_status`, `status`, `changed_by`, `timestamp`

---

## 🚀 Quick Test Commands

### Using curl (from terminal)

```bash
# 1. Get your auth token (from browser console or Supabase)
TOKEN="your-jwt-token-here"
TRIP_ID="your-trip-id-here"

# 2. Test valid transition
curl -X PATCH "http://localhost:8081/api/trips/$TRIP_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "confirmed"}'

# 3. Test invalid transition (should fail)
curl -X PATCH "http://localhost:8081/api/trips/$TRIP_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "scheduled"}' \
  -v
```

---

## 🔧 Endpoints Updated

All these endpoints now use validated status updates:

1. ✅ `PATCH /api/trips/:id` - Generic update (validates if status is in body)
2. ✅ `PATCH /api/enhanced-trips/:id/status` - Status-specific endpoint
3. ✅ `PATCH /api/mobile/trips/:tripId/status` - Mobile API endpoint
4. ✅ `PATCH /routes/trips/:id` - Alternative trips route

---

## 📊 Expected Behavior

### Success Response (200)
```json
{
  "id": "trip_123",
  "status": "confirmed",
  "actual_pickup_time": null,
  "actual_dropoff_time": null,
  "updated_at": "2025-11-02T...",
  ...
}
```

### Validation Error Response (400)
```json
{
  "message": "Invalid status transition: Cannot transition from 'completed' to 'scheduled'. Allowed transitions: ",
  "error": "VALIDATION_ERROR"
}
```

---

## 🎯 Next Steps After Testing

1. Verify all test cases pass
2. Check timestamp auto-population works correctly
3. Verify status logging is working
4. Test with real UI components if possible
5. Document any edge cases found

---

*Last Updated: November 2, 2025*

