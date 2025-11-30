/**
 * Create Single Test Trip for Monarch Competency
 * 
 * This script creates one test trip with existing client and driver
 * to test the HierarchicalTripsPage functionality.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Single test trip using existing client and driver
const testTrip = {
  id: 'test_trip_single_001',
  program_id: 'monarch_competency',
  client_id: 'monarch_competency_patient_001', // John Doe (existing)
  driver_id: 'monarch_competency_driver_001', // Existing driver
  trip_type: 'one_way',
  pickup_address: '123 Main St, Lowell, MA 01852',
  dropoff_address: '456 Assessment Ave, Newton, MA 02458',
  scheduled_pickup_time: new Date().toISOString().split('T')[0] + 'T14:00:00Z', // Today at 2 PM
  passenger_count: 1,
  status: 'scheduled',
  notes: 'Test trip for HierarchicalTripsPage - single trip test',
  special_requirements: 'None'
};

async function createSingleTestTrip() {
  console.log('🚀 Creating single test trip...');
  console.log('📋 Trip Details:');
  console.log(`  - ID: ${testTrip.id}`);
  console.log(`  - Client: ${testTrip.client_id} (John Doe)`);
  console.log(`  - Driver: ${testTrip.driver_id}`);
  console.log(`  - From: ${testTrip.pickup_address}`);
  console.log(`  - To: ${testTrip.dropoff_address}`);
  console.log(`  - Time: ${testTrip.scheduled_pickup_time}`);
  console.log(`  - Status: ${testTrip.status}`);
  
  try {
    // Insert the test trip
    const { data, error } = await supabase
      .from('trips')
      .insert(testTrip)
      .select();

    if (error) {
      console.error('❌ Error creating test trip:', error);
      return;
    }

    console.log('✅ Successfully created test trip!');
    console.log('📊 Trip created:', data[0]);
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Go to the Trips page in your browser');
    console.log('2. You should see this trip listed');
    console.log('3. Test the search and filter functionality');
    console.log('4. Check if the trip details display correctly');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
createSingleTestTrip();

