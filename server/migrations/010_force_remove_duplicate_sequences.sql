-- ============================================================================
-- Force Remove Duplicate Sequences (Aggressive Cleanup)
-- ============================================================================
-- This migration aggressively removes ALL duplicate sequence entries
-- and ensures only one entry exists per program
-- Created: 2024-12-16

-- ============================================================================
-- STEP 1: Show Current Duplicates
-- ============================================================================
SELECT 
    entity_type,
    program_code,
    date_key,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as ids,
    MAX(last_value) as max_value,
    MIN(last_value) as min_value
FROM id_sequences
WHERE entity_type = 'client_scid'
GROUP BY entity_type, program_code, date_key
HAVING COUNT(*) > 1;

-- ============================================================================
-- STEP 2: Delete ALL Duplicates (Keep Only Highest last_value)
-- ============================================================================
-- Use a more aggressive approach: delete all, then recreate with correct values

-- First, save the max values for each program
CREATE TEMP TABLE IF NOT EXISTS temp_sequence_max AS
SELECT 
    entity_type,
    program_code,
    date_key,
    MAX(last_value) as max_last_value
FROM id_sequences
WHERE entity_type = 'client_scid'
GROUP BY entity_type, program_code, date_key;

-- Delete ALL client_scid sequences
DELETE FROM id_sequences WHERE entity_type = 'client_scid';

-- Recreate them with the max values
INSERT INTO id_sequences (entity_type, program_code, date_key, last_value, created_at, updated_at)
SELECT 
    entity_type,
    program_code,
    date_key,
    max_last_value,
    NOW(),
    NOW()
FROM temp_sequence_max;

-- Clean up temp table
DROP TABLE IF EXISTS temp_sequence_max;

-- ============================================================================
-- STEP 3: Verify No Duplicates Remain
-- ============================================================================
SELECT 
    entity_type,
    program_code,
    date_key,
    COUNT(*) as count
FROM id_sequences
WHERE entity_type = 'client_scid'
GROUP BY entity_type, program_code, date_key
HAVING COUNT(*) > 1;
-- Expected: Should return 0 rows (no duplicates)

-- ============================================================================
-- STEP 4: Verify Sequences Exist for All Programs
-- ============================================================================
SELECT 
    p.code as program_code,
    p.name as program_name,
    s.last_value as sequence_value,
    CASE 
        WHEN s.last_value IS NULL THEN '❌ MISSING'
        ELSE '✅ EXISTS'
    END as status
FROM programs p
LEFT JOIN id_sequences s ON s.entity_type = 'client_scid' 
    AND s.program_code = p.code 
    AND s.date_key IS NULL
WHERE p.code IS NOT NULL
ORDER BY p.code;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- All duplicate sequences have been removed. Each program should now have
-- exactly one sequence entry with the correct last_value.





