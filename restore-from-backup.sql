-- RESTORE SCRIPT: Restore from backup if UUID fix goes wrong
-- ONLY RUN THIS IF THE UUID FIX FAILED AND YOU NEED TO RESTORE

-- ============================================================================
-- STEP 1: Drop the modified tables (if they exist)
-- ============================================================================

-- Drop foreign key constraints first
ALTER TABLE client_group_memberships DROP CONSTRAINT IF EXISTS client_group_memberships_client_group_id_fkey;
ALTER TABLE client_group_memberships DROP CONSTRAINT IF EXISTS client_group_memberships_client_id_fkey;

-- Drop the modified tables
DROP TABLE IF EXISTS client_group_memberships CASCADE;
DROP TABLE IF EXISTS client_groups CASCADE;

-- ============================================================================
-- STEP 2: Restore from backup
-- ============================================================================

-- Restore client_groups table
CREATE TABLE client_groups AS 
SELECT * FROM client_groups_backup;

-- Restore client_group_memberships table
CREATE TABLE client_group_memberships AS
SELECT * FROM client_group_memberships_backup;

-- ============================================================================
-- STEP 3: Recreate constraints and indexes
-- ============================================================================

-- Add primary keys
ALTER TABLE client_groups ADD PRIMARY KEY (id);
ALTER TABLE client_group_memberships ADD PRIMARY KEY (id);

-- Add foreign key constraints
ALTER TABLE client_groups 
ADD CONSTRAINT client_groups_program_id_fkey 
FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE;

ALTER TABLE client_group_memberships 
ADD CONSTRAINT client_group_memberships_client_group_id_fkey 
FOREIGN KEY (client_group_id) REFERENCES client_groups(id) ON DELETE CASCADE;

ALTER TABLE client_group_memberships 
ADD CONSTRAINT client_group_memberships_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 4: Verify restoration
-- ============================================================================

-- Check that data was restored
SELECT 
    'client_groups' as table_name,
    COUNT(*) as record_count
FROM client_groups
UNION ALL
SELECT 
    'client_group_memberships' as table_name,
    COUNT(*) as record_count
FROM client_group_memberships;

-- Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'client_groups' 
AND table_schema = 'public'
ORDER BY ordinal_position;











