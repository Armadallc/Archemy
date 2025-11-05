/**
 * Tenant Isolation Verification Script
 * 
 * Tests:
 * 1. Trips endpoint tenant isolation (Halcyon vs Monarch)
 * 2. Drivers endpoint tenant isolation (Halcyon vs Monarch)
 * 3. WebSocket notification isolation (future - manual testing required)
 * 
 * Usage: node test-tenant-isolation-verification.js
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const API_URL = process.env.API_URL || 'http://localhost:8081';
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test credentials
const CREDENTIALS = {
  halcyon: { email: 'admin@halcyon.com', password: 'admin123' },
  monarch: { email: 'programadmin@monarch.com', password: 'programadmin123' },
  superAdmin: { email: 'admin@monarch.com', password: 'admin123' }
};

let HALCYON_ADMIN_TOKEN = '';
let MONARCH_ADMIN_TOKEN = '';
let SUPER_ADMIN_TOKEN = '';

async function authenticateUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error(`❌ Authentication failed for ${email}:`, error.message);
      return null;
    }
    return data.session.access_token;
  } catch (error) {
    console.error(`❌ Error authenticating ${email}:`, error.message);
    return null;
  }
}

async function initializeAuth() {
  console.log('🔐 Authenticating users...\n');
  
  HALCYON_ADMIN_TOKEN = await authenticateUser(CREDENTIALS.halcyon.email, CREDENTIALS.halcyon.password);
  if (HALCYON_ADMIN_TOKEN) {
    console.log(`✅ Authenticated as Halcyon Admin: ${CREDENTIALS.halcyon.email}`);
  } else {
    console.log(`⚠️  Could not authenticate Halcyon Admin - tests may fail`);
  }
  
  MONARCH_ADMIN_TOKEN = await authenticateUser(CREDENTIALS.monarch.email, CREDENTIALS.monarch.password);
  if (MONARCH_ADMIN_TOKEN) {
    console.log(`✅ Authenticated as Monarch Admin: ${CREDENTIALS.monarch.email}`);
  } else {
    console.log(`⚠️  Could not authenticate Monarch Admin - tests may fail`);
  }
  
  SUPER_ADMIN_TOKEN = await authenticateUser(CREDENTIALS.superAdmin.email, CREDENTIALS.superAdmin.password);
  if (SUPER_ADMIN_TOKEN) {
    console.log(`✅ Authenticated as Super Admin: ${CREDENTIALS.superAdmin.email}`);
  }
  
  console.log('');
}

async function makeRequest(method, endpoint, token, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

async function testTripsEndpoint() {
  console.log('\n🔍 Testing Trips Endpoint Tenant Isolation\n');
  
  // Test 1: Halcyon trips endpoint
  console.log('Test 1: Fetching Halcyon trips...');
  const halcyonTrips = await makeRequest('GET', '/api/trips/corporate-client/halcyon', HALCYON_ADMIN_TOKEN);
  console.log(`  Status: ${halcyonTrips.status}`);
  console.log(`  Trips returned: ${Array.isArray(halcyonTrips.data) ? halcyonTrips.data.length : 'N/A'}`);
  
  if (Array.isArray(halcyonTrips.data)) {
    // Verify all trips belong to Halcyon programs
    const halcyonProgramIds = halcyonTrips.data
      .map(trip => trip.programs?.id)
      .filter(Boolean);
    const uniquePrograms = [...new Set(halcyonProgramIds)];
    console.log(`  Unique programs: ${uniquePrograms.join(', ')}`);
    
    // Check if any trips belong to Monarch
    const monarchTrips = halcyonTrips.data.filter(trip => {
      const corporateClientId = trip.programs?.corporate_clients?.id;
      return corporateClientId && corporateClientId !== 'halcyon';
    });
    
    if (monarchTrips.length > 0) {
      console.log(`  ❌ FAIL: Found ${monarchTrips.length} trips from other corporate clients`);
      return false;
    } else {
      console.log(`  ✅ PASS: All trips belong to Halcyon`);
    }
  }
  
  // Test 2: Monarch trips endpoint
  console.log('\nTest 2: Fetching Monarch trips...');
  const monarchTrips = await makeRequest('GET', '/api/trips/corporate-client/monarch', MONARCH_ADMIN_TOKEN);
  console.log(`  Status: ${monarchTrips.status}`);
  console.log(`  Trips returned: ${Array.isArray(monarchTrips.data) ? monarchTrips.data.length : 'N/A'}`);
  
  if (Array.isArray(monarchTrips.data)) {
    // Verify all trips belong to Monarch programs
    const halcyonTrips = monarchTrips.data.filter(trip => {
      const corporateClientId = trip.programs?.corporate_clients?.id;
      return corporateClientId && corporateClientId === 'halcyon';
    });
    
    if (halcyonTrips.length > 0) {
      console.log(`  ❌ FAIL: Found ${halcyonTrips.length} trips from Halcyon`);
      return false;
    } else {
      console.log(`  ✅ PASS: All trips belong to Monarch`);
    }
  }
  
  // Test 3: Compare results
  console.log('\nTest 3: Comparing Halcyon vs Monarch results...');
  if (Array.isArray(halcyonTrips.data) && Array.isArray(monarchTrips.data)) {
    const halcyonTripIds = new Set(halcyonTrips.data.map(t => t.id));
    const monarchTripIds = new Set(monarchTrips.data.map(t => t.id));
    const overlap = [...halcyonTripIds].filter(id => monarchTripIds.has(id));
    
    if (overlap.length > 0) {
      console.log(`  ❌ FAIL: Found ${overlap.length} trips in both results (tenant leakage)`);
      console.log(`  Overlapping trip IDs: ${overlap.join(', ')}`);
      return false;
    } else {
      console.log(`  ✅ PASS: No trip overlap between Halcyon and Monarch`);
    }
  }
  
  return true;
}

async function testDriversEndpoint() {
  console.log('\n🔍 Testing Drivers Endpoint Tenant Isolation\n');
  
  // Test 1: Halcyon drivers endpoint
  console.log('Test 1: Fetching Halcyon drivers...');
  const halcyonDrivers = await makeRequest('GET', '/api/drivers/corporate-client/halcyon', HALCYON_ADMIN_TOKEN);
  console.log(`  Status: ${halcyonDrivers.status}`);
  console.log(`  Drivers returned: ${Array.isArray(halcyonDrivers.data) ? halcyonDrivers.data.length : 'N/A'}`);
  
  if (Array.isArray(halcyonDrivers.data)) {
    // Verify all drivers belong to Halcyon programs
    const halcyonProgramIds = halcyonDrivers.data
      .map(driver => {
        const primaryProgram = driver.users?.programs?.id;
        const authorizedPrograms = driver.users?.authorized_programs || [];
        return [primaryProgram, ...(Array.isArray(authorizedPrograms) ? authorizedPrograms : [])].filter(Boolean);
      })
      .flat();
    const uniquePrograms = [...new Set(halcyonProgramIds)];
    console.log(`  Unique programs: ${uniquePrograms.join(', ')}`);
    
    // Check if any drivers belong to Monarch
    const monarchDrivers = halcyonDrivers.data.filter(driver => {
      const corporateClientId = driver.users?.programs?.corporate_clients?.id;
      return corporateClientId && corporateClientId !== 'halcyon';
    });
    
    if (monarchDrivers.length > 0) {
      console.log(`  ❌ FAIL: Found ${monarchDrivers.length} drivers from other corporate clients`);
      console.log(`  Monarch driver IDs: ${monarchDrivers.map(d => d.id).join(', ')}`);
      return false;
    } else {
      console.log(`  ✅ PASS: All drivers belong to Halcyon`);
    }
  }
  
  // Test 2: Monarch drivers endpoint
  console.log('\nTest 2: Fetching Monarch drivers...');
  const monarchDrivers = await makeRequest('GET', '/api/drivers/corporate-client/monarch', MONARCH_ADMIN_TOKEN);
  console.log(`  Status: ${monarchDrivers.status}`);
  console.log(`  Drivers returned: ${Array.isArray(monarchDrivers.data) ? monarchDrivers.data.length : 'N/A'}`);
  
  if (Array.isArray(monarchDrivers.data)) {
    // Verify all drivers belong to Monarch programs
    const halcyonDrivers = monarchDrivers.data.filter(driver => {
      const corporateClientId = driver.users?.programs?.corporate_clients?.id;
      return corporateClientId && corporateClientId === 'halcyon';
    });
    
    if (halcyonDrivers.length > 0) {
      console.log(`  ❌ FAIL: Found ${halcyonDrivers.length} drivers from Halcyon`);
      return false;
    } else {
      console.log(`  ✅ PASS: All drivers belong to Monarch`);
    }
  }
  
  // Test 3: Compare results
  console.log('\nTest 3: Comparing Halcyon vs Monarch results...');
  if (Array.isArray(halcyonDrivers.data) && Array.isArray(monarchDrivers.data)) {
    const halcyonDriverIds = new Set(halcyonDrivers.data.map(d => d.id));
    const monarchDriverIds = new Set(monarchDrivers.data.map(d => d.id));
    const overlap = [...halcyonDriverIds].filter(id => monarchDriverIds.has(id));
    
    if (overlap.length > 0) {
      console.log(`  ❌ FAIL: Found ${overlap.length} drivers in both results (tenant leakage)`);
      console.log(`  Overlapping driver IDs: ${overlap.join(', ')}`);
      return false;
    } else {
      console.log(`  ✅ PASS: No driver overlap between Halcyon and Monarch`);
    }
  }
  
  return true;
}

async function testWebSocketNotificationIsolation() {
  console.log('\n🔍 WebSocket Notification Isolation Testing\n');
  console.log('⚠️  WebSocket testing requires manual verification:');
  console.log('  1. Open browser as Halcyon admin');
  console.log('  2. Open browser as Monarch admin (or program admin)');
  console.log('  3. Create a trip in Halcyon program');
  console.log('  4. Verify: Halcyon admin receives notification, Monarch admin does NOT');
  console.log('  5. Create a trip in Monarch program');
  console.log('  6. Verify: Monarch admin receives notification, Halcyon admin does NOT');
  console.log('\n  See: test-websocket-isolation.js for automated WebSocket testing');
}

async function main() {
  console.log('🚀 Starting Tenant Isolation Verification\n');
  console.log(`API URL: ${API_URL}\n`);
  
  // Authenticate users first
  await initializeAuth();
  
  if (!HALCYON_ADMIN_TOKEN || !MONARCH_ADMIN_TOKEN) {
    console.log('⚠️  Warning: Some authentication tokens are missing.');
    console.log('   Tests may fail or produce incomplete results.\n');
  }
  
  const results = {
    trips: false,
    drivers: false,
    websocket: true // Manual testing required
  };
  
  try {
    results.trips = await testTripsEndpoint();
  } catch (error) {
    console.error('❌ Trips endpoint test failed:', error);
  }
  
  try {
    results.drivers = await testDriversEndpoint();
  } catch (error) {
    console.error('❌ Drivers endpoint test failed:', error);
  }
  
  testWebSocketNotificationIsolation();
  
  // Summary
  console.log('\n📊 Test Results Summary\n');
  console.log(`Trips Endpoint: ${results.trips ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Drivers Endpoint: ${results.drivers ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`WebSocket Isolation: ⚠️  Manual testing required`);
  
  const allPassed = results.trips && results.drivers;
  console.log(`\n${allPassed ? '✅' : '❌'} Overall: ${allPassed ? 'PASS' : 'FAIL'}`);
  
  if (!allPassed) {
    process.exit(1);
  }
}

// Run if called directly
main().catch(console.error);

