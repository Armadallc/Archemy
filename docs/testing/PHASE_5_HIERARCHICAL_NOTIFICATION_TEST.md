# Phase 5: Hierarchical Notification Scoping - Test Guide

## Overview
This guide tests that notifications respect the hierarchical structure:
- **Corporate Client** → **Program** → **Location** → **Client**
- Super admins see all notifications
- Corporate admins only see notifications for their corporate client
- Program-level users only see notifications for their authorized programs

## Test Scenarios

### Scenario 1: Program-Level Isolation
**Goal**: Verify users in Program A do NOT receive notifications for trips in Program B

**Setup**:
1. Create two users with different programs:
   - User A: `program_admin` with `primary_program_id = 'program_a'`
   - User B: `program_admin` with `primary_program_id = 'program_b'`
2. Both users should be logged in and connected via WebSocket

**Steps**:
1. Log in as User A and open browser console
2. Log in as User B in a different browser/incognito window
3. Create a trip in Program A (as User A or another admin)
4. **Expected**: 
   - ✅ User A receives `trip_created` notification
   - ❌ User B does NOT receive notification
5. Check server logs for `broadcastToProgram` counts

### Scenario 2: Corporate Client Isolation
**Goal**: Verify corporate admins only see notifications for their corporate client

**Setup**:
1. Create two corporate admins:
   - Corporate Admin A: `corporate_admin` with `corporate_client_id = 'corp_a'`
   - Corporate Admin B: `corporate_admin` with `corporate_client_id = 'corp_b'`
2. Both should have WebSocket connections

**Steps**:
1. Create a trip in a program under Corporate Client A
2. **Expected**:
   - ✅ Corporate Admin A receives notification
   - ❌ Corporate Admin B does NOT receive notification
3. Check server logs: `broadcastToCorporateClient` should show skipped counts

### Scenario 3: Cross-Corporate Program Isolation
**Goal**: Verify programs in different corporate clients don't leak notifications

**Setup**:
1. Program A (under Corporate Client A)
2. Program B (under Corporate Client B)
3. Users in each program

**Steps**:
1. Create trip in Program A
2. **Expected**:
   - ✅ Users in Program A receive notification
   - ❌ Users in Program B do NOT receive notification
   - ❌ Corporate Admin for Client B does NOT receive notification

### Scenario 4: Super Admin Receives All
**Goal**: Verify super admins receive notifications for all trips

**Setup**:
1. Super admin user connected via WebSocket
2. Create trips in different programs/corporate clients

**Steps**:
1. Create trip in Program A
2. Create trip in Program B (different corporate client)
3. **Expected**:
   - ✅ Super admin receives ALL notifications
   - ✅ Server logs show super admin was included in broadcasts

### Scenario 5: Authorized Programs Access
**Goal**: Verify users with multiple authorized programs receive notifications for all of them

**Setup**:
1. User with `authorized_programs = ['program_a', 'program_b']`

**Steps**:
1. Create trip in Program A
2. Create trip in Program B
3. **Expected**:
   - ✅ User receives notifications for both Program A and Program B trips

## Server Log Verification

Look for these log messages in the server console:

```
📨 broadcastToProgram(program_id): sent to X clients, skipped Y
📨 broadcastToCorporateClient(corp_id): sent to X clients, skipped Y
```

The `skipped` count indicates how many clients were filtered out due to hierarchical validation.

## Manual Testing Checklist

- [ ] **Test 1**: Create trip in Program A → Verify only Program A users receive
- [ ] **Test 2**: Create trip → Verify corporate admin for different corporate client does NOT receive
- [ ] **Test 3**: Super admin creates trip → Verify super admin receives notification
- [ ] **Test 4**: Driver updates trip status → Verify only program users receive (not other programs)
- [ ] **Test 5**: User with authorized_programs receives notifications for all authorized programs

## Debugging

### Check Connected Clients
To see who's connected, check server logs for WebSocket connections:
```
🔌 WebSocket connected: user@example.com (program_admin)
```

### Verify User's Authorized Programs
Check the database:
```sql
SELECT user_id, email, role, primary_program_id, authorized_programs, corporate_client_id 
FROM users 
WHERE email = 'test@example.com';
```

### Server Console Commands
You can check connected clients by accessing the WebSocket server:
```javascript
// In server console or debug endpoint
const wsServer = getWebSocketServer();
console.log(wsServer.getConnectedClients());
```

## Expected Behavior

### Super Admin
- ✅ Receives notifications for ALL trips, regardless of program/corporate client
- ✅ Logs show: `shouldReceiveNotification` returns `true` immediately

### Corporate Admin
- ✅ Receives notifications ONLY for trips in their corporate client's programs
- ✅ Logs show skipped clients when broadcasting to different corporate clients

### Program Admin/User/Driver
- ✅ Receives notifications ONLY for trips in their `primary_program_id` or `authorized_programs`
- ✅ Logs show skipped clients when broadcasting to different programs
- ✅ Corporate client validation prevents cross-corporate leakage

---

*After completing tests, update TRIP_LIFECYCLE_ACTION_PLAN.md to mark Phase 5 as complete.*

