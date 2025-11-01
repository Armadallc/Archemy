-- Fix client_groups table to use proper UUID type and default
-- The current table has id as VARCHAR(50) but should be UUID

-- Step 1: Add a new UUID column temporarily
ALTER TABLE client_groups ADD COLUMN id_new UUID DEFAULT gen_random_uuid();

-- Step 2: Copy existing data (if any) to the new column
UPDATE client_groups SET id_new = gen_random_uuid() WHERE id_new IS NULL;

-- Step 3: Drop the old id column
ALTER TABLE client_groups DROP COLUMN id;

-- Step 4: Rename the new column to id and make it primary key
ALTER TABLE client_groups RENAME COLUMN id_new TO id;
ALTER TABLE client_groups ADD PRIMARY KEY (id);

-- Step 5: Do the same for client_group_memberships
ALTER TABLE client_group_memberships ADD COLUMN id_new UUID DEFAULT gen_random_uuid();
UPDATE client_group_memberships SET id_new = gen_random_uuid() WHERE id_new IS NULL;
ALTER TABLE client_group_memberships DROP COLUMN id;
ALTER TABLE client_group_memberships RENAME COLUMN id_new TO id;
ALTER TABLE client_group_memberships ADD PRIMARY KEY (id);

-- Step 6: Verify the changes
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











