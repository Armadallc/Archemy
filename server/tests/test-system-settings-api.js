/**
 * System Settings API Test Script
 * Tests GET and PUT endpoints for system settings
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..', '..');
config({ path: join(projectRoot, '.env') });

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8081';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getAuthToken() {
  try {
    // Try to get session from browser (if running in Node, this won't work)
    // For testing, we'll use a mock token or actual login
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      return session.access_token;
    }
    
    // If no session, try to sign in as super_admin
    // Note: This requires valid credentials
    console.log('⚠️  No active session found. Using mock token for testing.');
    return 'super_admin_development_token_monarch_2024';
  } catch (error) {
    console.log('⚠️  Using mock token for testing.');
    return 'super_admin_development_token_monarch_2024';
  }
}

async function testSystemSettingsAPI() {
  console.log('🧪 Testing System Settings API\n');
  console.log('═══════════════════════════════════════\n');

  const token = await getAuthToken();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: GET system settings
  console.log('📋 Test 1: GET /api/system-settings');
  try {
    const response = await fetch(`${BASE_URL}/api/system-settings`, {
      method: 'GET',
      headers
    });

    const data = await response.json();
    
    console.log('   📝 Full Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 200) {
      console.log('   ✅ Status: 200 OK');
      
      // Verify structure
      if (data.id && data.app_name && data.support_email) {
        console.log('   ✅ Response structure is valid');
        passedTests++;
      } else {
        console.log('   ❌ Response structure is invalid');
        failedTests++;
      }
    } else if (response.status === 404) {
      console.log('   ⚠️  Status: 404 (Table may not exist yet - run migration first)');
      console.log('   📝 Error:', data.message || 'Not found');
      failedTests++;
    } else if (response.status === 403) {
      console.log('   ❌ Status: 403 Forbidden (Check authentication)');
      console.log('   📝 Error:', data.message || 'Access denied');
      failedTests++;
    } else {
      console.log(`   ❌ Status: ${response.status}`);
      console.log('   📝 Response:', JSON.stringify(data, null, 2));
      failedTests++;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    failedTests++;
  }

  console.log('');

  // Test 2: PUT system settings (only if GET worked)
  if (passedTests > 0) {
    console.log('📋 Test 2: PUT /api/system-settings');
    try {
      const updateData = {
        app_name: 'HALCYON Transportation Management',
        support_email: 'support@halcyon.com',
        support_phone: '+1 (555) 123-4567',
        timezone: 'America/Denver',
        language: 'en'
      };

      const response = await fetch(`${BASE_URL}/api/system-settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (response.status === 200) {
        console.log('   ✅ Status: 200 OK');
        console.log('   📊 Updated Settings:', JSON.stringify(data, null, 2));
        
        // Verify update
        if (data.timezone === 'America/Denver') {
          console.log('   ✅ Settings updated successfully');
          passedTests++;
        } else {
          console.log('   ❌ Settings not updated correctly');
          failedTests++;
        }
      } else {
        console.log(`   ❌ Status: ${response.status}`);
        console.log('   📝 Error:', data.message || JSON.stringify(data, null, 2));
        failedTests++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failedTests++;
    }
  } else {
    console.log('📋 Test 2: PUT /api/system-settings');
    console.log('   ⏭️  Skipped (GET test failed - migration may be needed)');
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`\n📊 Test Results: ${passedTests} passed, ${failedTests} failed`);

  if (failedTests > 0 && passedTests === 0) {
    console.log('\n💡 Next Steps:');
    console.log('   1. Run the migration manually via Supabase Dashboard SQL Editor');
    console.log('   2. See: docs/settings/SYSTEM_SETTINGS_MIGRATION_INSTRUCTIONS.md');
    console.log('   3. Then re-run this test script');
  }

  return failedTests === 0;
}

// Run tests
testSystemSettingsAPI()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });

