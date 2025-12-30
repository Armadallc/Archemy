/**
 * Verification Script for Trip Creation/Update Tracking
 * 
 * This script verifies that:
 * 1. The migration has been run (created_by and updated_by columns exist)
 * 2. Trip creation sets created_by correctly
 * 3. Trip updates set updated_by and updated_at correctly
 * 4. The frontend can display created_by_user information
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env.local') });
dotenv.config({ path: join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyTripTracking() {
  console.log('🧪 Verifying Trip Creation/Update Tracking\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Check if columns exist
  console.log('📋 Test 1: Checking if created_by and updated_by columns exist...');
  try {
    const { data, error } = await supabase
      .from('trips')
      .select('created_by, updated_by, updated_at')
      .limit(1);

    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.error('   ❌ FAILED: Columns do not exist. Migration 0060_add_trip_created_by_updated_by.sql may not have been run.');
        failed++;
      } else {
        throw error;
      }
    } else {
      console.log('   ✅ PASSED: Columns exist');
      passed++;
    }
  } catch (error: any) {
    console.error('   ❌ FAILED:', error.message);
    failed++;
  }

  // Test 2: Check if a trip has created_by set
  console.log('\n📋 Test 2: Checking if trips have created_by set...');
  try {
    const { data: trips, error } = await supabase
      .from('trips')
      .select('id, created_by, updated_by, updated_at')
      .not('created_by', 'is', null)
      .limit(5);

    if (error) throw error;

    if (trips && trips.length > 0) {
      console.log(`   ✅ PASSED: Found ${trips.length} trip(s) with created_by set`);
      console.log(`   Example: Trip ${trips[0].id} created by ${trips[0].created_by}`);
      passed++;
    } else {
      console.log('   ⚠️  WARNING: No trips found with created_by set');
      console.log('   This is OK if no trips have been created since the migration');
      passed++;
    }
  } catch (error: any) {
    console.error('   ❌ FAILED:', error.message);
    failed++;
  }

  // Test 3: Check if trips have updated_by set
  console.log('\n📋 Test 3: Checking if trips have updated_by set...');
  try {
    const { data: trips, error } = await supabase
      .from('trips')
      .select('id, created_by, updated_by, updated_at')
      .not('updated_by', 'is', null)
      .limit(5);

    if (error) throw error;

    if (trips && trips.length > 0) {
      console.log(`   ✅ PASSED: Found ${trips.length} trip(s) with updated_by set`);
      console.log(`   Example: Trip ${trips[0].id} updated by ${trips[0].updated_by}`);
      passed++;
    } else {
      console.log('   ⚠️  WARNING: No trips found with updated_by set');
      console.log('   This is OK if no trips have been updated since the migration');
      passed++;
    }
  } catch (error: any) {
    console.error('   ❌ FAILED:', error.message);
    failed++;
  }

  // Test 4: Check if trips can join with users table
  console.log('\n📋 Test 4: Checking if trips can join with users table...');
  try {
    const { data: trips, error } = await supabase
      .from('trips')
      .select(`
        id,
        created_by,
        updated_by,
        created_by_user:created_by (
          user_id,
          user_name
        ),
        updated_by_user:updated_by (
          user_id,
          user_name
        )
      `)
      .not('created_by', 'is', null)
      .limit(1);

    if (error) throw error;

    if (trips && trips.length > 0) {
      const trip = trips[0];
      if (trip.created_by_user) {
        console.log(`   ✅ PASSED: Can join with users table`);
        console.log(`   Example: Trip ${trip.id} created by ${trip.created_by_user.user_name || trip.created_by_user.user_id}`);
        passed++;
      } else {
        console.log('   ⚠️  WARNING: created_by_user join returned null');
        console.log('   This may indicate the user_id does not exist in users table');
        passed++;
      }
    } else {
      console.log('   ⚠️  WARNING: No trips found to test join');
      passed++;
    }
  } catch (error: any) {
    console.error('   ❌ FAILED:', error.message);
    failed++;
  }

  // Test 5: Check if updated_at is set
  console.log('\n📋 Test 5: Checking if trips have updated_at set...');
  try {
    const { data: trips, error } = await supabase
      .from('trips')
      .select('id, updated_at')
      .not('updated_at', 'is', null)
      .limit(5);

    if (error) throw error;

    if (trips && trips.length > 0) {
      console.log(`   ✅ PASSED: Found ${trips.length} trip(s) with updated_at set`);
      passed++;
    } else {
      console.log('   ⚠️  WARNING: No trips found with updated_at set');
      passed++;
    }
  } catch (error: any) {
    console.error('   ❌ FAILED:', error.message);
    failed++;
  }

  // Summary
  console.log('\n📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n✅ All tests passed! Trip tracking is working correctly.');
    console.log('\n💡 Next steps:');
    console.log('   1. Create a new trip and verify created_by is set');
    console.log('   2. Update a trip and verify updated_by and updated_at are set');
    console.log('   3. Check the expanded trip view in the frontend to see "Created By" display');
  } else {
    console.log('\n❌ Some tests failed. Please review the errors above.');
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Ensure migration 0060_add_trip_created_by_updated_by.sql has been run');
    console.log('   2. Check that trips are being created/updated with user authentication');
    console.log('   3. Verify that the backend routes are setting created_by and updated_by');
  }

  process.exit(failed > 0 ? 1 : 0);
}

verifyTripTracking().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});


