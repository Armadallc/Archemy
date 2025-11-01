-- Check the current structure of client_groups table
-- This will show us how the id column is defined

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'client_groups' 
AND table_schema = 'public'
ORDER BY ordinal_position;











