/**
 * SEED DASHBOARD DATA
 * Add sample data to make the dashboard functional
 */
import { supabase } from './minimal-supabase';

async function seedDashboardData() {
  console.log('🌱 Seeding dashboard data...');

  try {
    // Add sample trips
    const { error: tripsError } = await supabase.from('trips').insert([
      {
        id: 'trip_1',
        program_id: 'monarch_competency',
        client_id: 'client_1',
        driver_id: 'driver_1',
        pickup_location: '123 Main St, Denver, CO',
        dropoff_location: '456 Oak Ave, Denver, CO',
        scheduled_pickup_time: '2024-01-15T09:00:00Z',
        scheduled_dropoff_time: '2024-01-15T10:00:00Z',
        status: 'scheduled',
        trip_category: 'medical',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'trip_2',
        program_id: 'monarch_competency',
        client_id: 'client_2',
        driver_id: 'driver_2',
        pickup_location: '789 Pine St, Denver, CO',
        dropoff_location: '321 Elm St, Denver, CO',
        scheduled_pickup_time: '2024-01-15T14:00:00Z',
        scheduled_dropoff_time: '2024-01-15T15:00:00Z',
        status: 'completed',
        trip_category: 'medical',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'trip_3',
        program_id: 'monarch_mental_health',
        client_id: 'client_3',
        driver_id: 'driver_1',
        pickup_location: '555 Cedar Ave, Denver, CO',
        dropoff_location: '777 Maple Dr, Denver, CO',
        scheduled_pickup_time: '2024-01-16T08:00:00Z',
        scheduled_dropoff_time: '2024-01-16T09:00:00Z',
        status: 'scheduled',
        trip_category: 'mental_health',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);

    if (tripsError) {
      console.log('⚠️ Trips already exist or error:', tripsError.message);
    } else {
      console.log('✅ Added sample trips');
    }

    // Add sample clients
    const { error: clientsError } = await supabase.from('clients').insert([
      {
        id: 'client_1',
        program_id: 'monarch_competency',
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-0101',
        email: 'john.doe@example.com',
        address: '123 Main St, Denver, CO 80202',
        emergency_contact: 'Jane Doe - 555-0102',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'client_2',
        program_id: 'monarch_competency',
        first_name: 'Mary',
        last_name: 'Smith',
        phone: '555-0201',
        email: 'mary.smith@example.com',
        address: '789 Pine St, Denver, CO 80203',
        emergency_contact: 'Bob Smith - 555-0202',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'client_3',
        program_id: 'monarch_mental_health',
        first_name: 'David',
        last_name: 'Johnson',
        phone: '555-0301',
        email: 'david.johnson@example.com',
        address: '555 Cedar Ave, Denver, CO 80204',
        emergency_contact: 'Sarah Johnson - 555-0302',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);

    if (clientsError) {
      console.log('⚠️ Clients already exist or error:', clientsError.message);
    } else {
      console.log('✅ Added sample clients');
    }

    // Add sample drivers
    const { error: driversError } = await supabase.from('drivers').insert([
      {
        id: 'driver_1',
        program_id: 'monarch_competency',
        user_id: 'driver_user_1',
        first_name: 'Mike',
        last_name: 'Wilson',
        phone: '555-1001',
        email: 'mike.wilson@example.com',
        license_number: 'DL123456789',
        license_expiry: '2025-12-31',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'driver_2',
        program_id: 'monarch_competency',
        user_id: 'driver_user_2',
        first_name: 'Lisa',
        last_name: 'Brown',
        phone: '555-1002',
        email: 'lisa.brown@example.com',
        license_number: 'DL987654321',
        license_expiry: '2025-11-30',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);

    if (driversError) {
      console.log('⚠️ Drivers already exist or error:', driversError.message);
    } else {
      console.log('✅ Added sample drivers');
    }

    // Add sample vehicles
    const { error: vehiclesError } = await supabase.from('vehicles').insert([
      {
        id: 'vehicle_1',
        program_id: 'monarch_competency',
        make: 'Ford',
        model: 'Transit',
        year: 2022,
        license_plate: 'ABC-123',
        vin: '1FTBW2CM5NKA12345',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'vehicle_2',
        program_id: 'monarch_competency',
        make: 'Chevrolet',
        model: 'Express',
        year: 2021,
        license_plate: 'XYZ-789',
        vin: '1GC1YVEG5MZ123456',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);

    if (vehiclesError) {
      console.log('⚠️ Vehicles already exist or error:', vehiclesError.message);
    } else {
      console.log('✅ Added sample vehicles');
    }

    console.log('🎉 Dashboard data seeding complete!');

  } catch (error) {
    console.error('❌ Error seeding dashboard data:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDashboardData();
}

export { seedDashboardData };
