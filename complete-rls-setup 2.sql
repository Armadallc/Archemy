-- ============================================================================
-- COMPLETE RLS SETUP FOR HALCYON NMT
-- ============================================================================
-- This script enables RLS on all tables and creates basic policies
-- Run this in Supabase SQL Editor

-- ============================================================================
-- STEP 1: ENABLE RLS ON ALL PUBLIC SCHEMA TABLES
-- ============================================================================

ALTER TABLE corporate_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE frequent_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_duty_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_access_audit ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: CREATE BASIC RLS POLICIES
-- ============================================================================

-- Corporate Clients: Super admins see all, corporate admins see their own
DROP POLICY IF EXISTS "corporate_clients_policy" ON corporate_clients;
CREATE POLICY "corporate_clients_policy" ON corporate_clients
    FOR ALL USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users 
            WHERE role = 'super_admin' 
            OR (role = 'corporate_admin' AND corporate_client_id = corporate_clients.id)
        )
    );

-- Programs: Based on corporate client access
DROP POLICY IF EXISTS "programs_policy" ON programs;
CREATE POLICY "programs_policy" ON programs
    FOR ALL USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users 
            WHERE role = 'super_admin' 
            OR (role = 'corporate_admin' AND corporate_client_id = programs.corporate_client_id)
            OR (role = 'program_admin' AND primary_program_id = programs.id)
            OR (programs.id = ANY(authorized_programs))
        )
    );

-- Users: Super admins see all, corporate admins see their users, users see themselves
DROP POLICY IF EXISTS "users_policy" ON users;
CREATE POLICY "users_policy" ON users
    FOR ALL USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users u2
            WHERE u2.role = 'super_admin' 
            OR (u2.role = 'corporate_admin' AND u2.corporate_client_id = users.corporate_client_id)
            OR users.auth_user_id = auth.uid()
        )
    );

-- Clients: Based on program access
DROP POLICY IF EXISTS "clients_policy" ON clients;
CREATE POLICY "clients_policy" ON clients
    FOR ALL USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users 
            WHERE role = 'super_admin' 
            OR (role = 'corporate_admin' AND corporate_client_id = (
                SELECT corporate_client_id FROM programs WHERE id = clients.program_id
            ))
            OR (role = 'program_admin' AND primary_program_id = clients.program_id)
            OR (clients.program_id = ANY(authorized_programs))
        )
    );

-- Client Groups: Based on program access
DROP POLICY IF EXISTS "client_groups_policy" ON client_groups;
CREATE POLICY "client_groups_policy" ON client_groups
    FOR ALL USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users 
            WHERE role = 'super_admin' 
            OR (role = 'corporate_admin' AND corporate_client_id = (
                SELECT corporate_client_id FROM programs WHERE id = client_groups.program_id
            ))
            OR (role = 'program_admin' AND primary_program_id = client_groups.program_id)
            OR (client_groups.program_id = ANY(authorized_programs))
        )
    );

-- Client Group Memberships: Based on group access
DROP POLICY IF EXISTS "client_group_memberships_policy" ON client_group_memberships;
CREATE POLICY "client_group_memberships_policy" ON client_group_memberships
    FOR ALL USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users 
            WHERE role = 'super_admin' 
            OR (role = 'corporate_admin' AND corporate_client_id = (
                SELECT p.corporate_client_id FROM programs p
                JOIN client_groups cg ON cg.program_id = p.id
                WHERE cg.id = client_group_memberships.client_group_id
            ))
            OR (role = 'program_admin' AND primary_program_id = (
                SELECT program_id FROM client_groups WHERE id = client_group_memberships.client_group_id
            ))
            OR ((
                SELECT program_id FROM client_groups WHERE id = client_group_memberships.client_group_id
            ) = ANY(authorized_programs))
        )
    );

-- Drivers: Based on program access
DROP POLICY IF EXISTS "drivers_policy" ON drivers;
CREATE POLICY "drivers_policy" ON drivers
    FOR ALL USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users 
            WHERE role = 'super_admin' 
            OR (role = 'corporate_admin' AND corporate_client_id = (
                SELECT corporate_client_id FROM programs WHERE id = drivers.program_id
            ))
            OR (role = 'program_admin' AND primary_program_id = drivers.program_id)
            OR (drivers.program_id = ANY(authorized_programs))
        )
    );

-- Vehicles: Based on program access
DROP POLICY IF EXISTS "vehicles_policy" ON vehicles;
CREATE POLICY "vehicles_policy" ON vehicles
    FOR ALL USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users 
            WHERE role = 'super_admin' 
            OR (role = 'corporate_admin' AND corporate_client_id = (
                SELECT corporate_client_id FROM programs WHERE id = vehicles.program_id
            ))
            OR (role = 'program_admin' AND primary_program_id = vehicles.program_id)
            OR (vehicles.program_id = ANY(authorized_programs))
        )
    );

-- Trips: Based on program access
DROP POLICY IF EXISTS "trips_policy" ON trips;
CREATE POLICY "trips_policy" ON trips
    FOR ALL USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users 
            WHERE role = 'super_admin' 
            OR (role = 'corporate_admin' AND corporate_client_id = (
                SELECT corporate_client_id FROM programs WHERE id = trips.program_id
            ))
            OR (role = 'program_admin' AND primary_program_id = trips.program_id)
            OR (trips.program_id = ANY(authorized_programs))
        )
    );

-- Frequent Locations: Based on program access
DROP POLICY IF EXISTS "frequent_locations_policy" ON frequent_locations;
CREATE POLICY "frequent_locations_policy" ON frequent_locations
    FOR ALL USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users 
            WHERE role = 'super_admin' 
            OR (role = 'corporate_admin' AND corporate_client_id = (
                SELECT corporate_client_id FROM programs WHERE id = frequent_locations.program_id
            ))
            OR (role = 'program_admin' AND primary_program_id = frequent_locations.program_id)
            OR (frequent_locations.program_id = ANY(authorized_programs))
        )
    );

-- Locations: Based on program access
DROP POLICY IF EXISTS "locations_policy" ON locations;
CREATE POLICY "locations_policy" ON locations
    FOR ALL USING (
        auth.uid() IN (
            SELECT auth_user_id FROM users 
            WHERE role = 'super_admin' 
            OR (role = 'corporate_admin' AND corporate_client_id = (
                SELECT corporate_client_id FROM programs WHERE id = locations.program_id
            ))
            OR (role = 'program_admin' AND primary_program_id = locations.program_id)
            OR (locations.program_id = ANY(authorized_programs))
        )
    );

-- ============================================================================
-- STEP 3: VERIFY RLS STATUS
-- ============================================================================

SELECT 
    schemaname, 
    tablename, 
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- ============================================================================
-- STEP 4: TEST RLS POLICIES
-- ============================================================================

-- This will show which policies exist for each table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
