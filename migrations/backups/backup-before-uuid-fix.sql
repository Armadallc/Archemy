-- BACKUP SCRIPT: Create backup before fixing UUID columns
-- Run this FIRST to backup the client_groups and client_group_memberships tables

-- ============================================================================
-- STEP 1: Create backup tables
-- ============================================================================

-- Backup client_groups table
CREATE TABLE client_groups_backup AS 
SELECT * FROM client_groups;

-- Backup client_group_memberships table  
CREATE TABLE client_group_memberships_backup AS
SELECT * FROM client_group_memberships;

-- ============================================================================
-- STEP 2: Verify backup was created successfully
-- ============================================================================

-- Check backup table counts
SELECT 
    'client_groups' as table_name,
    COUNT(*) as original_count
FROM client_groups
UNION ALL
SELECT 
    'client_groups_backup' as table_name,
    COUNT(*) as backup_count
FROM client_groups_backup
UNION ALL
SELECT 
    'client_group_memberships' as table_name,
    COUNT(*) as original_count
FROM client_group_memberships
UNION ALL
SELECT 
    'client_group_memberships_backup' as table_name,
    COUNT(*) as backup_count
FROM client_group_memberships_backup;

-- ============================================================================
-- STEP 3: Show backup table structure
-- ============================================================================

-- Show structure of backup tables
SELECT 
    'client_groups_backup' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'client_groups_backup' 
AND table_schema = 'public'
UNION ALL
SELECT 
    'client_group_memberships_backup' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'client_group_memberships_backup' 
AND table_schema = 'public'
ORDER BY table_name, column_name;
















