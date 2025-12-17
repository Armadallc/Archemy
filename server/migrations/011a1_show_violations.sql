-- ============================================================================
-- Show Specific Code Format Violations
-- Run this to see exactly which records have format issues
-- ============================================================================

-- Show corporate clients with format violations
SELECT 
    'corporate_clients' as table_name,
    id,
    name,
    code,
    LENGTH(code) as code_length,
    CASE 
        WHEN code IS NULL THEN 'NULL'
        WHEN code = '' THEN 'EMPTY'
        WHEN code !~ '^[A-Z]' THEN 'NOT_UPPERCASE'
        WHEN code ~ '[^A-Z]' THEN 'CONTAINS_NON_LETTERS'
        WHEN LENGTH(code) < 2 THEN 'TOO_SHORT'
        WHEN LENGTH(code) > 5 THEN 'TOO_LONG'
        ELSE 'OK'
    END as issue_type,
    'Expected: 2-5 uppercase letters (e.g., MON, APN)' as expected_format
FROM corporate_clients
WHERE code IS NULL 
   OR code = ''
   OR code !~ '^[A-Z]{2,5}$'
ORDER BY issue_type, name;

-- Show programs with format violations (should be 0 based on your results)
SELECT 
    'programs' as table_name,
    id,
    name,
    code,
    LENGTH(code) as code_length,
    CASE 
        WHEN code IS NULL THEN 'NULL'
        WHEN code = '' THEN 'EMPTY'
        WHEN code !~ '^[A-Z]' THEN 'NOT_UPPERCASE'
        WHEN code ~ '[^A-Z]' THEN 'CONTAINS_NON_LETTERS'
        WHEN LENGTH(code) < 2 THEN 'TOO_SHORT'
        WHEN LENGTH(code) > 4 THEN 'TOO_LONG'
        ELSE 'OK'
    END as issue_type,
    'Expected: 2-4 uppercase letters (e.g., MC, ABC)' as expected_format
FROM programs
WHERE code IS NULL 
   OR code = ''
   OR code !~ '^[A-Z]{2,4}$'
ORDER BY issue_type, name;

-- Show locations with format violations (should be 0 based on your results)
SELECT 
    'locations' as table_name,
    id,
    name,
    code,
    program_id,
    LENGTH(code) as code_length,
    CASE 
        WHEN code IS NULL THEN 'NULL'
        WHEN code = '' THEN 'EMPTY'
        WHEN code !~ '^[A-Z]' THEN 'NOT_UPPERCASE'
        WHEN code ~ '[^A-Z]' THEN 'CONTAINS_NON_LETTERS'
        WHEN LENGTH(code) < 2 THEN 'TOO_SHORT'
        WHEN LENGTH(code) > 5 THEN 'TOO_LONG'
        ELSE 'OK'
    END as issue_type,
    'Expected: 2-5 uppercase letters (e.g., LOW, ABCDE)' as expected_format
FROM locations
WHERE code IS NULL 
   OR code = ''
   OR code !~ '^[A-Z]{2,5}$'
ORDER BY issue_type, name;
