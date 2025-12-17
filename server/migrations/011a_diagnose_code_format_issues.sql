-- ============================================================================
-- Diagnostic Script: Identify Code Format Issues
-- Run this BEFORE migration 011 to identify and fix format problems
-- ============================================================================

-- ============================================================================
-- STEP 1: Check Corporate Client Codes
-- ============================================================================
SELECT 
    id,
    name,
    code,
    LENGTH(code) as code_length,
    code ~ '^[A-Z]{2,5}$' as matches_format,
    CASE 
        WHEN code IS NULL THEN 'NULL'
        WHEN code = '' THEN 'EMPTY'
        WHEN code !~ '^[A-Z]' THEN 'NOT_UPPERCASE'
        WHEN code ~ '[^A-Z]' THEN 'CONTAINS_NON_LETTERS'
        WHEN LENGTH(code) < 2 THEN 'TOO_SHORT'
        WHEN LENGTH(code) > 5 THEN 'TOO_LONG'
        ELSE 'OK'
    END as issue_type
FROM corporate_clients
WHERE code IS NULL 
   OR code = ''
   OR code !~ '^[A-Z]{2,5}$'
ORDER BY issue_type, name;

-- ============================================================================
-- STEP 2: Check Program Codes
-- ============================================================================
SELECT 
    id,
    name,
    code,
    LENGTH(code) as code_length,
    code ~ '^[A-Z]{2,4}$' as matches_format,
    CASE 
        WHEN code IS NULL THEN 'NULL'
        WHEN code = '' THEN 'EMPTY'
        WHEN code !~ '^[A-Z]' THEN 'NOT_UPPERCASE'
        WHEN code ~ '[^A-Z]' THEN 'CONTAINS_NON_LETTERS'
        WHEN LENGTH(code) < 2 THEN 'TOO_SHORT'
        WHEN LENGTH(code) > 4 THEN 'TOO_LONG'
        ELSE 'OK'
    END as issue_type
FROM programs
WHERE code IS NULL 
   OR code = ''
   OR code !~ '^[A-Z]{2,4}$'
ORDER BY issue_type, name;

-- ============================================================================
-- STEP 3: Check Location Codes
-- ============================================================================
SELECT 
    id,
    name,
    code,
    program_id,
    LENGTH(code) as code_length,
    code ~ '^[A-Z]{2,5}$' as matches_format,
    CASE 
        WHEN code IS NULL THEN 'NULL'
        WHEN code = '' THEN 'EMPTY'
        WHEN code !~ '^[A-Z]' THEN 'NOT_UPPERCASE'
        WHEN code ~ '[^A-Z]' THEN 'CONTAINS_NON_LETTERS'
        WHEN LENGTH(code) < 2 THEN 'TOO_SHORT'
        WHEN LENGTH(code) > 5 THEN 'TOO_LONG'
        ELSE 'OK'
    END as issue_type
FROM locations
WHERE code IS NULL 
   OR code = ''
   OR code !~ '^[A-Z]{2,5}$'
ORDER BY issue_type, name;

-- ============================================================================
-- STEP 4: Summary Counts
-- ============================================================================
SELECT 
    'corporate_clients' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE code IS NULL OR code = '') as null_or_empty,
    COUNT(*) FILTER (WHERE code !~ '^[A-Z]{2,5}$') as format_violations,
    COUNT(*) FILTER (WHERE code ~ '^[A-Z]{2,5}$') as valid_codes
FROM corporate_clients
UNION ALL
SELECT 
    'programs' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE code IS NULL OR code = '') as null_or_empty,
    COUNT(*) FILTER (WHERE code !~ '^[A-Z]{2,4}$') as format_violations,
    COUNT(*) FILTER (WHERE code ~ '^[A-Z]{2,4}$') as valid_codes
FROM programs
UNION ALL
SELECT 
    'locations' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE code IS NULL OR code = '') as null_or_empty,
    COUNT(*) FILTER (WHERE code !~ '^[A-Z]{2,5}$') as format_violations,
    COUNT(*) FILTER (WHERE code ~ '^[A-Z]{2,5}$') as valid_codes
FROM locations;

