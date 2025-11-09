-- Fix trips.client_id to be UUID type to match clients.id
-- This will enable the foreign key relationship to work properly

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE trips
DROP CONSTRAINT IF EXISTS trips_client_id_fkey;

-- Step 2: Add a new UUID column
ALTER TABLE trips ADD COLUMN client_id_new UUID;

-- Step 3: Copy data from old column to new column
UPDATE trips 
SET client_id_new = client_id::UUID 
WHERE client_id IS NOT NULL;

-- Step 4: Drop the old column and rename the new one
ALTER TABLE trips DROP COLUMN client_id;
ALTER TABLE trips RENAME COLUMN client_id_new TO client_id;

-- Step 5: Recreate the foreign key constraint
ALTER TABLE trips
ADD CONSTRAINT trips_client_id_fkey
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trips' AND column_name = 'client_id';














