-- ============================================================================
-- Backfill Missing Client SCIDs
-- ============================================================================
-- This migration generates SCIDs for all clients that don't have them yet
-- Properly scoped by program to ensure correct program_code is used
-- Created: 2025-12-25

-- ============================================================================
-- STEP 1: Sync Sequences with Existing SCIDs
-- ============================================================================
-- Update sequences to match the maximum existing SCID for each program
-- This prevents duplicate SCID errors when generating new ones
DO $$
DECLARE
    program_record RECORD;
    program_code_val VARCHAR(10);
    max_seq INTEGER;
BEGIN
    -- For each program that has clients with SCIDs
    FOR program_record IN 
        SELECT DISTINCT p.id, p.code, p.name
        FROM programs p
        INNER JOIN clients c ON c.program_id = p.id
        WHERE c.scid IS NOT NULL
          AND p.code IS NOT NULL
          AND p.code != ''
    LOOP
        program_code_val := program_record.code;
        
        -- Find the maximum sequence number for this program's SCIDs
        -- SCID format: PROGRAM_CODE-#### (e.g., MC-0001, MC-0158)
        SELECT COALESCE(
            MAX(
                CAST(SUBSTRING(c.scid FROM '-(.+)$') AS INTEGER)
            ),
            0
        ) INTO max_seq
        FROM clients c
        WHERE c.program_id = program_record.id
          AND c.scid IS NOT NULL 
          AND c.scid ~ ('^' || program_code_val || '-[0-9]+$');  -- Match this program's SCIDs
        
        -- Update or insert sequence
        INSERT INTO id_sequences (entity_type, program_code, date_key, last_value)
        VALUES ('client_scid', program_code_val, NULL, max_seq)
        ON CONFLICT (entity_type, program_code, date_key)
        DO UPDATE SET 
            last_value = GREATEST(id_sequences.last_value, max_seq),
            updated_at = NOW();
        
        RAISE NOTICE 'Synced sequence for program % (%): max_seq = %', program_code_val, program_record.name, max_seq;
    END LOOP;
    
    -- For programs without any clients with SCIDs yet, initialize sequence at 0
    FOR program_record IN 
        SELECT p.id, p.code, p.name
        FROM programs p
        WHERE p.code IS NOT NULL
          AND p.code != ''
          AND NOT EXISTS (
              SELECT 1 FROM id_sequences s
              WHERE s.entity_type = 'client_scid'
                AND s.program_code = p.code
                AND s.date_key IS NULL
          )
    LOOP
        INSERT INTO id_sequences (entity_type, program_code, date_key, last_value)
        VALUES ('client_scid', program_record.code, NULL, 0)
        ON CONFLICT (entity_type, program_code, date_key) DO NOTHING;
        
        RAISE NOTICE 'Initialized sequence for program % (%)', program_record.code, program_record.name;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Generate SCIDs for Clients Missing Them
-- ============================================================================
-- Generate SCIDs for all existing clients that don't have one
-- Ordered by creation date to maintain consistency
DO $$
DECLARE
    client_record RECORD;
    program_record RECORD;
    program_code_val VARCHAR(10);
    new_scid VARCHAR(20);
    clients_processed INTEGER := 0;
    clients_skipped INTEGER := 0;
BEGIN
    -- Loop through all clients without SCID, ordered by creation date
    FOR client_record IN 
        SELECT c.id, c.program_id, c.created_at, c.first_name, c.last_name
        FROM clients c
        WHERE c.scid IS NULL
        ORDER BY c.created_at ASC
    LOOP
        -- Get program for this client
        SELECT id, code, name INTO program_record
        FROM programs
        WHERE id = client_record.program_id;
        
        -- Skip if program doesn't exist
        IF program_record.id IS NULL THEN
            RAISE NOTICE 'Skipping client % - program % does not exist', client_record.id, client_record.program_id;
            clients_skipped := clients_skipped + 1;
            CONTINUE;
        END IF;
        
        -- Get program code
        program_code_val := program_record.code;
        
        -- Skip if program code is missing
        IF program_code_val IS NULL OR program_code_val = '' THEN
            RAISE NOTICE 'Skipping client % (%) - program % has no code', 
                client_record.id, 
                COALESCE(client_record.first_name || ' ' || client_record.last_name, 'Unknown'),
                program_record.name;
            clients_skipped := clients_skipped + 1;
            CONTINUE;
        END IF;
        
        -- Generate SCID
        BEGIN
            SELECT generate_client_scid(program_code_val) INTO new_scid;
            
            -- Update client with SCID
            UPDATE clients
            SET scid = new_scid
            WHERE id = client_record.id;
            
            clients_processed := clients_processed + 1;
            
            RAISE NOTICE 'Generated SCID % for client % (%) in program %', 
                new_scid, 
                client_record.id,
                COALESCE(client_record.first_name || ' ' || client_record.last_name, 'Unknown'),
                program_code_val;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error generating SCID for client % (%): %', 
                client_record.id, 
                COALESCE(client_record.first_name || ' ' || client_record.last_name, 'Unknown'),
                SQLERRM;
            clients_skipped := clients_skipped + 1;
        END;
    END LOOP;
    
    RAISE NOTICE 'SCID generation complete: % processed, % skipped', clients_processed, clients_skipped;
END $$;

-- ============================================================================
-- STEP 3: Verify Results
-- ============================================================================
-- Show summary of SCID assignment
SELECT 
    COUNT(*) as total_clients,
    COUNT(scid) as clients_with_scid,
    COUNT(*) - COUNT(scid) as clients_missing_scid,
    COUNT(DISTINCT program_id) as programs_with_clients
FROM clients;

-- Show clients still missing SCIDs (if any)
SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.program_id,
    p.code as program_code,
    p.name as program_name,
    c.created_at
FROM clients c
LEFT JOIN programs p ON p.id = c.program_id
WHERE c.scid IS NULL
ORDER BY c.created_at;

-- Show SCID distribution by program
SELECT 
    p.code as program_code,
    p.name as program_name,
    COUNT(c.id) as total_clients,
    COUNT(c.scid) as clients_with_scid,
    MIN(c.scid) FILTER (WHERE c.scid IS NOT NULL) as min_scid,
    MAX(c.scid) FILTER (WHERE c.scid IS NOT NULL) as max_scid
FROM programs p
LEFT JOIN clients c ON c.program_id = p.id
WHERE p.code IS NOT NULL
GROUP BY p.id, p.code, p.name
ORDER BY p.code;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Summary:
-- 1. Synced sequences with existing SCIDs to prevent duplicates
-- 2. Generated SCIDs for all clients missing them
-- 3. Properly scoped by program_id to use correct program_code
--
-- Next Steps:
-- 1. Verify all clients now have SCIDs
-- 2. Check the summary queries above for any issues
-- 3. If any clients are still missing SCIDs, check if their programs have codes




