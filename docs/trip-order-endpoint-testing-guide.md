# Trip Order Endpoints - Testing Guide

**Date:** December 30, 2025

---

## 🧪 Manual Testing Guide

### Prerequisites

1. **Server Running**: Ensure your backend server is running on `http://localhost:8081`
2. **Authentication**: Get your auth token from:
   - Browser DevTools → Application → Local Storage → `sb-<project>-auth-token`
   - Or use the Supabase client to authenticate

### Test Endpoints

#### 1. Get Unassigned Orders

```bash
curl -X GET "http://localhost:8081/api/trips/orders/unassigned" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
[
  {
    "id": "trip_123",
    "status": "order",
    "driver_id": null,
    "decline_reason": null,
    ...
  }
]
```

#### 2. Confirm Trip Order

```bash
curl -X POST "http://localhost:8081/api/trips/TRIP_ID/confirm-order" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "message": "Trip order confirmed",
  "trips": [{ ... }],
  "isRecurring": false
}
```

**Note:** Requires driver role and the authenticated user must be the assigned driver.

#### 3. Decline Trip Order

```bash
curl -X POST "http://localhost:8081/api/trips/TRIP_ID/decline-order" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "conflict"
  }'
```

**Valid Reasons:**
- `conflict`
- `day_off`
- `unavailable`
- `vehicle_issue`
- `personal_emergency`
- `too_far`

**Expected Response:**
```json
{
  "message": "Trip order declined",
  "trip": {
    "id": "trip_123",
    "status": "order",
    "decline_reason": "conflict",
    "declined_by": "user_id",
    "declined_at": "2025-12-30T...",
    "driver_id": null
  }
}
```

#### 4. Update Trip Status (State Machine)

**Start Trip:**
```bash
curl -X POST "http://localhost:8081/api/trips/TRIP_ID/update-status" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start_trip",
    "client_aboard": true
  }'
```

**Expected Response:**
```json
{
  "message": "Trip status updated",
  "trip": { ... },
  "nextAction": "arrive",
  "buttonState": "Arrived"
}
```

**Arrive (Round Trip with Wait Time):**
```bash
curl -X POST "http://localhost:8081/api/trips/TRIP_ID/update-status" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "arrive",
    "start_wait_time": true
  }'
```

**Client Ready:**
```bash
curl -X POST "http://localhost:8081/api/trips/TRIP_ID/update-status" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "client_ready"
  }'
```

**Continue Trip:**
```bash
curl -X POST "http://localhost:8081/api/trips/TRIP_ID/update-status" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "continue_trip",
    "client_aboard": true
  }'
```

**Complete Trip:**
```bash
curl -X POST "http://localhost:8081/api/trips/TRIP_ID/update-status" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "complete_trip"
  }'
```

**No Show:**
```bash
curl -X POST "http://localhost:8081/api/trips/TRIP_ID/update-status" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "no_show"
  }'
```

---

## 🧪 Automated Testing

### Using the Test Script

1. **Set Environment Variables:**
   ```bash
   export VITE_SUPABASE_URL="your_supabase_url"
   export VITE_SUPABASE_ANON_KEY="your_anon_key"
   export TEST_EMAIL="admin@monarch.com"
   export TEST_PASSWORD="admin123"
   ```

2. **Run the Test Script:**
   ```bash
   node server/tests/test-trip-order-endpoints.js
   ```

### Test Scenarios

1. ✅ **Create trip** → Should default to 'order' status
2. ✅ **Get unassigned orders** → Should return trips with status 'order' and no driver
3. ✅ **Confirm order** → Should change status to 'scheduled'
4. ✅ **Decline order** → Should keep status as 'order', set decline fields
5. ✅ **Update status** → Should handle all state machine actions
6. ✅ **Invalid actions** → Should return 400 error

---

## 🔍 Testing Checklist

### Order Management
- [ ] Create trip → Verify status is 'order'
- [ ] Confirm order → Verify status changes to 'scheduled'
- [ ] Confirm recurring order → Verify all instances confirmed
- [ ] Decline order → Verify decline fields set
- [ ] Get unassigned orders → Verify correct trips returned

### Status Updates
- [ ] Start trip (client aboard) → Verify client_onboard_at set
- [ ] Start trip (no client) → Verify deadhead handled
- [ ] Arrive (round trip, wait time) → Verify wait_time_started_at set
- [ ] Client ready → Verify wait_time_stopped_at set
- [ ] Continue trip → Verify return trip handled
- [ ] Complete trip → Verify status 'completed'
- [ ] No show → Verify status 'no_show'

### Notifications
- [ ] Order confirmed → Verify notification sent to creator
- [ ] Order declined → Verify notification sent to super admins
- [ ] Status updates → Verify notifications sent to tagged users
- [ ] Check user preferences → Verify notifications respect preferences

### Error Handling
- [ ] Invalid action → Returns 400
- [ ] Missing required params → Returns 400 with nextPrompt
- [ ] Wrong driver → Returns 403
- [ ] Wrong status → Returns 400

---

## 📝 Postman Collection

You can import these endpoints into Postman for easier testing:

1. Create a new collection: "Trip Order Management"
2. Set collection variable: `baseUrl` = `http://localhost:8081`
3. Set collection variable: `authToken` = `YOUR_TOKEN`
4. Add authorization header: `Authorization: Bearer {{authToken}}`

### Endpoints to Add:

1. **GET** `/api/trips/orders/unassigned`
2. **POST** `/api/trips/:id/confirm-order`
3. **POST** `/api/trips/:id/decline-order`
4. **POST** `/api/trips/:id/update-status` (with different body variants)

---

## 🐛 Common Issues

### "User ID not found in session"
- **Solution**: Make sure you're authenticated and the token is valid

### "You are not assigned to this trip"
- **Solution**: Create a trip with the authenticated user as the driver, or test with a driver account

### "Cannot confirm trip. Current status is..."
- **Solution**: Make sure the trip status is 'order' before confirming

### "Valid decline reason is required"
- **Solution**: Use one of the 6 valid reason codes

---

**Last Updated:** December 30, 2025

