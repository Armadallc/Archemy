-- ============================================================================
-- Backfill Missing Trip Reference IDs
-- ============================================================================
-- This migration generates reference_ids for all trips that don't have them yet
-- Properly scoped by program and trip date
-- Created: 2025-12-25

-- ============================================================================
-- STEP 1: Sync Sequences with Existing Reference IDs
-- ============================================================================
-- Update sequences to match the maximum existing reference_id for each program/date
-- This prevents duplicate reference_id errors when generating new ones
DO $$
DECLARE
    program_record RECORD;
    date_record RECORD;
    program_code_val VARCHAR(10);
    date_key_val DATE;
    max_seq INTEGER;
BEGIN
    -- For each program/date combination that has trips with reference_ids
    FOR program_record IN 
        SELECT DISTINCT p.id, p.code, p.name
        FROM programs p
        INNER JOIN trips t ON t.program_id = p.id
        WHERE t.reference_id IS NOT NULL
          AND p.code IS NOT NULL
          AND p.code != ''
    LOOP
        program_code_val := program_record.code;
        
        -- For each date that has trips with reference_ids for this program
        FOR date_record IN
            SELECT DISTINCT t.scheduled_pickup_time::DATE as trip_date
            FROM trips t
            WHERE t.program_id = program_record.id
              AND t.reference_id IS NOT NULL
              AND t.scheduled_pickup_time IS NOT NULL
        LOOP
            date_key_val := date_record.trip_date;
            
            -- Find the maximum sequence number for this program/date combination
            -- Reference ID format: T[YYMMDD]-[PROGRAM_CODE]-[###] (e.g., T241227-MC-001)
            SELECT COALESCE(
                MAX(
                    CAST(SUBSTRING(t.reference_id FROM '-([0-9]+)$') AS INTEGER)
                ),
                0
            ) INTO max_seq
            FROM trips t
            WHERE t.program_id = program_record.id
              AND t.scheduled_pickup_time::DATE = date_key_val
              AND t.reference_id IS NOT NULL 
              AND t.reference_id ~ ('^T[0-9]{6}-' || program_code_val || '-[0-9]+$');
            
            -- Update or insert sequence
            INSERT INTO id_sequences (entity_type, program_code, date_key, last_value)
            VALUES ('trip_reference', program_code_val, date_key_val::TEXT, max_seq)
            ON CONFLICT (entity_type, program_code, date_key)
            DO UPDATE SET 
                last_value = GREATEST(id_sequences.last_value, max_seq),
                updated_at = NOW();
            
            RAISE NOTICE 'Synced sequence for program % (%), date %: max_seq = %', 
                program_code_val, program_record.name, date_key_val, max_seq;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Generate Reference IDs for Trips Missing Them
-- ============================================================================
-- Generate reference_ids for all existing trips that don't have one
-- Ordered by creation date to maintain consistency
DO $$
DECLARE
    trip_record RECORD;
    program_record RECORD;
    program_code_val VARCHAR(10);
    trip_date_val DATE;
    new_reference_id VARCHAR(30);
    trips_processed INTEGER := 0;
    trips_skipped INTEGER := 0;
BEGIN
    -- Loop through all trips without reference_id, ordered by creation date
    FOR trip_record IN 
        SELECT t.id, t.program_id, t.scheduled_pickup_time, t.created_at
        FROM trips t
        WHERE t.reference_id IS NULL
        ORDER BY t.created_at ASC
    LOOP
        -- Get program for this trip
        SELECT id, code, name INTO program_record
        FROM programs
        WHERE id = trip_record.program_id;
        
        -- Skip if program doesn't exist
        IF program_record.id IS NULL THEN
            RAISE NOTICE 'Skipping trip % - program % does not exist', trip_record.id, trip_record.program_id;
            trips_skipped := trips_skipped + 1;
            CONTINUE;
        END IF;
        
        -- Get program code
        program_code_val := program_record.code;
        
        -- Skip if program code is missing
        IF program_code_val IS NULL OR program_code_val = '' THEN
            RAISE NOTICE 'Skipping trip % - program % has no code', 
                trip_record.id, 
                program_record.name;
            trips_skipped := trips_skipped + 1;
            CONTINUE;
        END IF;
        
        -- Get trip date from scheduled_pickup_time, or use created_at date as fallback
        IF trip_record.scheduled_pickup_time IS NOT NULL THEN
            trip_date_val := trip_record.scheduled_pickup_time::DATE;
        ELSE
            trip_date_val := trip_record.created_at::DATE;
            RAISE NOTICE 'Trip % has no scheduled_pickup_time, using created_at date: %', 
                trip_record.id, trip_date_val;
        END IF;
        
        -- Generate reference_id
        BEGIN
            SELECT generate_trip_reference_id(program_code_val, trip_date_val) INTO new_reference_id;
            
            -- Update trip with reference_id
            UPDATE trips
            SET reference_id = new_reference_id
            WHERE id = trip_record.id;
            
            trips_processed := trips_processed + 1;
            
            RAISE NOTICE 'Generated reference_id % for trip % (Program: %, Date: %)', 
                new_reference_id, 
                trip_record.id,
                program_code_val,
                trip_date_val;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error generating reference_id for trip %: %', 
                trip_record.id, 
                SQLERRM;
            trips_skipped := trips_skipped + 1;
        END;
    END LOOP;
    
    RAISE NOTICE 'Reference ID generation complete: % processed, % skipped', trips_processed, trips_skipped;
END $$;

-- ============================================================================
-- STEP 3: Verify Results
-- ============================================================================
-- Show summary of reference_id assignment
SELECT 
    COUNT(*) as total_trips,
    COUNT(reference_id) as trips_with_reference_id,
    COUNT(*) - COUNT(reference_id) as trips_missing_reference_id,
    COUNT(DISTINCT program_id) as programs_with_trips
FROM trips;

-- Show trips still missing reference_ids (if any)
SELECT 
    t.id,
    t.program_id,
    p.code as program_code,
    p.name as program_name,
    t.scheduled_pickup_time,
    t.created_at
FROM trips t
LEFT JOIN programs p ON p.id = t.program_id
WHERE t.reference_id IS NULL
ORDER BY t.created_at;

-- Show reference_id distribution by program
SELECT 
    p.code as program_code,
    p.name as program_name,
    COUNT(t.id) as total_trips,
    COUNT(t.reference_id) as trips_with_reference_id,
    MIN(t.reference_id) FILTER (WHERE t.reference_id IS NOT NULL) as min_reference_id,
    MAX(t.reference_id) FILTER (WHERE t.reference_id IS NOT NULL) as max_reference_id
FROM programs p
LEFT JOIN trips t ON t.program_id = p.id
WHERE p.code IS NOT NULL
GROUP BY p.id, p.code, p.name
ORDER BY p.code;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Summary:
-- 1. Synced sequences with existing reference_ids to prevent duplicates
-- 2. Generated reference_ids for all trips missing them
-- 3. Properly scoped by program_id and trip date (from scheduled_pickup_time)
--
-- Next Steps:
-- 1. Verify all trips now have reference_ids
-- 2. Check the summary queries above for any issues
-- 3. If any trips are still missing reference_ids, check if their programs have codes
--    or if they have scheduled_pickup_time set

