import { supabase } from './minimal-supabase.js';

export async function createVehicleTables() {
  console.log('🚗 Creating vehicle management tables...');

  try {
    // Create vehicles table
    const { error: vehiclesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS vehicles (
          id TEXT PRIMARY KEY,
          organization_id TEXT NOT NULL REFERENCES organizations(id),
          year INTEGER NOT NULL,
          make TEXT NOT NULL,
          model TEXT NOT NULL,
          color TEXT NOT NULL,
          license_plate TEXT UNIQUE,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    if (vehiclesError) {
      console.error('Error creating vehicles table:', vehiclesError);
      throw vehiclesError;
    }

    // Create driver_vehicle_assignments table
    const { error: assignmentsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS driver_vehicle_assignments (
          id TEXT PRIMARY KEY,
          driver_id TEXT NOT NULL REFERENCES drivers(id),
          vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
          assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
          is_primary BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(driver_id, vehicle_id)
        );
      `
    });

    if (assignmentsError) {
      console.error('Error creating driver_vehicle_assignments table:', assignmentsError);
      throw assignmentsError;
    }

    // Add vehicle_id column to trips table
    const { error: tripsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE trips ADD COLUMN IF NOT EXISTS vehicle_id TEXT REFERENCES vehicles(id);
      `
    });

    if (tripsError) {
      console.error('Error adding vehicle_id to trips table:', tripsError);
      throw tripsError;
    }

    // Create indexes
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_vehicles_organization_id ON vehicles(organization_id);
        CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);
        CREATE INDEX IF NOT EXISTS idx_driver_vehicle_assignments_driver_id ON driver_vehicle_assignments(driver_id);
        CREATE INDEX IF NOT EXISTS idx_driver_vehicle_assignments_vehicle_id ON driver_vehicle_assignments(vehicle_id);
        CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
      `
    });

    if (indexError) {
      console.error('Error creating indexes:', indexError);
      throw indexError;
    }

    console.log('✅ Vehicle tables created successfully');
    return true;

  } catch (error) {
    console.error('❌ Failed to create vehicle tables:', error);
    return false;
  }
}

export async function seedVehicleData() {
  console.log('🚗 Seeding vehicle data...');

  try {
    // Insert sample vehicles
    const vehicles = [
      {
        id: 'vehicle_001',
        organization_id: 'monarch_competency',
        year: 2020,
        make: 'Honda',
        model: 'Pilot',
        color: 'White',
        license_plate: 'MC-001',
        is_active: true
      },
      {
        id: 'vehicle_002',
        organization_id: 'monarch_competency',
        year: 2019,
        make: 'Toyota',
        model: 'Sienna',
        color: 'Silver',
        license_plate: 'MC-002',
        is_active: true
      },
      {
        id: 'vehicle_003',
        organization_id: 'monarch_competency',
        year: 2021,
        make: 'Ford',
        model: 'Transit',
        color: 'Blue',
        license_plate: 'MC-003',
        is_active: true
      },
      {
        id: 'vehicle_004',
        organization_id: 'monarch_mental_health',
        year: 2020,
        make: 'Chevrolet',
        model: 'Suburban',
        color: 'Black',
        license_plate: 'MH-001',
        is_active: true
      },
      {
        id: 'vehicle_005',
        organization_id: 'monarch_sober_living',
        year: 2018,
        make: 'Honda',
        model: 'Odyssey',
        color: 'Gray',
        license_plate: 'SL-001',
        is_active: true
      },
      {
        id: 'vehicle_006',
        organization_id: 'monarch_launch',
        year: 2022,
        make: 'Toyota',
        model: 'Highlander',
        color: 'Red',
        license_plate: 'ML-001',
        is_active: true
      }
    ];

    const { error: vehicleInsertError } = await supabase
      .from('vehicles')
      .insert(vehicles);

    if (vehicleInsertError) {
      console.error('Error inserting vehicles:', vehicleInsertError);
      throw vehicleInsertError;
    }

    // Assign primary vehicle to existing driver
    const { error: assignmentError } = await supabase
      .from('driver_vehicle_assignments')
      .insert([
        {
          id: 'assignment_001',
          driver_id: 'driver_1749740891490',
          vehicle_id: 'vehicle_001',
          assigned_date: new Date().toISOString().split('T')[0],
          is_primary: true
        }
      ]);

    if (assignmentError) {
      console.error('Error creating vehicle assignment:', assignmentError);
      throw assignmentError;
    }

    console.log('✅ Vehicle data seeded successfully');
    return true;

  } catch (error) {
    console.error('❌ Failed to seed vehicle data:', error);
    return false;
  }
}