# Hybrid RBAC Testing Checklist

## Pre-Testing Setup

- [ ] **Database Migration**
  - [ ] Backup production database (if testing on production-like data)
  - [ ] Run migration `0050_hybrid_rbac_tenant_roles.sql` in test environment
  - [ ] Verify no errors during migration
  - [ ] Check that existing data is preserved

- [ ] **Environment Verification**
  - [ ] Backend server is running
  - [ ] Frontend dev server is running
  - [ ] Database connection is active
  - [ ] User is logged in as `corporate_admin` or `super_admin`

---

## Critical Tests

### 1. Database Schema Tests

- [ ] **Verify Tables Created**
  ```sql
  SELECT * FROM tenant_roles LIMIT 1;
  SELECT * FROM users WHERE tenant_role_id IS NOT NULL LIMIT 1;
  SELECT * FROM role_permissions WHERE role_type = 'tenant' LIMIT 1;
  ```

- [ ] **Verify Columns Added**
  - [ ] `users.tenant_role_id` exists and is nullable
  - [ ] `users.active_tenant_id` exists and is nullable
  - [ ] `role_permissions.role_type` exists with CHECK constraint

- [ ] **Verify Default Tenant Roles Created**
  ```sql
  SELECT COUNT(*) FROM tenant_roles WHERE name LIKE '%_corporate_admin_%';
  SELECT COUNT(*) FROM tenant_roles WHERE name LIKE '%_program_admin_%';
  ```
  Should have at least one role per corporate client for each system role.

- [ ] **Verify Permissions Seeded**
  ```sql
  SELECT COUNT(*) FROM role_permissions WHERE role_type = 'tenant';
  ```
  Should have permissions for each default tenant role.

---

### 2. Backend API Tests

#### Tenant Roles Endpoints

- [ ] **GET /api/tenant-roles**
  - [ ] Returns list of tenant roles for corporate client
  - [ ] Returns empty array if no roles exist
  - [ ] Respects corporate client scoping (can't see other clients' roles)

- [ ] **POST /api/tenant-roles**
  - [ ] Creates new tenant role successfully
  - [ ] Returns 400 if name is missing
  - [ ] Returns 409 if role name already exists for corporate client
  - [ ] Sets `created_by` to current user

- [ ] **GET /api/tenant-roles/:id**
  - [ ] Returns role details
  - [ ] Returns 404 if role doesn't exist
  - [ ] Returns 403 if accessing other corporate client's role

- [ ] **PUT /api/tenant-roles/:id**
  - [ ] Updates role name, description, is_active
  - [ ] Returns 409 if new name conflicts
  - [ ] Updates `updated_at` timestamp

- [ ] **DELETE /api/tenant-roles/:id**
  - [ ] Soft deletes (sets is_active=false)
  - [ ] Returns 409 if role is assigned to users
  - [ ] Returns 404 if role doesn't exist

#### Permissions Endpoints

- [ ] **GET /api/tenant-roles/:id/permissions**
  - [ ] Returns permissions for role
  - [ ] Returns empty array if no permissions

- [ ] **POST /api/tenant-roles/:id/permissions**
  - [ ] Adds permission to role
  - [ ] Returns 409 if permission already exists
  - [ ] Links permission to corporate client

- [ ] **POST /api/tenant-roles/:id/permissions/bulk**
  - [ ] Replaces all permissions
  - [ ] Handles empty array (removes all permissions)
  - [ ] Updates permissions atomically

#### User Assignment Endpoints

- [ ] **POST /api/users/:userId/assign-role**
  - [ ] Assigns tenant role to user
  - [ ] Sets `active_tenant_id` to corporate client
  - [ ] Returns 404 if user or role doesn't exist
  - [ ] Returns 403 if accessing other corporate client

- [ ] **DELETE /api/users/:userId/assign-role**
  - [ ] Removes tenant role assignment
  - [ ] Sets `tenant_role_id` and `active_tenant_id` to NULL

---

### 3. Authorization Service Tests

- [ ] **getUserPermissions(userId, corporateClientId)**
  - [ ] Returns system role permissions if no tenant role assigned
  - [ ] Returns combined permissions (system + tenant) if tenant role assigned
  - [ ] Deduplicates permissions correctly
  - [ ] Handles users with no role gracefully

- [ ] **hasPermission(userId, permission, resource, corporateClientId)**
  - [ ] Returns true for system role permissions
  - [ ] Returns true for tenant role permissions
  - [ ] Returns false for missing permissions
  - [ ] Works with both system and tenant roles

- [ ] **getEffectiveRoleName(userId)**
  - [ ] Returns tenant role name if assigned
  - [ ] Returns system role name if no tenant role
  - [ ] Handles null/undefined gracefully

---

### 4. Frontend Component Tests

#### Tenant Roles Management Page

- [ ] **Page Loads**
  - [ ] Settings → Tenant Roles tab is visible (for corporate_admin/super_admin)
  - [ ] Tab is hidden for other roles
  - [ ] Shows "No tenant roles" message if empty

- [ ] **Create Role**
  - [ ] "Create Role" button opens dialog
  - [ ] Form validation works (name required)
  - [ ] Creates role successfully
  - [ ] Shows success toast
  - [ ] New role appears in list
  - [ ] Dialog closes after creation

- [ ] **Edit Role**
  - [ ] Edit button opens dialog with current values
  - [ ] Updates role successfully
  - [ ] Shows success toast
  - [ ] Changes reflect in list

- [ ] **Delete Role**
  - [ ] Delete button shows confirmation
  - [ ] Soft deletes role (sets inactive)
  - [ ] Shows error if role is assigned to users
  - [ ] Role disappears from active list

- [ ] **Search Functionality**
  - [ ] Search filters roles by name
  - [ ] Search filters roles by description
  - [ ] Shows "No results" for no matches

#### Permissions Management Dialog

- [ ] **Dialog Opens**
  - [ ] "Manage" button opens permissions dialog
  - [ ] Shows role name in dialog title
  - [ ] Permissions are grouped by category

- [ ] **Permission Selection**
  - [ ] Clicking permission toggles selection
  - [ ] Selected permissions show checkmark
  - [ ] Unselected permissions show X
  - [ ] Permission count updates correctly

- [ ] **Save Permissions**
  - [ ] "Save Permissions" button saves changes
  - [ ] Shows success toast
  - [ ] Dialog closes after save
  - [ ] Permissions persist after refresh

- [ ] **Permission Groups**
  - [ ] All 15 permission groups are visible
  - [ ] Permissions are correctly categorized
  - [ ] Layout is responsive (mobile/desktop)

---

### 5. Integration Tests

- [ ] **User with Tenant Role**
  - [ ] User can be assigned a tenant role via API
  - [ ] User's permissions reflect tenant role permissions
  - [ ] AuthorizationService correctly combines permissions
  - [ ] User can access features based on tenant role permissions

- [ ] **User without Tenant Role**
  - [ ] User falls back to system role permissions
  - [ ] No errors occur
  - [ ] All existing functionality works

- [ ] **Permission Checks**
  - [ ] `requirePermission` middleware works with tenant roles
  - [ ] API endpoints respect tenant role permissions
  - [ ] Frontend permission checks work correctly

- [ ] **Corporate Client Isolation**
  - [ ] Corporate admin can only see their own tenant roles
  - [ ] Cannot access other corporate clients' roles
  - [ ] Super admin can see all tenant roles

---

### 6. Data Integrity Tests

- [ ] **Foreign Key Constraints**
  - [ ] Cannot delete corporate client with tenant roles (CASCADE works)
  - [ ] Cannot assign non-existent tenant role to user
  - [ ] Cannot create permission for non-existent tenant role

- [ ] **Unique Constraints**
  - [ ] Cannot create duplicate role name for same corporate client
  - [ ] Can create same role name for different corporate clients
  - [ ] Cannot create duplicate permission for same role

- [ ] **Data Seeding**
  - [ ] Default tenant roles created for all active corporate clients
  - [ ] Permissions copied correctly from system roles
  - [ ] No duplicate permissions in role_permissions table

---

### 7. Error Handling Tests

- [ ] **API Error Responses**
  - [ ] 400 for validation errors
  - [ ] 401 for unauthenticated requests
  - [ ] 403 for unauthorized access
  - [ ] 404 for not found resources
  - [ ] 409 for conflicts
  - [ ] 500 for server errors (with proper logging)

- [ ] **Frontend Error Handling**
  - [ ] Network errors show user-friendly messages
  - [ ] Validation errors display inline
  - [ ] Loading states prevent duplicate submissions
  - [ ] Toast notifications for all errors

---

### 8. Performance Tests

- [ ] **Query Performance**
  - [ ] Role list loads quickly (< 1 second)
  - [ ] Permissions dialog loads quickly
  - [ ] No N+1 query issues
  - [ ] Database indexes are used

- [ ] **UI Responsiveness**
  - [ ] No lag when toggling permissions
  - [ ] Smooth dialog animations
  - [ ] Search is instant

---

## Quick Test Script

Run these commands in your test environment:

```bash
# 1. Check migration applied
psql -d your_db -c "SELECT COUNT(*) FROM tenant_roles;"

# 2. Test API endpoint (replace TOKEN and CORPORATE_CLIENT_ID)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/tenant-roles?corporate_client_id=$CORPORATE_CLIENT_ID

# 3. Create a test role
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Role","corporate_client_id":"'$CORPORATE_CLIENT_ID'","description":"Test"}' \
  http://localhost:8081/api/tenant-roles
```

---

## Critical Issues to Watch For

⚠️ **BLOCKERS:**
- Migration fails or corrupts data
- Users lose access after migration
- Permissions not working correctly
- API endpoints return 500 errors
- Frontend crashes or doesn't load

⚠️ **HIGH PRIORITY:**
- Performance degradation
- Missing permissions in UI
- Corporate client isolation broken
- Data not persisting correctly

---

## Test Completion Criteria

✅ **Ready for Production if:**
- [ ] All critical tests pass
- [ ] No data loss or corruption
- [ ] All API endpoints work correctly
- [ ] Frontend components function properly
- [ ] Authorization service works for both system and tenant roles
- [ ] No console errors or warnings
- [ ] Performance is acceptable

---

## Next Steps After Testing

1. **If all tests pass:** Proceed to Phase 5 (Deployment)
2. **If issues found:** Document issues and fix before proceeding
3. **If critical blockers:** Rollback migration and investigate

---

**Test Date:** _______________  
**Tested By:** _______________  
**Environment:** _______________  
**Results:** _______________











