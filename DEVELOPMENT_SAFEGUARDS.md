# Development Safeguards

## Critical System Protection

This document establishes mandatory safeguards to prevent breaking working functionality during development.

## Authentication System - PROTECTED ⚠️

**Current Working State:**
- Token-based authentication with localStorage persistence
- Session fallback for production
- Development token: Works without re-login after code changes
- Backend auth middleware supports both session and Bearer token

**FORBIDDEN CHANGES:**
- ❌ NEVER modify session cookie settings (httpOnly, secure, sameSite)
- ❌ NEVER change token storage mechanism in localStorage
- ❌ NEVER alter the Bearer token authentication flow
- ❌ NEVER modify the super admin token validation
- ❌ NEVER change database field names (user_id, primary_organization_id)

**Required Testing Before ANY Auth Changes:**
1. Login with superadmin@monarch.com must work
2. Dashboard must load all data (200 responses)
3. Page refresh must maintain login state
4. Code changes must not require re-login

## Database Schema - PROTECTED ⚠️

**Snake Case Convention - IMMUTABLE:**
- All database fields use snake_case (user_id, organization_id, etc.)
- Frontend mapping handles camelCase conversion
- Authentication queries use exact database field names

**FORBIDDEN CHANGES:**
- ❌ NEVER change existing field names
- ❌ NEVER modify primary key structures
- ❌ NEVER alter foreign key relationships without migration plan

## Core API Endpoints - PROTECTED ⚠️

**Dashboard Dependencies - CRITICAL:**
```
GET /api/clients/organization/:org
GET /api/drivers/organization/:org  
GET /api/trips/organization/:org
GET /api/organizations/:org
```

**REQUIRED TESTING:**
- All endpoints must return 200 status
- Data structure must remain consistent
- Organization filtering must work correctly

## Change Protocol

### Before Making ANY Change:
1. **Document current working state**
2. **Identify all dependencies**
3. **Create rollback plan**
4. **Test authentication flow**
5. **Verify dashboard functionality**

### During Development:
1. **Test immediately after each change**
2. **Verify login persistence works**
3. **Check API response codes**
4. **Confirm data loading**

### After Changes:
1. **Full system verification**
2. **Update this document if new protections needed**
3. **Document any new working functionality**

## Emergency Rollback Instructions

If authentication breaks:
1. Check localStorage for auth_token
2. Verify session cookie configuration 
3. Test API endpoints with curl
4. Check server logs for auth failures
5. Revert to last known working commit

## Cost Prevention

To prevent unnecessary charges from fixing self-created problems:
- Always test in small increments
- Never make multiple simultaneous auth changes
- Verify working state before proceeding
- Stop immediately if anything breaks

## Success Metrics

System is considered stable when:
- ✅ Login works without re-authentication during development
- ✅ Dashboard loads all data with 200 responses
- ✅ Page refresh maintains authentication state
- ✅ API calls include proper authorization headers
- ✅ No 401 authentication errors in console

## Last Verified Working State

**Date:** July 2, 2025, 6:26 PM
**Authentication:** Token-based with localStorage persistence ✅
**Dashboard:** All data loading with 200 responses ✅
**Session Persistence:** Working through code changes ✅
**API Authorization:** Bearer token authentication functional ✅

---

**⚠️ WARNING: This document must be consulted before ANY changes to authentication, sessions, or core API functionality.**