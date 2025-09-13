# Pre-Change Checklist ⚠️

**MANDATORY: Complete this checklist before making ANY changes to the system**

## Current System Health Verification

### 1. Authentication Check ✅
- [ ] Can login with superadmin@monarch.com
- [ ] Dashboard loads without errors
- [ ] No 401 errors in browser console
- [ ] Auth token stored in localStorage
- [ ] Page refresh maintains login

**Test Command:** Open browser console and check for auth_token in localStorage

### 2. API Endpoints Check ✅
- [ ] GET /api/clients/organization/monarch_competency returns 200
- [ ] GET /api/drivers/organization/monarch_competency returns 200  
- [ ] GET /api/trips/organization/monarch_competency returns 200
- [ ] GET /api/organizations/monarch_competency returns 200
- [ ] All responses contain expected data arrays/objects

**Test Command:** `node test-system-health.js` (if server running)

### 3. Dashboard Functionality ✅  
- [ ] Client count displays correctly
- [ ] Driver list loads
- [ ] Trip calendar shows data
- [ ] No loading spinners stuck
- [ ] All cards show real data (not "Loading...")

### 4. Database Schema Integrity ✅
- [ ] Snake_case field names preserved (user_id, organization_id)
- [ ] No camelCase conversion in database queries
- [ ] Foreign key relationships intact
- [ ] No broken joins or missing data

## Change Impact Assessment

### Before Making Changes:
1. **Document what you're changing:**
   - [ ] Files being modified
   - [ ] Specific functions/components
   - [ ] Database schema changes
   - [ ] Configuration changes

2. **Identify dependencies:**
   - [ ] What could break from this change?
   - [ ] Which API endpoints are affected?
   - [ ] Will authentication be impacted?
   - [ ] Are database queries modified?

3. **Create rollback plan:**
   - [ ] Note current working commit
   - [ ] Identify files to revert
   - [ ] Test rollback procedure if needed

## FORBIDDEN Changes (Without Extreme Caution)

❌ **NEVER touch these without consulting DEVELOPMENT_SAFEGUARDS.md:**
- Session cookie configuration (httpOnly, secure, sameSite)
- localStorage token storage mechanism  
- Bearer token authentication flow
- Database field names (snake_case convention)
- Core API endpoint paths or response structures
- Super admin token validation logic

## Post-Change Verification

### After ANY change:
1. **Immediate test:**
   - [ ] Page refreshes without errors
   - [ ] Login still works
   - [ ] Dashboard loads data
   - [ ] No new console errors

2. **Full verification:**
   - [ ] Run health check script
   - [ ] Test all modified functionality
   - [ ] Verify unchanged parts still work
   - [ ] Check for regression issues

## Emergency Stop Conditions

🚨 **STOP IMMEDIATELY if any of these occur:**
- Login stops working
- Dashboard shows 401 errors
- API endpoints return unexpected errors
- Database queries fail
- Session persistence breaks

## Recovery Steps

If system breaks:
1. Check last working state in DEVELOPMENT_SAFEGUARDS.md
2. Revert recent changes
3. Clear browser cache/localStorage if needed
4. Restart server
5. Verify auth token configuration
6. Test with curl commands if needed

## Success Criteria

✅ System is ready for changes when:
- All checklist items pass
- No console errors
- Authentication working
- Dashboard loading properly
- API returning 200 responses

---

**Last Verified:** July 2, 2025, 6:26 PM
**Status:** ✅ STABLE - All systems working
**Next Check:** Before any code changes