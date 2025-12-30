#!/usr/bin/env node

/**
 * Test script for Trip Order Management Endpoints
 * 
 * Usage:
 * 1. Make sure your server is running on localhost:8081
 * 2. Get your auth token from browser localStorage or cookies
 * 3. Update AUTH_TOKEN below (or set as environment variable)
 * 4. Run: node server/tests/test-trip-order-endpoints.js
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8081';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Test credentials (update these for your environment)
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@monarch.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'admin123';

let authToken = null;
let testTripId = null;
let testDriverId = null;
let testUserId = null;

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

async function authenticate() {
  if (!supabase) {
    console.error('❌ Supabase client not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  console.log('🔐 Authenticating...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });

  if (error) {
    console.error('❌ Authentication failed:', error.message);
    process.exit(1);
  }

  authToken = data.session.access_token;
  testUserId = data.user.id;
  console.log('✅ Authenticated as:', data.user.email);
  return authToken;
}

async function makeRequest(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`\n📡 ${method} ${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (response.ok) {
      console.log(`   ✅ Success!`);
      console.log(`   📝 Response:`, JSON.stringify(data, null, 2));
      return { success: true, data, status: response.status };
    } else {
      console.log(`   ❌ Error:`, data.message || data.error);
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    console.log(`   ❌ Network Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function createTestTrip() {
  console.log('\n📝 Creating test trip...');
  
  // Get a program ID
  const { data: programs } = await supabase
    .from('programs')
    .select('id')
    .limit(1)
    .single();

  if (!programs) {
    console.error('❌ No programs found. Cannot create test trip.');
    return null;
  }

  // Get a client ID
  const { data: clients } = await supabase
    .from('clients')
    .select('id')
    .limit(1)
    .single();

  if (!clients) {
    console.error('❌ No clients found. Cannot create test trip.');
    return null;
  }

  // Get a driver ID
  const { data: drivers } = await supabase
    .from('drivers')
    .select('id')
    .limit(1)
    .single();

  const tripData = {
    program_id: programs.id,
    client_id: clients.id,
    driver_id: drivers?.id || null,
    trip_type: 'one_way',
    pickup_address: '123 Test St, Test City, TS 12345',
    dropoff_address: '456 Test Ave, Test City, TS 12345',
    scheduled_pickup_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    passenger_count: 1,
    status: 'order' // New trips should default to 'order'
  };

  const result = await makeRequest('POST', '/api/trips', tripData);
  
  if (result.success && result.data.id) {
    testTripId = result.data.id;
    testDriverId = result.data.driver_id;
    console.log(`✅ Test trip created: ${testTripId}`);
    return testTripId;
  }
  
  return null;
}

async function testUnassignedOrders() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: Get Unassigned Orders');
  console.log('='.repeat(60));
  
  const result = await makeRequest('GET', '/api/trips/orders/unassigned');
  
  if (result.success) {
    console.log(`\n✅ Found ${result.data.length} unassigned orders`);
  }
  
  return result.success;
}

async function testConfirmOrder() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Confirm Trip Order');
  console.log('='.repeat(60));
  
  if (!testTripId) {
    console.log('⚠️  Skipping - no test trip available');
    return false;
  }

  // Note: This will only work if the authenticated user is the assigned driver
  // For testing, you may need to create a trip with a driver that matches your user
  const result = await makeRequest('POST', `/api/trips/${testTripId}/confirm-order`);
  
  if (result.success) {
    console.log(`\n✅ Order confirmed successfully`);
    if (result.data.isRecurring) {
      console.log(`   Confirmed ${result.data.trips.length} trips in recurring series`);
    }
  } else {
    console.log(`\n⚠️  Order confirmation failed (this is expected if you're not the assigned driver)`);
  }
  
  return result.success;
}

async function testDeclineOrder() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Decline Trip Order');
  console.log('='.repeat(60));
  
  // Create a new trip for decline test
  const declineTripId = await createTestTrip();
  
  if (!declineTripId) {
    console.log('⚠️  Skipping - could not create test trip');
    return false;
  }

  const validReasons = ['conflict', 'day_off', 'unavailable', 'vehicle_issue', 'personal_emergency', 'too_far'];
  
  const result = await makeRequest('POST', `/api/trips/${declineTripId}/decline-order`, {
    reason: validReasons[0] // Use 'conflict' as test reason
  });
  
  if (result.success) {
    console.log(`\n✅ Order declined successfully`);
    console.log(`   Decline reason: ${result.data.trip.decline_reason}`);
  } else {
    console.log(`\n⚠️  Order decline failed (this is expected if you're not the assigned driver)`);
  }
  
  return result.success;
}

async function testUpdateStatus() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: Update Trip Status (State Machine)');
  console.log('='.repeat(60));
  
  if (!testTripId) {
    console.log('⚠️  Skipping - no test trip available');
    return false;
  }

  // Test start_trip action
  console.log('\n📋 Testing start_trip action...');
  const startResult = await makeRequest('POST', `/api/trips/${testTripId}/update-status`, {
    action: 'start_trip',
    client_aboard: true
  });
  
  if (startResult.success) {
    console.log(`✅ Trip started successfully`);
    console.log(`   Next action: ${startResult.data.nextAction}`);
    console.log(`   Button state: ${startResult.data.buttonState}`);
  } else {
    console.log(`⚠️  Start trip failed (this is expected if trip is not in 'scheduled' status)`);
  }

  // Test complete_trip action (if trip was started)
  if (startResult.success) {
    console.log('\n📋 Testing complete_trip action...');
    const completeResult = await makeRequest('POST', `/api/trips/${testTripId}/update-status`, {
      action: 'complete_trip'
    });
    
    if (completeResult.success) {
      console.log(`✅ Trip completed successfully`);
    }
  }

  return startResult.success;
}

async function testInvalidActions() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 5: Invalid Action Handling');
  console.log('='.repeat(60));
  
  if (!testTripId) {
    console.log('⚠️  Skipping - no test trip available');
    return false;
  }

  // Test with invalid action
  const result = await makeRequest('POST', `/api/trips/${testTripId}/update-status`, {
    action: 'invalid_action'
  });
  
  if (!result.success && result.status === 400) {
    console.log(`✅ Correctly rejected invalid action`);
    return true;
  }
  
  return false;
}

async function runAllTests() {
  console.log('🧪 Testing Trip Order Management Endpoints\n');
  console.log('='.repeat(60));
  
  // Authenticate first
  await authenticate();
  
  // Create a test trip
  await createTestTrip();
  
  // Run tests
  const results = {
    unassignedOrders: await testUnassignedOrders(),
    confirmOrder: await testConfirmOrder(),
    declineOrder: await testDeclineOrder(),
    updateStatus: await testUpdateStatus(),
    invalidActions: await testInvalidActions()
  };
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Unassigned Orders:     ${results.unassignedOrders ? '✅' : '❌'}`);
  console.log(`Confirm Order:          ${results.confirmOrder ? '✅' : '⚠️  (may require driver role)'}`);
  console.log(`Decline Order:          ${results.declineOrder ? '✅' : '⚠️  (may require driver role)'}`);
  console.log(`Update Status:          ${results.updateStatus ? '✅' : '⚠️  (may require driver role)'}`);
  console.log(`Invalid Actions:        ${results.invalidActions ? '✅' : '❌'}`);
  console.log('='.repeat(60));
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  console.log(`\n✅ Passed: ${passed}/${total} tests`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed or were skipped. Check the output above for details.');
  }
}

// Run tests
runAllTests().catch(console.error);

