import { supabase } from './minimal-supabase';

export async function initializeVehicles() {
  console.log('🚗 Initializing vehicles data...');
  
  try {
    // Check if vehicles already exist
    const { data: existingVehicles, error: checkError } = await supabase
      .from('vehicles')
      .select('id')
      .limit(1);

    // If table doesn't exist, the error will be caught and we'll create sample data
    if (checkError && checkError.code === '42P01') {
      console.log('Vehicles table does not exist, creating sample data...');
      // Table doesn't exist, so we'll try to insert data which will create it
    } else if (existingVehicles && existingVehicles.length > 0) {
      console.log('✅ Vehicles already exist, skipping initialization');
      return;
    }

    const sampleVehicles = [
        // Monarch Competency vehicles
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
          organization_id: 'monarch_competency',
          year: 2018,
          make: 'Chevrolet',
          model: 'Express',
          color: 'Gray',
          license_plate: 'MC-004',
          is_active: true
        },
        // Monarch Mental Health vehicles
        {
          id: 'vehicle_005',
          organization_id: 'monarch_mental_health',
          year: 2022,
          make: 'Honda',
          model: 'Odyssey',
          color: 'Black',
          license_plate: 'MMH-001',
          is_active: true
        },
        {
          id: 'vehicle_006',
          organization_id: 'monarch_mental_health',
          year: 2020,
          make: 'Toyota',
          model: 'Highlander',
          color: 'Red',
          license_plate: 'MMH-002',
          is_active: true
        },
        {
          id: 'vehicle_007',
          organization_id: 'monarch_mental_health',
          year: 2019,
          make: 'Nissan',
          model: 'NV200',
          color: 'White',
          license_plate: 'MMH-003',
          is_active: true
        },
        // Monarch Sober Living vehicles
        {
          id: 'vehicle_008',
          organization_id: 'monarch_sober_living',
          year: 2021,
          make: 'Ford',
          model: 'Transit Connect',
          color: 'Blue',
          license_plate: 'MSL-001',
          is_active: true
        },
        {
          id: 'vehicle_009',
          organization_id: 'monarch_sober_living',
          year: 2020,
          make: 'Honda',
          model: 'Ridgeline',
          color: 'Green',
          license_plate: 'MSL-002',
          is_active: true
        },
        {
          id: 'vehicle_010',
          organization_id: 'monarch_sober_living',
          year: 2018,
          make: 'Toyota',
          model: 'Prius',
          color: 'Silver',
          license_plate: 'MSL-003',
          is_active: true
        },
        // Monarch Launch vehicles
        {
          id: 'vehicle_011',
          organization_id: 'monarch_launch',
          year: 2022,
          make: 'Tesla',
          model: 'Model Y',
          color: 'White',
          license_plate: 'ML-001',
          is_active: true
        },
        {
          id: 'vehicle_012',
          organization_id: 'monarch_launch',
          year: 2021,
          make: 'BMW',
          model: 'X3',
          color: 'Black',
          license_plate: 'ML-002',
          is_active: true
        },
        {
          id: 'vehicle_013',
          organization_id: 'monarch_launch',
          year: 2020,
          make: 'Audi',
          model: 'Q5',
          color: 'Gray',
          license_plate: 'ML-003',
          is_active: true
        }
      ];

    const { error: insertError } = await supabase
      .from('vehicles')
      .insert(sampleVehicles);

    if (insertError) {
      console.error('Error inserting sample vehicles:', insertError);
    } else {
      console.log(`✅ Inserted ${sampleVehicles.length} sample vehicles`);
    }

  } catch (error) {
    console.error('Error initializing vehicles:', error);
  }
}