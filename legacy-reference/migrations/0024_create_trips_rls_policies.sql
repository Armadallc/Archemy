-- ============================================================================
-- RLS POLICIES FOR TRIPS TABLE
-- ============================================================================
-- This file contains comprehensive RLS policies for the trips table
-- Apply these policies in the Supabase SQL Editor

-- First, drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "trips_super_admin_select" ON trips;
DROP POLICY IF EXISTS "trips_corporate_admin_select" ON trips;
DROP POLICY IF EXISTS "trips_program_admin_select" ON trips;
DROP POLICY IF EXISTS "trips_program_user_select" ON trips;
DROP POLICY IF EXISTS "trips_driver_select" ON trips;
DROP POLICY IF EXISTS "trips_insert" ON trips;
DROP POLICY IF EXISTS "trips_update" ON trips;

-- ============================================================================
-- SELECT POLICIES
-- ============================================================================

-- Super Admin can see all trips
CREATE POLICY "trips_super_admin_select" ON trips
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND u.role = 'super_admin'
  )
);

-- Corporate Admin can see trips for their corporate client
CREATE POLICY "trips_corporate_admin_select" ON trips
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN programs p ON p.id = trips.program_id
    JOIN corporate_clients cc ON cc.id = p.corporate_client_id
    WHERE u.user_id = auth.uid()::text
    AND u.role = 'corporate_admin'
    AND u.corporate_client_id = cc.id
  )
);

-- Program Admin can see trips for their programs
CREATE POLICY "trips_program_admin_select" ON trips
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND u.role = 'program_admin'
    AND (
      trips.program_id = u.primary_program_id
      OR trips.program_id = ANY(u.authorized_programs)
    )
  )
);

-- Program User can see trips for their facility
CREATE POLICY "trips_program_user_select" ON trips
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND u.role = 'program_user'
    AND trips.program_id = u.primary_program_id
  )
);

-- Driver can see trips assigned to them
CREATE POLICY "trips_driver_select" ON trips
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN drivers d ON d.user_id = u.user_id
    WHERE u.user_id = auth.uid()::text
    AND u.role = 'driver'
    AND trips.driver_id = d.id
  )
);

-- ============================================================================
-- INSERT POLICIES
-- ============================================================================

-- Users can insert trips for programs they have access to
CREATE POLICY "trips_insert" ON trips
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND u.role IN ('super_admin', 'corporate_admin', 'program_admin', 'program_user')
    AND (
      u.role = 'super_admin'
      OR (u.role = 'corporate_admin' AND trips.program_id IN (
        SELECT p.id FROM programs p
        JOIN corporate_clients cc ON cc.id = p.corporate_client_id
        WHERE cc.id = u.corporate_client_id
      ))
      OR (u.role = 'program_admin' AND (
        trips.program_id = u.primary_program_id
        OR trips.program_id = ANY(u.authorized_programs)
      ))
      OR (u.role = 'program_user' AND trips.program_id = u.primary_program_id)
    )
  )
);

-- ============================================================================
-- UPDATE POLICIES
-- ============================================================================

-- Users can update trips they have access to
CREATE POLICY "trips_update" ON trips
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND (
      u.role = 'super_admin'
      OR (u.role = 'driver' AND EXISTS (
        SELECT 1 FROM drivers d
        WHERE d.user_id = u.user_id
        AND d.id = trips.driver_id
      ))
      OR (u.role IN ('corporate_admin', 'program_admin', 'program_user') AND (
        u.role = 'corporate_admin' AND trips.program_id IN (
          SELECT p.id FROM programs p
          JOIN corporate_clients cc ON cc.id = p.corporate_client_id
          WHERE cc.id = u.corporate_client_id
        )
        OR (u.role = 'program_admin' AND (
          trips.program_id = u.primary_program_id
          OR trips.program_id = ANY(u.authorized_programs)
        ))
        OR (u.role = 'program_user' AND trips.program_id = u.primary_program_id)
      ))
    )
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test queries to verify policies work:
-- 
-- 1. Test as Super Admin:
-- SELECT id, program_id, driver_id, status FROM trips LIMIT 5;
--
-- 2. Test as Corporate Admin:
-- SELECT id, program_id, driver_id, status FROM trips LIMIT 5;
--
-- 3. Test as Program Admin:
-- SELECT id, program_id, driver_id, status FROM trips LIMIT 5;
--
-- 4. Test as Program User:
-- SELECT id, program_id, driver_id, status FROM trips LIMIT 5;
--
-- 5. Test as Driver:
-- SELECT id, program_id, driver_id, status FROM trips LIMIT 5;
