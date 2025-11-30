# Phase 2: Permissions Database & API - Implementation Summary

**Date:** 2025-01-27  
**Status:** ✅ Implementation Complete - Ready for Testing

---

## ✅ What Was Implemented

### 1. Database Schema
- ✅ Created `migrations/0029_create_role_permissions_table.sql`
  - Table: `role_permissions` with fields: `id`, `role`, `permission`, `resource`, `program_id`, `corporate_client_id`, `created_at`, `updated_at`
  - Indexes on `role`, `permission`, `resource`, `program_id`, `corporate_client_id`
  - Foreign keys to `programs` and `corporate_clients` tables
  - Row Level Security (RLS) policies
  - Auto-update trigger for `updated_at`

### 2. Initial Data Migration
- ✅ Created `migrations/0030_populate_role_permissions_from_hardcoded.sql`
  - Populates `role_permissions` table from hardcoded `ROLE_PERMISSIONS` in `server/permissions.ts`
  - Inserts permissions for all 5 roles: `super_admin`, `corporate_admin`, `program_admin`, `program_user`, `driver`
  - Uses `ON CONFLICT DO NOTHING` to prevent duplicates

### 3. Schema Definition
- ✅ Updated `shared/schema.ts`
  - Added `rolePermissions` table definition
  - Added `insertRolePermissionSchema` and `selectRolePermissionSchema`
  - Added `RolePermission` and `InsertRolePermission` types

### 4. Backend Storage Layer
- ✅ Created `server/permissions-storage.ts`
  - `getEffectivePermissions()` - Get user's effective permissions with hierarchy support
  - `getAllPermissions()` - Get all permissions for a hierarchy level (admin only)
  - `grantPermission()` - Grant permission to a role
  - `revokePermission()` - Revoke permission by ID
  - `checkPermission()` - Check if user has specific permission
  - Includes migration error handling with helpful messages

### 5. Backend API Routes
- ✅ Created `server/routes/permissions.ts`
  - `GET /api/permissions/effective` - Get current user's effective permissions
  - `GET /api/permissions/effective/program/:id` - Get effective permissions for program
  - `GET /api/permissions/effective/corporate-client/:id` - Get effective permissions for corporate client
  - `GET /api/permissions/all` - Get all permissions (admin only)
  - `GET /api/permissions/all/program/:id` - Get all permissions for program
  - `GET /api/permissions/all/corporate-client/:id` - Get all permissions for corporate client
  - `POST /api/permissions/grant` - Grant permission (super_admin only)
  - `DELETE /api/permissions/:id` - Revoke permission (super_admin only)
  - All routes include proper authentication and authorization
  - Error handling with migration requirement detection

### 6. Route Registration
- ✅ Updated `server/routes/index.ts`
  - Registered `/api/permissions` routes

### 7. Permission Checking Update
- ✅ Updated `server/auth.ts`
  - Modified `requirePermission()` to use database permissions first
  - Falls back to hardcoded permissions if database table doesn't exist
  - Supports hierarchy-aware permission checking (program_id, corporate_client_id)
  - Maintains backward compatibility

---

## 📋 Next Steps: Testing

### Step 1: Run Migrations
```bash
# Run the migrations in order:
# 1. Create the table
psql -d your_database -f migrations/0029_create_role_permissions_table.sql

# 2. Populate initial data
psql -d your_database -f migrations/0030_populate_role_permissions_from_hardcoded.sql
```

Or use Supabase SQL Editor:
1. Open Supabase Dashboard → SQL Editor
2. Run `migrations/0029_create_role_permissions_table.sql`
3. Run `migrations/0030_populate_role_permissions_from_hardcoded.sql`

### Step 2: Restart Backend Server
```bash
# Restart the backend server to load new routes
npm run dev
```

### Step 3: Test API Endpoints

#### Test 1: Get Effective Permissions
```bash
# As authenticated user
curl -X GET http://localhost:8081/api/permissions/effective \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: Returns array of permissions for current user's role

#### Test 2: Get All Permissions (Super Admin)
```bash
# As super_admin
curl -X GET http://localhost:8081/api/permissions/all \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```

Expected: Returns all permissions for all roles

#### Test 3: Grant Permission (Super Admin)
```bash
# As super_admin
curl -X POST http://localhost:8081/api/permissions/grant \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "program_user",
    "permission": "manage_trips",
    "resource": "*"
  }'
```

Expected: Creates new permission record

#### Test 4: Revoke Permission (Super Admin)
```bash
# As super_admin (use ID from previous grant)
curl -X DELETE http://localhost:8081/api/permissions/PERMISSION_ID \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```

Expected: Deletes permission record

### Step 4: Test Frontend Integration
1. Navigate to `/permissions` page
2. Verify "Effective Permissions" section loads
3. Verify "All Permissions" section loads (for admins)
4. Test granting a new permission
5. Test revoking a permission
6. Verify permissions update correctly

### Step 5: Test Permission Checking
1. Test routes that use `requirePermission()` middleware
2. Verify permissions are checked correctly
3. Verify fallback to hardcoded permissions works if database unavailable

---

## 🔍 Key Features

### Hierarchy-Aware Permissions
- Permissions can be scoped to:
  - **Global** (`program_id` = NULL, `corporate_client_id` = NULL)
  - **Corporate Client** (`corporate_client_id` set)
  - **Program** (`program_id` set)

### Effective Permissions Resolution
When checking permissions, the system checks in this order:
1. Program-specific permissions (most specific)
2. Corporate client-specific permissions
3. Global permissions (least specific)

### Backward Compatibility
- If `role_permissions` table doesn't exist, falls back to hardcoded permissions
- No breaking changes to existing functionality
- Gradual migration path

---

## ⚠️ Important Notes

1. **Migration Order**: Run migrations in order (0029, then 0030)
2. **RLS Policies**: Only `super_admin` can insert/update/delete permissions
3. **Unique Constraint**: Prevents duplicate permissions for same role/resource/scope
4. **Cascade Deletes**: Permissions are deleted when programs/corporate clients are deleted

---

## 🐛 Troubleshooting

### Error: "role_permissions table does not exist"
- **Solution**: Run migrations `0029` and `0030`

### Error: "Permission already exists"
- **Solution**: Permission already granted for that role/resource/scope combination

### Permissions not loading in frontend
- **Check**: Backend server restarted after adding routes?
- **Check**: User has correct role (super_admin for all permissions)?
- **Check**: Network tab for API errors

### Fallback to hardcoded permissions
- **Expected**: If database table doesn't exist, system falls back automatically
- **Check**: Console logs for "⚠️ Database permissions not available" warning

---

## 📊 Database Schema

```sql
CREATE TABLE role_permissions (
    id VARCHAR(50) PRIMARY KEY,
    role user_role NOT NULL,
    permission VARCHAR(100) NOT NULL,
    resource VARCHAR(50) NOT NULL DEFAULT '*',
    program_id VARCHAR(50) NULL,
    corporate_client_id VARCHAR(50) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## ✅ Success Criteria

- [ ] Migrations run successfully
- [ ] API endpoints return correct data
- [ ] Frontend permissions page loads
- [ ] Granting permissions works
- [ ] Revoking permissions works
- [ ] Permission checking works in routes
- [ ] Fallback to hardcoded permissions works

---

**Ready for testing!** Start with Step 1 (Run Migrations).

