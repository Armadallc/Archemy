# Driver Notifications - Testing Guide

## Prerequisites

1. **Backend Server Running**: Ensure the backend server is running and WebSocket server is active
2. **Mobile App Running**: Have the mobile app open in Expo Go or web browser
3. **Driver Logged In**: Ensure you're logged in as a driver with valid credentials
4. **Web Admin Access**: Have access to the web admin interface to create/update trips

---

## Test 1: WebSocket Connection

### Steps:
1. Open the mobile app and log in as a driver
2. Navigate to **Menu → View Notifications** (`http://localhost:8082/notifications`)
3. Check the connection status indicator at the top of the page

### Expected Results:
- ✅ Connection status shows "Connected" (green indicator)
- ✅ No error messages in console
- ✅ Backend logs show WebSocket connection established

### Troubleshooting:
- If disconnected: Check backend server is running
- If connection fails: Verify WebSocket URL in `mobile/services/websocket.ts`
- Check browser console for connection errors

---

## Test 2: New Trip Assignment Notification

### Steps:
1. **In Web Admin Interface**:
   - Create a new trip
   - Assign it to the driver you're testing with
   - Save the trip

2. **In Mobile App**:
   - Watch the notifications page
   - Check the home page notification bell (should show badge count)
   - Navigate to notifications page if not already there

### Expected Results:
- ✅ Notification appears in the notifications list
- ✅ Notification title: "New Trip Assigned"
- ✅ Notification body includes client name
- ✅ Priority badge shows "HIGH" (red/orange badge)
- ✅ Author information displayed (if available)
- ✅ Unread count increases on home page bell
- ✅ Unread count increases in menu "View Notifications" option
- ✅ Notification shows pickup time

### Verification Checklist:
- [ ] Notification appears within 1-2 seconds of trip creation
- [ ] Client name is correct (not "Unknown Client")
- [ ] Priority badge is visible and color-coded
- [ ] Author is displayed (if backend sends it)
- [ ] Unread count updates correctly
- [ ] Notification can be tapped to mark as read

### Backend Logs to Check:
Look for these log messages in backend console:
```
📨 Broadcasting new_trip notification: {
  tripId: '...',
  clientName: '...',
  driverUserId: '...',
  programId: '...'
}
```

---

## Test 3: Trip Status Update Notification

### Steps:
1. **In Web Admin Interface**:
   - Find an existing trip assigned to the test driver
   - Update the trip status (e.g., from "scheduled" to "confirmed" or "in_progress")
   - Save the changes

2. **In Mobile App**:
   - Watch the notifications page
   - Check for new notification

### Expected Results:
- ✅ Notification appears with title "Trip Updated" or "Trip Confirmed"
- ✅ Notification body includes status change information
- ✅ Priority badge shows appropriate level:
  - "HIGH" for cancellations
  - "MEDIUM" for status updates
- ✅ Client name is displayed correctly
- ✅ Previous status → New status shown
- ✅ Author information displayed (who made the update)

### Status Change Tests:
Test these status transitions:
- [ ] `scheduled` → `confirmed`
- [ ] `confirmed` → `in_progress`
- [ ] `in_progress` → `completed`
- [ ] `scheduled` → `cancelled` (should show HIGH priority)

### Backend Logs to Check:
```
📨 Broadcasting trip_update notification: {
  tripId: '...',
  statusChange: 'scheduled → confirmed',
  action: 'status_update',
  driverId: '...',
  programId: '...'
}
```

---

## Test 4: Notification Display & UI

### Steps:
1. Navigate to notifications page
2. Review the notification list
3. Check individual notification items

### Expected Results:
- ✅ **Priority Badges**:
  - LOW: Blue/gray badge
  - MEDIUM: Yellow/orange badge
  - HIGH: Orange/red badge
  - URGENT: Red badge
  
- ✅ **Author Display**:
  - Shows author name/role if available
  - Icon (person-circle-outline) displayed
  - Format: "By [Name] ([Role])" or "By System"

- ✅ **Notification Icons**:
  - New Trip: Car icon (green)
  - Trip Update: Refresh icon (blue)
  - Emergency: Warning icon (red)
  - System: Information icon (gray)

- ✅ **Read/Unread States**:
  - Unread: Left border accent, unread dot
  - Read: No border, no dot

- ✅ **Timestamp**: Shows relative time (e.g., "2 minutes ago")

---

## Test 5: Notification Preferences

### Steps:
1. Navigate to **Menu → View Notifications**
2. Scroll to the bottom to see "Notification Preferences" section
3. Toggle various notification types on/off
4. Toggle sound and vibration settings
5. Try to disable "Emergency" notifications (should be blocked)

### Expected Results:
- ✅ All notification types listed:
  - New Trip
  - Trip Update
  - Trip Reminder
  - Emergency (disabled toggle - cannot be turned off)
  - System
  
- ✅ Sound toggle works
- ✅ Vibration toggle works
- ✅ Preferences persist after app restart
- ✅ Alert shown when trying to disable Emergency notifications

### Test Preference Impact:
1. Disable "New Trip" notifications
2. Create a new trip assignment
3. **Expected**: Notification may still appear (if backend doesn't check preferences), but local notification won't play sound/vibrate

**Note**: Currently, preferences are stored locally only. Backend doesn't check preferences before sending notifications.

---

## Test 6: Notification Interactions

### Steps:
1. Tap on an unread notification
2. Check unread count updates
3. Tap "Clear All" button
4. Verify all notifications cleared

### Expected Results:
- ✅ Tapping notification marks it as read
- ✅ Unread count decreases
- ✅ Notification appearance changes (border removed, dot removed)
- ✅ "Clear All" removes all notifications
- ✅ Unread count resets to 0

---

## Test 7: Home Page Integration

### Steps:
1. Navigate to home page (`http://localhost:8082/home`)
2. Check notification bell in header
3. Tap the bell
4. Verify navigation to notifications page

### Expected Results:
- ✅ Notification bell visible in top right of header
- ✅ Badge shows unread count (if > 0)
- ✅ Badge hidden when count is 0
- ✅ Tapping bell navigates to notifications page
- ✅ Badge count matches actual unread count

---

## Test 8: Menu Integration

### Steps:
1. Navigate to menu page (`http://localhost:8082/menu`)
2. Check "View Notifications" option in Profile section
3. Verify unread count display
4. Tap to navigate

### Expected Results:
- ✅ "View Notifications" appears under "View Profile"
- ✅ Subtitle shows unread count message
- ✅ Badge shows unread count (if > 0)
- ✅ Tapping navigates to notifications page
- ✅ No duplicate "Notifications" option in Settings section

---

## Test 9: Multiple Notifications

### Steps:
1. Create multiple trips assigned to the driver
2. Update multiple trip statuses
3. Check notifications list

### Expected Results:
- ✅ All notifications appear in list
- ✅ Most recent notifications at top
- ✅ Each notification shows correct information
- ✅ Unread count is accurate
- ✅ Can mark individual notifications as read

---

## Test 10: Connection Recovery

### Steps:
1. Disconnect backend server (or stop WebSocket)
2. Observe connection status
3. Reconnect backend server
4. Verify automatic reconnection

### Expected Results:
- ✅ Connection status shows "Disconnected" when server down
- ✅ Connection automatically retries (up to 5 attempts)
- ✅ Connection re-establishes when server comes back
- ✅ Notifications resume after reconnection

---

## Known Issues to Watch For

1. **"Unknown Client"**: If client name shows as "Unknown Client", check:
   - Backend is extracting client name correctly
   - Trip has proper client/client_group relations
   - WebSocket message includes `clientName` field

2. **Missing Notifications**: If notifications don't appear:
   - Check WebSocket connection status
   - Verify backend is calling `broadcastTripCreated`/`broadcastTripUpdate`
   - Check browser console for errors
   - Verify driver's `user_id` matches in backend

3. **Priority Not Showing**: If priority badges don't appear:
   - Check backend is sending `priority` field in WebSocket message
   - Verify frontend is extracting priority from message data

4. **Author Not Showing**: If author info is missing:
   - Check backend is including `author` or `updatedBy` in WebSocket message
   - Verify frontend is extracting author from message data

---

## Debugging Tips

### Frontend Console Logs:
Look for these log messages:
```
✅ WebSocket connected for notifications
📨 New trip received: { ... }
📨 Trip update received: { ... }
```

### Backend Console Logs:
Look for these log messages:
```
📨 Broadcasting new_trip notification: { ... }
📨 Broadcasting trip_update notification: { ... }
   → Sending to driver: [driverId]
   → Sending to user: [userId]
```

### Check WebSocket Connection:
In browser DevTools → Network → WS, verify:
- WebSocket connection is "101 Switching Protocols"
- Connection stays open (not closing immediately)
- Messages are being received

---

## Success Criteria

All tests pass if:
- ✅ WebSocket connects successfully
- ✅ New trip notifications appear with correct details
- ✅ Trip update notifications appear with correct details
- ✅ Priority badges display correctly
- ✅ Author information displays correctly
- ✅ Unread counts update correctly
- ✅ Preferences work and persist
- ✅ UI elements (bell, menu item) work correctly
- ✅ Notifications can be marked as read
- ✅ Connection recovers after disconnection

---

## Next Steps After Testing

1. **Document any issues found** in this file
2. **Fix critical issues** (notifications not appearing, wrong data)
3. **Enhance features** (preference sync with backend, push notifications)
4. **Add automated tests** for critical paths

---

## Test Results Template

```
Test Date: [Date]
Tester: [Name]
Driver User ID: [ID]

Test 1: WebSocket Connection - [PASS/FAIL]
Test 2: New Trip Notification - [PASS/FAIL]
Test 3: Trip Update Notification - [PASS/FAIL]
Test 4: Notification Display - [PASS/FAIL]
Test 5: Preferences - [PASS/FAIL]
Test 6: Interactions - [PASS/FAIL]
Test 7: Home Page Integration - [PASS/FAIL]
Test 8: Menu Integration - [PASS/FAIL]
Test 9: Multiple Notifications - [PASS/FAIL]
Test 10: Connection Recovery - [PASS/FAIL]

Issues Found:
- [Issue 1]
- [Issue 2]

Notes:
[Any additional observations]
```





