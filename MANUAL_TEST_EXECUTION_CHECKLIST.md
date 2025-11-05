# Manual Walkthrough Test - Execution Checklist

**Date**: November 4, 2025  
**Purpose**: Execute manual tests for trip creation and hierarchical enforcement  
**Format**: Step-by-step checklist with expected results

---

## 📋 Pre-Test Setup

### Environment Check
- [ ] Backend server running on `http://localhost:8081`
- [ ] Frontend server running on `http://localhost:5173`
- [ ] WebSocket connection active (check browser console for connection status)
- [ ] Database accessible (Supabase connection working)

### Test Users Available
- [ ] `admin@monarch.com` / `admin123` (Super Admin)
- [ ] `admin@halcyon.com` / `admin123` (Halcyon Corporate Admin)
- [ ] `programadmin@monarch.com` / `programadmin123` (Monarch Program Admin)
- [ ] `driver@monarch.com` / `driver123` (Driver - if needed)

### Test Data Available
- [ ] Halcyon has at least 1 program (`halcyon_detox`)
- [ ] Halcyon has at least 1 client
- [ ] Halcyon has at least 1 location
- [ ] Monarch has at least 1 program
- [ ] Monarch has at least 1 client
- [ ] Monarch has at least 1 driver

---

## 🧪 TEST 1: Super Admin Creates Trip

### Steps
1. [ ] Open browser and navigate to `http://localhost:5173`
2. [ ] Login as `admin@monarch.com` / `admin123`
3. [ ] Navigate to trip creation page (or booking form)
4. [ ] Open browser DevTools → Console tab (to see WebSocket messages)
5. [ ] Select a program from dropdown (any Monarch program)
6. [ ] Fill in trip details:
   - [ ] Select a client
   - [ ] Select pickup address
   - [ ] Select dropoff address
   - [ ] Set scheduled date (future date)
   - [ ] Set scheduled time
   - [ ] Optionally assign a driver
7. [ ] Submit the trip creation form
8. [ ] Note the response (success/error)

### Expected Results
- ✅ Trip created successfully (201 status or success message)
- ✅ No errors in console
- ✅ Trip appears in trips list/calendar
- ✅ WebSocket message received: `trip_created` event
- ✅ Notification appears in notification center (if driver assigned)

### Verification Points
- [ ] Check browser console for WebSocket message: `📨 WebSocket message received: trip_created`
- [ ] Check notification center for "New Trip Created" notification
- [ ] Check trips list - new trip should appear
- [ ] Check database (optional) - trip should have correct `program_id`

### Report Back
- **Status**: [ ] PASS / [ ] FAIL
- **Notes**: (Any issues or unexpected behavior)

---

## 🧪 TEST 2: Halcyon Corporate Admin Creates Trip

### Steps
1. [ ] Open browser (or new incognito window)
2. [ ] Navigate to `http://localhost:5173`
3. [ ] Login as `admin@halcyon.com` / `admin123`
4. [ ] Navigate to trip creation page
5. [ ] Open browser DevTools → Console tab
6. [ ] Check program dropdown - note which programs are visible
7. [ ] Select a program from dropdown (should only see Halcyon programs)
8. [ ] Fill in trip details:
   - [ ] Select a Halcyon client
   - [ ] Select pickup address
   - [ ] Select dropoff address
   - [ ] Set scheduled date (future date)
   - [ ] Set scheduled time
   - [ ] Optionally assign a driver (if available)
9. [ ] Submit the trip creation form
10. [ ] Note the response (success/error)

### Expected Results
- ✅ Only Halcyon programs visible in dropdown
- ✅ Trip created successfully
- ✅ No errors in console
- ✅ Trip appears in trips list
- ✅ WebSocket message received: `trip_created` event
- ✅ Notification appears in notification center

### Verification Points
- [ ] Program dropdown only shows Halcyon programs (no Monarch programs)
- [ ] Trip created with `program_id` = Halcyon program
- [ ] WebSocket message received
- [ ] Notification appears
- [ ] Trip visible in trips list

### Report Back
- **Status**: [ ] PASS / [ ] FAIL
- **Notes**: (Any issues, especially if Monarch programs appear in dropdown)

---

## 🧪 TEST 3: Cross-Corporate Trip Creation Attempt (Security Test)

### Steps
1. [ ] Keep logged in as `admin@halcyon.com` (Halcyon corporate admin)
2. [ ] Open browser DevTools → Console tab
3. [ ] In console, run this command to get auth token:
   ```javascript
   localStorage.getItem('auth_token')
   ```
4. [ ] Copy the token value
5. [ ] In console, run this command to create trip with Monarch program:
   ```javascript
   // First, get a Monarch program ID (you may need to check database or use a known ID)
   // Replace 'monarch_program_id' with actual Monarch program ID
   fetch('http://localhost:8081/api/trips', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       program_id: 'monarch_program_id', // Use actual Monarch program ID
       client_id: 'halcyon_client_id', // Use a Halcyon client ID
       pickup_address: '123 Test St',
       dropoff_address: '456 Test Ave',
       scheduled_pickup_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
       passenger_count: 1,
       status: 'scheduled',
       trip_type: 'one_way'
     })
   }).then(r => r.json()).then(console.log).catch(console.error)
   ```
6. [ ] Note the response (should be 403 error if validation works)

### Expected Results
- ❌ **SHOULD FAIL**: 403 error with message "Access denied to program"
- ⚠️ **CURRENT BEHAVIOR**: Likely succeeds (no validation)

### Verification Points
- [ ] Response status code: [ ] 403 (expected) / [ ] 201 (security gap)
- [ ] Error message (if any)
- [ ] Trip created in database (check trips list - should NOT appear)

### Report Back
- **Status**: [ ] PASS (blocked) / [ ] FAIL (security gap - trip created)
- **Response Code**: __________
- **Error Message**: __________
- **Notes**: (Did trip get created? Check trips list)

---

## 🧪 TEST 4: Monarch Program Admin Creates Trip

### Steps
1. [ ] Open browser (or new incognito window)
2. [ ] Navigate to `http://localhost:5173`
3. [ ] Login as `programadmin@monarch.com` / `programadmin123`
4. [ ] Navigate to trip creation page
5. [ ] Open browser DevTools → Console tab
6. [ ] Check program dropdown - note which programs are visible
7. [ ] Select a program from dropdown
8. [ ] Fill in trip details:
   - [ ] Select a Monarch client
   - [ ] Select pickup address
   - [ ] Select dropoff address
   - [ ] Set scheduled date (future date)
   - [ ] Set scheduled time
   - [ ] Optionally assign a driver
9. [ ] Submit the trip creation form
10. [ ] Note the response (success/error)

### Expected Results
- ✅ Only accessible programs visible in dropdown
- ✅ Trip created successfully
- ✅ No errors in console
- ✅ Trip appears in trips list
- ✅ WebSocket message received: `trip_created` event
- ✅ Notification appears in notification center

### Verification Points
- [ ] Program dropdown shows only accessible programs
- [ ] Trip created with correct `program_id`
- [ ] WebSocket message received
- [ ] Notification appears
- [ ] Trip visible in trips list

### Report Back
- **Status**: [ ] PASS / [ ] FAIL
- **Notes**: (Which programs were visible in dropdown?)

---

## 🧪 TEST 5: Cross-Program Trip Creation Attempt (Security Test)

### Steps
1. [ ] Keep logged in as `programadmin@monarch.com`
2. [ ] Open browser DevTools → Console tab
3. [ ] Identify your primary program ID (from UI or database)
4. [ ] Identify another program ID (Halcyon program or different Monarch program)
5. [ ] In console, run this command:
   ```javascript
   fetch('http://localhost:8081/api/trips', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       program_id: 'unauthorized_program_id', // Use a program ID you don't have access to
       client_id: 'valid_client_id', // Use a valid client ID from your program
       pickup_address: '123 Test St',
       dropoff_address: '456 Test Ave',
       scheduled_pickup_time: new Date(Date.now() + 86400000).toISOString(),
       passenger_count: 1,
       status: 'scheduled',
       trip_type: 'one_way'
     })
   }).then(r => r.json()).then(console.log).catch(console.error)
   ```
6. [ ] Note the response (should be 403 error if validation works)

### Expected Results
- ❌ **SHOULD FAIL**: 403 error with message "Access denied to program"
- ⚠️ **CURRENT BEHAVIOR**: Likely succeeds (no validation)

### Verification Points
- [ ] Response status code: [ ] 403 (expected) / [ ] 201 (security gap)
- [ ] Error message (if any)
- [ ] Trip created in database (check trips list - should NOT appear)

### Report Back
- **Status**: [ ] PASS (blocked) / [ ] FAIL (security gap - trip created)
- **Response Code**: __________
- **Error Message**: __________
- **Notes**: (Did trip get created? Check trips list)

---

## 🧪 TEST 6: Notification Isolation Test

### Steps
1. [ ] Open two browser windows (or one regular + one incognito):
   - **Window 1**: Login as `admin@halcyon.com` (Halcyon admin)
   - **Window 2**: Login as `programadmin@monarch.com` (Monarch admin)
2. [ ] In both windows, open DevTools → Console tab
3. [ ] In both windows, check notification center (bell icon)
4. [ ] In **Window 1** (Halcyon), create a trip:
   - [ ] Navigate to trip creation
   - [ ] Fill in trip details for Halcyon
   - [ ] Submit trip creation
5. [ ] Check **Window 1** for notifications
6. [ ] Check **Window 2** for notifications
7. [ ] In **Window 2** (Monarch), create a trip:
   - [ ] Navigate to trip creation
   - [ ] Fill in trip details for Monarch
   - [ ] Submit trip creation
8. [ ] Check **Window 1** for notifications
9. [ ] Check **Window 2** for notifications

### Expected Results
- ✅ Window 1 receives notification when Halcyon trip created
- ❌ Window 2 does NOT receive notification when Halcyon trip created
- ✅ Window 2 receives notification when Monarch trip created
- ❌ Window 1 does NOT receive notification when Monarch trip created

### Verification Points
- [ ] Halcyon trip creation → Halcyon admin receives notification
- [ ] Halcyon trip creation → Monarch admin does NOT receive notification
- [ ] Monarch trip creation → Monarch admin receives notification
- [ ] Monarch trip creation → Halcyon admin does NOT receive notification
- [ ] Check console logs in both windows for WebSocket messages

### Report Back
- **Status**: [ ] PASS / [ ] FAIL
- **Halcyon → Halcyon**: [ ] Notification received
- **Halcyon → Monarch**: [ ] No notification (correct) / [ ] Notification received (leakage!)
- **Monarch → Monarch**: [ ] Notification received
- **Monarch → Halcyon**: [ ] No notification (correct) / [ ] Notification received (leakage!)
- **Notes**: (Any cross-tenant notification leakage?)

---

## 🧪 TEST 7: Trip Creation with Driver Assignment

### Steps
1. [ ] Login as `admin@monarch.com` (super admin)
2. [ ] Navigate to trip creation page
3. [ ] Create a trip with:
   - [ ] Select a program
   - [ ] Select a client
   - [ ] **Assign a driver** (select from driver dropdown)
   - [ ] Fill in other trip details
   - [ ] Submit trip creation
4. [ ] Check WebSocket console logs
5. [ ] Check notification center

### Expected Results
- ✅ Trip created successfully
- ✅ WebSocket message sent to assigned driver
- ✅ Notification appears in notification center
- ✅ Driver receives notification (if driver is logged in)

### Verification Points
- [ ] Trip created with `driver_id` set
- [ ] WebSocket log shows: `→ Sending to driver user: <driver_user_id>`
- [ ] Notification appears: "New Trip Created" with driver assignment message
- [ ] If driver is logged in, they receive notification

### Report Back
- **Status**: [ ] PASS / [ ] FAIL
- **Driver Notification Sent**: [ ] Yes / [ ] No
- **Notes**: (Was driver notification received? Check WebSocket logs)

---

## 🧪 TEST 8: Default Status Verification

### Steps
1. [ ] Login as any admin user
2. [ ] Navigate to trip creation page
3. [ ] Create a trip **without** specifying status in the form
4. [ ] Submit trip creation
5. [ ] Check the created trip's status

### Expected Results
- ✅ Trip created successfully
- ✅ Status defaults to `"scheduled"` if not provided
- ⚠️ **CURRENT**: May need to check database - status might need to be explicitly set

### Verification Points
- [ ] Trip created successfully
- [ ] Check trip in trips list - what status does it show?
- [ ] Check database (optional) - what is the `status` field value?

### Report Back
- **Status**: [ ] PASS / [ ] FAIL
- **Default Status**: __________ (What status was set?)
- **Notes**: (Was status "scheduled" or something else?)

---

## 📊 Test Results Summary

### Overall Status
- **Tests Passed**: ___ / 8
- **Tests Failed**: ___ / 8
- **Security Issues Found**: ___ (list below)

### Security Issues
1. [ ] Cross-corporate trip creation blocked: [ ] Yes / [ ] No
2. [ ] Cross-program trip creation blocked: [ ] Yes / [ ] No
3. [ ] Notification isolation working: [ ] Yes / [ ] No

### Critical Findings
- **Test 3 Result**: __________
- **Test 5 Result**: __________
- **Test 6 Result**: __________

---

## 📝 Report Format

After executing tests, report back with:
1. **Test Number**: Which test (1-8)
2. **Status**: PASS / FAIL
3. **Key Observations**: What happened
4. **Unexpected Behavior**: Any issues
5. **Console Errors**: Any errors in browser console
6. **WebSocket Messages**: What WebSocket messages were received

---

*Use this checklist to guide your testing and report back results*

