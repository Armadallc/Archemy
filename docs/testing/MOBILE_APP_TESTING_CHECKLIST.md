# Mobile App Testing Checklist

## Test Environment
- **User**: driver@monarch.com
- **Platform**: Web (http://localhost:8082 or Expo web)
- **Backend**: http://localhost:8081

---

## ✅ Test 1: Trip Status Button (Start Trip)

### Steps:
1. Navigate to the **Trips** tab
2. Find a trip with status "scheduled" or "confirmed"
3. Click the **"Start Trip"** button
4. Confirm the action in the alert dialog

### Expected Results:
- ✅ Button should be clickable (not grayed out)
- ✅ Clicking button should NOT navigate to trip details
- ✅ Alert dialog should appear asking for confirmation
- ✅ After confirming, trip status should update to "in_progress"
- ✅ Success message should appear
- ✅ Trip card should refresh with new status

### If Failed:
- Check browser console for errors
- Verify trip status in the database
- Check network tab for API call to `/api/trips/:id` with PATCH method

---

## ✅ Test 2: Profile Persistence

### Steps:
1. Navigate to the **Profile** tab
2. Click **"Edit Profile"** button
3. Change the name field (e.g., "Test Driver")
4. Change the email field (e.g., "test@example.com")
5. Click **"Save"** button
6. Wait for success message
7. Navigate away and back to Profile tab
8. Check if changes persisted

### Expected Results:
- ✅ Edit form should appear when clicking "Edit Profile"
- ✅ Save button should be clickable
- ✅ Success alert should appear after saving
- ✅ Changes should persist after navigating away and back
- ✅ Changes should be visible in the profile display

### If Failed:
- Check browser console for errors
- Check network tab for API call to `/api/mobile/driver/profile` with PATCH method
- Verify response status is 200
- Check server logs for any errors

---

## ✅ Test 3: WebSocket Connection Stability

### Steps:
1. Navigate to the **Notifications** tab
2. Observe the connection status indicator
3. Wait 30-60 seconds
4. Check if connection remains stable
5. Create a trip from admin dashboard (if possible)
6. Check if notification appears

### Expected Results:
- ✅ Connection status should show "Connected" (green indicator)
- ✅ Connection should remain stable (not disconnect)
- ✅ No "WebSocket disconnected" messages in console
- ✅ "connection" message type should be handled without errors
- ✅ If trip is created, notification should appear

### If Failed:
- Check browser console for WebSocket errors
- Verify WebSocket URL: `ws://localhost:8081/ws?token=...`
- Check server logs for WebSocket connection issues
- Verify token is being sent correctly

---

## 🔍 Debugging Commands

### Check Server Status:
```bash
curl http://localhost:8081/api/health
```

### Check WebSocket Connections:
```bash
curl http://localhost:8081/api/ws-test
```

### Check Browser Console:
- Open DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests
- Check WebSocket messages in Network tab

---

## 📝 Test Results Template

```
Test 1: Trip Status Button
- Status: [PASS/FAIL]
- Notes: [Any issues observed]

Test 2: Profile Persistence
- Status: [PASS/FAIL]
- Notes: [Any issues observed]

Test 3: WebSocket Connection
- Status: [PASS/FAIL]
- Notes: [Any issues observed]
```

---

## 🚨 Common Issues & Solutions

### Issue: Button still not clickable
- **Solution**: Check if trip card structure was updated correctly
- **Check**: Verify `tripCardContent` style exists

### Issue: Profile changes not saving
- **Solution**: Check API endpoint `/api/mobile/driver/profile` exists
- **Check**: Verify driver record exists for user

### Issue: WebSocket keeps disconnecting
- **Solution**: Check server WebSocket handler for "connection" message
- **Check**: Verify token is valid and not expired






