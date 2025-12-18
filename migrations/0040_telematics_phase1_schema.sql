-- ============================================================================
-- TELEMATICS MVP - PHASE 1: Revenue Critical Features
-- Migration: 0040_telematics_phase1_schema.sql
-- Date: 2024-12-18
-- Description: Adds trip purpose coding, billing codes, legs system, and wait time tracking
-- ============================================================================

-- ============================================================================
-- ADD COLUMNS TO TRIPS TABLE
-- ============================================================================

-- Trip Purpose & Billing
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_purpose VARCHAR(20) CHECK (trip_purpose IN ('Legal', 'Groceries', 'Community', 'Program (adjacent)', 'Medical', 'Non-Medical'));
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_code VARCHAR(20); -- CPT/HCPCS code (A0120, T2001, T2004, etc.) - optional
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_modifier VARCHAR(2); -- 2 uppercase letters (e.g., 'HA') - optional, only if trip_code selected

-- Appointment & Timing
ALTER TABLE trips ADD COLUMN IF NOT EXISTS appointment_time TIMESTAMP WITH TIME ZONE; -- When client needs to be at appointment

-- Wait Time Tracking
ALTER TABLE trips ADD COLUMN IF NOT EXISTS wait_time_minutes INTEGER DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS wait_time_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS wait_time_stopped_at TIMESTAMP WITH TIME ZONE;

-- HCBS Waiver Verification
ALTER TABLE trips ADD COLUMN IF NOT EXISTS hcbs_waiver_verified BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN trips.trip_purpose IS 'Purpose of trip: Legal, Groceries, Community, Program (adjacent), Medical, Non-Medical';
COMMENT ON COLUMN trips.trip_code IS 'CPT/HCPCS billing code (e.g., A0120, T2001, T2004) - optional, used when corporate client is not the payer';
COMMENT ON COLUMN trips.trip_modifier IS 'Billing modifier (2 uppercase letters, e.g., HA) - optional, only used if trip_code is selected';
COMMENT ON COLUMN trips.appointment_time IS 'Time when client needs to be present for appointment';
COMMENT ON COLUMN trips.wait_time_minutes IS 'Total wait time in minutes (accumulated from start/stop cycles)';
COMMENT ON COLUMN trips.wait_time_started_at IS 'Timestamp when wait time timer was started';
COMMENT ON COLUMN trips.wait_time_stopped_at IS 'Timestamp when wait time timer was stopped';

-- ============================================================================
-- CREATE TRIP LEGS TABLE
-- ============================================================================
-- Supports multi-leg trips: Leg A (initial pickup to dropoff), Leg B (return or additional legs), etc.

CREATE TABLE IF NOT EXISTS trip_legs (
    id VARCHAR(50) PRIMARY KEY,
    trip_id VARCHAR(50) NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    leg_number VARCHAR(10) NOT NULL, -- 'A', 'B', 'C', etc.
    leg_type VARCHAR(50) NOT NULL CHECK (leg_type IN ('pickup_to_dropoff', 'return', 'additional_pickup', 'additional_dropoff')),
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    from_latitude DECIMAL(10, 8),
    from_longitude DECIMAL(11, 8),
    to_latitude DECIMAL(10, 8),
    to_longitude DECIMAL(11, 8),
    distance_miles DECIMAL(10, 2), -- Calculated distance between from and to addresses
    estimated_time_minutes INTEGER, -- Estimated travel time using maps API, traffic, time of day
    actual_time_minutes INTEGER, -- Actual time taken for this leg
    started_at TIMESTAMP WITH TIME ZONE, -- When driver started this leg
    completed_at TIMESTAMP WITH TIME ZONE, -- When driver completed this leg
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, leg_number)
);

-- Add comments
COMMENT ON TABLE trip_legs IS 'Individual legs of a trip. Leg A = initial pickup to dropoff, Leg B = return or additional legs';
COMMENT ON COLUMN trip_legs.leg_number IS 'Leg identifier: A, B, C, etc.';
COMMENT ON COLUMN trip_legs.leg_type IS 'Type of leg: pickup_to_dropoff, return, additional_pickup, additional_dropoff';
COMMENT ON COLUMN trip_legs.estimated_time_minutes IS 'Estimated travel time calculated using maps API, traffic conditions, and time of day';
COMMENT ON COLUMN trip_legs.actual_time_minutes IS 'Actual time taken for this leg (calculated from started_at to completed_at)';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_legs_trip_id ON trip_legs(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_legs_leg_number ON trip_legs(trip_id, leg_number);

-- ============================================================================
-- ADD COLUMN TO CLIENT_GROUPS TABLE
-- ============================================================================
-- Client groups can have a default trip purpose that doesn't change even if clients in the group change

ALTER TABLE client_groups ADD COLUMN IF NOT EXISTS trip_purpose VARCHAR(20) CHECK (trip_purpose IN ('Legal', 'Groceries', 'Community', 'Program (adjacent)', 'Medical', 'Non-Medical'));

COMMENT ON COLUMN client_groups.trip_purpose IS 'Default trip purpose for this client group. Purpose remains constant even if clients in group change.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify trips table columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'trips' 
AND column_name IN ('trip_purpose', 'trip_code', 'trip_modifier', 'appointment_time', 'wait_time_minutes', 'wait_time_started_at', 'wait_time_stopped_at', 'hcbs_waiver_verified')
ORDER BY column_name;

-- Verify trip_legs table was created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'trip_legs'
ORDER BY ordinal_position;

-- Verify client_groups column was added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'client_groups' 
AND column_name = 'trip_purpose';

SELECT 'Telematics Phase 1 schema migration completed successfully!' as status;
