import { supabase } from './minimal-supabase.js';

export async function createMissingTables() {
  try {
    console.log('🔧 Creating missing database tables...');

    // Create user_role enum
    const { error: enumError1 } = await supabase.rpc('exec_sql', {
      sql: `DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('super_admin', 'corporate_admin', 'program_admin', 'program_user', 'driver');
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

    // Create corporate_clients table
    const { error: corporateClientsError } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS corporate_clients (
        id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        address VARCHAR,
        phone VARCHAR,
        email VARCHAR,
        logo_url VARCHAR,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );`
    });

    // Create programs table (renamed from organizations)
    const { error: programsError } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS programs (
        id VARCHAR PRIMARY KEY,
        corporate_client_id VARCHAR REFERENCES corporate_clients(id) NOT NULL,
        name VARCHAR NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );`
    });

    // Create locations table
    const { error: locationsError } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS locations (
        id VARCHAR PRIMARY KEY,
        program_id VARCHAR REFERENCES programs(id) NOT NULL,
        name VARCHAR NOT NULL,
        address VARCHAR NOT NULL,
        phone VARCHAR,
        contact_person VARCHAR,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );`
    });

    // Create users table
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR PRIMARY KEY,
        user_name VARCHAR NOT NULL,
        email VARCHAR UNIQUE NOT NULL,
        password_hash VARCHAR NOT NULL,
        role user_role NOT NULL,
        primary_program_id VARCHAR REFERENCES programs(id),
        authorized_programs VARCHAR[],
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
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );`
    });

    // Create trips table
    const { error: tripsError } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS trips (
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
      );`
    });

    // Create clients table (passengers/patients)
    const { error: clientsError } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS clients (
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
      );`
    });

    // Create driver_schedules table
    const { error: schedulesError } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS driver_schedules (
        id TEXT PRIMARY KEY,
        driver_id VARCHAR REFERENCES users(user_id) NOT NULL,
        program_id VARCHAR REFERENCES programs(id) NOT NULL,
        day_of_week INTEGER NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_on_call BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );`
    });

    console.log('✅ Database table creation completed');
    
    if (corporateClientsError) console.log('Corporate clients table error:', corporateClientsError);
    if (programsError) console.log('Programs table error:', programsError);
    if (locationsError) console.log('Locations table error:', locationsError);
    if (usersError) console.log('Users table error:', usersError);
    if (driversError) console.log('Drivers table error:', driversError);
    if (clientsError) console.log('Clients table error:', clientsError);
    if (tripsError) console.log('Trips table error:', tripsError);
    if (schedulesError) console.log('Schedules table error:', schedulesError);

  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
}