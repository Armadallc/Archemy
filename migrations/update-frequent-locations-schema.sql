-- ============================================================================
-- FREQUENT LOCATIONS SCHEMA ENHANCEMENT
-- Add tag system, auto-sync, and priority fields to frequent_locations table
-- ============================================================================

-- Add new columns to frequent_locations table
ALTER TABLE frequent_locations 
ADD COLUMN IF NOT EXISTS tag VARCHAR(50) DEFAULT 'other',
ADD COLUMN IF NOT EXISTS is_service_location BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_synced BOOLEAN DEFAULT false;

-- Create index on tag for better performance
CREATE INDEX IF NOT EXISTS idx_frequent_locations_tag ON frequent_locations(tag);

-- Create index on priority for sorting
CREATE INDEX IF NOT EXISTS idx_frequent_locations_priority ON frequent_locations(priority);

-- Update existing frequent locations to have 'other' tag if null
UPDATE frequent_locations 
SET tag = 'other' 
WHERE tag IS NULL;

-- ============================================================================
-- AUTO-SYNC TRIGGER FUNCTION
-- Automatically add service locations to frequent locations when created
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_service_location_to_frequent()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new service location into frequent_locations
  INSERT INTO frequent_locations (
    name, 
    full_address, 
    street_address, 
    city, 
    state, 
    zip_code,
    program_id, 
    tag, 
    is_service_location, 
    auto_synced, 
    usage_count,
    priority,
    created_at,
    updated_at
  ) VALUES (
    NEW.name, 
    NEW.address,
    -- Extract street address (first part before comma)
    COALESCE(TRIM(SPLIT_PART(NEW.address, ',', 1)), ''),
    -- Extract city (second part before comma)
    COALESCE(TRIM(SPLIT_PART(NEW.address, ',', 2)), ''),
    -- Extract state (third part before comma)
    COALESCE(TRIM(SPLIT_PART(NEW.address, ',', 3)), ''),
    -- Extract zip code (fourth part before comma)
    COALESCE(TRIM(SPLIT_PART(NEW.address, ',', 4)), ''),
    NEW.program_id, 
    'service_location', 
    true, 
    true, 
    0,
    1, -- Highest priority for service locations
    NOW(),
    NOW()
  )
  ON CONFLICT (name, program_id) DO NOTHING; -- Prevent duplicates
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-sync service locations
DROP TRIGGER IF EXISTS sync_service_locations ON locations;
CREATE TRIGGER sync_service_locations
  AFTER INSERT ON locations
  FOR EACH ROW
  EXECUTE FUNCTION sync_service_location_to_frequent();

-- ============================================================================
-- UPDATE EXISTING SERVICE LOCATIONS
-- Add existing service locations to frequent_locations if not already present
-- ============================================================================

INSERT INTO frequent_locations (
  name, 
  full_address, 
  street_address, 
  city, 
  state, 
  zip_code,
  program_id, 
  tag, 
  is_service_location, 
  auto_synced, 
  usage_count,
  priority,
  created_at,
  updated_at
)
SELECT 
  l.name,
  l.address,
  COALESCE(TRIM(SPLIT_PART(l.address, ',', 1)), ''),
  COALESCE(TRIM(SPLIT_PART(l.address, ',', 2)), ''),
  COALESCE(TRIM(SPLIT_PART(l.address, ',', 3)), ''),
  COALESCE(TRIM(SPLIT_PART(l.address, ',', 4)), ''),
  l.program_id,
  'service_location',
  true,
  true,
  0,
  1,
  NOW(),
  NOW()
FROM locations l
WHERE NOT EXISTS (
  SELECT 1 FROM frequent_locations fl 
  WHERE fl.name = l.name 
  AND fl.program_id = l.program_id 
  AND fl.is_service_location = true
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check the updated schema
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'frequent_locations' 
ORDER BY ordinal_position;

-- Check service locations in frequent_locations
SELECT name, tag, is_service_location, priority, usage_count
FROM frequent_locations 
WHERE is_service_location = true 
ORDER BY priority, usage_count DESC;

-- Check all tags and their counts
SELECT tag, COUNT(*) as count
FROM frequent_locations 
GROUP BY tag 
ORDER BY 
  CASE tag
    WHEN 'service_location' THEN 1
    WHEN 'grocery_store' THEN 2
    WHEN 'dmv' THEN 3
    WHEN 'legal_services' THEN 4
    WHEN 'medical' THEN 5
    WHEN 'non_medical' THEN 6
    WHEN 'group_activity' THEN 7
    WHEN 'fellowship' THEN 8
    WHEN 'other' THEN 9
    ELSE 10
  END;














