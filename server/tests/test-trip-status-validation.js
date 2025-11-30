/**
 * Test Script for Trip Status Validation
 * 
 * Run this in browser console on http://localhost:5173 while logged in
 * Or run with: node test-trip-status-validation.js (requires auth token)
 */

// Get auth token from localStorage
const authToken = localStorage.getItem('auth_token') || localStorage.getItem('supabase_auth_token');

// Helper function to make API requests
async function updateTripStatus(tripId, newStatus) {
  const response = await fetch(`http://localhost:8081/api/trips/${tripId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ status: newStatus })
  });
  
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

// Test function
async function testStatusValidation() {
  console.log('🧪 Starting Trip Status Validation Tests...\n');
  
  // First, get a trip to test with
  const tripsResponse = await fetch('http://localhost:8081/api/trips', {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  const trips = await tripsResponse.json();
  
  if (!trips || trips.length === 0) {
    console.error('❌ No trips found. Create a trip first.');
    return;
  }
  
  const testTrip = trips[0];
  console.log(`📋 Testing with trip: ${testTrip.id}`);
  console.log(`   Current status: ${testTrip.status}\n`);
  
  // Test valid transitions
  console.log('✅ TEST 1: Valid Transitions');
  console.log('─'.repeat(50));
  
  const validNextStatuses = getValidNextStatuses(testTrip.status);
  for (const nextStatus of validNextStatuses.slice(0, 1)) { // Test first valid transition
    console.log(`\n   Testing: ${testTrip.status} → ${nextStatus}`);
    const result = await updateTripStatus(testTrip.id, nextStatus);
    
    if (result.ok) {
      console.log(`   ✅ SUCCESS: Transition allowed`);
      console.log(`   New status: ${result.data.status}`);
      
      // Check if timestamps were auto-set
      if (nextStatus === 'in_progress' && result.data.actual_pickup_time) {
        console.log(`   ✅ Timestamp auto-set: actual_pickup_time = ${result.data.actual_pickup_time}`);
      }
      if (nextStatus === 'completed' && result.data.actual_dropoff_time) {
        console.log(`   ✅ Timestamp auto-set: actual_dropoff_time = ${result.data.actual_dropoff_time}`);
      }
      
      // Restore original status for next test
      await updateTripStatus(testTrip.id, testTrip.status);
      console.log(`   🔄 Restored to original status: ${testTrip.status}`);
    } else {
      console.log(`   ❌ FAILED: ${result.data.message || 'Unknown error'}`);
    }
  }
  
  // Test invalid transitions
  console.log('\n\n❌ TEST 2: Invalid Transitions');
  console.log('─'.repeat(50));
  
  const invalidStatuses = ['completed', 'cancelled', 'no_show'];
  for (const invalidStatus of invalidStatuses) {
    if (invalidStatus === testTrip.status) continue; // Skip if it's the current status
    
    console.log(`\n   Testing: ${testTrip.status} → ${invalidStatus} (should fail)`);
    const result = await updateTripStatus(testTrip.id, invalidStatus);
    
    if (!result.ok && result.status === 400) {
      console.log(`   ✅ CORRECTLY REJECTED: ${result.data.message}`);
    } else if (result.ok) {
      console.log(`   ❌ SHOULD HAVE FAILED: Transition was allowed but shouldn't be!`);
      // Restore original status
      await updateTripStatus(testTrip.id, testTrip.status);
    } else {
      console.log(`   ⚠️ Unexpected error: ${result.data.message || 'Unknown error'}`);
    }
  }
  
  console.log('\n\n🎯 Testing Complete!');
  console.log('\nNext steps:');
  console.log('1. Check server logs for status change entries in trip_status_logs');
  console.log('2. Verify timestamps were auto-set correctly');
  console.log('3. Test in UI at /trips/edit/:tripId');
}

// Helper to get valid next statuses
function getValidNextStatuses(currentStatus) {
  const transitions = {
    scheduled: ['confirmed', 'cancelled', 'no_show'],
    confirmed: ['in_progress', 'cancelled', 'no_show'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
    no_show: []
  };
  return transitions[currentStatus] || [];
}

// Run tests
if (typeof window !== 'undefined') {
  // Browser environment
  window.testTripStatusValidation = testStatusValidation;
  console.log('📝 Test function available! Run: testTripStatusValidation()');
} else {
  // Node environment
  testStatusValidation().catch(console.error);
}

