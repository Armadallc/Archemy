-- Fix UUID generation for client_groups table
-- This ensures the id column has proper UUID default generation

-- First, let's see the current column definition
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'client_groups' 
AND table_schema = 'public'
AND column_name = 'id';

-- Fix the id column to have proper UUID default
ALTER TABLE client_groups 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Also fix client_group_memberships table
ALTER TABLE client_group_memberships 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('client_groups', 'client_group_memberships')
AND table_schema = 'public'
AND column_name = 'id'
ORDER BY table_name;
















