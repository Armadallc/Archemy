-- ============================================================================
-- POPULATE ROLE PERMISSIONS FROM HARDCODED VALUES
-- Multi-Tenant Transportation Management System
-- ============================================================================

BEGIN;

-- Helper function to insert permission if it doesn't exist
DO $$
BEGIN
    -- Insert permissions for super_admin (all permissions, global scope)
    INSERT INTO role_permissions (role, permission, resource, program_id, corporate_client_id)
    SELECT * FROM (VALUES
        ('super_admin', 'manage_corporate_clients', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'view_corporate_clients', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'manage_programs', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'view_programs', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'manage_locations', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'view_locations', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'manage_users', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'view_users', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'manage_clients', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'view_clients', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'manage_client_groups', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'view_client_groups', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'manage_drivers', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'view_drivers', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'manage_vehicles', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'view_vehicles', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'manage_trips', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'view_trips', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'create_trips', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'update_trip_status', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'manage_trip_categories', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'view_trip_categories', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'view_clients_cross_corporate', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'manage_clients_cross_corporate', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'create_trips_cross_corporate', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'view_programs_cross_corporate', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'view_reports', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'view_analytics', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'mobile_app_access', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'location_tracking', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'manage_notifications', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'view_notifications', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'manage_calendar', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'view_calendar', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'manage_webhooks', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('super_admin', 'view_webhooks', '*', NULL::VARCHAR, NULL::VARCHAR)
    ) AS v(role, permission, resource, program_id, corporate_client_id)
    WHERE NOT EXISTS (
        SELECT 1 FROM role_permissions rp
        WHERE rp.role = v.role
        AND rp.permission = v.permission
        AND rp.resource = v.resource
        AND COALESCE(rp.program_id, '') = COALESCE(v.program_id, '')
        AND COALESCE(rp.corporate_client_id, '') = COALESCE(v.corporate_client_id, '')
    );

    -- Insert permissions for corporate_admin (corporate client level access)
    INSERT INTO role_permissions (role, permission, resource, program_id, corporate_client_id)
    SELECT * FROM (VALUES
        ('corporate_admin', 'view_corporate_clients', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'manage_programs', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'view_programs', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'manage_locations', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'view_locations', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'manage_users', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'view_users', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'manage_clients', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'view_clients', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'manage_client_groups', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'view_client_groups', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'manage_drivers', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'view_drivers', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'manage_vehicles', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'view_vehicles', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'manage_trips', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'view_trips', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'create_trips', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'update_trip_status', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'manage_trip_categories', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'view_trip_categories', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'view_reports', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'view_analytics', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'mobile_app_access', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'location_tracking', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'manage_notifications', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'view_notifications', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'manage_calendar', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'view_calendar', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'manage_webhooks', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('corporate_admin', 'view_webhooks', '*', NULL::VARCHAR, NULL::VARCHAR)
    ) AS v(role, permission, resource, program_id, corporate_client_id)
    WHERE NOT EXISTS (
        SELECT 1 FROM role_permissions rp
        WHERE rp.role = v.role
        AND rp.permission = v.permission
        AND rp.resource = v.resource
        AND COALESCE(rp.program_id, '') = COALESCE(v.program_id, '')
        AND COALESCE(rp.corporate_client_id, '') = COALESCE(v.corporate_client_id, '')
    );

    -- Insert permissions for program_admin (program level access)
    INSERT INTO role_permissions (role, permission, resource, program_id, corporate_client_id)
    SELECT * FROM (VALUES
        ('program_admin', 'view_programs', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'manage_locations', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'view_locations', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'view_users', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'manage_clients', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'view_clients', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'manage_client_groups', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'view_client_groups', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'manage_drivers', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'view_drivers', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'manage_vehicles', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'view_vehicles', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'manage_trips', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'view_trips', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'create_trips', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'update_trip_status', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'manage_trip_categories', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'view_trip_categories', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'view_reports', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'view_analytics', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'mobile_app_access', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'location_tracking', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'manage_notifications', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'view_notifications', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'manage_calendar', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'view_calendar', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_admin', 'view_webhooks', '*', NULL::VARCHAR, NULL::VARCHAR)
    ) AS v(role, permission, resource, program_id, corporate_client_id)
    WHERE NOT EXISTS (
        SELECT 1 FROM role_permissions rp
        WHERE rp.role = v.role
        AND rp.permission = v.permission
        AND rp.resource = v.resource
        AND COALESCE(rp.program_id, '') = COALESCE(v.program_id, '')
        AND COALESCE(rp.corporate_client_id, '') = COALESCE(v.corporate_client_id, '')
    );

    -- Insert permissions for program_user (limited program access)
    INSERT INTO role_permissions (role, permission, resource, program_id, corporate_client_id)
    SELECT * FROM (VALUES
        ('program_user', 'view_programs', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_user', 'view_locations', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_user', 'view_clients', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_user', 'view_client_groups', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_user', 'view_drivers', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_user', 'view_vehicles', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_user', 'view_trips', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_user', 'create_trips', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_user', 'update_trip_status', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_user', 'view_trip_categories', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_user', 'mobile_app_access', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_user', 'view_notifications', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('program_user', 'view_calendar', '*', NULL::VARCHAR, NULL::VARCHAR)
    ) AS v(role, permission, resource, program_id, corporate_client_id)
    WHERE NOT EXISTS (
        SELECT 1 FROM role_permissions rp
        WHERE rp.role = v.role
        AND rp.permission = v.permission
        AND rp.resource = v.resource
        AND COALESCE(rp.program_id, '') = COALESCE(v.program_id, '')
        AND COALESCE(rp.corporate_client_id, '') = COALESCE(v.corporate_client_id, '')
    );

    -- Insert permissions for driver (driver-specific permissions)
    INSERT INTO role_permissions (role, permission, resource, program_id, corporate_client_id)
    SELECT * FROM (VALUES
        ('driver', 'view_programs', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('driver', 'view_locations', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('driver', 'view_clients', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('driver', 'view_trips', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('driver', 'update_trip_status', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('driver', 'view_trip_categories', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('driver', 'mobile_app_access', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('driver', 'location_tracking', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('driver', 'view_notifications', '*', NULL::VARCHAR, NULL::VARCHAR),
        ('driver', 'view_calendar', '*', NULL::VARCHAR, NULL::VARCHAR)
    ) AS v(role, permission, resource, program_id, corporate_client_id)
    WHERE NOT EXISTS (
        SELECT 1 FROM role_permissions rp
        WHERE rp.role = v.role
        AND rp.permission = v.permission
        AND rp.resource = v.resource
        AND COALESCE(rp.program_id, '') = COALESCE(v.program_id, '')
        AND COALESCE(rp.corporate_client_id, '') = COALESCE(v.corporate_client_id, '')
    );
EXCEPTION WHEN unique_violation THEN
    -- Ignore duplicate key errors
    NULL;
END $$;

COMMIT;

