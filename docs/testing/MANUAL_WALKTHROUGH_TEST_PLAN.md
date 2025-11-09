# Manual Walkthrough Test Plan

**Date**: November 4, 2025  
**Purpose**: Test hierarchical structure enforcement and trip creation flow  
**Status**: Ready for Execution

---

## 🎯 Test Objectives

1. Verify trip creation respects hierarchical structure
2. Test program access validation (or lack thereof)
3. Verify notifications are sent correctly
4. Test cross-tenant isolation
5. Verify status flow and transitions

---

## 👥 Test Users

### User 1: Super Admin
- **Email**: `admin@monarch.com`
- **Password**: `admin123`
- **Role**: `super_admin`
- **Access**: All programs, all corporate clients

### User 2: Halcyon Corporate Admin
- **Email**: `admin@halcyon.com`
- **Password**: `admin123`
- **Role**: `corporate_admin`
- **Corporate Client**: `halcyon`
- **Programs**: `halcyon_detox`

### User 3: Monarch Program Admin
- **Email**: `programadmin@monarch.com`
- **Password**: `programadmin123`
- **Role**: `program_admin`
- **Corporate Client**: `monarch`
- **Programs**: Monarch programs (check database)

---

## 📋 Test Scenarios

### Scenario 1: Super Admin Creates Trip

#### Test Steps
1. Login as `admin@monarch.com` (super admin)
2. Navigate to trip creation page
3. Select a Monarch program (or any program)
4. Create a trip with:
   - Client: Any Monarch client
   - Driver: Any Monarch driver
   - Pickup/Dropoff: Valid addresses
   - Date/Time: Future date
   - Status: "scheduled"
5. Submit trip creation

#### Expected Results
- ✅ Trip created successfully
- ✅ Notification sent to assigned driver (if driver assigned)
- ✅ Notification sent to program users
- ✅ Trip appears in calendar/trips list
- ✅ Status defaults to "scheduled" if not provided

#### Verification Points
- [ ] Trip created in database
- [ ] Trip has correct `program_id`
- [ ] Notification received by driver (check WebSocket)
- [ ] Notification received by program admins
- [ ] Trip visible in trips list

---

### Scenario 2: Halcyon Corporate Admin Creates Trip

#### Test Steps
1. Login as `admin@halcyon.com` (Halcyon corporate admin)
2. Navigate to trip creation page
3. Verify only Halcyon programs are visible
4. Select Halcyon program (`halcyon_detox`)
5. Create a trip with:
   - Client: Halcyon client
   - Driver: Halcyon driver (if available)
   - Pickup/Dropoff: Valid addresses
   - Date/Time: Future date
6. Submit trip creation

#### Expected Results
- ✅ Trip created successfully
- ✅ Only Halcyon programs visible in dropdown
- ✅ Trip belongs to Halcyon program
- ✅ Notification sent to Halcyon program users
- ❌ Notification NOT sent to Monarch users

#### Verification Points
- [ ] Only Halcyon programs in dropdown
- [ ] Trip created with correct `program_id`
- [ ] Trip has `corporate_client_id` = "halcyon"
- [ ] Notification received by Halcyon users
- [ ] Notification NOT received by Monarch users (open another browser)

---

### Scenario 3: Attempt Cross-Corporate Trip Creation (Security Test)

#### Test Steps
1. Login as `admin@halcyon.com` (Halcyon corporate admin)
2. Open browser DevTools → Network tab
3. Navigate to trip creation page
4. Intercept API request or manually call:
   ```javascript
   // In browser console
   fetch('/api/trips', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       program_id: 'monarch_program_id', // Try to use Monarch program
       client_id: 'halcyon_client_id',
       // ... other trip fields
     })
   })
   ```

#### Expected Results
- ❌ **SHOULD FAIL** with 403 error: "Access denied to program"
- ⚠️ **CURRENT BEHAVIOR**: Likely succeeds (no validation)

#### Verification Points
- [ ] Request blocked with 403 error
- [ ] Error message indicates program access denied
- [ ] Trip NOT created in database

---

### Scenario 4: Program Admin Creates Trip

#### Test Steps
1. Login as `programadmin@monarch.com` (Monarch program admin)
2. Navigate to trip creation page
3. Verify only their program is visible (or programs they have access to)
4. Create a trip with:
   - Client: Program client
   - Driver: Program driver
   - Pickup/Dropoff: Valid addresses
   - Date/Time: Future date
5. Submit trip creation

#### Expected Results
- ✅ Trip created successfully
- ✅ Only accessible programs visible
- ✅ Notification sent to program users
- ✅ Trip belongs to correct program

#### Verification Points
- [ ] Only accessible programs in dropdown
- [ ] Trip created with correct `program_id`
- [ ] Notification received by program users
- [ ] Trip visible in trips list

---

### Scenario 5: Attempt Cross-Program Trip Creation (Security Test)

#### Test Steps
1. Login as `programadmin@monarch.com` (Monarch program admin)
2. Identify their primary program ID (from database or UI)
3. Identify another program ID (from another corporate client or program)
4. Attempt to create trip with unauthorized program:
   ```javascript
   // In browser console
   fetch('/api/trips', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       program_id: 'unauthorized_program_id', // Try to use unauthorized program
       client_id: 'valid_client_id',
       // ... other trip fields
     })
   })
   ```

#### Expected Results
- ❌ **SHOULD FAIL** with 403 error: "Access denied to program"
- ⚠️ **CURRENT BEHAVIOR**: Likely succeeds (no validation)

#### Verification Points
- [ ] Request blocked with 403 error
- [ ] Error message indicates program access denied
- [ ] Trip NOT created in database

---

### Scenario 6: Driver Updates Trip Status

#### Test Steps
1. Login as driver (mobile app or web)
2. View assigned trips
3. Select a trip with status "scheduled"
4. Update status to "in_progress"
5. Update status to "completed"

#### Expected Results
- ✅ Status updates successfully
- ✅ Timestamps recorded (`actual_pickup_time`, `actual_dropoff_time`)
- ✅ Notification sent to program admins
- ✅ Notification includes driver name
- ✅ Status transition validation works (cannot skip steps)

#### Verification Points
- [ ] Status updates correctly
- [ ] Timestamps recorded
- [ ] Notification received by admins
- [ ] Invalid transitions blocked (e.g., `completed` → `in_progress`)

---

### Scenario 7: Notification Isolation Test

#### Test Steps
1. Open two browser windows:
   - Window 1: Login as `admin@halcyon.com`
   - Window 2: Login as `programadmin@monarch.com`
2. In Window 1 (Halcyon), create a trip
3. Check Window 2 (Monarch) for notifications

#### Expected Results
- ✅ Window 1 receives notification
- ❌ Window 2 does NOT receive notification
- ✅ No cross-tenant notification leakage

#### Verification Points
- [ ] Halcyon admin receives notification
- [ ] Monarch admin does NOT receive notification
- [ ] WebSocket logs show correct filtering

---

### Scenario 8: Trip Creation Notification Flow

#### Test Steps
1. Login as super admin
2. Create a trip with assigned driver
3. Monitor WebSocket connection (check console logs)
4. Verify notification targets

#### Expected Results
- ✅ Notification sent to assigned driver
- ✅ Notification broadcast to program users
- ✅ Notification includes trip details
- ✅ Notification includes hierarchical context

#### Verification Points
- [ ] Driver receives notification
- [ ] Program admins receive notification
- [ ] Notification contains trip data
- [ ] Notification contains `program_id` and `corporate_client_id`

---

## 🔍 Verification Checklist

### Trip Creation
- [ ] Super admin can create trips for any program
- [ ] Corporate admin can create trips for their programs
- [ ] Corporate admin cannot create trips for other corporate clients (if validation added)
- [ ] Program admin can create trips for their program
- [ ] Program admin cannot create trips for other programs (if validation added)
- [ ] Program user can create trips for their program
- [ ] Program user cannot create trips for other programs (if validation added)
- [ ] Driver cannot create trips

### Notifications
- [ ] Trip creation notifications sent to assigned driver
- [ ] Trip creation notifications broadcast to program users
- [ ] Notifications respect hierarchical boundaries
- [ ] No cross-tenant notification leakage
- [ ] Status update notifications include driver context

### Status Flow
- [ ] Default status is "scheduled"
- [ ] Status transitions validated
- [ ] Timestamps recorded correctly
- [ ] Invalid transitions blocked

---

## 📊 Test Results Template

### Test Execution Log

| Test # | Scenario | User | Status | Notes |
|--------|----------|------|--------|-------|
| 1 | Super Admin Creates Trip | admin@monarch.com | ⏳ Pending | |
| 2 | Halcyon Admin Creates Trip | admin@halcyon.com | ⏳ Pending | |
| 3 | Cross-Corporate Attempt | admin@halcyon.com | ⏳ Pending | Expected: Should fail |
| 4 | Program Admin Creates Trip | programadmin@monarch.com | ⏳ Pending | |
| 5 | Cross-Program Attempt | programadmin@monarch.com | ⏳ Pending | Expected: Should fail |
| 6 | Driver Updates Status | driver@monarch.com | ⏳ Pending | |
| 7 | Notification Isolation | Both users | ⏳ Pending | |
| 8 | Notification Flow | admin@monarch.com | ⏳ Pending | |

---

## 🚨 Known Issues to Verify

1. **Program Access Validation**: Currently NOT enforced - verify if trip can be created for unauthorized program
2. **Corporate Client Validation**: Currently NOT enforced - verify if corporate admin can create trips for other corporate clients
3. **Default Status**: Verify if default status is set when not provided

---

## 📝 Post-Test Actions

1. Document all test results
2. Note any security gaps found
3. Create bug reports for failed tests
4. Update action plan based on findings
5. Prioritize fixes based on security risk

---

*Last Updated: November 4, 2025*

