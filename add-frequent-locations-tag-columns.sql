-- ============================================================================
-- ADD TAG SYSTEM COLUMNS TO FREQUENT_LOCATIONS TABLE
-- ============================================================================

-- Add new columns to frequent_locations table
ALTER TABLE frequent_locations 
ADD COLUMN IF NOT EXISTS tag VARCHAR(50) DEFAULT 'other',
ADD COLUMN IF NOT EXISTS is_service_location BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_synced BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_frequent_locations_tag ON frequent_locations(tag);
CREATE INDEX IF NOT EXISTS idx_frequent_locations_priority ON frequent_locations(priority);
CREATE INDEX IF NOT EXISTS idx_frequent_locations_is_service_location ON frequent_locations(is_service_location);

-- Update existing records to have default values
UPDATE frequent_locations 
SET 
  tag = 'other',
  is_service_location = false,
  priority = 0,
  auto_synced = false
WHERE tag IS NULL;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'frequent_locations' 
  AND column_name IN ('tag', 'is_service_location', 'priority', 'auto_synced')
ORDER BY ordinal_position;









