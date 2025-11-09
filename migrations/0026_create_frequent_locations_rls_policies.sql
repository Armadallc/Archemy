-- ============================================================================
-- FREQUENT LOCATIONS RLS POLICIES
-- Multi-Tenant Transportation Management System
-- ============================================================================

-- Drop existing policies (safe - won't error if they don't exist)
DROP POLICY IF EXISTS "frequent_locations_super_admin_select" ON frequent_locations;
DROP POLICY IF EXISTS "frequent_locations_corporate_admin_select" ON frequent_locations;
DROP POLICY IF EXISTS "frequent_locations_program_admin_select" ON frequent_locations;
DROP POLICY IF EXISTS "frequent_locations_program_user_select" ON frequent_locations;
DROP POLICY IF EXISTS "frequent_locations_driver_select" ON frequent_locations;
DROP POLICY IF EXISTS "frequent_locations_insert" ON frequent_locations;
DROP POLICY IF EXISTS "frequent_locations_update" ON frequent_locations;
DROP POLICY IF EXISTS "frequent_locations_delete" ON frequent_locations;

-- Create RLS policies
-- Super Admin: Full access
CREATE POLICY "frequent_locations_super_admin_select" ON frequent_locations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND u.role = 'super_admin'
  )
);

-- Corporate Admin: Access to locations within their corporate entity
CREATE POLICY "frequent_locations_corporate_admin_select" ON frequent_locations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND u.role = 'corporate_admin'
    AND u.corporate_client_id = frequent_locations.corporate_client_id
  )
);

-- Program Admin: Access to locations within their programs
CREATE POLICY "frequent_locations_program_admin_select" ON frequent_locations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND u.role = 'program_admin'
    AND (
      frequent_locations.program_id = u.primary_program_id
      OR frequent_locations.program_id = ANY(u.authorized_programs)
    )
  )
);

-- Program User: Access to locations within their primary program
CREATE POLICY "frequent_locations_program_user_select" ON frequent_locations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND u.role = 'program_user'
    AND frequent_locations.program_id = u.primary_program_id
  )
);

-- Driver: Access to locations within their assigned programs
CREATE POLICY "frequent_locations_driver_select" ON frequent_locations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN drivers d ON d.user_id = u.user_id
    WHERE u.user_id = auth.uid()::text
    AND u.role = 'driver'
    AND frequent_locations.program_id = d.program_id
  )
);

-- Insert policy
CREATE POLICY "frequent_locations_insert" ON frequent_locations
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND u.role IN ('super_admin', 'corporate_admin', 'program_admin', 'program_user')
    AND (
      u.role = 'super_admin'
      OR (u.role = 'corporate_admin' AND frequent_locations.corporate_client_id = u.corporate_client_id)
      OR (u.role = 'program_admin' AND (
        frequent_locations.program_id = u.primary_program_id
        OR frequent_locations.program_id = ANY(u.authorized_programs)
      ))
      OR (u.role = 'program_user' AND frequent_locations.program_id = u.primary_program_id)
    )
  )
);

-- Update policy
CREATE POLICY "frequent_locations_update" ON frequent_locations
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND (
      u.role = 'super_admin'
      OR (u.role = 'corporate_admin' AND frequent_locations.corporate_client_id = u.corporate_client_id)
      OR (u.role = 'program_admin' AND (
        frequent_locations.program_id = u.primary_program_id
        OR frequent_locations.program_id = ANY(u.authorized_programs)
      ))
      OR (u.role = 'program_user' AND frequent_locations.program_id = u.primary_program_id)
    )
  )
);

-- Delete policy
CREATE POLICY "frequent_locations_delete" ON frequent_locations
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.user_id = auth.uid()::text
    AND (
      u.role = 'super_admin'
      OR (u.role = 'corporate_admin' AND frequent_locations.corporate_client_id = u.corporate_client_id)
      OR (u.role = 'program_admin' AND (
        frequent_locations.program_id = u.primary_program_id
        OR frequent_locations.program_id = ANY(u.authorized_programs)
      ))
      OR (u.role = 'program_user' AND frequent_locations.program_id = u.primary_program_id)
    )
  )
);






