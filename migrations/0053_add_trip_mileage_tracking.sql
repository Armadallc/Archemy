-- Migration: Add mileage tracking columns to trips table
-- Date: 2024-12-18
-- Purpose: Support pre-trip mileage estimation and post-trip actual mileage calculation

-- Add estimated and actual mileage columns
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS estimated_distance_miles DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS actual_distance_miles DECIMAL(10, 2);

-- Add comment for documentation
COMMENT ON COLUMN trips.estimated_distance_miles IS 'Pre-trip mileage estimate calculated from pickup/dropoff addresses';
COMMENT ON COLUMN trips.actual_distance_miles IS 'Post-trip actual mileage calculated from driver location tracking data';

-- Create index for mileage queries
CREATE INDEX IF NOT EXISTS idx_trips_estimated_distance ON trips(estimated_distance_miles) WHERE estimated_distance_miles IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trips_actual_distance ON trips(actual_distance_miles) WHERE actual_distance_miles IS NOT NULL;

