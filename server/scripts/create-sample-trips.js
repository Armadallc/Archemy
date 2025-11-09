/**
 * Create sample trip data for mobile app testing
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSampleTrips() {
  try {
    console.log('🚀 Creating sample trips...');

    // Get an existing driver ID
    const { data: drivers, error: driverError } = await supabase
      .from('drivers')
      .select('id')
      .eq('is_active', true)
      .limit(1);

    if (driverError || !drivers || drivers.length === 0) {
      console.error('❌ Could not find drivers:', driverError);
      return;
    }

    const driverId = drivers[0].id;
    console.log('👤 Using driver ID:', driverId);

    // Get a program ID
    const { data: programs, error: programError } = await supabase
      .from('programs')
      .select('id')
      .limit(1);

    if (programError || !programs || programs.length === 0) {
      console.error('❌ Could not find programs:', programError);
      return;
    }

    const programId = programs[0].id;
    console.log('🏢 Using program ID:', programId);

    // Get a client ID
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .limit(1);

    if (clientError || !clients || clients.length === 0) {
      console.error('❌ Could not find clients:', clientError);
      return;
    }

    const clientId = clients[0].id;
    console.log('👥 Using client ID:', clientId);

    // Create sample trips
    const sampleTrips = [
      {
        id: 'trip_1_' + Date.now(),
        program_id: programId,
        client_id: clientId,
        driver_id: driverId,
        trip_type: 'one_way',
        pickup_address: '123 Main St, Downtown',
        dropoff_address: '456 Oak Ave, Medical Center',
        scheduled_pickup_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        passenger_count: 1,
        status: 'scheduled',
        notes: 'Regular medical appointment',
        is_group_trip: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'trip_2_' + Date.now(),
        program_id: programId,
        client_id: clientId,
        driver_id: driverId,
        trip_type: 'round_trip',
        pickup_address: '789 Pine St, Residential',
        dropoff_address: '321 Elm St, Shopping Center',
        scheduled_pickup_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
        scheduled_return_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
        passenger_count: 2,
        status: 'scheduled',
        notes: 'Shopping trip - round trip',
        is_group_trip: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'trip_3_' + Date.now(),
        program_id: programId,
        client_id: clientId,
        driver_id: driverId,
        trip_type: 'one_way',
        pickup_address: '555 Cedar Blvd, Home',
        dropoff_address: '777 Maple Dr, Hospital',
        scheduled_pickup_time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours from now
        passenger_count: 1,
        status: 'in_progress',
        notes: 'Emergency medical transport',
        is_group_trip: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Insert trips
    const { data: insertedTrips, error: insertError } = await supabase
      .from('trips')
      .insert(sampleTrips)
      .select();

    if (insertError) {
      console.error('❌ Error inserting trips:', insertError);
      return;
    }

    console.log('✅ Successfully created', insertedTrips.length, 'sample trips');
    console.log('📱 Trips should now appear in the mobile app');

  } catch (error) {
    console.error('❌ Error creating sample trips:', error);
  }
}

createSampleTrips();
