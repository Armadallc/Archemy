-- ============================================================================
-- HYBRID RBAC MIGRATION: ADD TENANT ROLES SUPPORT
-- Multi-Tenant Transportation Management System
-- Migration: 0050_hybrid_rbac_tenant_roles
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: CREATE TENANT ROLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_roles (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    corporate_client_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_tenant_roles_corporate_client 
        FOREIGN KEY (corporate_client_id) 
        REFERENCES corporate_clients(id) 
        ON DELETE CASCADE,
    CONSTRAINT uq_tenant_roles_name_per_client 
        UNIQUE (corporate_client_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tenant_roles_corporate_client_id 
    ON tenant_roles(corporate_client_id);

CREATE INDEX IF NOT EXISTS idx_tenant_roles_is_active 
    ON tenant_roles(is_active);

CREATE OR REPLACE FUNCTION update_tenant_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenant_roles_updated_at
    BEFORE UPDATE ON tenant_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_roles_updated_at();

-- ============================================================================
-- STEP 2: ADD COLUMNS TO USERS TABLE
-- ============================================================================

ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS tenant_role_id VARCHAR(50) 
        REFERENCES tenant_roles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS active_tenant_id VARCHAR(50) 
        REFERENCES corporate_clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_tenant_role_id 
    ON users(tenant_role_id);

CREATE INDEX IF NOT EXISTS idx_users_active_tenant_id 
    ON users(active_tenant_id);

-- ============================================================================
-- STEP 3: ADD ROLE_TYPE TO ROLE_PERMISSIONS TABLE
-- ============================================================================

-- First, drop the existing CHECK constraint on role column to allow UUIDs for tenant roles
-- The original constraint only allows enum values, but we need to allow UUIDs too
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find and drop the CHECK constraint on the role column
    -- Constraint name may be 'role_permissions_role_check' or auto-generated
    FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'role_permissions'::regclass
        AND contype = 'c'
        AND conname LIKE '%role%'
    LOOP
        EXECUTE 'ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
    END LOOP;
END $$;

ALTER TABLE role_permissions 
    ADD COLUMN IF NOT EXISTS role_type VARCHAR(20) 
        DEFAULT 'system' 
        CHECK (role_type IN ('system', 'tenant'));

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_type 
    ON role_permissions(role_type);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_and_type 
    ON role_permissions(role, role_type);

-- Update existing unique constraint to include role_type
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_role_permissions_unique'
    ) THEN
        DROP INDEX idx_role_permissions_unique;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permissions_unique 
    ON role_permissions (
        role, 
        role_type,
        permission, 
        resource, 
        COALESCE(program_id, ''), 
        COALESCE(corporate_client_id, '')
    );

-- ============================================================================
-- STEP 4: SEED DEFAULT TENANT ROLES AND PERMISSIONS
-- ============================================================================

DO $$
DECLARE
    corp_client RECORD;
    system_role VARCHAR(50);
    tenant_role_id_var VARCHAR(50);
    perm RECORD;
BEGIN
    FOR corp_client IN 
        SELECT id, name FROM corporate_clients WHERE is_active = true
    LOOP
        FOR system_role IN 
            SELECT unnest(ARRAY['corporate_admin', 'program_admin', 'program_user', 'driver']::VARCHAR[])
        LOOP
            INSERT INTO tenant_roles (
                id,
                corporate_client_id, 
                name, 
                description,
                is_active
            ) VALUES (
                gen_random_uuid()::text,
                corp_client.id,
                system_role || '_' || corp_client.id,
                'Default tenant role for ' || system_role || ' in ' || corp_client.name,
                true
            )
            ON CONFLICT (corporate_client_id, name) DO NOTHING
            RETURNING id INTO tenant_role_id_var;

            IF tenant_role_id_var IS NOT NULL THEN
                FOR perm IN 
                    SELECT permission, resource, program_id, corporate_client_id
                    FROM role_permissions
                    WHERE role = system_role
                    AND role_type = 'system'
                    AND (corporate_client_id IS NULL OR corporate_client_id = corp_client.id)
                LOOP
                    INSERT INTO role_permissions (
                        role,
                        role_type,
                        permission,
                        resource,
                        program_id,
                        corporate_client_id
                    )
                    SELECT 
                        tenant_role_id_var,
                        'tenant',
                        perm.permission,
                        perm.resource,
                        perm.program_id,
                        COALESCE(perm.corporate_client_id, corp_client.id)
                    WHERE NOT EXISTS (
                        SELECT 1 FROM role_permissions rp
                        WHERE rp.role = tenant_role_id_var
                        AND rp.role_type = 'tenant'
                        AND rp.permission = perm.permission
                        AND rp.resource = perm.resource
                        AND COALESCE(rp.program_id, '') = COALESCE(perm.program_id, '')
                        AND COALESCE(rp.corporate_client_id, '') = COALESCE(perm.corporate_client_id, corp_client.id, '')
                    );
                END LOOP;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 5: ROW LEVEL SECURITY (COMMENTED OUT)
-- ============================================================================

-- ALTER TABLE tenant_roles ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "tenant_roles_select_own_corporate" ON tenant_roles
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM users u
--             WHERE u.user_id = auth.uid()::text
--             AND (
--                 u.role = 'super_admin'
--                 OR (
--                     u.role = 'corporate_admin'
--                     AND u.corporate_client_id = tenant_roles.corporate_client_id
--                 )
--             )
--         )
--     );
-- 
-- CREATE POLICY "tenant_roles_manage_own_corporate" ON tenant_roles
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM users u
--             WHERE u.user_id = auth.uid()::text
--             AND (
--                 u.role = 'super_admin'
--                 OR (
--                     u.role = 'corporate_admin'
--                     AND u.corporate_client_id = tenant_roles.corporate_client_id
--                 )
--             )
--         )
--     );

COMMIT;


