import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFrequentLocationsAPI() {
  try {
    console.log('🔍 Testing frequent locations API endpoints...\n');

    // 1. Sign in as a test user
    console.log('1️⃣ Signing in as test user...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@monarch.com',
      password: 'admin123'
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }

    const accessToken = authData.session.access_token;
    console.log('✅ Authenticated as:', authData.user.email);

    // 2. Test GET /api/frequent-locations
    console.log('\n2️⃣ Testing GET /api/frequent-locations...');
    const response = await fetch('http://localhost:8081/api/frequent-locations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.length} frequent locations:`);
      data.forEach((location, index) => {
        console.log(`  ${index + 1}. ${location.name} (${location.location_type}) - ${location.usage_count} uses`);
      });
    } else {
      const error = await response.json();
      console.error('❌ API error:', error);
      return;
    }

    // 3. Test GET /api/frequent-locations with program filter
    console.log('\n3️⃣ Testing GET /api/frequent-locations with program filter...');
    const programResponse = await fetch('http://localhost:8081/api/frequent-locations?program_id=monarch_competency', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Program filter response status:', programResponse.status);
    
    if (programResponse.ok) {
      const programData = await programResponse.json();
      console.log(`✅ Found ${programData.length} locations for program:`);
      programData.forEach((location, index) => {
        console.log(`  ${index + 1}. ${location.name} (${location.location_type})`);
      });
    } else {
      const error = await programResponse.json();
      console.error('❌ Program filter API error:', error);
    }

    // 4. Test GET /api/frequent-locations/program/:programId
    console.log('\n4️⃣ Testing GET /api/frequent-locations/program/monarch_competency...');
    const programSpecificResponse = await fetch('http://localhost:8081/api/frequent-locations/program/monarch_competency', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Program-specific response status:', programSpecificResponse.status);
    
    if (programSpecificResponse.ok) {
      const programSpecificData = await programSpecificResponse.json();
      console.log(`✅ Found ${programSpecificData.length} locations for program-specific endpoint:`);
      programSpecificData.forEach((location, index) => {
        console.log(`  ${index + 1}. ${location.name} (${location.location_type})`);
      });
    } else {
      const error = await programSpecificResponse.json();
      console.error('❌ Program-specific API error:', error);
    }

    console.log('\n✅ API testing completed successfully!');

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  }
}

testFrequentLocationsAPI();
