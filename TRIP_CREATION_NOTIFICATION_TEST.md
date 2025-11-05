# Trip Creation Notification Testing Guide

## 🎯 Testing Objectives

1. Verify trip creation notifications are broadcast via WebSocket
2. Verify web app receives and displays notifications correctly
3. Test hierarchical isolation (notifications only reach correct users)
4. Test with and without assigned driver

---

## 📋 Pre-Testing Checklist

- [ ] Backend server is running on port 8081
- [ ] Frontend dev server is running (Vite on port 5173)
- [ ] You are logged in as a user with trip creation permissions
- [ ] WebSocket connection shows as "connected" in browser console

---

## 🧪 Test Cases

### Test 1: Create Trip WITH Assigned Driver

**Steps:**
1. Navigate to Trips page or Booking form
2. Create a new trip with:
   - A client selected
   - A driver assigned
   - Pickup and dropoff locations
   - Scheduled time
3. Submit the trip creation

**Expected Results:**
- ✅ Server console shows WebSocket broadcast:
  ```
  📨 Broadcasting trip_created to driver: [driver_user_id]
  📨 Broadcasting trip_created to program: [program_id]
  ```
- ✅ Browser console shows:
  ```
  📨 WebSocket message received: { type: 'trip_created', data: {...} }
  ```
- ✅ Notification appears in notification center with:
  - Title: "New Trip Created"
  - Message: "A new trip has been created and assigned to a driver for [Client Name]"
  - Priority: High
  - Category: Trip

**How to Verify:**
- Check server terminal for broadcast logs
- Check browser console (F12) for WebSocket messages
- Open notification center (bell icon) and verify new notification

---

### Test 2: Create Trip WITHOUT Assigned Driver

**Steps:**
1. Navigate to Trips page or Booking form
2. Create a new trip with:
   - A client selected
   - NO driver assigned (leave driver field empty)
   - Pickup and dropoff locations
   - Scheduled time
3. Submit the trip creation

**Expected Results:**
- ✅ Server console shows WebSocket broadcast:
  ```
  📨 Broadcasting trip_created to program: [program_id]
  ```
- ✅ Browser console shows:
  ```
  📨 WebSocket message received: { type: 'trip_created', data: {...} }
  ```
- ✅ Notification appears in notification center with:
  - Title: "New Trip Created"
  - Message: "A new trip has been created for [Client Name]"
  - Priority: High
  - Category: Trip

**Note:** No driver-specific notification should be sent since no driver is assigned.

---

### Test 3: Hierarchical Isolation Test

**Prerequisites:**
- Two users logged in from different programs
- Or: One user with access to multiple programs

**Steps:**
1. As User A (Program 1), create a trip for Program 1
2. Check if User B (Program 2) receives the notification

**Expected Results:**
- ✅ User A receives notification (same program)
- ❌ User B does NOT receive notification (different program)
- ✅ Server logs show broadcasts are scoped to program_id

**How to Verify:**
- Have two browser windows/tabs open with different users
- Or test sequentially and verify notifications don't leak

---

### Test 4: Multiple Program Admins

**Prerequisites:**
- Multiple users with `program_admin` or `program_user` roles in the same program

**Steps:**
1. Create a trip in Program A
2. Verify all admins/users in Program A receive notifications

**Expected Results:**
- ✅ All users in the same program receive the notification
- ✅ Notification appears for each connected user

---

## 🔍 Debugging Tips

### If WebSocket Doesn't Connect:

1. **Check Server Logs:**
   ```
   Look for: "🔌 WebSocket server created successfully"
   Look for: "🔌 WebSocket verification started"
   ```

2. **Check Browser Console:**
   ```
   Look for: "🔌 Connecting to WebSocket: ws://localhost:8081/ws?token=..."
   Look for: "✅ WebSocket connected"
   ```

3. **Check Authentication:**
   - Verify user has `auth_user_id` or JWT token
   - Check token is passed in WebSocket URL query params

### If Notifications Don't Appear:

1. **Verify WebSocket Message:**
   ```javascript
   // In browser console, check if message is received:
   console.log('📨 WebSocket message received:', message);
   ```

2. **Verify Notification Handler:**
   - Check `EnhancedNotificationCenter.tsx` is handling `trip_created`
   - Verify `addNotification` is being called

3. **Check Server Broadcast:**
   - Look for "Broadcasting trip_created" in server logs
   - Verify `broadcastTripCreated` function is called

---

## 📊 Test Results Template

### Test 1: Trip WITH Driver
- [ ] Server broadcasted to driver
- [ ] Server broadcasted to program
- [ ] Browser received WebSocket message
- [ ] Notification appeared in UI
- [ ] Notification shows correct client name

### Test 2: Trip WITHOUT Driver
- [ ] Server broadcasted to program only
- [ ] Browser received WebSocket message
- [ ] Notification appeared in UI
- [ ] Notification doesn't mention driver assignment

### Test 3: Hierarchical Isolation
- [ ] User A (same program) received notification
- [ ] User B (different program) did NOT receive notification
- [ ] Server logs show correct program scoping

---

## 🐛 Known Issues / Limitations

- WebSocket connection may fail if server is not running
- Notifications may not appear if notification center is not mounted
- Mobile app WebSocket connection may need separate testing (Phase C)

---

## ✅ Success Criteria

All tests pass when:
1. ✅ Server successfully broadcasts trip_created events
2. ✅ Web app receives WebSocket messages
3. ✅ Notifications appear in notification center
4. ✅ Hierarchical isolation is maintained
5. ✅ Driver-specific targeting works when driver is assigned

---

*Last Updated: During trip notification implementation*
