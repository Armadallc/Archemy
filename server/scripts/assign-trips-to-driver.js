/**
 * Assign trips to the test driver user
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

async function assignTripsToDriver() {
  try {
    console.log('🔍 Assigning trips to test driver...\n');

    // 1. Find the test driver
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, user_id')
      .eq('user_id', 'test_driver_1760287355404')
      .single();

    if (driverError || !driver) {
      console.error('❌ Driver not found:', driverError);
      return;
    }

    console.log('👤 Found driver:', driver.id);

    // 2. Find unassigned trips
    const { data: unassignedTrips, error: tripsError } = await supabase
      .from('trips')
      .select('id, driver_id, status, scheduled_pickup_time')
      .is('driver_id', null)
      .limit(3);

    if (tripsError) {
      console.error('❌ Error fetching unassigned trips:', tripsError);
      return;
    }

    console.log(`📋 Found ${unassignedTrips.length} unassigned trips:`);
    unassignedTrips.forEach(trip => {
      console.log(`  - ${trip.id}: status=${trip.status}, time=${trip.scheduled_pickup_time}`);
    });

    if (unassignedTrips.length === 0) {
      console.log('❌ No unassigned trips to assign');
      return;
    }

    // 3. Assign trips to the driver
    const tripIds = unassignedTrips.map(trip => trip.id);
    const { error: updateError } = await supabase
      .from('trips')
      .update({ driver_id: driver.id })
      .in('id', tripIds);

    if (updateError) {
      console.error('❌ Error assigning trips:', updateError);
      return;
    }

    console.log(`✅ Assigned ${tripIds.length} trips to driver ${driver.id}`);

    // 4. Verify the assignment
    const { data: driverTrips, error: verifyError } = await supabase
      .from('trips')
      .select('id, driver_id, status, scheduled_pickup_time')
      .eq('driver_id', driver.id)
      .order('scheduled_pickup_time', { ascending: true });

    if (verifyError) {
      console.error('❌ Error verifying trips:', verifyError);
      return;
    }

    console.log(`\n✅ Driver now has ${driverTrips.length} trips:`);
    driverTrips.forEach(trip => {
      console.log(`  - ${trip.id}: status=${trip.status}, time=${trip.scheduled_pickup_time}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

assignTripsToDriver();





