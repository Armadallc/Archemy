-- ============================================================================
-- HIPAA-Compliant Identifier System Migration
-- Phase 2: Sync SCID Sequences with Existing Data
-- ============================================================================
-- This migration ensures the id_sequences table is properly synchronized
-- with existing SCIDs in the database. This prevents duplicate SCID errors
-- when creating new clients.
-- Created: 2024-12-16
-- Version: 1.0.0

-- ============================================================================
-- STEP 1: Sync Sequences for Client SCIDs
-- ============================================================================
-- For each program, find the maximum SCID sequence number and update
-- the id_sequences table to start from the next number

DO $$
DECLARE
    program_record RECORD;
    max_seq INTEGER;
    program_code_val VARCHAR(10);
    scid_pattern TEXT;
BEGIN
    -- For each program that has clients with SCIDs
    FOR program_record IN
        SELECT DISTINCT
            p.id as program_id,
            p.code as program_code,
            p.name as program_name
        FROM programs p
        INNER JOIN clients c ON c.program_id = p.id
        WHERE c.scid IS NOT NULL
          AND p.code IS NOT NULL
          AND c.scid ~ '^[A-Z0-9]+-[0-9]+$'  -- Valid SCID format: CODE-####
    LOOP
        program_code_val := program_record.program_code;
        
        -- Find the maximum sequence number for this program's SCIDs
        -- SCID format: PROGRAM_CODE-#### (e.g., MC-0001, MC-0158)
        SELECT COALESCE(MAX(
            CAST(SUBSTRING(c.scid FROM '-(.+)$') AS INTEGER)
        ), 0) INTO max_seq
        FROM clients c
        WHERE c.program_id = program_record.program_id
          AND c.scid IS NOT NULL
          AND c.scid ~ ('^' || program_code_val || '-[0-9]+$');  -- Match this program's SCIDs
        
        -- Update or insert the sequence to ensure we start from max_seq + 1
        INSERT INTO id_sequences (entity_type, program_code, date_key, last_value)
        VALUES ('client_scid', program_code_val, NULL, max_seq)
        ON CONFLICT (entity_type, program_code, date_key)
        DO UPDATE SET 
            last_value = GREATEST(id_sequences.last_value, max_seq),
            updated_at = NOW();
        
        RAISE NOTICE 'Synced sequence for program % (code: %): max_seq = %, next will be %', 
            program_record.program_name, 
            program_code_val, 
            max_seq, 
            max_seq + 1;
    END LOOP;
    
    -- Also handle programs that don't have any clients yet
    -- Initialize their sequences to 0
    FOR program_record IN
        SELECT id, code, name
        FROM programs
        WHERE code IS NOT NULL
          AND id NOT IN (
              SELECT DISTINCT program_id 
              FROM clients 
              WHERE scid IS NOT NULL
          )
    LOOP
        INSERT INTO id_sequences (entity_type, program_code, date_key, last_value)
        VALUES ('client_scid', program_record.code, NULL, 0)
        ON CONFLICT (entity_type, program_code, date_key)
        DO NOTHING;  -- Don't overwrite if sequence already exists
        
        RAISE NOTICE 'Initialized sequence for program % (code: %) with no existing clients', 
            program_record.name, 
            program_record.code;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Verify Sequence Sync
-- ============================================================================
-- Check that sequences are properly synced

SELECT 
    s.entity_type,
    s.program_code,
    s.last_value as sequence_last_value,
    p.name as program_name,
    COUNT(c.id) as clients_with_scid,
    MAX(CAST(SUBSTRING(c.scid FROM '-(.+)$') AS INTEGER)) as max_existing_scid
FROM id_sequences s
LEFT JOIN programs p ON p.code = s.program_code
LEFT JOIN clients c ON c.program_id = p.id AND c.scid IS NOT NULL AND c.scid ~ ('^' || s.program_code || '-[0-9]+$')
WHERE s.entity_type = 'client_scid'
GROUP BY s.entity_type, s.program_code, s.last_value, p.name
ORDER BY s.program_code;

-- Expected: sequence_last_value should be >= max_existing_scid for each program
-- If sequence_last_value < max_existing_scid, the sequence needs to be updated

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Sequences are now synchronized with existing SCIDs. New clients will
-- get SCIDs that don't conflict with existing ones.





