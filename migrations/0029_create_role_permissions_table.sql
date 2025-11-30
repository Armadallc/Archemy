-- ============================================================================
-- CREATE ROLE PERMISSIONS TABLE
-- Multi-Tenant Transportation Management System
-- ============================================================================

BEGIN;

-- Create role_permissions table for granular permission management
CREATE TABLE IF NOT EXISTS role_permissions (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'corporate_admin', 'program_admin', 'program_user', 'driver')),
    permission VARCHAR(100) NOT NULL,
    resource VARCHAR(50) NOT NULL DEFAULT '*',
    program_id VARCHAR(50) NULL,
    corporate_client_id VARCHAR(50) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_role_permissions_program FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_corporate_client FOREIGN KEY (corporate_client_id) REFERENCES corporate_clients(id) ON DELETE CASCADE
);

-- Create unique index for role/permission/resource combination (handles NULLs properly)
CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permissions_unique ON role_permissions (
    role, 
    permission, 
    resource, 
    COALESCE(program_id, ''), 
    COALESCE(corporate_client_id, '')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON role_permissions(resource);
CREATE INDEX IF NOT EXISTS idx_role_permissions_program_id ON role_permissions(program_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_corporate_client_id ON role_permissions(corporate_client_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_role_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER role_permissions_updated_at
    BEFORE UPDATE ON role_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_role_permissions_updated_at();

-- Enable Row Level Security
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can view permissions for their role and hierarchy level
CREATE POLICY "role_permissions_select_own_role" ON role_permissions
    FOR SELECT USING (
        -- Super admin can see all permissions
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.user_id = auth.uid()::text
            AND u.role = 'super_admin'
        )
        OR
        -- Users can see permissions for their own role
        role = (
            SELECT u.role FROM users u
            WHERE u.user_id = auth.uid()::text
        )
        OR
        -- Users can see permissions for roles they can manage
        role IN (
            SELECT unnest(ARRAY['corporate_admin', 'program_admin', 'program_user', 'driver']::VARCHAR[])
            WHERE EXISTS (
                SELECT 1 FROM users u
                WHERE u.user_id = auth.uid()::text
                AND u.role = 'super_admin'
            )
            OR
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.user_id = auth.uid()::text
                AND u.role = 'corporate_admin'
                AND role IN ('program_admin', 'program_user', 'driver')
            )
            OR
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.user_id = auth.uid()::text
                AND u.role = 'program_admin'
                AND role IN ('program_user', 'driver')
            )
        )
    );

-- Create RLS policy: Only super_admin can insert/update/delete permissions
CREATE POLICY "role_permissions_super_admin_only" ON role_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.user_id = auth.uid()::text
            AND u.role = 'super_admin'
        )
    );

COMMIT;

