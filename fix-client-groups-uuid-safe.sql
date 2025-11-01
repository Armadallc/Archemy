-- SAFE UUID Fix: Handle foreign key constraints properly
-- This approach preserves data and relationships

-- ============================================================================
-- STEP 1: Drop foreign key constraints temporarily
-- ============================================================================

-- Drop foreign key constraints that depend on client_groups.id
ALTER TABLE client_group_memberships 
DROP CONSTRAINT IF EXISTS client_group_memberships_client_group_id_fkey;

ALTER TABLE trips 
DROP CONSTRAINT IF EXISTS trips_client_group_id_fkey;

-- ============================================================================
-- STEP 2: Create new UUID columns
-- ============================================================================

-- Add new UUID columns
ALTER TABLE client_groups ADD COLUMN id_new UUID DEFAULT gen_random_uuid();
ALTER TABLE client_group_memberships ADD COLUMN id_new UUID DEFAULT gen_random_uuid();

-- Add new UUID columns for foreign key references
ALTER TABLE client_group_memberships ADD COLUMN client_group_id_new UUID;
ALTER TABLE trips ADD COLUMN client_group_id_new UUID;

-- ============================================================================
-- STEP 3: Copy data and create mapping
-- ============================================================================

-- Create a mapping table to track old_id -> new_id
CREATE TEMP TABLE id_mapping AS
SELECT id as old_id, id_new as new_id FROM client_groups;

-- Update client_group_memberships to use new UUIDs
UPDATE client_group_memberships 
SET id_new = m.new_id
FROM id_mapping m
WHERE client_group_memberships.client_group_id = m.old_id;

-- Update foreign key references to use new UUIDs
UPDATE client_group_memberships 
SET client_group_id_new = m.new_id
FROM id_mapping m
WHERE client_group_memberships.client_group_id = m.old_id;

UPDATE trips 
SET client_group_id_new = m.new_id
FROM id_mapping m
WHERE trips.client_group_id = m.old_id;

-- ============================================================================
-- STEP 4: Drop old columns and rename new ones
-- ============================================================================

-- Drop old id columns
ALTER TABLE client_groups DROP COLUMN id;
ALTER TABLE client_group_memberships DROP COLUMN id;

-- Drop old foreign key columns
ALTER TABLE client_group_memberships DROP COLUMN client_group_id;
ALTER TABLE trips DROP COLUMN client_group_id;

-- Rename new columns to original names
ALTER TABLE client_groups RENAME COLUMN id_new TO id;
ALTER TABLE client_group_memberships RENAME COLUMN id_new TO id;
ALTER TABLE client_group_memberships RENAME COLUMN client_group_id_new TO client_group_id;
ALTER TABLE trips RENAME COLUMN client_group_id_new TO client_group_id;

-- ============================================================================
-- STEP 5: Recreate constraints
-- ============================================================================

-- Add primary keys
ALTER TABLE client_groups ADD PRIMARY KEY (id);
ALTER TABLE client_group_memberships ADD PRIMARY KEY (id);

-- Recreate foreign key constraints
ALTER TABLE client_group_memberships 
ADD CONSTRAINT client_group_memberships_client_group_id_fkey 
FOREIGN KEY (client_group_id) REFERENCES client_groups(id) ON DELETE CASCADE;

ALTER TABLE trips 
ADD CONSTRAINT trips_client_group_id_fkey 
FOREIGN KEY (client_group_id) REFERENCES client_groups(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 6: Verify the fix
-- ============================================================================

-- Check table structure
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

-- Check record counts
SELECT 'client_groups' as table_name, COUNT(*) as count FROM client_groups
UNION ALL
SELECT 'client_group_memberships' as table_name, COUNT(*) as count FROM client_group_memberships;

