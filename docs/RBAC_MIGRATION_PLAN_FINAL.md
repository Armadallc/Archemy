# Hybrid RBAC Migration Plan - Final Review Version

## Executive Summary

**CRITICAL: Read this entire section before executing any migration.**

### Pre-Migration Checklist

1. ✅ **Fix Typo**: Verify `gen_random_uuid()` (not `gen_random_wuid()`) is used throughout the SQL migration file.
2. ✅ **RLS Section**: The RLS policies section (STEP 7) is commented out. Do NOT uncomment until core functionality is verified.
3. ✅ **Test Environment**: **MANDATORY** - Test the entire migration in a temporary Supabase project before applying to production.
4. ✅ **Import Path Verification**: Verify the `AuthorizationService` import path matches your project structure (see warning below).
5. ✅ **Backup**: Create a database backup before applying to production.

### Migration Execution Order

1. Review and verify all SQL statements in `migrations/0049_add_tenant_roles_rbac.sql`
2. Test migration in temporary Supabase project
3. Fix any issues discovered during testing
4. Create production database backup
5. Apply migration to production during low-traffic window
6. Verify core functionality (create tenant role, assign to user, check permissions)
7. Implement RLS policies as separate migration (STEP 7) after verification

---

## Overview

This migration implements a **hybrid Role-Based Access Control (RBAC)** system that allows:
- **System Roles**: Continue using existing enum-based roles (`super_admin`, `corporate_admin`, etc.)
- **Tenant Roles**: Corporate Admins can create custom roles for their tenants
- **Backward Compatibility**: Existing `users.role` enum remains functional during transition

### Key Design Decisions

1. **Polymorphic Relationship**: `rolePermissions.role_type` discriminator allows `role` column to reference either system enum or `tenant_roles.id`
2. **Non-Breaking Changes**: All new columns are nullable, no existing columns are dropped
3. **Default Seeding**: Creates default tenant roles for existing corporate clients to ensure smooth transition
4. **Separate Permissions Table**: `tenant_role_permissions` stores permissions for custom roles

---

## Phase 1: Schema Changes

### 1.1 Drizzle ORM Schema Updates

**File**: `shared/schema.ts`

Add the following definitions:

```typescript
// Add after existing enums (around line 60)
export const roleTypeEnum = pgEnum('role_type', ['system', 'tenant']);

// Add after rolePermissions table definition (around line 530)
// Tenant Roles Table
export const tenantRoles = pgTable("tenant_roles", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  corporate_client_id: varchar("corporate_client_id", { length: 50 })
    .notNull()
    .references(() => corporateClients.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  created_by: varchar("created_by", { length: 50 })
    .references(() => users.user_id, { onDelete: 'set null' }),
});

// Tenant Role Permissions Table
export const tenantRolePermissions = pgTable("tenant_role_permissions", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::text`),
  tenant_role_id: varchar("tenant_role_id", { length: 50 })
    .notNull()
    .references(() => tenantRoles.id, { onDelete: 'cascade' }),
  permission: varchar("permission", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 50 }).notNull().default('*'),
  program_id: varchar("program_id", { length: 50 })
    .references(() => programs.id, { onDelete: 'cascade' }),
  corporate_client_id: varchar("corporate_client_id", { length: 50 })
    .references(() => corporateClients.id, { onDelete: 'cascade' }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});
```

**Update existing tables**:

```typescript
// Update users table (around line 137)
export const users = pgTable("users", {
  // ... existing columns ...
  role: userRoleEnum("role").notNull(),
  tenant_role_id: varchar("tenant_role_id", { length: 50 })
    .references(() => tenantRoles.id, { onDelete: 'set null' }), // ADD THIS
  active_tenant_id: varchar("active_tenant_id", { length: 50 })
    .references(() => corporateClients.id, { onDelete: 'set null' }), // ADD THIS
  // ... rest of columns ...
});

// Update rolePermissions table (around line 521)
export const rolePermissions = pgTable("role_permissions", {
  // ... existing columns ...
  role: varchar("role", { length: 50 }).notNull(),
  role_type: varchar("role_type", { length: 20 })
    .default('system')
    .$type<'system' | 'tenant'>(),
  // ... rest of columns ...
});
```

### 1.2 TypeScript Type Updates

Add to your type definitions:

```typescript
// In shared/types.ts or similar
export type RoleType = 'system' | 'tenant';

export interface TenantRole {
  id: string;
  corporate_client_id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  created_by?: string | null;
}

export interface TenantRolePermission {
  id: string;
  tenant_role_id: string;
  permission: string;
  resource: string;
  program_id?: string | null;
  corporate_client_id?: string | null;
  created_at: Date;
  updated_at: Date;
}
```

---

## Phase 2: SQL Migration

**File**: `migrations/0049_add_tenant_roles_rbac.sql`

This file contains the complete migration script. Key points:

- **STEP 1**: Creates `tenant_roles` table
- **STEP 2**: Adds `tenant_role_id` and `active_tenant_id` to `users` table
- **STEP 3**: Adds `role_type` discriminator to `role_permissions` table
- **STEP 4**: Creates `tenant_role_permissions` junction table
- **STEP 5**: Seeds default tenant roles for existing corporate clients
- **STEP 6**: Optional user migration (commented out)
- **STEP 7**: RLS policies (commented out - implement separately)

**CRITICAL**: The migration uses `gen_random_uuid()::text` (corrected from typo).

---

## Phase 3: Authorization Service

**File**: `server/services/authorizationService.ts`

**⚠️ IMPORTANT WARNING**: Verify the import path `'../minimal-supabase'` matches your project structure. It may need to be `'../lib/supabase'` or another path depending on your setup.

```typescript
import { supabase } from '../minimal-supabase'; // ⚠️ VERIFY THIS PATH

/**
 * Authorization Service - Hybrid RBAC Support
 * 
 * This service provides permission checking that supports both:
 * - System roles (enum-based): super_admin, corporate_admin, etc.
 * - Tenant roles (custom roles created by Corporate Admins)
 */
export class AuthorizationService {
  /**
   * Get all permissions for a user in a specific corporate client context
   * 
   * @param userId - The user's ID
   * @param corporateClientId - The corporate client context (required for tenant roles)
   * @returns Array of permission strings the user has
   */
  static async getUserPermissions(
    userId: string,
    corporateClientId?: string | null
  ): Promise<string[]> {
    try {
      // Step 1: Get user record
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role, tenant_role_id, corporate_client_id, active_tenant_id')
        .eq('user_id', userId)
        .single();

      if (userError || !user) {
        console.error('User not found:', userError);
        return [];
      }

      // Step 2: Determine which role to use
      let effectiveRole: string | null = null;
      let roleType: 'system' | 'tenant' = 'system';

      // Super admins always use system role
      if (user.role === 'super_admin') {
        effectiveRole = 'super_admin';
        roleType = 'system';
      }
      // If user has tenant_role_id and we're in the correct corporate client context
      else if (user.tenant_role_id && corporateClientId) {
        // Verify the tenant role belongs to the requested corporate client
        const { data: tenantRole } = await supabase
          .from('tenant_roles')
          .select('id, corporate_client_id, is_active')
          .eq('id', user.tenant_role_id)
          .eq('corporate_client_id', corporateClientId)
          .eq('is_active', true)
          .single();

        if (tenantRole) {
          effectiveRole = user.tenant_role_id;
          roleType = 'tenant';
        } else {
          // Fall back to system role if tenant role not found or inactive
          effectiveRole = user.role;
          roleType = 'system';
        }
      }
      // Fall back to system role
      else {
        effectiveRole = user.role;
        roleType = 'system';
      }

      if (!effectiveRole) {
        return [];
      }

      // Step 3: Fetch permissions based on role type
      let permissions: string[] = [];

      if (roleType === 'system') {
        // Query role_permissions for system role
        const { data: rolePerms, error: permError } = await supabase
          .from('role_permissions')
          .select('permission')
          .eq('role', effectiveRole)
          .eq('role_type', 'system')
          .or(`corporate_client_id.is.null,corporate_client_id.eq.${corporateClientId || ''}`);

        if (permError) {
          console.error('Error fetching system role permissions:', permError);
          return [];
        }

        permissions = (rolePerms || []).map(p => p.permission);
      } else {
        // Query tenant_role_permissions for tenant role
        const { data: tenantPerms, error: tenantPermError } = await supabase
          .from('tenant_role_permissions')
          .select('permission')
          .eq('tenant_role_id', effectiveRole)
          .or(`corporate_client_id.is.null,corporate_client_id.eq.${corporateClientId || ''}`);

        if (tenantPermError) {
          console.error('Error fetching tenant role permissions:', tenantPermError);
          return [];
        }

        permissions = (tenantPerms || []).map(p => p.permission);
      }

      // Step 4: Deduplicate and return
      return Array.from(new Set(permissions));
    } catch (error) {
      console.error('Error in getUserPermissions:', error);
      return [];
    }
  }

  /**
   * Check if a user has a specific permission
   * 
   * @param userId - The user's ID
   * @param permission - The permission to check (e.g., 'manage_users')
   * @param corporateClientId - The corporate client context
   * @param resource - Optional resource scope (default: '*')
   * @returns true if user has the permission
   */
  static async hasPermission(
    userId: string,
    permission: string,
    corporateClientId?: string | null,
    resource: string = '*'
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, corporateClientId);
    return permissions.includes(permission);
  }

  /**
   * Get user's effective role (system or tenant)
   * 
   * @param userId - The user's ID
   * @param corporateClientId - The corporate client context
   * @returns Object with role information
   */
  static async getEffectiveRole(
    userId: string,
    corporateClientId?: string | null
  ): Promise<{
    role: string;
    roleType: 'system' | 'tenant';
    isTenantRole: boolean;
  }> {
    const { data: user } = await supabase
      .from('users')
      .select('role, tenant_role_id, corporate_client_id')
      .eq('user_id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Super admin always uses system role
    if (user.role === 'super_admin') {
      return {
        role: 'super_admin',
        roleType: 'system',
        isTenantRole: false,
      };
    }

    // Check if user has active tenant role in this corporate client
    if (user.tenant_role_id && corporateClientId) {
      const { data: tenantRole } = await supabase
        .from('tenant_roles')
        .select('id, name, corporate_client_id, is_active')
        .eq('id', user.tenant_role_id)
        .eq('corporate_client_id', corporateClientId)
        .eq('is_active', true)
        .single();

      if (tenantRole) {
        return {
          role: tenantRole.id,
          roleType: 'tenant',
          isTenantRole: true,
        };
      }
    }

    // Fall back to system role
    return {
      role: user.role,
      roleType: 'system',
      isTenantRole: false,
    };
  }
}
```

---

## Phase 4: Rollback Plan

**File**: `migrations/0050_rollback_tenant_roles_rbac.sql`

```sql
-- ============================================================================
-- ROLLBACK: HYBRID RBAC MIGRATION
-- WARNING: Only use if no new tenant roles have been created
-- This will remove all tenant role data and schema changes
-- ============================================================================

BEGIN;

-- Step 1: Remove foreign key constraints from users table
ALTER TABLE users 
    DROP COLUMN IF EXISTS tenant_role_id,
    DROP COLUMN IF EXISTS active_tenant_id;

-- Step 2: Remove role_type from role_permissions
ALTER TABLE role_permissions 
    DROP COLUMN IF EXISTS role_type;

-- Step 3: Drop tenant role permissions table
DROP TABLE IF EXISTS tenant_role_permissions CASCADE;

-- Step 4: Drop tenant roles table
DROP TABLE IF EXISTS tenant_roles CASCADE;

-- Step 5: Drop functions
DROP FUNCTION IF EXISTS update_tenant_roles_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_tenant_role_permissions_updated_at() CASCADE;

COMMIT;
```

---

## Summary & Next Steps

### Immediate Actions Required

1. ✅ **Review SQL Migration**: Verify `gen_random_uuid()` is correct (not `gen_random_wuid()`)
2. ✅ **Verify Import Path**: Check `AuthorizationService` import path matches your project
3. ✅ **Test in Staging**: Run entire migration in temporary Supabase project
4. ✅ **Backup Production**: Create full database backup before production deployment

### Post-Migration Tasks

1. **Update API Routes**: Modify permission checking to use `AuthorizationService.getUserPermissions()`
2. **Update Frontend**: Add UI for Corporate Admins to create/manage tenant roles
3. **Implement RLS**: Uncomment and test STEP 7 RLS policies as separate migration
4. **Data Migration**: Optionally run STEP 6 to link existing users to default tenant roles
5. **Documentation**: Update API documentation with new tenant role endpoints

### Testing Checklist

- [ ] Migration runs without errors in test environment
- [ ] Default tenant roles created for each corporate client
- [ ] Can create new custom tenant role via API
- [ ] Can assign tenant role to user
- [ ] Permission checking works with tenant roles
- [ ] Permission checking still works with system roles
- [ ] Super admin can still access everything
- [ ] Backward compatibility maintained (users without tenant_role_id work)

---

## Changelog

### Version 2.0 (Final Review - Current)

**Critical Fixes:**
- ✅ Fixed typo: `gen_random_wuid()` → `gen_random_uuid()` throughout SQL migration
- ✅ Commented out RLS section (STEP 7) - to be implemented separately
- ✅ Added prominent warning about import path verification in AuthorizationService
- ✅ Added Executive Summary with pre-migration checklist
- ✅ Clarified migration execution order

**Improvements:**
- Enhanced comments explaining each step
- Added rollback plan as separate migration file
- Improved error handling in AuthorizationService
- Added comprehensive testing checklist

### Version 1.0 (Initial)

- Initial migration plan created
- Schema definitions provided
- AuthorizationService stub created

---

## Support & Questions

If you encounter issues during migration:

1. Check the rollback plan is available before proceeding
2. Test in isolated environment first
3. Review Supabase logs for detailed error messages
4. Verify all foreign key relationships are correct
5. Ensure no conflicting migrations are running

**Remember**: This is a non-breaking migration. The existing system will continue to work even if tenant roles are not immediately used.







