import { supabase } from './minimal-supabase.js';

export async function createMissingTables() {
  try {
    console.log('🔧 Creating missing database tables...');

    // Create user_role enum
    const { error: enumError1 } = await supabase.rpc('exec_sql', {
      sql: `DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('super_admin', 'monarch_owner', 'organization_admin', 'organization_user', 'driver');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`
    });

    // Create trip_type enum
    const { error: enumError2 } = await supabase.rpc('exec_sql', {
      sql: `DO $$ BEGIN
        CREATE TYPE trip_type AS ENUM ('one_way', 'round_trip');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`
    });

    // Create trip_status enum
    const { error: enumError3 } = await supabase.rpc('exec_sql', {
      sql: `DO $$ BEGIN
        CREATE TYPE trip_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`
    });

    // Create users table
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR PRIMARY KEY,
        user_name VARCHAR NOT NULL,
        email VARCHAR UNIQUE NOT NULL,
        password_hash VARCHAR NOT NULL,
        role user_role NOT NULL,
        primary_organization_id VARCHAR REFERENCES organizations(id),
        authorized_organizations VARCHAR[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );`
    });

    // Create drivers table
    const { error: driversError } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS drivers (
        id TEXT PRIMARY KEY,
        user_id VARCHAR REFERENCES users(user_id) NOT NULL,
        license_number VARCHAR NOT NULL,
        vehicle_info TEXT,
        primary_organization_id VARCHAR REFERENCES organizations(id) NOT NULL,
        authorized_organizations VARCHAR[],
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );`
    });

    // Create trips table
    const { error: tripsError } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        organization_id TEXT REFERENCES organizations(id) NOT NULL,
        client_id TEXT REFERENCES clients(id) NOT NULL,
        driver_id TEXT,
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
      );`
    });

    // Create driver_schedules table
    const { error: schedulesError } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS driver_schedules (
        id TEXT PRIMARY KEY,
        driver_id VARCHAR REFERENCES users(user_id) NOT NULL,
        organization_id VARCHAR REFERENCES organizations(id) NOT NULL,
        day_of_week INTEGER NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_on_call BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );`
    });

    console.log('✅ Database table creation completed');
    
    if (usersError) console.log('Users table error:', usersError);
    if (driversError) console.log('Drivers table error:', driversError);
    if (tripsError) console.log('Trips table error:', tripsError);
    if (schedulesError) console.log('Schedules table error:', schedulesError);

  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
}