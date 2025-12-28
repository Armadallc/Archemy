-- ============================================================================
-- Fix Missing Reference IDs for Client Groups
-- ============================================================================
-- This migration generates reference_ids for any client groups that are missing them
-- Run this after migration 016 if you created groups before the migration was applied
-- Created: 2025-12-23

-- Generate reference_ids for all existing client groups that don't have one
DO $$
DECLARE
    group_record RECORD;
    program_record RECORD;
    program_code_val VARCHAR(10);
    new_reference_id VARCHAR(30);
BEGIN
    -- Loop through all client groups without reference_id, ordered by creation date
    FOR group_record IN 
        SELECT cg.id, cg.program_id, cg.created_at, cg.name
        FROM client_groups cg
        WHERE cg.reference_id IS NULL
        ORDER BY cg.created_at ASC
    LOOP
        -- Get program code for this group
        SELECT code INTO program_code_val
        FROM programs
        WHERE id = group_record.program_id;
        
        -- Skip if program code is missing
        IF program_code_val IS NULL OR program_code_val = '' THEN
            RAISE NOTICE 'Skipping client group % (%) - program % has no code', group_record.id, group_record.name, group_record.program_id;
            CONTINUE;
        END IF;
        
        -- Generate reference_id
        BEGIN
            SELECT generate_client_group_reference_id(program_code_val) INTO new_reference_id;
            
            -- Update client group with reference_id
            UPDATE client_groups
            SET reference_id = new_reference_id
            WHERE id = group_record.id;
            
            RAISE NOTICE 'Generated reference_id % for client group % (%)', new_reference_id, group_record.id, group_record.name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error generating reference_id for group % (%): %', group_record.id, group_record.name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Verify all groups have reference_ids
SELECT 
    COUNT(*) as total_groups,
    COUNT(reference_id) as groups_with_reference_id,
    COUNT(*) - COUNT(reference_id) as groups_missing_reference_id
FROM client_groups
WHERE is_active = true;

-- Show groups still missing reference_ids (if any)
SELECT 
    cg.id,
    cg.name,
    cg.program_id,
    p.code as program_code,
    cg.created_at
FROM client_groups cg
LEFT JOIN programs p ON p.id = cg.program_id
WHERE cg.reference_id IS NULL
  AND cg.is_active = true
ORDER BY cg.created_at;


