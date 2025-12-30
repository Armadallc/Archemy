-- ============================================================================
-- Migration: 0055_add_stops_to_trips.sql
-- Description: Add stops column to trips table for multi-stop trip support
-- Date: 2025-01-24
-- ============================================================================

-- Add stops column to trips table
-- This stores intermediate stop addresses between origin and destination
-- Format: JSONB array of address strings, e.g., ["Stop 1 Address", "Stop 2 Address"]
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS stops JSONB DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN trips.stops IS 'Array of intermediate stop addresses for multi-stop trips. Maximum 8 stops allowed. Format: JSONB array of address strings.';

-- Create index for JSONB queries (optional, but useful for filtering/searching)
CREATE INDEX IF NOT EXISTS idx_trips_stops ON trips USING GIN (stops);




