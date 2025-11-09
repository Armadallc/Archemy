# Hierarchical Structure Enforcement Audit

**Date**: November 4, 2025  
**Phase**: 1.3 - Foundation & Verification  
**Status**: ✅ Complete

---

## Executive Summary

This audit verifies that trip creation respects the hierarchical structure and that users can only create trips for programs they have access to. The audit reveals that **program access validation is NOT currently enforced** in trip creation endpoints, creating a potential security gap.

---

## 🔍 Permission System Analysis

### Role-Based Permissions

**Location**: `server/permissions.ts`

#### Roles with Trip Creation Permission
1. ✅ **super_admin**: Can create trips for any program
2. ✅ **corporate_admin**: Can create trips for programs in their corporate client
3. ✅ **program_admin**: Can create trips for their program
4. ✅ **program_user**: Can create trips for their program
5. ❌ **driver**: Cannot create trips (only can update trip status)

#### Permission Function: `canAccessProgram()`

**Location**: `server/permissions.ts` (line 221-248)

```typescript
export function canAccessProgram(
  userRole: string,
  primaryProgramId: string | null,
  authorizedPrograms: string[] | null,
  requestedProgramId: string
): boolean {
  // Super admin can access all programs
  if (userRole === 'super_admin') {
    return true;
  }
  
  // Corporate admin can access all programs within their corporate client
  if (userRole === 'corporate_admin') {
    return true; // Will be filtered by corporate client in the application logic
  }
  
  // Program admin and program user can access their primary program
  if (primaryProgramId === requestedProgramId) {
    return true;
  }
  
  // Check authorized programs
  if (authorizedPrograms && authorizedPrograms.includes(requestedProgramId)) {
    return true;
  }
  
  return false;
}
```

**Validation Logic**:
- ✅ Super admin: Always allowed
- ✅ Corporate admin: Always allowed (relies on corporate client filtering)
- ✅ Program users: Must match `primaryProgramId` or be in `authorizedPrograms`

---

## 🔐 Trip Creation Endpoint Analysis

### Primary Endpoint: `POST /api/trips`

**Location**: `server/routes/trips.ts` (line 83-115)

#### Current Implementation
```typescript
router.post("/", 
  requireSupabaseAuth, 
  requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']), 
  async (req: SupabaseAuthenticatedRequest, res) => {
    try {
      const trip = await tripsStorage.createTrip(req.body);
      // ... notification logic ...
      res.status(201).json(trip);
    } catch (error) {
      console.error("Error creating trip:", error);
      res.status(500).json({ message: "Failed to create trip" });
    }
  }
);
```

#### Security Analysis
- ✅ **Role Check**: Uses `requireSupabaseRole()` to verify user has trip creation permission
- ❌ **Program Access Check**: **NOT IMPLEMENTED** - No validation that user can create trips for `req.body.program_id`
- ❌ **Corporate Client Check**: **NOT IMPLEMENTED** - No validation that program belongs to user's corporate client

#### Potential Security Issues
1. **Program Access Bypass**: A user could potentially create trips for programs they don't have access to by manipulating `program_id` in request body
2. **Cross-Corporate Trip Creation**: A corporate admin could create trips for programs in other corporate clients
3. **Unauthorized Program Access**: A program user could create trips for other programs if they know the program ID

---

### Alternative Endpoint: `POST /api/trips` (api-routes.ts)

**Location**: `server/api-routes.ts` (line 1183-1215)

#### Current Implementation
- **Same as primary endpoint**: Same security issues apply
- **No program access validation**

---

## 🛡️ Available Validation Middleware

### `requireProgramAccess()` Middleware

**Location**: `server/auth.ts` (line 40-63)

```typescript
export function requireProgramAccess(programIdParam: string = 'programId') {
  return async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const programId = req.params[programIdParam] || req.body[programIdParam] || req.query[programIdParam];
    
    if (!programId) {
      return res.status(400).json({ message: `Program ID required in ${programIdParam}` });
    }

    if (!canAccessProgram(req.user.role, req.user.primaryProgramId, null, programId)) {
      return res.status(403).json({ 
        message: "Access denied to program",
        programId,
        userRole: req.user.role
      });
    }

    req.currentProgramId = programId;
    next();
  };
}
```

#### Features
- ✅ Extracts `programId` from params, body, or query
- ✅ Validates using `canAccessProgram()`
- ✅ Returns 403 if access denied
- ⚠️ **Issue**: Only checks `primaryProgramId` - doesn't check `authorizedPrograms` (bug in implementation)

#### Usage
- **Not currently used** in trip creation endpoints
- **Available** for implementation

---

## 📋 Frontend Implementation

### Booking Forms

#### Simple Booking Form
**Location**: `client/src/components/booking/simple-booking-form.tsx`

```typescript
// Uses hierarchy context
const { level, selectedCorporateClient, selectedProgram } = useHierarchy();

// Sets program_id from hierarchy
program_id: effectiveProgram, // from selectedProgram or selectedProgramLocal
```

#### Quick Booking Form
**Location**: `client/src/components/booking/quick-booking-form.tsx`

```typescript
// Uses hierarchy context
const { level, selectedCorporateClient, selectedProgram } = useHierarchy();

// Sets program_id from hierarchy
program_id: selectedProgram,
```

#### Frontend Protection
- ✅ **UI Level**: Forms only show programs user has access to (via filtered queries)
- ⚠️ **Client-Side Only**: Can be bypassed by manipulating API requests
- ❌ **No Server-Side Validation**: Backend doesn't verify program access

---

## 🚨 Security Gap Analysis

### Current State
1. **Role-Based Authorization**: ✅ Working
   - Only users with `CREATE_TRIPS` permission can call endpoint
   - Roles: `super_admin`, `corporate_admin`, `program_admin`, `program_user`

2. **Program Access Validation**: ❌ **NOT IMPLEMENTED**
   - No server-side check that user can access `program_id`
   - User could manipulate request to create trips for unauthorized programs

3. **Corporate Client Validation**: ❌ **NOT IMPLEMENTED**
   - No check that program belongs to user's corporate client
   - Corporate admin could create trips for other corporate clients' programs

### Attack Scenarios

#### Scenario 1: Program User Creates Trip for Another Program
```
User: program_user with primary_program_id = "program_a"
Request: POST /api/trips { program_id: "program_b", ... }
Result: ✅ Trip created (SHOULD BE BLOCKED)
```

#### Scenario 2: Corporate Admin Creates Trip for Another Corporate Client
```
User: corporate_admin with corporate_client_id = "monarch"
Request: POST /api/trips { program_id: "halcyon_program", ... }
Result: ✅ Trip created (SHOULD BE BLOCKED)
```

#### Scenario 3: Program User Uses Unauthorized Program ID
```
User: program_user with primary_program_id = "program_a"
Request: POST /api/trips { program_id: "program_c", ... }
Result: ✅ Trip created (SHOULD BE BLOCKED)
```

---

## ✅ Recommendations

### Immediate Fix Required

#### 1. Add Program Access Validation to Trip Creation

**Location**: `server/routes/trips.ts` and `server/api-routes.ts`

```typescript
router.post("/", 
  requireSupabaseAuth, 
  requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin', 'program_user']),
  // ADD THIS MIDDLEWARE:
  requireProgramAccess('program_id'), // Validates req.body.program_id
  async (req: SupabaseAuthenticatedRequest, res) => {
    // ... existing code ...
  }
);
```

#### 2. Fix `requireProgramAccess()` Middleware

**Issue**: Only checks `primaryProgramId`, doesn't check `authorizedPrograms`

**Location**: `server/auth.ts` (line 52)

```typescript
// CURRENT (BROKEN):
if (!canAccessProgram(req.user.role, req.user.primaryProgramId, null, programId)) {

// FIXED:
if (!canAccessProgram(
  req.user.role, 
  req.user.primaryProgramId, 
  req.user.authorizedPrograms || null, // Pass authorized programs
  programId
)) {
```

#### 3. Add Corporate Client Validation

For corporate admins, verify that program belongs to their corporate client:

```typescript
// After requireProgramAccess validation
if (req.user.role === 'corporate_admin' && req.user.corporateClientId) {
  // Fetch program to verify corporate_client_id
  const program = await programsStorage.getProgram(req.body.program_id);
  if (program.corporate_client_id !== req.user.corporateClientId) {
    return res.status(403).json({ 
      message: "Access denied: Program does not belong to your corporate client"
    });
  }
}
```

---

## 📊 Test Scenarios

### Test 1: Super Admin Can Create Trips for Any Program
- **User**: `super_admin`
- **Program**: Any program ID
- **Expected**: ✅ Should succeed
- **Current**: ✅ Works correctly

### Test 2: Corporate Admin Can Create Trips for Their Programs
- **User**: `corporate_admin` (Monarch)
- **Program**: Monarch program
- **Expected**: ✅ Should succeed
- **Current**: ✅ Works (but no validation)

### Test 3: Corporate Admin Cannot Create Trips for Other Corporate Clients
- **User**: `corporate_admin` (Monarch)
- **Program**: Halcyon program
- **Expected**: ❌ Should fail (403)
- **Current**: ⚠️ **DOES NOT WORK** - No validation, trip would be created

### Test 4: Program Admin Can Create Trips for Their Program
- **User**: `program_admin` (primary_program_id = "program_a")
- **Program**: "program_a"
- **Expected**: ✅ Should succeed
- **Current**: ✅ Works (but no validation)

### Test 5: Program Admin Cannot Create Trips for Other Programs
- **User**: `program_admin` (primary_program_id = "program_a")
- **Program**: "program_b"
- **Expected**: ❌ Should fail (403)
- **Current**: ⚠️ **DOES NOT WORK** - No validation, trip would be created

### Test 6: Program User Can Create Trips for Their Program
- **User**: `program_user` (primary_program_id = "program_a")
- **Program**: "program_a"
- **Expected**: ✅ Should succeed
- **Current**: ✅ Works (but no validation)

### Test 7: Program User Cannot Create Trips for Other Programs
- **User**: `program_user` (primary_program_id = "program_a")
- **Program**: "program_b"
- **Expected**: ❌ Should fail (403)
- **Current**: ⚠️ **DOES NOT WORK** - No validation, trip would be created

---

## ✅ Verification Checklist

### Role-Based Authorization
- [x] Super admin can create trips
- [x] Corporate admin can create trips
- [x] Program admin can create trips
- [x] Program user can create trips
- [x] Driver cannot create trips (only update status)

### Program Access Validation
- [ ] Super admin can create trips for any program ✅ (expected)
- [ ] Corporate admin can create trips for their corporate client's programs ⚠️ (no validation)
- [ ] Corporate admin cannot create trips for other corporate clients' programs ❌ (not enforced)
- [ ] Program admin can create trips for their program ⚠️ (no validation)
- [ ] Program admin cannot create trips for other programs ❌ (not enforced)
- [ ] Program user can create trips for their program ⚠️ (no validation)
- [ ] Program user cannot create trips for other programs ❌ (not enforced)

### Notification Scope
- [x] Trip creation notifications respect hierarchical boundaries (verified in Step 1.2)
- [x] WebSocket validation prevents cross-tenant leakage (verified in Step 1.2)

---

## 🎯 Summary

### What's Working
1. ✅ **Role-Based Authorization**: Only authorized roles can create trips
2. ✅ **Frontend UI Protection**: Forms only show accessible programs
3. ✅ **Notification Isolation**: Notifications respect hierarchical boundaries

### What's Missing (Critical)
1. ❌ **Program Access Validation**: No server-side check that user can access `program_id`
2. ❌ **Corporate Client Validation**: No check that program belongs to user's corporate client
3. ❌ **Middleware Usage**: `requireProgramAccess()` exists but is not used in trip creation

### Security Risk Level: 🔴 **HIGH**

**Risk**: Users can create trips for programs they don't have access to by manipulating the API request.

**Impact**: 
- Data integrity issues
- Cross-tenant data leakage
- Unauthorized trip creation
- Potential billing/invoicing errors

---

## 📋 Next Steps

### Immediate Actions Required
1. **Add `requireProgramAccess('program_id')` middleware** to trip creation endpoints
2. **Fix `requireProgramAccess()` middleware** to check `authorizedPrograms`
3. **Add corporate client validation** for corporate admins
4. **Test all scenarios** to verify enforcement

### Manual Walkthrough Test Plan
1. Test super admin can create trips for any program
2. Test corporate admin can create trips for their programs
3. Test corporate admin cannot create trips for other corporate clients
4. Test program admin can create trips for their program
5. Test program admin cannot create trips for other programs
6. Test program user can create trips for their program
7. Test program user cannot create trips for other programs

---

*Last Updated: November 4, 2025*

