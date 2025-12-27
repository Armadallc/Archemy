-- Migration: Add separated address fields to all tables
-- Date: 2025-12-22
-- Purpose: Replace single text address fields with separated street, city, state, zip fields
--          for better data quality, validation, and querying

-- ============================================================================
-- TRIPS TABLE
-- ============================================================================
-- Add separated fields for pickup address
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS pickup_street TEXT,
ADD COLUMN IF NOT EXISTS pickup_city TEXT,
ADD COLUMN IF NOT EXISTS pickup_state VARCHAR(2),
ADD COLUMN IF NOT EXISTS pickup_zip VARCHAR(5);

-- Add separated fields for dropoff address
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS dropoff_street TEXT,
ADD COLUMN IF NOT EXISTS dropoff_city TEXT,
ADD COLUMN IF NOT EXISTS dropoff_state VARCHAR(2),
ADD COLUMN IF NOT EXISTS dropoff_zip VARCHAR(5);

-- Add comments
COMMENT ON COLUMN trips.pickup_street IS 'Street address for pickup (e.g., "123 Main St")';
COMMENT ON COLUMN trips.pickup_city IS 'City for pickup address';
COMMENT ON COLUMN trips.pickup_state IS 'State code for pickup address (2 uppercase letters)';
COMMENT ON COLUMN trips.pickup_zip IS 'ZIP code for pickup address (5 digits)';
COMMENT ON COLUMN trips.dropoff_street IS 'Street address for dropoff (e.g., "456 Oak Ave")';
COMMENT ON COLUMN trips.dropoff_city IS 'City for dropoff address';
COMMENT ON COLUMN trips.dropoff_state IS 'State code for dropoff address (2 uppercase letters)';
COMMENT ON COLUMN trips.dropoff_zip IS 'ZIP code for dropoff address (5 digits)';

-- Add CHECK constraints for state (2 uppercase letters)
ALTER TABLE trips
ADD CONSTRAINT trips_pickup_state_format CHECK (
  pickup_state IS NULL OR (LENGTH(pickup_state) = 2 AND pickup_state ~ '^[A-Z]{2}$')
);

ALTER TABLE trips
ADD CONSTRAINT trips_dropoff_state_format CHECK (
  dropoff_state IS NULL OR (LENGTH(dropoff_state) = 2 AND dropoff_state ~ '^[A-Z]{2}$')
);

-- Add CHECK constraints for ZIP (5 digits)
ALTER TABLE trips
ADD CONSTRAINT trips_pickup_zip_format CHECK (
  pickup_zip IS NULL OR (LENGTH(pickup_zip) = 5 AND pickup_zip ~ '^[0-9]{5}$')
);

ALTER TABLE trips
ADD CONSTRAINT trips_dropoff_zip_format CHECK (
  dropoff_zip IS NULL OR (LENGTH(dropoff_zip) = 5 AND dropoff_zip ~ '^[0-9]{5}$')
);

-- Create indexes for querying
CREATE INDEX IF NOT EXISTS idx_trips_pickup_city ON trips(pickup_city);
CREATE INDEX IF NOT EXISTS idx_trips_pickup_state ON trips(pickup_state);
CREATE INDEX IF NOT EXISTS idx_trips_pickup_zip ON trips(pickup_zip);
CREATE INDEX IF NOT EXISTS idx_trips_dropoff_city ON trips(dropoff_city);
CREATE INDEX IF NOT EXISTS idx_trips_dropoff_state ON trips(dropoff_state);
CREATE INDEX IF NOT EXISTS idx_trips_dropoff_zip ON trips(dropoff_zip);

-- ============================================================================
-- LOCATIONS TABLE
-- ============================================================================
-- Add separated fields
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state VARCHAR(2),
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(5);

-- Add comments
COMMENT ON COLUMN locations.street_address IS 'Street address (e.g., "123 Main St")';
COMMENT ON COLUMN locations.city IS 'City name';
COMMENT ON COLUMN locations.state IS 'State code (2 uppercase letters)';
COMMENT ON COLUMN locations.zip_code IS 'ZIP code (5 digits)';

-- Add CHECK constraints
ALTER TABLE locations
ADD CONSTRAINT locations_state_format CHECK (
  state IS NULL OR (LENGTH(state) = 2 AND state ~ '^[A-Z]{2}$')
);

ALTER TABLE locations
ADD CONSTRAINT locations_zip_format CHECK (
  zip_code IS NULL OR (LENGTH(zip_code) = 5 AND zip_code ~ '^[0-9]{5}$')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_state ON locations(state);
CREATE INDEX IF NOT EXISTS idx_locations_zip ON locations(zip_code);

-- ============================================================================
-- CLIENTS TABLE
-- ============================================================================
-- Add separated fields
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state VARCHAR(2),
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(5);

-- Add comments
COMMENT ON COLUMN clients.street_address IS 'Client street address (e.g., "123 Main St")';
COMMENT ON COLUMN clients.city IS 'Client city';
COMMENT ON COLUMN clients.state IS 'Client state code (2 uppercase letters)';
COMMENT ON COLUMN clients.zip_code IS 'Client ZIP code (5 digits)';

-- Add CHECK constraints
ALTER TABLE clients
ADD CONSTRAINT clients_state_format CHECK (
  state IS NULL OR (LENGTH(state) = 2 AND state ~ '^[A-Z]{2}$')
);

ALTER TABLE clients
ADD CONSTRAINT clients_zip_format CHECK (
  zip_code IS NULL OR (LENGTH(zip_code) = 5 AND zip_code ~ '^[0-9]{5}$')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_city ON clients(city);
CREATE INDEX IF NOT EXISTS idx_clients_state ON clients(state);
CREATE INDEX IF NOT EXISTS idx_clients_zip ON clients(zip_code);

-- ============================================================================
-- CORPORATE CLIENTS TABLE
-- ============================================================================
-- Add separated fields
ALTER TABLE corporate_clients
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state VARCHAR(2),
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(5);

-- Add comments
COMMENT ON COLUMN corporate_clients.street_address IS 'Corporate client street address';
COMMENT ON COLUMN corporate_clients.city IS 'Corporate client city';
COMMENT ON COLUMN corporate_clients.state IS 'Corporate client state code (2 uppercase letters)';
COMMENT ON COLUMN corporate_clients.zip_code IS 'Corporate client ZIP code (5 digits)';

-- Add CHECK constraints
ALTER TABLE corporate_clients
ADD CONSTRAINT corporate_clients_state_format CHECK (
  state IS NULL OR (LENGTH(state) = 2 AND state ~ '^[A-Z]{2}$')
);

ALTER TABLE corporate_clients
ADD CONSTRAINT corporate_clients_zip_format CHECK (
  zip_code IS NULL OR (LENGTH(zip_code) = 5 AND zip_code ~ '^[0-9]{5}$')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_corporate_clients_city ON corporate_clients(city);
CREATE INDEX IF NOT EXISTS idx_corporate_clients_state ON corporate_clients(state);
CREATE INDEX IF NOT EXISTS idx_corporate_clients_zip ON corporate_clients(zip_code);

-- ============================================================================
-- PROGRAMS TABLE
-- ============================================================================
-- Add separated fields
ALTER TABLE programs
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state VARCHAR(2),
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(5);

-- Add comments
COMMENT ON COLUMN programs.street_address IS 'Program street address';
COMMENT ON COLUMN programs.city IS 'Program city';
COMMENT ON COLUMN programs.state IS 'Program state code (2 uppercase letters)';
COMMENT ON COLUMN programs.zip_code IS 'Program ZIP code (5 digits)';

-- Add CHECK constraints
ALTER TABLE programs
ADD CONSTRAINT programs_state_format CHECK (
  state IS NULL OR (LENGTH(state) = 2 AND state ~ '^[A-Z]{2}$')
);

ALTER TABLE programs
ADD CONSTRAINT programs_zip_format CHECK (
  zip_code IS NULL OR (LENGTH(zip_code) = 5 AND zip_code ~ '^[0-9]{5}$')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_programs_city ON programs(city);
CREATE INDEX IF NOT EXISTS idx_programs_state ON programs(state);
CREATE INDEX IF NOT EXISTS idx_programs_zip ON programs(zip_code);

-- ============================================================================
-- HELPER FUNCTION: Generate full_address from components
-- ============================================================================
CREATE OR REPLACE FUNCTION format_full_address(
  street TEXT,
  city TEXT,
  state VARCHAR(2),
  zip VARCHAR(5)
) RETURNS TEXT AS $$
BEGIN
  IF street IS NULL AND city IS NULL AND state IS NULL AND zip IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN TRIM(
    CONCAT_WS(', ',
      NULLIF(TRIM(street), ''),
      NULLIF(TRIM(city), ''),
      CASE 
        WHEN state IS NOT NULL AND zip IS NOT NULL THEN CONCAT(state, ' ', zip)
        WHEN state IS NOT NULL THEN state
        WHEN zip IS NOT NULL THEN zip
        ELSE NULL
      END
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- COMPUTED COLUMNS (using generated columns where supported, or views)
-- ============================================================================
-- Note: PostgreSQL doesn't support computed columns directly, but we can:
-- 1. Use triggers to maintain full_address
-- 2. Use views for read operations
-- 3. Generate in application layer

-- For now, we'll maintain full_address in application layer
-- Old address fields remain for backward compatibility during migration

