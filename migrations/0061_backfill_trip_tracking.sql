-- ============================================================================
-- BACKFILL TRIP TRACKING DATA
-- Migration: 0061_backfill_trip_tracking.sql
-- Description: Backfills created_by, updated_by, and updated_at for existing trips
-- ============================================================================

-- Strategy:
-- 1. Set updated_at to created_at for trips where updated_at is NULL
--    (This ensures all trips have an updated_at timestamp)
-- 2. Leave created_by and updated_by as NULL for old trips
--    (They were created before tracking was implemented - this is accurate)
-- 3. For trips that have been updated since migration, updated_by should already be set
--    (No action needed for these)

-- Step 1: Set updated_at to created_at for trips where updated_at is NULL
-- This ensures all trips have an updated_at timestamp
UPDATE trips
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Step 2: Verify the backfill
-- Count trips with NULL created_by (old trips, before tracking)
DO $$
DECLARE
    old_trips_count INTEGER;
    trips_with_updated_at INTEGER;
    trips_without_updated_at INTEGER;
BEGIN
    -- Count old trips (created before tracking)
    SELECT COUNT(*) INTO old_trips_count
    FROM trips
    WHERE created_by IS NULL;
    
    -- Count trips with updated_at set
    SELECT COUNT(*) INTO trips_with_updated_at
    FROM trips
    WHERE updated_at IS NOT NULL;
    
    -- Count trips without updated_at (should be 0 after backfill)
    SELECT COUNT(*) INTO trips_without_updated_at
    FROM trips
    WHERE updated_at IS NULL;
    
    RAISE NOTICE '✅ Backfill Summary:';
    RAISE NOTICE '   - Old trips (created_by IS NULL): %', old_trips_count;
    RAISE NOTICE '   - Trips with updated_at: %', trips_with_updated_at;
    RAISE NOTICE '   - Trips without updated_at: %', trips_without_updated_at;
    
    IF trips_without_updated_at > 0 THEN
        RAISE WARNING '⚠️  Some trips still have NULL updated_at. Check for trips with NULL created_at.';
    ELSE
        RAISE NOTICE '✅ All trips now have updated_at timestamp';
    END IF;
END $$;

-- Step 3: Add comment for documentation
COMMENT ON COLUMN trips.created_by IS 'User ID of the user who created the trip. NULL for trips created before tracking was implemented.';
COMMENT ON COLUMN trips.updated_by IS 'User ID of the user who last updated the trip. NULL for trips that have not been updated since tracking was implemented.';


