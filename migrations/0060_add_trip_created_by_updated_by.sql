-- ============================================================================
-- TRIP CREATION/UPDATE TRACKING
-- Migration: 0060_add_trip_created_by_updated_by.sql
-- Description: Adds created_by and updated_by columns to trips table for audit tracking
-- ============================================================================

-- Add created_by column
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL;

-- Add updated_by column
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trips_created_by ON trips(created_by);
CREATE INDEX IF NOT EXISTS idx_trips_updated_by ON trips(updated_by);

-- Add comments for documentation
COMMENT ON COLUMN trips.created_by IS 'User ID of the user who created the trip';
COMMENT ON COLUMN trips.updated_by IS 'User ID of the user who last updated the trip';

