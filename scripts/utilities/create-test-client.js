/**
 * Create Test Client for Monarch Competency
 * 
 * This script creates a test client to have more variety for testing trips.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test client
const testClient = {
  id: 'test_client_001',
  first_name: 'Jane',
  last_name: 'Smith',
  program_id: 'monarch_competency',
  location_id: 'monarch_competency_lowell',
  phone: '555-9999',
  email: 'jane.smith@test.com',
  address: '789 Test Street, Lowell, MA 01852',
  emergency_contact_name: 'Bob Smith',
  emergency_contact_phone: '555-8888',
  special_requirements: 'Wheelchair accessible',
  is_active: true
};

async function createTestClient() {
  console.log('🚀 Creating test client...');
  console.log('👤 Client Details:');
  console.log(`  - Name: ${testClient.first_name} ${testClient.last_name}`);
  console.log(`  - Program: ${testClient.program_id}`);
  console.log(`  - Location: ${testClient.location_id}`);
  console.log(`  - Phone: ${testClient.phone}`);
  console.log(`  - Email: ${testClient.email}`);
  console.log(`  - Special Requirements: ${testClient.special_requirements}`);
  
  try {
    // Insert the test client
    const { data, error } = await supabase
      .from('clients')
      .insert(testClient)
      .select();

    if (error) {
      console.error('❌ Error creating test client:', error);
      return;
    }

    console.log('✅ Successfully created test client!');
    console.log('📊 Client created:', data[0]);
    
    console.log('\n🎯 You can now create trips for this client!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
createTestClient();
