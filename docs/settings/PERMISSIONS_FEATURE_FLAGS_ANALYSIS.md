# Permissions & Feature Flags Page - Analysis

**File:** `client/src/pages/permissions.tsx`  
**Status:** UI Complete, Backend Missing  
**Date:** 2025-01-27

---

## 📋 Page Overview

The Permissions & Feature Flags page provides a comprehensive interface for managing role-based permissions and feature flags across the hierarchical system (Corporate Client → Program → Location). It's accessible to `super_admin` and `program_admin` roles.

---

## 🎯 What the Page Does

### 1. **Role Permissions Management**
- **View effective permissions** - Shows what permissions the current user actually has
- **View all permissions** - Shows all permissions assigned to all roles (admin only)
- **Grant new permissions** - Allows admins to grant specific permissions to roles
- **Hierarchical filtering** - Permissions can be scoped to corporate client or program level

### 2. **Feature Flags Management**
- **View feature flags** - Lists all feature flags with their enabled/disabled status
- **Create feature flags** - Create new feature flags with optional program/corporate client scope
- **Toggle feature flags** - Enable/disable feature flags with a switch
- **Hierarchical scoping** - Feature flags can be global, program-specific, or corporate client-specific

---

## 🏗️ UI Structure

### **Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  PERMISSIONS & FEATURE FLAGS                            │
│  [Current Hierarchy Level Badge]                        │
├──────────────────────────┬──────────────────────────────┤
│  Role Permissions         │  Feature Flags               │
│  ┌────────────────────┐  │  ┌────────────────────┐     │
│  │ Grant Permission   │  │  │ Create Flag        │     │
│  │ - Role             │  │  │ - Flag Name        │     │
│  │ - Permission       │  │  │ - Program (opt)    │     │
│  │ - Resource         │  │  │ - Client (opt)     │     │
│  │ - Program (opt)    │  │  │ - Enabled toggle   │     │
│  │ [Grant Button]     │  │  │ [Create Button]    │     │
│  └────────────────────┘  │  └────────────────────┘     │
│  ┌────────────────────┐  │  ┌────────────────────┐     │
│  │ Current Permissions│  │  │ Current Flags       │     │
│  │ [List with icons]  │  │  │ [List with toggles]│     │
│  └────────────────────┘  │  └────────────────────┘     │
└──────────────────────────┴──────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  Your Effective Permissions                             │
│  [Grid of permission badges]                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Current UI Logic (As-Is)

### **1. Permission Granting Flow**

**User Actions:**
1. Select a **Role** (super_admin, program_admin, program_user, driver)
2. Select a **Permission** (VIEW_TRIPS, CREATE_TRIPS, etc.)
3. Select a **Resource** scope (`*`, `program`, `corporate_client`, `own`)
4. Optionally select a **Program** (for program-scoped permissions)
5. Click "Grant Permission"

**Expected Backend Logic:**
```typescript
POST /api/permissions/grant
Body: {
  role: "program_admin",
  permission: "VIEW_TRIPS",
  resource: "program",
  program_id: "monarch_competency" | null,
  corporate_client_id: "monarch" | null
}
```

**Backend Should:**
- Create a new `role_permissions` record
- Validate that the requesting user has permission to grant permissions
- Check for duplicate permissions (same role + permission + resource + scope)
- Return the created permission object
- Trigger cache invalidation

**Current State:** ❌ API endpoint doesn't exist, mutation will fail

---

### **2. Permission Viewing Flow**

**Effective Permissions (Current User):**
- **Endpoint:** `/api/permissions/effective` (or `/api/permissions/effective/program/:id` or `/api/permissions/effective/corporate-client/:id`)
- **Expected Response:** Array of permission strings: `["VIEW_TRIPS", "CREATE_TRIPS", ...]`
- **Logic:** Should return all permissions the current user has based on:
  - Their role's base permissions
  - Any custom permissions granted to their role
  - Scoped to current hierarchy level (program/corporate client)

**All Permissions (Admin View):**
- **Endpoint:** `/api/permissions/all` (or `/api/permissions/all/program/:id` or `/api/permissions/all/corporate-client/:id`)
- **Expected Response:** Array of `Permission` objects:
  ```typescript
  [{
    id: "perm_123",
    role: "program_admin",
    permission: "VIEW_TRIPS",
    resource: "program",
    program_id: "monarch_competency" | null,
    corporate_client_id: "monarch" | null
  }, ...]
  ```
- **Logic:** Should return all permissions in the system, filtered by hierarchy level if specified

**Current State:** 
- `/api/permissions/all` exists but returns hardcoded stub data
- `/api/permissions/effective` doesn't exist
- Hierarchical endpoints don't exist

---

### **3. Feature Flag Creation Flow**

**User Actions:**
1. Enter a **Flag Name** (e.g., "new_calendar_view")
2. Optionally select a **Program** (for program-specific flags)
3. Optionally select a **Corporate Client** (for client-specific flags)
4. Toggle **Enabled** state (default: disabled)
5. Click "Create Feature Flag"

**Expected Backend Logic:**
```typescript
POST /api/feature-flags/toggle
Body: {
  flag_name: "new_calendar_view",
  isEnabled: false,
  program_id: "monarch_competency" | null,
  corporate_client_id: "monarch" | null
}
```

**Backend Should:**
- Create a new `feature_flags` record
- Validate flag name uniqueness (within scope)
- Set initial enabled state
- Return the created flag object
- Trigger cache invalidation

**Current State:** ❌ API endpoint doesn't exist, mutation will fail

---

### **4. Feature Flag Toggle Flow**

**User Actions:**
1. Click the **Switch** next to a feature flag

**Expected Backend Logic:**
```typescript
POST /api/feature-flags/toggle
Body: {
  id: "flag_123",
  isEnabled: true
}
```

**Backend Should:**
- Update the `feature_flags` record
- Validate that the requesting user has permission to toggle flags
- Return the updated flag object
- Trigger cache invalidation
- Optionally send WebSocket notification to connected clients

**Current State:** ❌ API endpoint doesn't exist, mutation will fail

---

### **5. Feature Flag Viewing Flow**

**Endpoint:** `/api/feature-flags` (or `/api/feature-flags/program/:id` or `/api/feature-flags/corporate-client/:id`)

**Expected Response:** Array of `FeatureFlag` objects:
```typescript
[{
  id: "flag_123",
  flag_name: "new_calendar_view",
  is_enabled: false,
  program_id: "monarch_competency" | null,
  corporate_client_id: "monarch" | null,
  description?: string
}, ...]
```

**Logic:** Should return all feature flags, filtered by hierarchy level if specified. Flags should inherit:
- Global flags (`program_id` and `corporate_client_id` are null) → visible everywhere
- Corporate client flags → visible for that corporate client and all its programs
- Program flags → visible only for that specific program

**Current State:** ❌ API endpoint doesn't exist, query will fail

---

## 🎨 UI Components & States

### **Permission Granting Form:**
- **Role Dropdown:** Shows all roles (super_admin, program_admin, program_user, driver)
- **Permission Dropdown:** Shows hardcoded list of 16 permissions
- **Resource Dropdown:** Shows 4 resource scopes:
  - `*` = All Resources (global permission)
  - `program` = Program-scoped permission
  - `corporate_client` = Corporate client-scoped permission
  - `own` = Own resources only (e.g., own trips)
- **Program Dropdown:** Only visible for super_admin, shows all programs
- **Grant Button:** Disabled until role, permission, and resource are selected

### **Feature Flag Creation Form:**
- **Flag Name Input:** Free text input (no validation in UI)
- **Program Dropdown:** Only visible for super_admin
- **Corporate Client Dropdown:** Only visible for super_admin
- **Enabled Toggle:** Switch for initial enabled state
- **Create Button:** Disabled until flag name is entered

### **Current Permissions List:**
- Shows permission icon (based on permission type)
- Shows permission name (formatted: "VIEW TRIPS")
- Shows resource scope and role name
- Shows resource badge
- **Missing:** No revoke/delete button (would need to be added)

### **Current Feature Flags List:**
- Shows flag icon
- Shows flag name
- Shows scope (Program name or "Global")
- Shows enabled/disabled badge
- Shows toggle switch (clicking toggles the flag)

### **Effective Permissions Display:**
- Grid layout (2 columns on mobile, 4 on desktop)
- Shows permission icon
- Shows permission name (formatted)
- **Note:** Currently expects array of strings, not objects

---

## 🔐 Access Control Logic

### **Who Can Access:**
- **super_admin:** Full access to all sections
- **program_admin:** Can view effective permissions, can view all permissions, can grant permissions, can manage feature flags
- **program_user:** Can only view their own effective permissions (but page isn't accessible to them)
- **driver:** Can only view their own effective permissions (but page isn't accessible to them)

### **Hierarchy-Based Filtering:**
The page automatically filters data based on the current hierarchy level:

**Corporate Level (super_admin):**
- Shows all permissions across all corporate clients
- Shows all feature flags (global + all corporate clients + all programs)

**Program Level:**
- Shows permissions for the selected program
- Shows feature flags for the program (global + corporate client + program-specific)

**Location Level:**
- Inherits from program level (no location-specific permissions/flags)

---

## 📊 Data Models (Expected)

### **Permission Model:**
```typescript
interface Permission {
  id: string;                    // Primary key
  role: string;                  // 'super_admin' | 'program_admin' | 'program_user' | 'driver'
  permission: string;            // 'VIEW_TRIPS' | 'CREATE_TRIPS' | etc.
  resource: string;              // '*' | 'program' | 'corporate_client' | 'own'
  program_id?: string | null;    // Optional: scope to specific program
  corporate_client_id?: string | null;  // Optional: scope to specific corporate client
  created_at: timestamp;
  updated_at: timestamp;
}
```

### **Feature Flag Model:**
```typescript
interface FeatureFlag {
  id: string;                    // Primary key
  flag_name: string;             // Unique flag identifier (e.g., 'new_calendar_view')
  is_enabled: boolean;           // Current enabled state
  description?: string;          // Optional description
  program_id?: string | null;    // Optional: scope to specific program
  corporate_client_id?: string | null;  // Optional: scope to specific corporate client
  created_at: timestamp;
  updated_at: timestamp;
}
```

---

## 🔄 Expected Backend Logic (If Using Current UI)

### **1. Permission Inheritance Logic**

**When checking if a user has a permission:**

```typescript
function hasPermission(
  userId: string,
  permission: string,
  resource?: string,
  programId?: string,
  corporateClientId?: string
): boolean {
  const user = getUser(userId);
  
  // 1. Check hardcoded role permissions (fallback)
  if (ROLE_PERMISSIONS[user.role].includes(permission)) {
    return true;
  }
  
  // 2. Check database permissions
  const dbPermissions = getPermissionsForUser(userId, programId, corporateClientId);
  
  // 3. Check for exact match
  const exactMatch = dbPermissions.find(p => 
    p.permission === permission &&
    (p.resource === '*' || p.resource === resource) &&
    (p.program_id === null || p.program_id === programId) &&
    (p.corporate_client_id === null || p.corporate_client_id === corporateClientId)
  );
  
  if (exactMatch) return true;
  
  // 4. Check for program-level permission (if requesting program-specific)
  if (programId) {
    const programMatch = dbPermissions.find(p =>
      p.permission === permission &&
      (p.resource === '*' || p.resource === 'program') &&
      p.program_id === programId
    );
    if (programMatch) return true;
  }
  
  // 5. Check for corporate-level permission (if requesting corporate-specific)
  if (corporateClientId) {
    const corporateMatch = dbPermissions.find(p =>
      p.permission === permission &&
      (p.resource === '*' || p.resource === 'corporate_client') &&
      p.corporate_client_id === corporateClientId
    );
    if (corporateMatch) return true;
  }
  
  // 6. Check for global permission
  const globalMatch = dbPermissions.find(p =>
    p.permission === permission &&
    p.resource === '*' &&
    p.program_id === null &&
    p.corporate_client_id === null
  );
  
  return !!globalMatch;
}
```

### **2. Feature Flag Resolution Logic**

**When checking if a feature flag is enabled:**

```typescript
function isFeatureFlagEnabled(
  flagName: string,
  programId?: string,
  corporateClientId?: string
): boolean {
  // 1. Check for program-specific flag
  if (programId) {
    const programFlag = getFeatureFlag(flagName, programId, null);
    if (programFlag) return programFlag.is_enabled;
  }
  
  // 2. Check for corporate client-specific flag
  if (corporateClientId) {
    const clientFlag = getFeatureFlag(flagName, null, corporateClientId);
    if (clientFlag) return clientFlag.is_enabled;
  }
  
  // 3. Check for global flag
  const globalFlag = getFeatureFlag(flagName, null, null);
  if (globalFlag) return globalFlag.is_enabled;
  
  // 4. Default to disabled if flag doesn't exist
  return false;
}
```

**Flag Inheritance Order (Most Specific Wins):**
1. Program-specific flag (most specific)
2. Corporate client-specific flag
3. Global flag (least specific)

---

## ⚠️ Current Limitations & Issues

### **1. Missing Backend Endpoints:**
- ❌ `GET /api/permissions/effective` - Returns current user's effective permissions
- ❌ `GET /api/permissions/effective/program/:id` - Program-scoped effective permissions
- ❌ `GET /api/permissions/effective/corporate-client/:id` - Corporate-scoped effective permissions
- ❌ `GET /api/permissions/all` - Returns hardcoded stub (needs real implementation)
- ❌ `GET /api/permissions/all/program/:id` - Program-scoped all permissions
- ❌ `GET /api/permissions/all/corporate-client/:id` - Corporate-scoped all permissions
- ❌ `POST /api/permissions/grant` - Grant new permission
- ❌ `DELETE /api/permissions/:id` - Revoke permission (UI doesn't have delete button yet)
- ❌ `GET /api/feature-flags` - Get all feature flags
- ❌ `GET /api/feature-flags/program/:id` - Program-scoped feature flags
- ❌ `GET /api/feature-flags/corporate-client/:id` - Corporate-scoped feature flags
- ❌ `POST /api/feature-flags/toggle` - Toggle or create feature flag

### **2. UI Limitations:**
- ❌ No "Revoke Permission" button (would need to be added)
- ❌ No "Delete Feature Flag" button (would need to be added)
- ❌ No permission editing (only create/delete)
- ❌ No feature flag editing (only create/toggle)
- ❌ No validation for flag name format (should be snake_case)
- ❌ No duplicate permission checking in UI (backend should handle)

### **3. Data Model Issues:**
- ❌ `effectivePermissions` expects array of strings, but backend might return objects
- ❌ No `description` field shown for feature flags (exists in model but not displayed)
- ❌ No `created_at` or `updated_at` timestamps displayed

---

## 🎯 How It Would Work (If Backend Implemented)

### **Example: Granting a Permission**

**User Flow:**
1. Super admin navigates to `/permissions`
2. Selects "Program Manager" role
3. Selects "VIEW_TRIPS" permission
4. Selects "program" resource
5. Selects "Monarch Competency" program
6. Clicks "Grant Permission"

**Backend Flow:**
1. Receives `POST /api/permissions/grant` with:
   ```json
   {
     "role": "program_admin",
     "permission": "VIEW_TRIPS",
     "resource": "program",
     "program_id": "monarch_competency",
     "corporate_client_id": null
   }
   ```
2. Validates user is super_admin or program_admin
3. Checks for duplicate (same role + permission + resource + program_id)
4. Creates `role_permissions` record:
   ```sql
   INSERT INTO role_permissions (id, role, permission, resource, program_id, corporate_client_id)
   VALUES ('perm_123', 'program_admin', 'VIEW_TRIPS', 'program', 'monarch_competency', NULL);
   ```
5. Returns created permission object
6. Frontend invalidates cache and refetches permissions list

**Result:**
- All users with `program_admin` role now have `VIEW_TRIPS` permission for the "Monarch Competency" program
- This permission is checked when they try to view trips for that program

---

### **Example: Creating a Feature Flag**

**User Flow:**
1. Super admin navigates to `/permissions`
2. Enters "new_calendar_view" as flag name
3. Selects "Monarch Competency" program
4. Toggles "Enabled" to ON
5. Clicks "Create Feature Flag"

**Backend Flow:**
1. Receives `POST /api/feature-flags/toggle` with:
   ```json
   {
     "flag_name": "new_calendar_view",
     "isEnabled": true,
     "program_id": "monarch_competency",
     "corporate_client_id": null
   }
   ```
2. Validates user is super_admin or program_admin
3. Checks flag name uniqueness within program scope
4. Creates `feature_flags` record:
   ```sql
   INSERT INTO feature_flags (id, flag_name, is_enabled, program_id, corporate_client_id)
   VALUES ('flag_123', 'new_calendar_view', true, 'monarch_competency', NULL);
   ```
5. Returns created flag object
6. Frontend invalidates cache and refetches flags list

**Result:**
- Feature flag "new_calendar_view" is enabled for "Monarch Competency" program
- Frontend can check `isFeatureFlagEnabled('new_calendar_view', 'monarch_competency')` to conditionally show new calendar

---

### **Example: Checking Effective Permissions**

**User Flow:**
1. Program admin navigates to `/permissions`
2. Page loads and fetches effective permissions

**Backend Flow:**
1. Receives `GET /api/permissions/effective/program/monarch_competency`
2. Gets current user's role: `program_admin`
3. Gets base permissions from `ROLE_PERMISSIONS.program_admin`
4. Gets custom permissions from database:
   ```sql
   SELECT permission FROM role_permissions
   WHERE role = 'program_admin'
   AND (program_id = 'monarch_competency' OR program_id IS NULL)
   AND (corporate_client_id = 'monarch' OR corporate_client_id IS NULL);
   ```
5. Merges and deduplicates permissions
6. Returns array: `["VIEW_TRIPS", "CREATE_TRIPS", "VIEW_CLIENTS", ...]`

**Result:**
- "Your Effective Permissions" section shows all permissions the user actually has
- This is what's used for UI visibility and backend authorization checks

---

## 🔧 Integration Points

### **1. With Authorization Middleware**
The permissions system should integrate with `server/auth.ts`:

```typescript
// Current (hardcoded):
export function requirePermission(permission: Permission) {
  return (req, res, next) => {
    if (hasPermission(req.user.role, permission)) {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
}

// Should become (database-backed):
export function requirePermission(permission: Permission) {
  return async (req, res, next) => {
    const hasPerm = await checkUserPermission(
      req.user.user_id,
      permission,
      req.user.program_id,
      req.user.corporate_client_id
    );
    if (hasPerm) {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
}
```

### **2. With Feature Flag Checks**
Feature flags should be checkable throughout the app:

```typescript
// In any component:
const { data: isNewCalendarEnabled } = useQuery({
  queryKey: ['/api/feature-flags/check', 'new_calendar_view', selectedProgram],
  queryFn: async () => {
    const response = await apiRequest('GET', `/api/feature-flags/check/new_calendar_view?program=${selectedProgram}`);
    return await response.json();
  }
});

if (isNewCalendarEnabled) {
  return <NewCalendar />;
} else {
  return <OldCalendar />;
}
```

### **3. With Hierarchy System**
The page automatically adapts to the current hierarchy level:

- **Corporate level:** Shows all permissions/flags across all clients
- **Program level:** Shows permissions/flags for selected program
- **Location level:** Inherits from program level

---

## 📝 Summary

### **What Works:**
✅ Complete UI for permissions management  
✅ Complete UI for feature flags management  
✅ Hierarchical filtering logic (frontend)  
✅ Role-based access control (frontend)  
✅ Form validation and state management  
✅ Loading states and error handling  

### **What Doesn't Work:**
❌ All API endpoints are missing or return stub data  
❌ No database persistence  
❌ No actual permission checking integration  
❌ No feature flag checking integration  
❌ No revoke/delete functionality in UI  

### **What Would Need to Be Built:**
1. **Database Tables:** `role_permissions`, `feature_flags`
2. **Storage Layers:** `permissions-storage.ts`, `feature-flags-storage.ts`
3. **API Routes:** Full CRUD endpoints for both permissions and feature flags
4. **Authorization Integration:** Update `requirePermission` middleware to use database
5. **Feature Flag Utilities:** Helper functions to check flags throughout the app
6. **UI Enhancements:** Add revoke/delete buttons, edit functionality

---

**The UI is production-ready and well-designed. It just needs the backend implementation to make it functional.**

