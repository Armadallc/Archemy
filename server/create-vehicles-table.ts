import { supabase } from './minimal-supabase';

export async function createVehiclesTable() {
  console.log('🚗 Creating vehicles table directly...');
  
  try {
    // Use raw SQL to create the table
    const { data, error } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS vehicles (
          id TEXT PRIMARY KEY,
          organization_id TEXT NOT NULL,
          year INTEGER NOT NULL,
          make TEXT NOT NULL,
          model TEXT NOT NULL,
          color TEXT NOT NULL,
          license_plate TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS driver_vehicle_assignments (
          id TEXT PRIMARY KEY,
          driver_id TEXT NOT NULL,
          vehicle_id TEXT NOT NULL,
          assigned_date DATE NOT NULL,
          is_primary BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(driver_id, vehicle_id)
        );
        
        INSERT INTO vehicles (id, organization_id, year, make, model, color, license_plate, is_active) VALUES
        ('vehicle_001', 'monarch_competency', 2020, 'Honda', 'Pilot', 'White', 'MC-001', true),
        ('vehicle_002', 'monarch_competency', 2019, 'Toyota', 'Sienna', 'Silver', 'MC-002', true),
        ('vehicle_003', 'monarch_competency', 2021, 'Ford', 'Transit', 'Blue', 'MC-003', true),
        ('vehicle_004', 'monarch_competency', 2018, 'Chevrolet', 'Express', 'Gray', 'MC-004', true)
        ON CONFLICT (id) DO NOTHING;
      `
    });

    if (error) {
      console.error('Error creating vehicles table:', error);
    } else {
      console.log('✅ Vehicles table created successfully');
    }

  } catch (error) {
    console.error('Error in createVehiclesTable:', error);
  }
}