-- ============================================================================
-- Fix Code Format Issues
-- Run this AFTER 011a_diagnose_code_format_issues.sql to fix format problems
-- ============================================================================
-- This script normalizes codes to match the required format:
-- Corporate Clients: 2-5 uppercase letters
-- Programs: 2-4 uppercase letters  
-- Locations: 2-5 uppercase letters
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix Corporate Client Codes
-- ============================================================================
-- Normalize to uppercase, remove non-letters, truncate to 5 chars, pad to 2 if needed
UPDATE corporate_clients
SET code = CASE
    -- If NULL or empty, generate from name
    WHEN code IS NULL OR code = '' THEN
        UPPER(SUBSTRING(REGEXP_REPLACE(name, '[^A-Z]', '', 'g'), 1, 5))
    -- If too short, pad with first letter
    WHEN LENGTH(UPPER(REGEXP_REPLACE(code, '[^A-Z]', '', 'g'))) < 2 THEN
        UPPER(SUBSTRING(REGEXP_REPLACE(code || name, '[^A-Z]', '', 'g'), 1, 5))
    -- Normalize: uppercase, letters only, truncate to 5
    ELSE
        UPPER(SUBSTRING(REGEXP_REPLACE(code, '[^A-Z]', '', 'g'), 1, 5))
END
WHERE code IS NULL 
   OR code = ''
   OR code !~ '^[A-Z]{2,5}$';

-- Ensure minimum length of 2
UPDATE corporate_clients
SET code = UPPER(SUBSTRING(REGEXP_REPLACE(code || name, '[^A-Z]', '', 'g'), 1, 5))
WHERE LENGTH(code) < 2;

-- ============================================================================
-- STEP 2: Fix Program Codes
-- ============================================================================
-- Normalize to uppercase, remove non-letters, truncate to 4 chars, pad to 2 if needed
UPDATE programs
SET code = CASE
    -- If NULL or empty, use derive_program_code function
    WHEN code IS NULL OR code = '' THEN
        derive_program_code(name)
    -- If too short, pad with first letter
    WHEN LENGTH(UPPER(REGEXP_REPLACE(code, '[^A-Z]', '', 'g'))) < 2 THEN
        UPPER(SUBSTRING(REGEXP_REPLACE(code || name, '[^A-Z]', '', 'g'), 1, 4))
    -- Normalize: uppercase, letters only, truncate to 4
    ELSE
        UPPER(SUBSTRING(REGEXP_REPLACE(code, '[^A-Z]', '', 'g'), 1, 4))
END
WHERE code IS NULL 
   OR code = ''
   OR code !~ '^[A-Z]{2,4}$';

-- Ensure minimum length of 2
UPDATE programs
SET code = derive_program_code(name)
WHERE LENGTH(code) < 2;

-- ============================================================================
-- STEP 3: Fix Location Codes
-- ============================================================================
-- Normalize to uppercase, remove non-letters, truncate to 5 chars, pad to 2 if needed
UPDATE locations
SET code = CASE
    -- If NULL or empty, use derive_location_code function
    WHEN code IS NULL OR code = '' THEN
        derive_location_code(name)
    -- If too short, pad with first letter
    WHEN LENGTH(UPPER(REGEXP_REPLACE(code, '[^A-Z]', '', 'g'))) < 2 THEN
        UPPER(SUBSTRING(REGEXP_REPLACE(code || name, '[^A-Z]', '', 'g'), 1, 5))
    -- Normalize: uppercase, letters only, truncate to 5
    ELSE
        UPPER(SUBSTRING(REGEXP_REPLACE(code, '[^A-Z]', '', 'g'), 1, 5))
END
WHERE code IS NULL 
   OR code = ''
   OR code !~ '^[A-Z]{2,5}$';

-- Ensure minimum length of 2
UPDATE locations
SET code = derive_location_code(name)
WHERE LENGTH(code) < 2;

-- ============================================================================
-- STEP 4: Handle Duplicates After Normalization
-- ============================================================================
-- If normalization created duplicates, we need to handle them
-- This will add a number suffix to duplicates

-- Corporate Clients: Add number suffix to duplicates
DO $$
DECLARE
    dup_record RECORD;
    new_code VARCHAR(5);
    suffix INTEGER;
BEGIN
    FOR dup_record IN 
        SELECT code, array_agg(id) as ids
        FROM corporate_clients
        GROUP BY code
        HAVING COUNT(*) > 1
    LOOP
        suffix := 1;
        FOR i IN 2..array_length(dup_record.ids, 1) LOOP
            -- Try to create unique code by appending number
            new_code := SUBSTRING(dup_record.code || suffix::TEXT, 1, 5);
            
            -- If still duplicate, increment suffix
            WHILE EXISTS (SELECT 1 FROM corporate_clients WHERE code = new_code) LOOP
                suffix := suffix + 1;
                new_code := SUBSTRING(dup_record.code || suffix::TEXT, 1, 5);
            END LOOP;
            
            UPDATE corporate_clients
            SET code = new_code
            WHERE id = dup_record.ids[i];
            
            suffix := suffix + 1;
        END LOOP;
    END LOOP;
END $$;

-- Programs: Add number suffix to duplicates
DO $$
DECLARE
    dup_record RECORD;
    new_code VARCHAR(4);
    suffix INTEGER;
BEGIN
    FOR dup_record IN 
        SELECT code, array_agg(id) as ids
        FROM programs
        GROUP BY code
        HAVING COUNT(*) > 1
    LOOP
        suffix := 1;
        FOR i IN 2..array_length(dup_record.ids, 1) LOOP
            -- Try to create unique code by appending number
            new_code := SUBSTRING(dup_record.code || suffix::TEXT, 1, 4);
            
            -- If still duplicate, increment suffix
            WHILE EXISTS (SELECT 1 FROM programs WHERE code = new_code) LOOP
                suffix := suffix + 1;
                new_code := SUBSTRING(dup_record.code || suffix::TEXT, 1, 4);
            END LOOP;
            
            UPDATE programs
            SET code = new_code
            WHERE id = dup_record.ids[i];
            
            suffix := suffix + 1;
        END LOOP;
    END LOOP;
END $$;

-- Locations: Handle duplicates within same program
DO $$
DECLARE
    dup_record RECORD;
    new_code VARCHAR(5);
    suffix INTEGER;
BEGIN
    FOR dup_record IN 
        SELECT program_id, code, array_agg(id) as ids
        FROM locations
        WHERE program_id IS NOT NULL
        GROUP BY program_id, code
        HAVING COUNT(*) > 1
    LOOP
        suffix := 1;
        FOR i IN 2..array_length(dup_record.ids, 1) LOOP
            -- Try to create unique code by appending number
            new_code := SUBSTRING(dup_record.code || suffix::TEXT, 1, 5);
            
            -- If still duplicate within same program, increment suffix
            WHILE EXISTS (
                SELECT 1 FROM locations 
                WHERE program_id = dup_record.program_id 
                  AND code = new_code
            ) LOOP
                suffix := suffix + 1;
                new_code := SUBSTRING(dup_record.code || suffix::TEXT, 1, 5);
            END LOOP;
            
            UPDATE locations
            SET code = new_code
            WHERE id = dup_record.ids[i];
            
            suffix := suffix + 1;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 5: Verification
-- ============================================================================
-- Run these queries to verify all codes are now valid

-- Check corporate clients
SELECT 
    'corporate_clients' as table_name,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE code ~ '^[A-Z]{2,5}$') as valid,
    COUNT(*) FILTER (WHERE code !~ '^[A-Z]{2,5}$') as invalid
FROM corporate_clients;

-- Check programs
SELECT 
    'programs' as table_name,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE code ~ '^[A-Z]{2,4}$') as valid,
    COUNT(*) FILTER (WHERE code !~ '^[A-Z]{2,4}$') as invalid
FROM programs;

-- Check locations
SELECT 
    'locations' as table_name,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE code ~ '^[A-Z]{2,5}$') as valid,
    COUNT(*) FILTER (WHERE code !~ '^[A-Z]{2,5}$') as invalid
FROM locations;

-- Show any remaining issues
SELECT 'corporate_clients' as table_name, id, name, code 
FROM corporate_clients 
WHERE code !~ '^[A-Z]{2,5}$'
UNION ALL
SELECT 'programs' as table_name, id, name, code 
FROM programs 
WHERE code !~ '^[A-Z]{2,4}$'
UNION ALL
SELECT 'locations' as table_name, id, name, code 
FROM locations 
WHERE code !~ '^[A-Z]{2,5}$';

