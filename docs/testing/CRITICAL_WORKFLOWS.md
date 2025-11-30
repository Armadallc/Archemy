# Critical Workflows Documentation

**Last Updated:** 2025-01-19  
**Status:** Active

---

## 🎯 Overview

This document defines the critical workflows that must be validated before any deployment. These workflows are automated in `scripts/validate-workflows.ts`.

---

## 1. Trip Creation Workflow

### Description
Validates that trips can be created through the API with proper validation and data persistence.

### Critical Steps
1. User authenticates
2. User selects program/location
3. User fills trip form
4. System validates data
5. Trip is created in database
6. Real-time update is sent
7. Trip appears in calendar/list

### Validation Points
- ✅ Endpoint exists (`POST /api/trips`)
- ✅ Authentication required
- ✅ Data validation works
- ✅ Database persistence
- ✅ Real-time updates

### Failure Impact
- **High:** Users cannot create trips
- **Blocker:** System unusable for primary function

---

## 2. Driver Assignment Workflow

### Description
Validates that drivers can be assigned to trips and receive notifications.

### Critical Steps
1. Admin assigns driver to trip
2. System updates trip record
3. Driver receives notification
4. Trip appears in driver's schedule
5. Real-time update sent

### Validation Points
- ✅ Assignment endpoint works
- ✅ Driver notification sent
- ✅ Schedule updates
- ✅ Real-time sync

### Failure Impact
- **High:** Drivers cannot receive assignments
- **Blocker:** Operations cannot function

---

## 3. Real-Time Updates Workflow

### Description
Validates that WebSocket connections work and real-time updates propagate correctly.

### Critical Steps
1. User connects to WebSocket
2. Trip status changes
3. Update broadcast to all connected clients
4. UI updates automatically
5. Multiple tabs stay in sync

### Validation Points
- ✅ WebSocket connection
- ✅ Message broadcasting
- ✅ Client updates
- ✅ Connection recovery

### Failure Impact
- **Medium:** Users see stale data
- **Non-blocker:** Manual refresh works

---

## 4. Authentication Workflow

### Description
Validates that users can authenticate and access appropriate resources.

### Critical Steps
1. User submits credentials
2. System validates credentials
3. JWT token issued
4. User redirected to dashboard
5. Protected routes accessible
6. Unauthorized routes blocked

### Validation Points
- ✅ Login endpoint works
- ✅ Token generation
- ✅ Role-based access
- ✅ Session management

### Failure Impact
- **Critical:** No one can access system
- **Blocker:** Complete system failure

---

## 🔄 Automated Validation

Run validation script:
```bash
npm run validate-workflows
```

This script checks:
- ✅ All endpoints exist
- ✅ Services are accessible
- ✅ Basic functionality works

---

## 📊 Validation Results

### Success Criteria
- All workflows return `passed`
- No critical errors
- All services accessible

### Failure Handling
- Log all failures
- Exit with code 1
- Report to monitoring system

---

## 🚨 Manual Validation

If automated validation passes but issues are reported:

1. **Test in Browser**
   - Open application
   - Test each workflow manually
   - Check console for errors

2. **Check Logs**
   - Server logs
   - Database logs
   - WebSocket logs

3. **Verify Data**
   - Check database directly
   - Verify records created
   - Check relationships

---

**Last Validated:** _________________  
**Validated By:** _________________  
**Status:** _________________

