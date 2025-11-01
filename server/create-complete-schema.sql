-- Complete Database Schema for HALCYON NMT Transportation System
-- New Architectural Blueprint: Corporate Clients → Programs → Locations → Clients
-- Created: 2024-01-01
-- Version: 2.0.0

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORPORATE CLIENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS corporate_clients (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PROGRAMS TABLE (renamed from organizations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS programs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    description TEXT,
    corporate_client_id VARCHAR(50) NOT NULL REFERENCES corporate_clients(id) ON DELETE CASCADE,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- LOCATIONS TABLE (renamed from service_areas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    program_id VARCHAR(50) NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    contact_person VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- USERS TABLE (updated for new role hierarchy)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(50) PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'corporate_admin', 'program_admin', 'program_user', 'driver')),
    primary_program_id VARCHAR(50) REFERENCES programs(id) ON DELETE SET NULL,
    authorized_programs TEXT[], -- Array of program IDs
    corporate_client_id VARCHAR(50) REFERENCES corporate_clients(id) ON DELETE SET NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CLIENTS TABLE (passive entities)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    program_id VARCHAR(50) NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    location_id VARCHAR(50) REFERENCES locations(id) ON DELETE SET NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    date_of_birth DATE,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    medical_conditions TEXT,
    special_requirements TEXT,
    billing_pin VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CLIENT GROUPS TABLE (new for group trips)
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_groups (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    program_id VARCHAR(50) NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CLIENT GROUP MEMBERSHIPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_group_memberships (
    id VARCHAR(50) PRIMARY KEY,
    client_group_id VARCHAR(50) NOT NULL REFERENCES client_groups(id) ON DELETE CASCADE,
    client_id VARCHAR(50) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_group_id, client_id)
);

-- ============================================================================
-- DRIVERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    program_id VARCHAR(50) NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    license_number VARCHAR(50),
    license_expiry DATE,
    phone VARCHAR(20),
    emergency_contact JSONB,
    current_vehicle_id VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- VEHICLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(50) PRIMARY KEY,
    program_id VARCHAR(50) NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    vin VARCHAR(17),
    color VARCHAR(50),
    capacity INTEGER NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('sedan', 'suv', 'van', 'bus', 'wheelchair_accessible')),
    fuel_type VARCHAR(50) NOT NULL CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid')),
    current_driver_id VARCHAR(50) REFERENCES drivers(id) ON DELETE SET NULL,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- VEHICLE ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicle_assignments (
    id VARCHAR(50) PRIMARY KEY,
    vehicle_id VARCHAR(50) NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id VARCHAR(50) NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    program_id VARCHAR(50) NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unassigned_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- VEHICLE MAINTENANCE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
    id VARCHAR(50) PRIMARY KEY,
    vehicle_id VARCHAR(50) NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(50) NOT NULL CHECK (maintenance_type IN ('routine', 'repair', 'inspection', 'accident', 'other')),
    description TEXT NOT NULL,
    mileage INTEGER,
    cost DECIMAL(10, 2),
    performed_by VARCHAR(255),
    performed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    next_due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TRIP CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS trip_categories (
    id VARCHAR(50) PRIMARY KEY,
    program_id VARCHAR(50) NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(program_id, name)
);

-- ============================================================================
-- TRIPS TABLE (enhanced with new features)
-- ============================================================================
CREATE TABLE IF NOT EXISTS trips (
    id VARCHAR(50) PRIMARY KEY,
    program_id VARCHAR(50) NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    pickup_location_id VARCHAR(50) REFERENCES locations(id) ON DELETE SET NULL,
    dropoff_location_id VARCHAR(50) REFERENCES locations(id) ON DELETE SET NULL,
    client_id VARCHAR(50) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    driver_id VARCHAR(50) REFERENCES drivers(id) ON DELETE SET NULL,
    trip_type VARCHAR(20) NOT NULL CHECK (trip_type IN ('one_way', 'round_trip')),
    pickup_address TEXT NOT NULL,
    dropoff_address TEXT NOT NULL,
    scheduled_pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_return_time TIMESTAMP WITH TIME ZONE,
    actual_pickup_time TIMESTAMP WITH TIME ZONE,
    actual_dropoff_time TIMESTAMP WITH TIME ZONE,
    actual_return_time TIMESTAMP WITH TIME ZONE,
    passenger_count INTEGER DEFAULT 1,
    special_requirements TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    trip_category_id VARCHAR(50) REFERENCES trip_categories(id) ON DELETE SET NULL,
    recurring_trip_id VARCHAR(50),
    recurring_pattern JSONB,
    recurring_end_date DATE,
    client_group_id VARCHAR(50) REFERENCES client_groups(id) ON DELETE SET NULL,
    is_group_trip BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DRIVER SCHEDULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_schedules (
    id VARCHAR(50) PRIMARY KEY,
    driver_id VARCHAR(50) NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    program_id VARCHAR(50) NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DRIVER DUTY STATUS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_duty_status (
    id VARCHAR(50) PRIMARY KEY,
    driver_id VARCHAR(50) NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    program_id VARCHAR(50) NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('off_duty', 'on_duty', 'on_trip', 'break', 'unavailable')),
    location JSONB, -- {latitude, longitude, address}
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DRIVER LOCATIONS TABLE (GPS tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_locations (
    id VARCHAR(50) PRIMARY KEY,
    driver_id VARCHAR(50) NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2),
    heading DECIMAL(5, 2),
    speed DECIMAL(5, 2),
    address TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATION SYSTEM TABLES
-- ============================================================================

-- Notification Templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('trip_reminder', 'driver_update', 'system_alert', 'maintenance_reminder', 'custom')),
    channels TEXT[] NOT NULL CHECK (channels <@ ARRAY['push', 'sms', 'email']),
    subject VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    channels TEXT[] NOT NULL CHECK (channels <@ ARRAY['push', 'sms', 'email']),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Deliveries
CREATE TABLE IF NOT EXISTS notification_deliveries (
    id VARCHAR(50) PRIMARY KEY,
    notification_id VARCHAR(50) NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('push', 'sms', 'email')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    push_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    advance_time INTEGER DEFAULT 30, -- minutes
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- ============================================================================
-- AUDIT AND LOGGING TABLES
-- ============================================================================

-- Trip Status Logs
CREATE TABLE IF NOT EXISTS trip_status_logs (
    id VARCHAR(50) PRIMARY KEY,
    trip_id VARCHAR(50) NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    driver_id VARCHAR(50) REFERENCES drivers(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL,
    actual_times JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offline Updates (for mobile sync)
CREATE TABLE IF NOT EXISTS offline_updates (
    id VARCHAR(50) PRIMARY KEY,
    driver_id VARCHAR(50) NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    update_type VARCHAR(50) NOT NULL CHECK (update_type IN ('trip_status', 'location', 'duty_status')),
    data JSONB NOT NULL,
    synced BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Corporate Clients indexes
CREATE INDEX IF NOT EXISTS idx_corporate_clients_active ON corporate_clients(is_active);

-- Programs indexes
CREATE INDEX IF NOT EXISTS idx_programs_corporate_client ON programs(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_programs_active ON programs(is_active);

-- Locations indexes
CREATE INDEX IF NOT EXISTS idx_locations_program ON locations(program_id);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_primary_program ON users(primary_program_id);
CREATE INDEX IF NOT EXISTS idx_users_corporate_client ON users(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_program ON clients(program_id);
CREATE INDEX IF NOT EXISTS idx_clients_location ON clients(location_id);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(is_active);

-- Client Groups indexes
CREATE INDEX IF NOT EXISTS idx_client_groups_program ON client_groups(program_id);
CREATE INDEX IF NOT EXISTS idx_client_groups_active ON client_groups(is_active);

-- Client Group Memberships indexes
CREATE INDEX IF NOT EXISTS idx_client_group_memberships_group ON client_group_memberships(client_group_id);
CREATE INDEX IF NOT EXISTS idx_client_group_memberships_client ON client_group_memberships(client_id);

-- Drivers indexes
CREATE INDEX IF NOT EXISTS idx_drivers_user ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_program ON drivers(program_id);
CREATE INDEX IF NOT EXISTS idx_drivers_active ON drivers(is_active);

-- Vehicles indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_program ON vehicles(program_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver ON vehicles(current_driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_active ON vehicles(is_active);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);

-- Vehicle Assignments indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_vehicle ON vehicle_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_driver ON vehicle_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_program ON vehicle_assignments(program_id);

-- Vehicle Maintenance indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_vehicle ON vehicle_maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_type ON vehicle_maintenance(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_performed_at ON vehicle_maintenance(performed_at);

-- Trip Categories indexes
CREATE INDEX IF NOT EXISTS idx_trip_categories_program ON trip_categories(program_id);
CREATE INDEX IF NOT EXISTS idx_trip_categories_active ON trip_categories(is_active);

-- Trips indexes
CREATE INDEX IF NOT EXISTS idx_trips_program ON trips(program_id);
CREATE INDEX IF NOT EXISTS idx_trips_client ON trips(client_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_pickup_location ON trips(pickup_location_id);
CREATE INDEX IF NOT EXISTS idx_trips_dropoff_location ON trips(dropoff_location_id);
CREATE INDEX IF NOT EXISTS idx_trips_category ON trips(trip_category_id);
CREATE INDEX IF NOT EXISTS idx_trips_group ON trips(client_group_id);
CREATE INDEX IF NOT EXISTS idx_trips_scheduled_pickup ON trips(scheduled_pickup_time);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_recurring ON trips(recurring_trip_id);

-- Driver Schedules indexes
CREATE INDEX IF NOT EXISTS idx_driver_schedules_driver ON driver_schedules(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_schedules_program ON driver_schedules(program_id);
CREATE INDEX IF NOT EXISTS idx_driver_schedules_day ON driver_schedules(day_of_week);

-- Driver Duty Status indexes
CREATE INDEX IF NOT EXISTS idx_driver_duty_status_driver ON driver_duty_status(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_duty_status_program ON driver_duty_status(program_id);
CREATE INDEX IF NOT EXISTS idx_driver_duty_status_started ON driver_duty_status(started_at);

-- Driver Locations indexes
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_timestamp ON driver_locations(timestamp);
CREATE INDEX IF NOT EXISTS idx_driver_locations_active ON driver_locations(is_active);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for);

-- Notification Deliveries indexes
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification ON notification_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user ON notification_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON notification_deliveries(status);

-- Notification Preferences indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_type ON notification_preferences(notification_type);

-- Trip Status Logs indexes
CREATE INDEX IF NOT EXISTS idx_trip_status_logs_trip ON trip_status_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_status_logs_driver ON trip_status_logs(driver_id);
CREATE INDEX IF NOT EXISTS idx_trip_status_logs_timestamp ON trip_status_logs(timestamp);

-- Offline Updates indexes
CREATE INDEX IF NOT EXISTS idx_offline_updates_driver ON offline_updates(driver_id);
CREATE INDEX IF NOT EXISTS idx_offline_updates_synced ON offline_updates(synced);
CREATE INDEX IF NOT EXISTS idx_offline_updates_created ON offline_updates(created_at);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_corporate_clients_updated_at BEFORE UPDATE ON corporate_clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_groups_updated_at BEFORE UPDATE ON client_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicle_assignments_updated_at BEFORE UPDATE ON vehicle_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicle_maintenance_updated_at BEFORE UPDATE ON vehicle_maintenance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trip_categories_updated_at BEFORE UPDATE ON trip_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driver_schedules_updated_at BEFORE UPDATE ON driver_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driver_duty_status_updated_at BEFORE UPDATE ON driver_duty_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_deliveries_updated_at BEFORE UPDATE ON notification_deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE corporate_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_duty_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- INITIAL DATA SEEDING
-- ============================================================================

-- Insert default corporate clients
INSERT INTO corporate_clients (id, name, description, is_active) VALUES
('monarch', 'Monarch', 'Monarch Corporate Client', true),
('halcyon', 'Halcyon Health', 'Halcyon Health Corporate Client', true)
ON CONFLICT (id) DO NOTHING;

-- Insert default programs
INSERT INTO programs (id, name, short_name, description, corporate_client_id, is_active) VALUES
('monarch_competency', 'Monarch Competency', 'Competency', 'Monarch Competency', 'monarch', true),
('monarch_mental_health', 'Monarch Mental Health', 'Mental Health', 'Monarch Mental Health', 'monarch', true),
('monarch_sober_living', 'Monarch Sober Living', 'Sober Living', 'Monarch Sober Living', 'monarch', true),
('monarch_launch', 'Monarch Launch', 'Launch', 'Monarch Launch', 'monarch', true),
('halcyon_detox', 'Halcyon Detox', 'Detox', 'Halcyon Detox', 'halcyon', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  description = EXCLUDED.description;

-- Insert default trip categories for each program
INSERT INTO trip_categories (id, program_id, name, description, is_active) VALUES
-- Monarch Competency
('medical_mcc', 'monarch_competency', 'Medical', 'Medical appointments and healthcare visits', true),
('legal_mcc', 'monarch_competency', 'Legal', 'Legal appointments and court visits', true),
('personal_mcc', 'monarch_competency', 'Personal', 'Personal errands and appointments', true),
('program_mcc', 'monarch_competency', 'Program', 'Program-related activities and meetings', true),
('12step_mcc', 'monarch_competency', '12-Step', '12-Step program meetings and activities', true),
('group_mcc', 'monarch_competency', 'Group', 'Group activities and outings', true),
('staff_mcc', 'monarch_competency', 'Staff', 'Staff transportation and meetings', true),
('carpool_mcc', 'monarch_competency', 'Carpool', 'Carpool and shared transportation', true),
-- Monarch Mental Health
('medical_mmh', 'monarch_mental_health', 'Medical', 'Medical appointments and healthcare visits', true),
('legal_mmh', 'monarch_mental_health', 'Legal', 'Legal appointments and court visits', true),
('personal_mmh', 'monarch_mental_health', 'Personal', 'Personal errands and appointments', true),
('program_mmh', 'monarch_mental_health', 'Program', 'Program-related activities and meetings', true),
('12step_mmh', 'monarch_mental_health', '12-Step', '12-Step program meetings and activities', true),
('group_mmh', 'monarch_mental_health', 'Group', 'Group activities and outings', true),
('staff_mmh', 'monarch_mental_health', 'Staff', 'Staff transportation and meetings', true),
('carpool_mmh', 'monarch_mental_health', 'Carpool', 'Carpool and shared transportation', true),
-- Monarch Sober Living
('medical_msl', 'monarch_sober_living', 'Medical', 'Medical appointments and healthcare visits', true),
('legal_msl', 'monarch_sober_living', 'Legal', 'Legal appointments and court visits', true),
('personal_msl', 'monarch_sober_living', 'Personal', 'Personal errands and appointments', true),
('program_msl', 'monarch_sober_living', 'Program', 'Program-related activities and meetings', true),
('12step_msl', 'monarch_sober_living', '12-Step', '12-Step program meetings and activities', true),
('group_msl', 'monarch_sober_living', 'Group', 'Group activities and outings', true),
('staff_msl', 'monarch_sober_living', 'Staff', 'Staff transportation and meetings', true),
('carpool_msl', 'monarch_sober_living', 'Carpool', 'Carpool and shared transportation', true),
-- Monarch Launch
('medical_ml', 'monarch_launch', 'Medical', 'Medical appointments and healthcare visits', true),
('legal_ml', 'monarch_launch', 'Legal', 'Legal appointments and court visits', true),
('personal_ml', 'monarch_launch', 'Personal', 'Personal errands and appointments', true),
('program_ml', 'monarch_launch', 'Program', 'Program-related activities and meetings', true),
('12step_ml', 'monarch_launch', '12-Step', '12-Step program meetings and activities', true),
('group_ml', 'monarch_launch', 'Group', 'Group activities and outings', true),
('staff_ml', 'monarch_launch', 'Staff', 'Staff transportation and meetings', true),
('carpool_ml', 'monarch_launch', 'Carpool', 'Carpool and shared transportation', true),
-- Halcyon Detox
('medical_hd', 'halcyon_detox', 'Medical', 'Medical appointments and healthcare visits', true),
('legal_hd', 'halcyon_detox', 'Legal', 'Legal appointments and court visits', true),
('personal_hd', 'halcyon_detox', 'Personal', 'Personal errands and appointments', true),
('program_hd', 'halcyon_detox', 'Program', 'Program-related activities and meetings', true),
('12step_hd', 'halcyon_detox', '12-Step', '12-Step program meetings and activities', true),
('group_hd', 'halcyon_detox', 'Group', 'Group activities and outings', true),
('staff_hd', 'halcyon_detox', 'Staff', 'Staff transportation and meetings', true),
('carpool_hd', 'halcyon_detox', 'Carpool', 'Carpool and shared transportation', true)
ON CONFLICT (id) DO NOTHING;

-- Insert default notification templates
INSERT INTO notification_templates (id, name, type, channels, title, body, priority, is_active) VALUES
('trip_reminder_template', 'Trip Reminder', 'trip_reminder', ARRAY['push', 'sms'], 'Upcoming Trip', 'You have a trip scheduled for {{scheduled_time}}', 'high', true),
('driver_update_template', 'Driver Update', 'driver_update', ARRAY['push', 'sms'], 'Driver Update', '{{message}}', 'medium', true),
('system_alert_template', 'System Alert', 'system_alert', ARRAY['push', 'email'], 'System Alert', '{{message}}', 'urgent', true),
('maintenance_reminder_template', 'Maintenance Reminder', 'maintenance_reminder', ARRAY['email'], 'Vehicle Maintenance Due', 'Vehicle {{vehicle_info}} maintenance is due on {{due_date}}', 'medium', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SCHEMA CREATION COMPLETE
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Create a view for easy access to program hierarchy
CREATE OR REPLACE VIEW program_hierarchy AS
SELECT 
    cc.id as corporate_client_id,
    cc.name as corporate_client_name,
    p.id as program_id,
    p.name as program_name,
    l.id as location_id,
    l.name as location_name
FROM corporate_clients cc
LEFT JOIN programs p ON cc.id = p.corporate_client_id
LEFT JOIN locations l ON p.id = l.program_id
WHERE cc.is_active = true AND p.is_active = true AND l.is_active = true;

-- Create a view for trip statistics
CREATE OR REPLACE VIEW trip_statistics AS
SELECT 
    p.id as program_id,
    p.name as program_name,
    COUNT(t.id) as total_trips,
    COUNT(CASE WHEN t.status = 'scheduled' THEN 1 END) as scheduled_trips,
    COUNT(CASE WHEN t.status = 'confirmed' THEN 1 END) as confirmed_trips,
    COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_trips,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_trips,
    COUNT(CASE WHEN t.status = 'cancelled' THEN 1 END) as cancelled_trips,
    COUNT(CASE WHEN t.is_group_trip = true THEN 1 END) as group_trips,
    COUNT(CASE WHEN t.recurring_trip_id IS NOT NULL THEN 1 END) as recurring_trips
FROM programs p
LEFT JOIN trips t ON p.id = t.program_id
WHERE p.is_active = true
GROUP BY p.id, p.name;

-- Schema creation complete!
SELECT 'HALCYON NMT Transportation System Database Schema Created Successfully!' as status;


