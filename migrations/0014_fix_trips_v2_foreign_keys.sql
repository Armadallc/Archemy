-- Fix trips_v2 foreign key constraints to reference the correct tables
-- Drop existing foreign key constraints
ALTER TABLE trips_v2 DROP CONSTRAINT IF EXISTS trips_v2_client_id_fkey;
ALTER TABLE trips_v2 DROP CONSTRAINT IF EXISTS trips_v2_driver_id_fkey;

-- Add new foreign key constraints that reference the original tables
-- This allows us to use existing client and driver IDs while we transition
ALTER TABLE trips_v2
ADD CONSTRAINT trips_v2_client_id_fkey
FOREIGN KEY (client_id) REFERENCES clients(id);

ALTER TABLE trips_v2
ADD CONSTRAINT trips_v2_driver_id_fkey
FOREIGN KEY (driver_id) REFERENCES drivers(id);

-- Also update the tripsV2Storage to join with the original tables for data retrieval
