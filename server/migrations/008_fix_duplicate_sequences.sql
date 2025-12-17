-- ============================================================================
-- Fix Duplicate Sequence Entries
-- ============================================================================
-- This migration fixes duplicate entries in id_sequences table
-- and properly syncs sequences with existing SCIDs
-- Created: 2024-12-16

-- ============================================================================
-- STEP 1: Check Current State
-- ============================================================================
-- First, let's see what we're working with
SELECT 
    entity_type,
    program_code,
    date_key,
    last_value,
    COUNT(*) OVER (PARTITION BY entity_type, program_code, date_key) as duplicate_count
FROM id_sequences
WHERE entity_type = 'client_scid'
ORDER BY program_code, date_key;

-- ============================================================================
-- STEP 2: Check Existing SCIDs in Clients Table
-- ============================================================================
SELECT 
    p.code as program_code,
    COUNT(c.id) as total_clients,
    COUNT(c.scid) as clients_with_scid,
    MAX(CAST(SUBSTRING(c.scid FROM '-(.+)$') AS INTEGER)) as max_scid_sequence
FROM programs p
LEFT JOIN clients c ON c.program_id = p.id
WHERE p.code IS NOT NULL
GROUP BY p.code
ORDER BY p.code;

-- ============================================================================
-- STEP 3: Remove Duplicate Sequence Entries
-- ============================================================================
-- Keep only the entry with the highest last_value for each program
-- First, let's see what duplicates exist
SELECT 
    entity_type,
    program_code,
    date_key,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as ids,
    MAX(last_value) as max_value
FROM id_sequences
WHERE entity_type = 'client_scid'
GROUP BY entity_type, program_code, date_key
HAVING COUNT(*) > 1;

-- Delete duplicates, keeping the one with highest last_value
-- Use a subquery to identify which IDs to keep (highest last_value)
WITH duplicates_to_keep AS (
    SELECT DISTINCT ON (entity_type, program_code, COALESCE(date_key::text, 'NULL'))
        id
    FROM id_sequences
    WHERE entity_type = 'client_scid'
    ORDER BY entity_type, program_code, COALESCE(date_key::text, 'NULL'), last_value DESC, updated_at DESC, id DESC
)
DELETE FROM id_sequences
WHERE entity_type = 'client_scid'
  AND id NOT IN (SELECT id FROM duplicates_to_keep);

-- Verify duplicates are gone
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
-- STEP 4: Sync Sequences with Existing SCIDs
-- ============================================================================
-- Update sequences to match the maximum existing SCID for each program
DO $$
DECLARE
    program_record RECORD;
    max_seq INTEGER;
    program_code_val VARCHAR(10);
BEGIN
    -- For each program, find the maximum SCID sequence number
    FOR program_record IN
        SELECT 
            p.id as program_id,
            p.code as program_code,
            p.name as program_name,
            COALESCE(MAX(
                CAST(SUBSTRING(c.scid FROM '-(.+)$') AS INTEGER)
            ), 0) as max_existing_seq
        FROM programs p
        LEFT JOIN clients c ON c.program_id = p.id 
            AND c.scid IS NOT NULL 
            AND c.scid ~ ('^' || p.code || '-[0-9]+$')
        WHERE p.code IS NOT NULL
        GROUP BY p.id, p.code, p.name
    LOOP
        program_code_val := program_record.program_code;
        max_seq := program_record.max_existing_seq;
        
        -- Update or insert the sequence
        INSERT INTO id_sequences (entity_type, program_code, date_key, last_value)
        VALUES ('client_scid', program_code_val, NULL, max_seq)
        ON CONFLICT (entity_type, program_code, date_key)
        DO UPDATE SET 
            last_value = GREATEST(id_sequences.last_value, max_seq),
            updated_at = NOW();
        
        RAISE NOTICE 'Synced sequence for % (code: %): max_seq = %, next will be %', 
            program_record.program_name, 
            program_code_val, 
            max_seq, 
            max_seq + 1;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 5: Verify Fix
-- ============================================================================
-- Check that duplicates are gone and sequences are synced
SELECT 
    s.entity_type,
    s.program_code,
    s.last_value as sequence_last_value,
    p.name as program_name,
    COUNT(c.id) FILTER (WHERE c.scid IS NOT NULL) as clients_with_scid,
    MAX(CAST(SUBSTRING(c.scid FROM '-(.+)$') AS INTEGER)) FILTER (
        WHERE c.scid IS NOT NULL AND c.scid ~ ('^' || s.program_code || '-[0-9]+$')
    ) as max_existing_scid
FROM id_sequences s
LEFT JOIN programs p ON p.code = s.program_code
LEFT JOIN clients c ON c.program_id = p.id
WHERE s.entity_type = 'client_scid'
  AND s.date_key IS NULL
GROUP BY s.entity_type, s.program_code, s.last_value, p.name
ORDER BY s.program_code;

-- Expected: 
-- - No duplicate program_code entries
-- - sequence_last_value >= max_existing_scid (or 0 if no clients exist)
-- - Each program should have exactly one sequence entry
