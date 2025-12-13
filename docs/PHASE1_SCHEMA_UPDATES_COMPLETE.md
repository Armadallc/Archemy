# Phase 1: Database Schema Updates - COMPLETE ✅

## Summary

All Drizzle ORM schema definitions have been updated in `shared/schema.ts` to support the Hybrid RBAC system.

## Changes Made

### 1. Added RoleType Type
- **Location**: Line ~59
- **Type**: `export type RoleType = 'system' | 'tenant'`
- **Purpose**: TypeScript type for the polymorphic discriminator

### 2. Updated Users Table
- **Location**: Lines 140-159
- **New Columns Added**:
  - `tenant_role_id`: VARCHAR(50), nullable, FK to `tenant_roles.id`
  - `active_tenant_id`: VARCHAR(50), nullable, FK to `corporate_clients.id`
- **Backward Compatibility**: Both columns are nullable, existing code continues to work

### 3. Updated Role Permissions Table
- **Location**: Lines 520-537
- **New Column Added**:
  - `role_type`: VARCHAR(20), default 'system', type `RoleType`
- **Purpose**: Polymorphic discriminator to support both system and tenant roles in the same table

### 4. Added Tenant Roles Table
- **Location**: Lines 539-552
- **Table**: `tenant_roles`
- **Columns**:
  - `id`: VARCHAR(50), PK, default `gen_random_uuid()::text`
  - `corporate_client_id`: VARCHAR(50), NOT NULL, FK to `corporate_clients.id`
  - `name`: VARCHAR(100), NOT NULL
  - `description`: TEXT, nullable
  - `is_active`: BOOLEAN, default true
  - `created_at`: TIMESTAMP, default NOW()
  - `updated_at`: TIMESTAMP, default NOW()
  - `created_by`: VARCHAR(50), nullable (FK to `users.user_id` - note: circular reference handled)
- **Constraints**:
  - Unique constraint on (`corporate_client_id`, `name`)

### 5. Added TypeScript Type Exports
- **Zod Schemas**:
  - `insertTenantRoleSchema`: For creating tenant roles
  - `selectTenantRoleSchema`: For selecting tenant roles
- **TypeScript Types**:
  - `TenantRole`: Select type for tenant roles
  - `InsertTenantRole`: Insert type for tenant roles

## Integration Points

### Existing Code Compatibility
- ✅ All existing `users.role` checks continue to work
- ✅ All existing `role_permissions` queries work (default `role_type='system'`)
- ✅ No breaking changes to existing TypeScript types

### New Code Usage
```typescript
import { tenantRoles, TenantRole, InsertTenantRole, RoleType } from '../shared/schema';

// Query tenant roles
const roles = await db.select().from(tenantRoles)
  .where(eq(tenantRoles.corporate_client_id, clientId));

// Insert new tenant role
const newRole: InsertTenantRole = {
  corporate_client_id: clientId,
  name: 'Custom Role',
  description: 'A custom role',
  is_active: true
};
```

## Notes

1. **Circular Reference**: The `tenant_roles.created_by` field references `users.user_id`, while `users.tenant_role_id` references `tenant_roles.id`. This creates a circular dependency that Drizzle handles with lazy function references. The FK constraint is maintained at the database level.

2. **Type Safety**: All new types are fully typed with TypeScript and Zod validation schemas.

3. **Indexes**: Database indexes are created in the SQL migration, not in the Drizzle schema (as per project conventions).

## Next Steps

Proceed to **Phase 2: Backend Integration** to create the `AuthorizationService` that uses these schema definitions.

## Testing

To verify the schema updates:
1. Check TypeScript compilation: `npm run build` or `tsc --noEmit`
2. Verify types are exported correctly
3. Test imports in a new file to ensure no circular dependency issues







