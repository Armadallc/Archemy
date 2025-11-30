-- Manual Schema Creation for Fresh Database
-- Run this in your Supabase SQL Editor

-- 1. Create user_role enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'corporate_admin', 'program_admin', 'program_user', 'driver');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create trip_type enum
DO $$ BEGIN
  CREATE TYPE trip_type AS ENUM ('one_way', 'round_trip');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Create trip_status enum
DO $$ BEGIN
  CREATE TYPE trip_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. Create corporate_clients table
CREATE TABLE IF NOT EXISTS corporate_clients (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  address VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  logo_url VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create programs table (renamed from organizations)
CREATE TABLE IF NOT EXISTS programs (
  id VARCHAR PRIMARY KEY,
  corporate_client_id VARCHAR REFERENCES corporate_clients(id) NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id VARCHAR PRIMARY KEY,
  program_id VARCHAR REFERENCES programs(id) NOT NULL,
  name VARCHAR NOT NULL,
  address VARCHAR NOT NULL,
  phone VARCHAR,
  contact_person VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. Create users table
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR PRIMARY KEY,
  user_name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  role user_role NOT NULL,
  primary_program_id VARCHAR REFERENCES programs(id),
  authorized_programs VARCHAR[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  user_id VARCHAR REFERENCES users(user_id) NOT NULL,
  license_number VARCHAR NOT NULL,
  vehicle_info TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 9. Create clients table (passengers/patients)
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  program_id TEXT REFERENCES programs(id) NOT NULL,
  location_id TEXT REFERENCES locations(id),
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  phone VARCHAR,
  email VARCHAR,
  address TEXT,
  emergency_contact VARCHAR,
  emergency_phone VARCHAR,
  special_requirements TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 10. Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  program_id TEXT REFERENCES programs(id) NOT NULL,
  pickup_location_id TEXT REFERENCES locations(id),
  dropoff_location_id TEXT REFERENCES locations(id),
  client_id TEXT REFERENCES clients(id) NOT NULL,
  driver_id TEXT REFERENCES drivers(id),
  trip_type trip_type NOT NULL,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  scheduled_pickup_time TIMESTAMP NOT NULL,
  scheduled_return_time TIMESTAMP,
  actual_pickup_time TIMESTAMP,
  actual_dropoff_time TIMESTAMP,
  actual_return_time TIMESTAMP,
  passenger_count INTEGER DEFAULT 1,
  special_requirements TEXT,
  status trip_status DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 11. Create driver_schedules table
CREATE TABLE IF NOT EXISTS driver_schedules (
  id TEXT PRIMARY KEY,
  driver_id VARCHAR REFERENCES users(user_id) NOT NULL,
  program_id VARCHAR REFERENCES programs(id) NOT NULL,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_on_call BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 12. Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  color TEXT NOT NULL,
  license_plate TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Create driver_vehicle_assignments table
CREATE TABLE IF NOT EXISTS driver_vehicle_assignments (
  id TEXT PRIMARY KEY,
  driver_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  assigned_date DATE NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(driver_id, vehicle_id)
);

-- 14. Verify tables were created
SELECT 'Schema Creation Complete!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;


