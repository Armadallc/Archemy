-- ============================================================================
-- ROLLBACK: HYBRID RBAC MIGRATION (0049)
-- Multi-Tenant Transportation Management System
-- Migration: 0050
-- Date: 2025-01-XX
-- ============================================================================
-- 
-- WARNING: This rollback script will remove all tenant role data and schema changes.
-- Only use if no new tenant roles have been created or if you need to revert
-- the migration entirely.
-- 
-- This rollback assumes:
-- 1. No custom tenant roles have been created (or you're okay losing them)
-- 2. No users have been assigned tenant_role_id (or you're okay resetting them)
-- 3. You want to return to the pre-migration state
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: REMOVE FOREIGN KEY CONSTRAINTS FROM USERS TABLE
-- ============================================================================
-- Purpose: Remove the new columns added to users table.
-- This will also remove any foreign key constraints automatically.

ALTER TABLE users 
    DROP COLUMN IF EXISTS tenant_role_id,
    DROP COLUMN IF EXISTS active_tenant_id;

-- ============================================================================
-- STEP 2: REMOVE ROLE_TYPE FROM ROLE_PERMISSIONS TABLE
-- ============================================================================
-- Purpose: Remove the discriminator column that enabled polymorphic relationships.

ALTER TABLE role_permissions 
    DROP COLUMN IF EXISTS role_type;

-- ============================================================================
-- STEP 3: DROP TENANT ROLE PERMISSIONS TABLE
-- ============================================================================
-- Purpose: Remove the junction table that linked tenant roles to permissions.
-- CASCADE will also drop any dependent objects (indexes, triggers, etc.).

DROP TABLE IF EXISTS tenant_role_permissions CASCADE;

-- ============================================================================
-- STEP 4: DROP TENANT ROLES TABLE
-- ============================================================================
-- Purpose: Remove the tenant_roles table.
-- CASCADE will also drop any dependent objects (indexes, triggers, etc.).

DROP TABLE IF EXISTS tenant_roles CASCADE;

-- ============================================================================
-- STEP 5: DROP HELPER FUNCTIONS
-- ============================================================================
-- Purpose: Remove the trigger functions created for updated_at timestamps.

DROP FUNCTION IF EXISTS update_tenant_roles_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_tenant_role_permissions_updated_at() CASCADE;

COMMIT;

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================
-- The database should now be in the same state as before migration 0049.
-- Verify by checking:
-- 1. users table no longer has tenant_role_id or active_tenant_id columns
-- 2. role_permissions table no longer has role_type column
-- 3. tenant_roles and tenant_role_permissions tables no longer exist
-- ============================================================================











