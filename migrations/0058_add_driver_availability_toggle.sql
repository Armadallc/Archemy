-- Migration: Add is_available field to drivers table for location sharing toggle
-- This allows drivers to control when their location is shared with admins/main app users

-- Add is_available column to drivers table
-- Default to false - drivers must explicitly enable location sharing
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT false;

-- Add comment explaining the field
COMMENT ON COLUMN drivers.is_available IS 'Controls location sharing availability. When true, driver location is shared with admins/main app users. Cannot be toggled off during active trips.';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_drivers_is_available ON drivers(is_available) WHERE is_available = true;

-- Update existing drivers to false so they must explicitly enable location sharing
-- This ensures drivers consciously opt-in to location sharing
UPDATE drivers
SET is_available = false
WHERE is_available IS NULL OR is_available = true;

-- Add comment to migration
COMMENT ON TABLE drivers IS 'Drivers table with availability toggle for location sharing';

