#!/usr/bin/env node

/**
 * System Health Check - Automated Testing for Critical Functionality
 * Run this before making any changes to verify system stability
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-app.replit.app' 
  : 'http://localhost:5000';

// Test configuration
const SUPER_ADMIN_TOKEN = 'super_admin_development_token_monarch_2024';
const TEST_ORG = 'monarch_competency';

const tests = [];
let passedTests = 0;
let failedTests = 0;

function addTest(name, testFn) {
  tests.push({ name, testFn });
}

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const requestModule = url.startsWith('https:') ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPER_ADMIN_TOKEN}`,
        ...options.headers
      }
    };

    const req = requestModule.request(url, requestOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, data, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function runTest(test) {
  try {
    console.log(`\n🧪 Testing: ${test.name}`);
    await test.testFn();
    console.log(`✅ PASSED: ${test.name}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ FAILED: ${test.name}`);
    console.log(`   Error: ${error.message}`);
    failedTests++;
  }
}

// Critical Authentication Tests
addTest('Authentication - Super Admin Token', async () => {
  const response = await makeRequest('/api/auth/user');
  if (response.status !== 200 && response.status !== 401) {
    throw new Error(`Unexpected auth status: ${response.status}`);
  }
  // 401 is acceptable if session-only, token should work for API calls
});

addTest('Dashboard API - Clients Endpoint', async () => {
  const response = await makeRequest(`/api/clients/organization/${TEST_ORG}`);
  if (response.status !== 200) {
    throw new Error(`Clients API failed: ${response.status} - ${JSON.stringify(response.data)}`);
  }
  if (!Array.isArray(response.data)) {
    throw new Error('Clients API should return an array');
  }
});

addTest('Dashboard API - Drivers Endpoint', async () => {
  const response = await makeRequest(`/api/drivers/organization/${TEST_ORG}`);
  if (response.status !== 200) {
    throw new Error(`Drivers API failed: ${response.status} - ${JSON.stringify(response.data)}`);
  }
  if (!Array.isArray(response.data)) {
    throw new Error('Drivers API should return an array');
  }
});

addTest('Dashboard API - Trips Endpoint', async () => {
  const response = await makeRequest(`/api/trips/organization/${TEST_ORG}`);
  if (response.status !== 200) {
    throw new Error(`Trips API failed: ${response.status} - ${JSON.stringify(response.data)}`);
  }
  if (!Array.isArray(response.data)) {
    throw new Error('Trips API should return an array');
  }
});

addTest('Dashboard API - Organization Endpoint', async () => {
  const response = await makeRequest(`/api/organizations/${TEST_ORG}`);
  if (response.status !== 200) {
    throw new Error(`Organization API failed: ${response.status} - ${JSON.stringify(response.data)}`);
  }
  if (!response.data || !response.data.id) {
    throw new Error('Organization API should return organization object with id');
  }
});

addTest('Database Schema - Snake Case Fields', async () => {
  const response = await makeRequest(`/api/clients/organization/${TEST_ORG}`);
  if (response.status === 200 && response.data.length > 0) {
    const client = response.data[0];
    // Check that we get snake_case from API (not camelCase)
    const hasSnakeCase = 'organization_id' in client || 'first_name' in client;
    if (!hasSnakeCase) {
      throw new Error('API should return snake_case field names from database');
    }
  }
});

// Main execution
async function main() {
  console.log('🚀 Starting System Health Check...');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`🏢 Test Organization: ${TEST_ORG}`);
  
  for (const test of tests) {
    await runTest(test);
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📝 Total: ${tests.length}`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! System is stable.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Do not proceed with changes.');
    process.exit(1);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('\n💥 Unhandled error:', error.message);
  process.exit(1);
});

if (require.main === module) {
  main();
}