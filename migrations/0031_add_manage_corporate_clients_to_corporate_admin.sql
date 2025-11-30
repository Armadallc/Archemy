-- ============================================================================
-- ADD manage_corporate_clients PERMISSION TO corporate_admin
-- Multi-Tenant Transportation Management System
-- ============================================================================

BEGIN;

-- Add manage_corporate_clients permission to corporate_admin role template (global scope)
INSERT INTO role_permissions (role, permission, resource, program_id, corporate_client_id)
SELECT * FROM (VALUES
    ('corporate_admin', 'manage_corporate_clients', '*', NULL::VARCHAR, NULL::VARCHAR)
) AS v(role, permission, resource, program_id, corporate_client_id)
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role = v.role
    AND rp.permission = v.permission
    AND rp.resource = v.resource
    AND COALESCE(rp.program_id, '') = COALESCE(v.program_id, '')
    AND COALESCE(rp.corporate_client_id, '') = COALESCE(v.corporate_client_id, '')
);

COMMIT;

