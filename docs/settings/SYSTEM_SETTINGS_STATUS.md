# System Settings & Hierarchical Permissions - Status Report

**Date:** 2025-01-27  
**Status:** Partially Functional - UI Complete, Backend Missing

---

## ✅ What's Already Functional

### 1. **Settings Page UI** (`client/src/pages/settings.tsx`)
- ✅ Role-based tab visibility (super_admin sees all tabs including System)
- ✅ Profile Settings tab (all roles)
- ✅ Corporate Client Settings tab (corporate_admin, super_admin)
- ✅ Program Settings tab (program_admin, corporate_admin, super_admin)
- ✅ Users tab (redirects to Users page)
- ✅ Contacts Directory tab (all roles)
- ✅ Notifications Settings tab (all roles)
- ✅ **System Settings tab UI** (super_admin only) - **UI ONLY, NO PERSISTENCE**

### 2. **Permissions Page UI** (`client/src/pages/permissions.tsx`)
- ✅ Role hierarchy display (super_admin, program_admin, program_user, driver)
- ✅ Effective permissions viewer
- ✅ All permissions viewer (admin only)
- ✅ Feature flags viewer
- ✅ Permission granting UI
- ✅ Feature flag toggle UI
- ⚠️ **All API calls fail** - backend endpoints don't exist

### 3. **User Management** (`client/src/pages/users.tsx`)
- ✅ User CRUD operations
- ✅ Role assignment (super_admin can create super_admin users)
- ✅ Program assignment (super_admin can assign users to programs)
- ✅ Active/inactive status management
- ✅ Hierarchical filtering based on current level

### 4. **Backend Permission System** (`server/permissions.ts`)
- ✅ Hardcoded permission constants (`PERMISSIONS` object)
- ✅ Role-based permission mapping (`ROLE_PERMISSIONS`)
- ✅ Permission checking functions (`hasPermission`, `canAccessProgram`, etc.)
- ✅ Role hierarchy functions (`getRoleLevel`, `canManageRole`)
- ✅ Used throughout backend routes for authorization
- ⚠️ **No database persistence** - permissions are hardcoded

### 5. **Hierarchy System** (`client/src/hooks/useHierarchy.tsx`)
- ✅ 3-level hierarchy support (corporate → program → location)
- ✅ URL-based navigation
- ✅ Filter parameter generation
- ✅ Page title generation
- ✅ Used throughout frontend for data filtering

---

## ❌ What's Missing

### 1. **System Settings Backend**
- ❌ No `system_settings` database table
- ❌ No `/api/system-settings` GET endpoint
- ❌ No `/api/system-settings` PUT endpoint
- ❌ No storage layer (`system-settings-storage.ts`)
- ❌ `handleSaveSystem()` only shows toast, doesn't persist

**Current State:**
- UI exists with fields: app_name, main_logo_url, support_email, support_phone, timezone, language
- All values are hardcoded defaults in component state
- No backend integration

### 2. **Permissions Backend API**
- ❌ No `role_permissions` database table
- ❌ No `/api/permissions/effective` endpoint (frontend expects this)
- ❌ No `/api/permissions/effective/program/:id` endpoint
- ❌ No `/api/permissions/effective/corporate-client/:id` endpoint
- ❌ No `/api/permissions/all` endpoint (only hardcoded stub exists)
- ❌ No `/api/permissions/all/program/:id` endpoint
- ❌ No `/api/permissions/all/corporate-client/:id` endpoint
- ❌ No `/api/permissions/grant` POST endpoint
- ❌ No `/api/permissions/revoke` endpoint

**Current State:**
- Permissions are hardcoded in `server/permissions.ts`
- `/api/permissions/all` returns hardcoded array (bypasses auth)
- Frontend expects full CRUD API that doesn't exist

### 3. **Feature Flags Backend API**
- ❌ No `feature_flags` database table
- ❌ No `/api/feature-flags` GET endpoint
- ❌ No `/api/feature-flags/program/:id` endpoint
- ❌ No `/api/feature-flags/corporate-client/:id` endpoint
- ❌ No `/api/feature-flags/toggle` POST endpoint
- ❌ No `/api/feature-flags/create` endpoint

**Current State:**
- Frontend has full UI for feature flags
- No backend support exists

### 4. **User Settings at Hierarchy Levels**
- ❌ No user-specific settings storage
- ❌ No program-level user settings
- ❌ No corporate-client-level user settings
- ❌ Settings page only shows current user profile, not hierarchical settings

---

## 📋 Prioritized Todo List

### **Phase 1: System Settings (Critical - Super Admin Only)** 🔴

**Priority: HIGH**  
**Estimated Time: 2-3 hours**

#### 1.1 Database Schema
- [ ] Create `system_settings` table migration
  - Fields: `id` (VARCHAR, PRIMARY KEY), `app_name` (VARCHAR), `main_logo_url` (TEXT), `support_email` (VARCHAR), `support_phone` (VARCHAR), `timezone` (VARCHAR), `language` (VARCHAR), `created_at`, `updated_at`
  - Single row constraint (only one system settings record)
  - Default values for initial row

#### 1.2 Backend Storage Layer
- [ ] Create `server/system-settings-storage.ts`
  - `getSystemSettings()` - Get current system settings
  - `updateSystemSettings(settings)` - Update system settings
  - Initialize default settings if none exist

#### 1.3 Backend API Routes
- [ ] Create `server/routes/system-settings.ts`
  - `GET /api/system-settings` - Get current settings (super_admin only)
  - `PUT /api/system-settings` - Update settings (super_admin only)
  - Add to `server/routes/index.ts`

#### 1.4 Frontend Integration
- [ ] Update `client/src/pages/settings.tsx`
  - Add `useQuery` to fetch system settings on mount
  - Update `handleSaveSystem` to call API
  - Add loading and error states
  - Invalidate queries on success

#### 1.5 Testing
- [ ] Test system settings CRUD operations
- [ ] Test super_admin access control
- [ ] Test default values initialization

---

### **Phase 2: Permissions Database & API (High Priority)** 🟠

**Priority: HIGH**  
**Estimated Time: 4-5 hours**

#### 2.1 Database Schema
- [ ] Create `role_permissions` table migration
  - Fields: `id` (VARCHAR, PRIMARY KEY), `role` (VARCHAR), `permission` (VARCHAR), `resource` (VARCHAR), `program_id` (VARCHAR, nullable), `corporate_client_id` (VARCHAR, nullable), `created_at`, `updated_at`
  - Indexes on `role`, `permission`, `program_id`, `corporate_client_id`
  - Foreign keys to `programs` and `corporate_clients` tables

#### 2.2 Initial Data Migration
- [ ] Create migration to populate `role_permissions` from hardcoded `ROLE_PERMISSIONS`
  - Convert all hardcoded permissions to database records
  - Set appropriate `program_id` and `corporate_client_id` (null for global)

#### 2.3 Backend Storage Layer
- [ ] Create `server/permissions-storage.ts`
  - `getEffectivePermissions(userId, level, corporateClientId?, programId?)` - Get user's effective permissions
  - `getAllPermissions(level, corporateClientId?, programId?)` - Get all permissions for level
  - `grantPermission(data)` - Grant permission to role
  - `revokePermission(permissionId)` - Revoke permission
  - `checkPermission(userId, permission, resource)` - Check if user has permission

#### 2.4 Backend API Routes
- [ ] Create `server/routes/permissions.ts`
  - `GET /api/permissions/effective` - Get current user's effective permissions
  - `GET /api/permissions/effective/program/:id` - Get effective permissions for program
  - `GET /api/permissions/effective/corporate-client/:id` - Get effective permissions for corporate client
  - `GET /api/permissions/all` - Get all permissions (admin only)
  - `GET /api/permissions/all/program/:id` - Get all permissions for program
  - `GET /api/permissions/all/corporate-client/:id` - Get all permissions for corporate client
  - `POST /api/permissions/grant` - Grant permission (super_admin only)
  - `DELETE /api/permissions/:id` - Revoke permission (super_admin only)
  - Add to `server/routes/index.ts`

#### 2.5 Update Permission Checking
- [ ] Update `server/auth.ts` to use database permissions instead of hardcoded
  - Modify `requirePermission` middleware to query database
  - Cache permissions for performance
  - Fallback to hardcoded permissions if database unavailable

#### 2.6 Frontend Integration
- [ ] Update `client/src/pages/permissions.tsx`
  - Fix API endpoint calls (they're already correct, just need backend)
  - Add error handling for failed API calls
  - Test permission granting/revoking

#### 2.7 Testing
- [ ] Test permission CRUD operations
- [ ] Test hierarchical permission filtering
- [ ] Test permission checking in routes
- [ ] Test super_admin access control

---

### **Phase 3: Feature Flags Database & API (Medium Priority)** 🟡

**Priority: MEDIUM**  
**Estimated Time: 3-4 hours**

#### 3.1 Database Schema
- [ ] Create `feature_flags` table migration
  - Fields: `id` (VARCHAR, PRIMARY KEY), `flag_name` (VARCHAR, UNIQUE), `is_enabled` (BOOLEAN), `program_id` (VARCHAR, nullable), `corporate_client_id` (VARCHAR, nullable), `description` (TEXT), `created_at`, `updated_at`
  - Indexes on `flag_name`, `program_id`, `corporate_client_id`
  - Foreign keys to `programs` and `corporate_clients` tables

#### 3.2 Backend Storage Layer
- [ ] Create `server/feature-flags-storage.ts`
  - `getFeatureFlags(level, corporateClientId?, programId?)` - Get feature flags for level
  - `toggleFeatureFlag(flagId, isEnabled)` - Toggle feature flag
  - `createFeatureFlag(data)` - Create new feature flag
  - `deleteFeatureFlag(flagId)` - Delete feature flag

#### 3.3 Backend API Routes
- [ ] Create `server/routes/feature-flags.ts`
  - `GET /api/feature-flags` - Get feature flags (admin only)
  - `GET /api/feature-flags/program/:id` - Get feature flags for program
  - `GET /api/feature-flags/corporate-client/:id` - Get feature flags for corporate client
  - `POST /api/feature-flags/toggle` - Toggle feature flag (admin only)
  - `POST /api/feature-flags/create` - Create feature flag (super_admin only)
  - `DELETE /api/feature-flags/:id` - Delete feature flag (super_admin only)
  - Add to `server/routes/index.ts`

#### 3.4 Frontend Integration
- [ ] Update `client/src/pages/permissions.tsx`
  - Fix API endpoint calls (they're already correct, just need backend)
  - Add error handling
  - Test feature flag toggling

#### 3.5 Testing
- [ ] Test feature flag CRUD operations
- [ ] Test hierarchical feature flag filtering
- [ ] Test feature flag inheritance (corporate → program)

---

### **Phase 4: User Settings at Hierarchy Levels (Low Priority)** 🟢

**Priority: LOW**  
**Estimated Time: 2-3 hours**

#### 4.1 Database Schema
- [ ] Create `user_settings` table migration
  - Fields: `id` (VARCHAR, PRIMARY KEY), `user_id` (VARCHAR), `setting_key` (VARCHAR), `setting_value` (JSONB), `program_id` (VARCHAR, nullable), `corporate_client_id` (VARCHAR, nullable), `created_at`, `updated_at`
  - Unique constraint on `(user_id, setting_key, program_id, corporate_client_id)`
  - Foreign keys to `users`, `programs`, `corporate_clients`

#### 4.2 Backend Storage Layer
- [ ] Create `server/user-settings-storage.ts`
  - `getUserSettings(userId, level, corporateClientId?, programId?)` - Get user settings
  - `setUserSetting(userId, key, value, programId?, corporateClientId?)` - Set user setting
  - `getUserSetting(userId, key, programId?, corporateClientId?)` - Get specific setting

#### 4.3 Backend API Routes
- [ ] Create `server/routes/user-settings.ts`
  - `GET /api/user-settings` - Get current user's settings
  - `GET /api/user-settings/program/:id` - Get user settings for program
  - `GET /api/user-settings/corporate-client/:id` - Get user settings for corporate client
  - `PUT /api/user-settings/:key` - Update user setting
  - Add to `server/routes/index.ts`

#### 4.4 Frontend Integration
- [ ] Update `client/src/pages/settings.tsx`
  - Add user settings section per hierarchy level
  - Allow users to configure settings per program/corporate client

#### 4.5 Testing
- [ ] Test user settings CRUD operations
- [ ] Test hierarchical settings inheritance

---

## 📊 Summary Statistics

### Functional Components
- ✅ **Settings Page UI:** 100% complete
- ✅ **Permissions Page UI:** 100% complete
- ✅ **User Management:** 100% complete
- ✅ **Backend Permission Logic:** 100% complete (hardcoded)
- ✅ **Hierarchy System:** 100% complete

### Missing Backend Components
- ❌ **System Settings:** 0% (UI only)
- ❌ **Permissions API:** 0% (hardcoded only)
- ❌ **Feature Flags API:** 0% (UI only)
- ❌ **User Settings API:** 0% (not implemented)

### Estimated Total Time
- **Phase 1 (System Settings):** 2-3 hours
- **Phase 2 (Permissions):** 4-5 hours
- **Phase 3 (Feature Flags):** 3-4 hours
- **Phase 4 (User Settings):** 2-3 hours
- **Total:** 11-15 hours

---

## 🎯 Recommended Implementation Order

1. **Start with Phase 1 (System Settings)** - Simplest, super_admin only, immediate value
2. **Then Phase 2 (Permissions)** - Most critical for security and access control
3. **Then Phase 3 (Feature Flags)** - Useful for feature rollouts
4. **Finally Phase 4 (User Settings)** - Nice-to-have, can be deferred

---

## 🔍 Key Files Reference

### Frontend
- `client/src/pages/settings.tsx` - Settings page (UI complete)
- `client/src/pages/permissions.tsx` - Permissions page (UI complete, API missing)
- `client/src/pages/users.tsx` - User management (fully functional)
- `client/src/hooks/useHierarchy.tsx` - Hierarchy system (fully functional)

### Backend
- `server/permissions.ts` - Permission constants and logic (hardcoded)
- `server/auth.ts` - Permission checking middleware (uses hardcoded permissions)
- `server/routes/index.ts` - Route registration (no system-settings, permissions, or feature-flags routes)

### Database
- `server/create-complete-schema.sql` - Database schema (no system_settings, role_permissions, or feature_flags tables)

---

**Next Steps:** Start with Phase 1 (System Settings) to get immediate value with minimal complexity.

