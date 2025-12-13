# Phase 2: Backend Integration - COMPLETE ✅

## Summary

The AuthorizationService has been created and integrated into the auth middleware, providing hybrid RBAC support (system + tenant roles) while maintaining full backward compatibility.

## Files Created/Modified

### 1. Created: `server/services/authorizationService.ts`

**New Service Methods:**

- **`getUserPermissions(userId, corporateClientId?, resource?)`**
  - Returns array of permission strings
  - Combines system and tenant role permissions
  - Automatically deduplicates permissions

- **`getUserPermissionsWithMetadata(userId, corporateClientId?, resource?)`**
  - Returns full `UserPermissions` object with:
    - `permissions`: Array of permission strings
    - `effectiveRole`: The role ID being used
    - `roleType`: 'system' | 'tenant'
    - `isTenantRole`: Boolean flag
    - `tenantRoleName`: Name of tenant role (if applicable)

- **`hasPermission(userId, permission, corporateClientId?, resource?)`**
  - Main permission check method
  - Returns boolean
  - Used by auth middleware

- **`getEffectiveRoleName(userId, corporateClientId?)`**
  - Returns role information including tenant role name
  - Useful for UI display

**Key Features:**
- ✅ Supports both system and tenant roles
- ✅ Super admins always use system role
- ✅ Tenant roles inherit from system roles (hybrid approach)
- ✅ Graceful error handling with fallbacks
- ✅ Automatic permission deduplication

### 2. Modified: `server/auth.ts`

**Updated `requirePermission` Middleware:**
- Now uses `AuthorizationService.hasPermission()` as primary method
- Falls back to legacy `permissionsStorage.checkPermission()` if new service fails
- Falls back to hardcoded permissions if database unavailable
- Maintains full backward compatibility

**Integration Points:**
- Line 14: Import `authorizationServiceHasPermission`
- Lines 22-68: Updated `requirePermission` function with hybrid RBAC support

## Architecture

### Permission Resolution Flow

```
1. Check AuthorizationService (hybrid RBAC)
   ├─ If user has tenant_role_id AND corporateClientId matches
   │  └─ Use tenant role permissions from role_permissions (role_type='tenant')
   ├─ Else use system role permissions (role_type='system')
   └─ Super admins always use system role

2. Fallback to legacy permissionsStorage (if new service fails)

3. Fallback to hardcoded permissions (if database unavailable)
```

### Hybrid Permission Merging

When a user has a tenant role:
1. Fetch permissions from `role_permissions` where `role_type='tenant'` and `role=tenant_role_id`
2. Also fetch permissions from `role_permissions` where `role_type='system'` and `role=user.role`
3. Merge and deduplicate both sets
4. Return combined permissions

This allows tenant roles to:
- Have custom permissions
- Inherit from system role permissions
- Override system permissions (by not including them in tenant role)

## Backward Compatibility

✅ **All existing code continues to work:**
- Existing `requirePermission` middleware calls work unchanged
- Legacy `permissionsStorage` still available as fallback
- Hardcoded permissions still work if database unavailable
- No breaking changes to API contracts

## Usage Examples

### In Route Handlers

```typescript
import { requirePermission } from '../auth';
import { PERMISSIONS } from '../permissions';

// Existing usage - no changes needed
router.get('/users', 
  requirePermission(PERMISSIONS.VIEW_USERS),
  async (req, res) => {
    // Handler code
  }
);
```

### Direct Service Usage

```typescript
import { hasPermission, getUserPermissions, getEffectiveRoleName } from '../services/authorizationService';

// Check single permission
const canManage = await hasPermission(userId, 'manage_users', corporateClientId);

// Get all permissions
const permissions = await getUserPermissions(userId, corporateClientId);

// Get role information
const roleInfo = await getEffectiveRoleName(userId, corporateClientId);
console.log(roleInfo.tenantRoleName); // "Custom Admin Role"
```

## Error Handling

The service includes comprehensive error handling:
- Returns empty permissions array on user not found (doesn't throw)
- Logs errors but doesn't crash
- Falls back gracefully to system role if tenant role invalid
- Maintains backward compatibility with legacy systems

## Testing

To test the integration:

1. **Test system role permissions:**
   ```typescript
   // User without tenant_role_id should use system role
   const perms = await getUserPermissions(userId, corporateClientId);
   ```

2. **Test tenant role permissions:**
   ```typescript
   // User with tenant_role_id should use tenant role
   const perms = await getUserPermissions(userId, corporateClientId);
   ```

3. **Test super admin:**
   ```typescript
   // Super admin should always use system role
   const perms = await getUserPermissions(superAdminId, corporateClientId);
   ```

4. **Test middleware:**
   ```typescript
   // Existing routes should work unchanged
   router.get('/test', requirePermission(PERMISSIONS.VIEW_USERS), handler);
   ```

## Next Steps

Proceed to **Phase 3: API Endpoints** to create tenant role management endpoints.







