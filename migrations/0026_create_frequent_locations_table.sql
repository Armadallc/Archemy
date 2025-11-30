-- ============================================================================
-- CREATE FREQUENT LOCATIONS TABLE
-- Multi-Tenant Transportation Management System
--
-- This migration creates the frequent_locations table for managing commonly
-- used pickup and drop-off locations in trip creation forms.
-- Adapted from legacy schema to work with corporate_clients/programs/locations hierarchy.
-- ============================================================================

-- Create frequent_locations table
CREATE TABLE IF NOT EXISTS frequent_locations (
  id TEXT PRIMARY KEY DEFAULT ('fl_'::text || gen_random_uuid()),
  
  -- Hierarchy relationships (replaces organization_id)
  corporate_client_id TEXT REFERENCES corporate_clients(id) ON DELETE CASCADE,
  program_id TEXT REFERENCES programs(id) ON DELETE CASCADE,
  location_id TEXT REFERENCES locations(id) ON DELETE CASCADE,
  
  -- Location details
  name TEXT NOT NULL,
  description TEXT,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  full_address TEXT NOT NULL,
  
  -- Location classification (expanded from legacy)
  location_type TEXT DEFAULT 'destination' CHECK (
    location_type = ANY (ARRAY[
      'destination'::text,
      'pickup'::text,
      'dropoff'::text,
      'facility'::text,
      'courthouse'::text,
      'medical'::text,
      'commercial'::text,
      'other'::text
    ])
  ),
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT frequent_locations_hierarchy_check CHECK (
    (corporate_client_id IS NOT NULL AND program_id IS NULL AND location_id IS NULL) OR
    (corporate_client_id IS NOT NULL AND program_id IS NOT NULL AND location_id IS NULL) OR
    (corporate_client_id IS NOT NULL AND program_id IS NOT NULL AND location_id IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_frequent_locations_corporate_client ON frequent_locations(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_frequent_locations_program ON frequent_locations(program_id);
CREATE INDEX IF NOT EXISTS idx_frequent_locations_location ON frequent_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_frequent_locations_type ON frequent_locations(location_type);
CREATE INDEX IF NOT EXISTS idx_frequent_locations_active ON frequent_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_frequent_locations_usage ON frequent_locations(usage_count DESC);

-- Enable RLS
ALTER TABLE frequent_locations ENABLE ROW LEVEL SECURITY;

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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_frequent_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER frequent_locations_updated_at
  BEFORE UPDATE ON frequent_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_frequent_locations_updated_at();

-- Insert some sample data for testing
INSERT INTO frequent_locations (
  id,
  corporate_client_id,
  program_id,
  name,
  description,
  street_address,
  city,
  state,
  zip_code,
  full_address,
  location_type,
  usage_count,
  is_active
) VALUES 
(
  'fl_sample_001',
  'monarch_corporate_001',
  'monarch_program_001',
  'Monarch Competency Center',
  'Main facility for Monarch Competency program',
  '123 Main Street',
  'Springfield',
  'IL',
  '62701',
  '123 Main Street, Springfield, IL 62701',
  'facility',
  15,
  true
),
(
  'fl_sample_002',
  'monarch_corporate_001',
  'monarch_program_001',
  'Springfield Courthouse',
  'Local courthouse for legal appointments',
  '456 Court Street',
  'Springfield',
  'IL',
  '62701',
  '456 Court Street, Springfield, IL 62701',
  'courthouse',
  8,
  true
),
(
  'fl_sample_003',
  'monarch_corporate_001',
  'monarch_program_001',
  'Springfield Medical Center',
  'Primary medical facility for health appointments',
  '789 Health Drive',
  'Springfield',
  'IL',
  '62701',
  '789 Health Drive, Springfield, IL 62701',
  'medical',
  12,
  true
);

-- Grant permissions
GRANT ALL ON frequent_locations TO authenticated, service_role;
GRANT USAGE ON SEQUENCE frequent_locations_id_seq TO authenticated, service_role;
