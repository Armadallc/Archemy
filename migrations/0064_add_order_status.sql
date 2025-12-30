-- ============================================================================
-- ADD ORDER STATUS TO TRIP STATUS
-- Migration: 0064_add_order_status.sql
-- Description: Adds 'order' status to trip status CHECK constraint and updates default
-- ============================================================================
-- Created: 2025-12-30
-- 
-- This migration:
-- 1. Adds 'order' as a new trip status (initial state for new trips)
-- 2. Updates default trip status from 'scheduled' to 'order'
-- 3. Updates CHECK constraint to include 'order' and 'no_show'
-- 4. Ensures existing trips remain in their current status
-- ============================================================================

-- Step 1: Update the CHECK constraint to include 'order' and 'no_show'
-- First, find and drop ALL existing status constraints (they may have different names)
DO $$
DECLARE
    constraint_name TEXT;
    constraint_rec RECORD;
BEGIN
    -- Find all CHECK constraints that reference status
    FOR constraint_rec IN
        SELECT conname, pg_get_constraintdef(oid) as constraint_def
        FROM pg_constraint
        WHERE conrelid = 'trips'::regclass
        AND contype = 'c'
        AND (pg_get_constraintdef(oid) LIKE '%status%IN%' OR conname LIKE '%status%')
    LOOP
        RAISE NOTICE 'Found constraint: %', constraint_rec.conname;
        EXECUTE format('ALTER TABLE trips DROP CONSTRAINT IF EXISTS %I', constraint_rec.conname);
        RAISE NOTICE 'Dropped constraint: %', constraint_rec.conname;
    END LOOP;
END $$;

-- Step 2: Add new constraint with 'order' and 'no_show' included
-- Use IF NOT EXISTS pattern by dropping first (already done above)
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;
ALTER TABLE trips ADD CONSTRAINT trips_status_check 
    CHECK (status IN ('order', 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'));

-- Step 3: Update default status for new trips
ALTER TABLE trips ALTER COLUMN status SET DEFAULT 'order';

-- Step 4: Add comment explaining the order status
COMMENT ON COLUMN trips.status IS 'Trip status: order (pending driver confirmation), scheduled (confirmed), in_progress, completed, cancelled, or no_show';

-- Step 5: Verify the changes
DO $$
DECLARE
    constraint_def TEXT;
    default_status TEXT;
    constraint_count INTEGER;
BEGIN
    -- Get the constraint definition
    SELECT pg_get_constraintdef(oid) INTO constraint_def
    FROM pg_constraint
    WHERE conrelid = 'trips'::regclass
    AND conname = 'trips_status_check';
    
    -- Get default status
    SELECT column_default INTO default_status
    FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'status';
    
    -- Count constraints
    SELECT COUNT(*) INTO constraint_count
    FROM pg_constraint
    WHERE conrelid = 'trips'::regclass
    AND conname = 'trips_status_check';
    
    RAISE NOTICE 'Status constraint definition: %', constraint_def;
    RAISE NOTICE 'Default trip status: %', default_status;
    RAISE NOTICE 'Constraint exists: %', (constraint_count > 0);
    
    -- Verify 'order' is in the constraint
    IF constraint_def LIKE '%order%' THEN
        RAISE NOTICE 'SUCCESS: order status added to CHECK constraint';
    ELSE
        RAISE EXCEPTION 'ERROR: order status not found in constraint';
    END IF;
    
    -- Verify default is 'order'
    IF default_status LIKE '%order%' THEN
        RAISE NOTICE 'SUCCESS: Default status set to order';
    ELSE
        RAISE EXCEPTION 'ERROR: Default status is not order';
    END IF;
END $$;

