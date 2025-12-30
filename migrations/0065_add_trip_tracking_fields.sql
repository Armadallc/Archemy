-- ============================================================================
-- ADD TRIP TRACKING FIELDS
-- Migration: 0065_add_trip_tracking_fields.sql
-- Description: Adds client tracking and decline reason fields to trips table
-- ============================================================================
-- Created: 2025-12-30
-- 
-- This migration adds:
-- 1. client_onboard_at - When client was picked up
-- 2. client_dropoff_at - When client was dropped off at appointment
-- 3. decline_reason - Reason code for declined orders
-- 4. declined_by - User who declined the order
-- 5. declined_at - When the order was declined
-- ============================================================================

-- Step 1: Add client tracking fields
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS client_onboard_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS client_dropoff_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Add decline tracking fields
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS decline_reason VARCHAR(50),
ADD COLUMN IF NOT EXISTS declined_by VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP WITH TIME ZONE;

-- Step 3: Add comments
COMMENT ON COLUMN trips.client_onboard_at IS 'Timestamp when client was picked up and boarded the vehicle';
COMMENT ON COLUMN trips.client_dropoff_at IS 'Timestamp when client was dropped off at appointment (for round trips)';
COMMENT ON COLUMN trips.decline_reason IS 'Reason code for declined order: conflict, day_off, unavailable, vehicle_issue, personal_emergency, too_far';
COMMENT ON COLUMN trips.declined_by IS 'User ID of the driver who declined the order';
COMMENT ON COLUMN trips.declined_at IS 'Timestamp when the order was declined';

-- Step 4: Add index for declined orders (for admin dashboard queries)
CREATE INDEX IF NOT EXISTS idx_trips_declined ON trips(declined_at) WHERE declined_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trips_client_onboard ON trips(client_onboard_at) WHERE client_onboard_at IS NOT NULL;

-- Step 5: Verify the changes
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'trips'
    AND column_name IN ('client_onboard_at', 'client_dropoff_at', 'decline_reason', 'declined_by', 'declined_at');
    
    IF column_count = 5 THEN
        RAISE NOTICE 'SUCCESS: All 5 tracking fields added to trips table';
    ELSE
        RAISE EXCEPTION 'ERROR: Expected 5 columns, found %', column_count;
    END IF;
END $$;

