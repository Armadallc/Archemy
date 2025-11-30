/**
 * Test script for Permissions API endpoints
 * 
 * Usage:
 * 1. Get your auth token from browser localStorage or cookies
 * 2. Update AUTH_TOKEN below
 * 3. Run: node server/tests/test-permissions-api.js
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8081';

// ⚠️ UPDATE THIS with your actual auth token
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE';

async function testEndpoint(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`\n📡 Testing: ${method} ${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (response.ok) {
      console.log(`   ✅ Success!`);
      console.log(`   📝 Response:`, JSON.stringify(data, null, 2));
    } else {
      console.log(`   ❌ Error:`, data.message || data.error);
    }
    return { success: response.ok, data };
  } catch (error) {
    console.log(`   ❌ Network Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing Permissions API Endpoints\n');
  console.log('=' .repeat(50));

  // Test 1: Get effective permissions
  await testEndpoint('GET', '/api/permissions/effective');

  // Test 2: Get all permissions (requires super_admin or corporate_admin)
  await testEndpoint('GET', '/api/permissions/all');

  // Test 3: Get effective permissions for a program (if you have a program ID)
  // await testEndpoint('GET', '/api/permissions/effective/program/YOUR_PROGRAM_ID');

  // Test 4: Grant a permission (requires super_admin)
  // await testEndpoint('POST', '/api/permissions/grant', {
  //   role: 'program_user',
  //   permission: 'manage_trips',
  //   resource: '*',
  // });

  console.log('\n' + '='.repeat(50));
  console.log('✅ Tests completed!');
  console.log('\n💡 Tip: Uncomment the grant/revoke tests if you want to test those endpoints.');
}

// Run tests
runTests().catch(console.error);

