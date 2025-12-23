-- Migration: Add trip_id to driver_locations table
-- Date: 2024-12-18
-- Purpose: Link location tracking data to specific trips for accurate mileage calculation

-- Add trip_id column to driver_locations table
ALTER TABLE driver_locations 
ADD COLUMN IF NOT EXISTS trip_id VARCHAR(50) REFERENCES trips(id) ON DELETE SET NULL;

-- Create index for trip-based location queries
CREATE INDEX IF NOT EXISTS idx_driver_locations_trip_id ON driver_locations(trip_id) WHERE trip_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN driver_locations.trip_id IS 'Links location update to a specific trip for accurate mileage calculation';

