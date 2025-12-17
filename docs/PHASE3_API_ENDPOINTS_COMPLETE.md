# Phase 3: API Endpoints - COMPLETE ✅

## Summary

All tenant role management API endpoints have been created and registered. The endpoints support full CRUD operations for tenant roles, permission management, and user role assignment.

## Files Created/Modified

### 1. Created: `server/routes/tenant-roles.ts`

**Endpoints Created:**

#### Tenant Role Management
- **GET `/api/tenant-roles`**
  - List all tenant roles for a corporate client
  - Query params: `corporate_client_id`
  - Access: `VIEW_USERS` permission
  - Returns: Array of tenant roles

- **GET `/api/tenant-roles/:id`**
  - Get a specific tenant role by ID
  - Access: `VIEW_USERS` permission
  - Returns: Tenant role object

- **POST `/api/tenant-roles`**
  - Create a new tenant role
  - Body: `{ name, description?, corporate_client_id, is_active? }`
  - Access: `MANAGE_USERS` permission
  - Returns: Created tenant role

- **PUT `/api/tenant-roles/:id`**
  - Update a tenant role
  - Body: `{ name?, description?, is_active? }`
  - Access: `MANAGE_USERS` permission
  - Returns: Updated tenant role

- **DELETE `/api/tenant-roles/:id`**
  - Soft delete a tenant role (sets `is_active=false`)
  - Checks if role is assigned to users before deletion
  - Access: `MANAGE_USERS` permission
  - Returns: Success message

#### Permission Management
- **GET `/api/tenant-roles/:id/permissions`**
  - Get all permissions for a tenant role
  - Access: `VIEW_USERS` permission
  - Returns: Array of permission objects

- **POST `/api/tenant-roles/:id/permissions`**
  - Add a permission to a tenant role
  - Body: `{ permission, resource?, program_id?, corporate_client_id? }`
  - Access: `MANAGE_USERS` permission
  - Returns: Created permission object

- **DELETE `/api/tenant-roles/:id/permissions/:permissionId`**
  - Remove a permission from a tenant role
  - Access: `MANAGE_USERS` permission
  - Returns: Success message

- **POST `/api/tenant-roles/:id/permissions/bulk`**
  - Bulk update permissions for a tenant role
  - Body: `{ permissions: Array<{ permission, resource?, program_id?, corporate_client_id? }> }`
  - Replaces all existing permissions
  - Access: `MANAGE_USERS` permission
  - Returns: Updated permissions array

### 2. Modified: `server/routes/users.ts`

**New Endpoints:**

- **POST `/api/users/:userId/assign-role`**
  - Assign a tenant role to a user
  - Body: `{ tenant_role_id, corporate_client_id }`
  - Access: `super_admin`, `corporate_admin`
  - Returns: Updated user and tenant role info

- **DELETE `/api/users/:userId/assign-role`**
  - Remove tenant role assignment (revert to system role)
  - Access: `super_admin`, `corporate_admin`
  - Returns: Updated user

### 3. Modified: `server/routes/index.ts`

- Registered `tenant-roles` route: `router.use("/tenant-roles", tenantRolesRoutes)`

## Security Features

### Access Control
- ✅ All endpoints require authentication
- ✅ Permission-based access control using `requirePermission` middleware
- ✅ Corporate client isolation (users can only manage roles in their corporate client)
- ✅ Super admin can access all corporate clients

### Validation
- ✅ Zod schema validation for all request bodies
- ✅ Input sanitization and type checking
- ✅ Unique constraint validation (role names per corporate client)
- ✅ Foreign key validation (tenant role exists, corporate client exists)

### Error Handling
- ✅ Comprehensive error messages
- ✅ Proper HTTP status codes
- ✅ Prevents deletion of roles assigned to users
- ✅ Handles unique constraint violations gracefully

## API Usage Examples

### Create a Tenant Role

```typescript
POST /api/tenant-roles
{
  "name": "Custom Admin",
  "description": "Custom admin role with limited permissions",
  "corporate_client_id": "monarch",
  "is_active": true
}
```

### Add Permissions to Role

```typescript
POST /api/tenant-roles/{roleId}/permissions
{
  "permission": "manage_users",
  "resource": "*",
  "corporate_client_id": "monarch"
}
```

### Bulk Update Permissions

```typescript
POST /api/tenant-roles/{roleId}/permissions/bulk
{
  "permissions": [
    { "permission": "view_users", "resource": "*" },
    { "permission": "manage_users", "resource": "*" },
    { "permission": "view_trips", "resource": "*" }
  ]
}
```

### Assign Role to User

```typescript
POST /api/users/{userId}/assign-role
{
  "tenant_role_id": "abc123",
  "corporate_client_id": "monarch"
}
```

### List Tenant Roles

```typescript
GET /api/tenant-roles?corporate_client_id=monarch
```

## Integration Points

### With AuthorizationService
- Endpoints use `requirePermission` middleware which calls `AuthorizationService.hasPermission()`
- Supports both system and tenant role permissions

### With Existing Routes
- User assignment endpoints integrate with existing user management
- Permission management follows same patterns as system permissions

## Testing

To test the endpoints:

1. **Create a tenant role:**
   ```bash
   curl -X POST http://localhost:8081/api/tenant-roles \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Role","corporate_client_id":"monarch"}'
   ```

2. **Add permissions:**
   ```bash
   curl -X POST http://localhost:8081/api/tenant-roles/{roleId}/permissions \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"permission":"view_users","resource":"*"}'
   ```

3. **Assign to user:**
   ```bash
   curl -X POST http://localhost:8081/api/users/{userId}/assign-role \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"tenant_role_id":"{roleId}","corporate_client_id":"monarch"}'
   ```

## Next Steps

Proceed to **Phase 4: Frontend Components** to create the UI for managing tenant roles.











