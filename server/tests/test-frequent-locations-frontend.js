import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFrequentLocationsFrontend() {
  try {
    console.log('🔍 Testing frequent locations frontend data loading...\n');

    // 1. Sign in as a test user (simulating frontend authentication)
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

    // 2. Test the exact API call that the frontend would make
    console.log('\n2️⃣ Testing frontend API call...');
    const response = await fetch('http://localhost:8081/api/frequent-locations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Frontend API call successful! Found ${data.length} frequent locations:`);
      
      data.forEach((location, index) => {
        console.log(`  ${index + 1}. ${location.name}`);
        console.log(`     - Type: ${location.location_type}`);
        console.log(`     - Address: ${location.full_address}`);
        console.log(`     - Usage: ${location.usage_count} times`);
        console.log(`     - Active: ${location.is_active}`);
        console.log(`     - Corporate: ${location.corporate_clients?.name || 'N/A'}`);
        console.log(`     - Program: ${location.programs?.name || 'N/A'}`);
        console.log('');
      });

      // 3. Test the Quick Add API call (program-specific)
      console.log('3️⃣ Testing Quick Add API call...');
      const quickAddResponse = await fetch('http://localhost:8081/api/frequent-locations/program/monarch_competency', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Quick Add response status:', quickAddResponse.status);
      
      if (quickAddResponse.ok) {
        const quickAddData = await quickAddResponse.json();
        console.log(`✅ Quick Add API call successful! Found ${quickAddData.length} locations for trip creation:`);
        
        quickAddData.forEach((location, index) => {
          console.log(`  ${index + 1}. ${location.name} (${location.location_type})`);
        });
      } else {
        const error = await quickAddResponse.json();
        console.error('❌ Quick Add API error:', error);
      }

    } else {
      const error = await response.json();
      console.error('❌ Frontend API error:', error);
      return;
    }

    console.log('\n✅ Frontend data loading test completed successfully!');
    console.log('🎯 The frequent locations page should now be able to load data properly.');

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  }
}

testFrequentLocationsFrontend();






