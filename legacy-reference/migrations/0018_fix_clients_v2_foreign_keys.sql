-- Fix clients_v2 foreign key constraints to reference v2 tables
-- Drop existing foreign key constraints
ALTER TABLE clients_v2 DROP CONSTRAINT IF EXISTS clients_v2_service_area_id_fkey;

-- Add new foreign key constraint to reference service_areas_v2
ALTER TABLE clients_v2
ADD CONSTRAINT clients_v2_service_area_id_fkey
FOREIGN KEY (service_area_id) REFERENCES service_areas_v2(id);

-- Update any existing clients_v2 records to use service_areas_v2 IDs
-- First, let's see if there are any existing records that need updating
-- This will be handled by the application logic during migration

