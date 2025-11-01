/**
 * Test mobile API driver trip filtering
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMobileAPI() {
  try {
    console.log('🔍 Testing mobile API driver trip filtering...\n');

    // 1. Sign in as the original driver user
    console.log('🔐 Signing in as original driver user...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'driver@monarch.com',
      password: 'driver123'
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ Authenticated as:', authData.user.email);
    console.log('🔑 Access token:', authData.session.access_token.substring(0, 50) + '...');

    // 2. Test mobile API endpoint
    console.log('\n📱 Testing mobile API endpoint...');
    const response = await fetch('http://localhost:8081/api/mobile/trips/driver', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API request failed:', errorText);
      return;
    }

    const trips = await response.json();
    console.log(`\n✅ Mobile API returned ${trips.length} trips:`);
    
    trips.forEach((trip, index) => {
      console.log(`  ${index + 1}. ${trip.id}: status=${trip.status}, time=${trip.scheduled_pickup_time}`);
    });

    // 3. Verify filtering is working
    console.log('\n🔍 Verifying filtering:');
    console.log(`- Expected: 7 trips (from database test)`);
    console.log(`- Actual: ${trips.length} trips`);
    
    if (trips.length === 7) {
      console.log('✅ Driver trip filtering is working correctly!');
    } else {
      console.log('❌ Driver trip filtering may have issues');
    }

    // 4. Check if any unassigned trips are included
    const unassignedTrips = trips.filter(trip => !trip.driver_id);
    if (unassignedTrips.length > 0) {
      console.log('❌ Found unassigned trips in driver list:', unassignedTrips.length);
    } else {
      console.log('✅ No unassigned trips found in driver list');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMobileAPI();
