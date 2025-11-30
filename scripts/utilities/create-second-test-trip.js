/**
 * Create Second Test Trip for Monarch Competency
 * 
 * This script creates a second test trip using the new test client
 * to provide more variety for testing the HierarchicalTripsPage.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Second test trip using the new test client
const secondTestTrip = {
  id: 'test_trip_single_002',
  program_id: 'monarch_competency',
  client_id: 'test_client_001', // Jane Smith (newly created)
  driver_id: 'monarch_competency_driver_001', // Existing driver
  trip_type: 'round_trip',
  pickup_address: '789 Test Street, Lowell, MA 01852',
  dropoff_address: '321 Medical Center, Newton, MA 02458',
  scheduled_pickup_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T10:00:00Z', // Tomorrow at 10 AM
  scheduled_return_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T16:00:00Z', // Tomorrow at 4 PM
  passenger_count: 1,
  status: 'confirmed',
  notes: 'Test round trip for Jane Smith - medical appointment',
  special_requirements: 'Wheelchair accessible'
};

async function createSecondTestTrip() {
  console.log('🚀 Creating second test trip...');
  console.log('📋 Trip Details:');
  console.log(`  - ID: ${secondTestTrip.id}`);
  console.log(`  - Client: ${secondTestTrip.client_id} (Jane Smith)`);
  console.log(`  - Driver: ${secondTestTrip.driver_id}`);
  console.log(`  - Type: ${secondTestTrip.trip_type}`);
  console.log(`  - From: ${secondTestTrip.pickup_address}`);
  console.log(`  - To: ${secondTestTrip.dropoff_address}`);
  console.log(`  - Pickup: ${secondTestTrip.scheduled_pickup_time}`);
  console.log(`  - Return: ${secondTestTrip.scheduled_return_time}`);
  console.log(`  - Status: ${secondTestTrip.status}`);
  console.log(`  - Special Requirements: ${secondTestTrip.special_requirements}`);
  
  try {
    // Insert the second test trip
    const { data, error } = await supabase
      .from('trips')
      .insert(secondTestTrip)
      .select();

    if (error) {
      console.error('❌ Error creating second test trip:', error);
      return;
    }

    console.log('✅ Successfully created second test trip!');
    console.log('📊 Trip created:', data[0]);
    
    console.log('\n🎯 Now you have 2 test trips:');
    console.log('1. John Doe - One way trip (scheduled) - Today 2 PM');
    console.log('2. Jane Smith - Round trip (confirmed) - Tomorrow 10 AM-4 PM');
    console.log('\n📱 Go test the Trips page now!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
createSecondTestTrip();

