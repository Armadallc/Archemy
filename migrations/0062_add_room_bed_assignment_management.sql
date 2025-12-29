-- Migration: 0062_add_room_bed_assignment_management.sql
-- Description: Adds room/bed assignment fields to clients table and creates location_room_beds table for room/bed inventory management
-- ============================================================================

-- Add room_number and bed_number fields to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS room_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS bed_number VARCHAR(50);

-- Create location_room_beds table for room/bed inventory management
CREATE TABLE IF NOT EXISTS location_room_beds (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  location_id VARCHAR(50) NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  room_number VARCHAR(50) NOT NULL,
  bed_number VARCHAR(50) NOT NULL,
  bed_label VARCHAR(100),
  bed_type VARCHAR(50),
  is_occupied BOOLEAN DEFAULT FALSE,
  assigned_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
  updated_by VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_location_room_beds_location_id ON location_room_beds(location_id);
CREATE INDEX IF NOT EXISTS idx_location_room_beds_room_number ON location_room_beds(location_id, room_number);
CREATE INDEX IF NOT EXISTS idx_location_room_beds_assigned_client_id ON location_room_beds(assigned_client_id);
CREATE INDEX IF NOT EXISTS idx_location_room_beds_is_occupied ON location_room_beds(is_occupied);
CREATE INDEX IF NOT EXISTS idx_location_room_beds_is_active ON location_room_beds(is_active);

-- Create unique constraint for room_number + bed_number per location
CREATE UNIQUE INDEX IF NOT EXISTS idx_location_room_beds_unique ON location_room_beds(location_id, room_number, bed_number) WHERE is_active = TRUE;

-- Create index on clients for room/bed lookups
CREATE INDEX IF NOT EXISTS idx_clients_room_bed ON clients(location_id, room_number, bed_number) WHERE room_number IS NOT NULL AND bed_number IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN clients.room_number IS 'Room number assignment (e.g., "1A", "6B")';
COMMENT ON COLUMN clients.bed_number IS 'Bed number assignment (e.g., "1", "2", "1 top", "2 bottom")';
COMMENT ON TABLE location_room_beds IS 'Tracks room and bed inventory for each location, allowing custom configurations per location';
COMMENT ON COLUMN location_room_beds.room_number IS 'Room identifier (e.g., "1A", "6B")';
COMMENT ON COLUMN location_room_beds.bed_number IS 'Bed identifier (e.g., "1", "2", "1 top", "2 bottom")';
COMMENT ON COLUMN location_room_beds.bed_label IS 'Optional human-readable label for the bed';
COMMENT ON COLUMN location_room_beds.bed_type IS 'Type of bed (e.g., "single", "bunk_top", "bunk_bottom", "twin", "full")';
COMMENT ON COLUMN location_room_beds.is_occupied IS 'Whether the bed is currently occupied';
COMMENT ON COLUMN location_room_beds.assigned_client_id IS 'Client currently assigned to this bed (if occupied)';

