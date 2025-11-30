-- ============================================================================
-- UPDATE FREQUENT LOCATIONS location_type CONSTRAINT
-- Multi-Tenant Transportation Management System
-- ============================================================================

BEGIN;

-- STEP 1: Drop the existing constraint(s) FIRST before updating data
-- Try multiple approaches to ensure we drop the constraint

-- Method 1: Try dropping by known name
ALTER TABLE frequent_locations 
DROP CONSTRAINT IF EXISTS frequent_locations_location_type_check;

-- Method 2: Find and drop any constraint on location_type (handles auto-generated names)
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    -- Find and drop any constraint on location_type
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'frequent_locations'::regclass 
        AND contype = 'c'
        AND (pg_get_constraintdef(oid) LIKE '%location_type%' 
             OR conname LIKE '%location_type%')
    LOOP
        BEGIN
            EXECUTE 'ALTER TABLE frequent_locations DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
            RAISE NOTICE 'Dropped constraint: %', constraint_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop constraint %: %', constraint_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- STEP 2: Now update existing rows to map old location_type values to new ones
-- Map old values to new values:
-- 'facility' -> 'service_location'
-- 'courthouse' -> 'legal'
-- 'medical' -> 'healthcare'
-- 'commercial' -> 'grocery'
-- 'pickup', 'dropoff', 'destination' -> 'other' (these are not types)

UPDATE frequent_locations 
SET location_type = 'service_location' 
WHERE location_type IN ('facility');

UPDATE frequent_locations 
SET location_type = 'legal' 
WHERE location_type IN ('courthouse');

UPDATE frequent_locations 
SET location_type = 'healthcare' 
WHERE location_type IN ('medical');

UPDATE frequent_locations 
SET location_type = 'grocery' 
WHERE location_type IN ('commercial');

UPDATE frequent_locations 
SET location_type = 'other' 
WHERE location_type IN ('pickup', 'dropoff', 'destination');

-- STEP 3: Update the default value to match the new location types
ALTER TABLE frequent_locations 
ALTER COLUMN location_type SET DEFAULT 'service_location';

-- STEP 4: Add the new constraint with updated location types
ALTER TABLE frequent_locations 
ADD CONSTRAINT frequent_locations_location_type_check CHECK (
  location_type = ANY (ARRAY[
    'service_location'::text,
    'legal'::text,
    'healthcare'::text,
    'dmv'::text,
    'grocery'::text,
    'other'::text
  ])
);

COMMIT;

