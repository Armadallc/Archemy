-- ============================================================================
-- CREATE FREQUENT LOCATIONS TABLE - SIMPLIFIED FOR MANUAL APPLICATION
-- Multi-Tenant Transportation Management System
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






