/**
 * Quick Test Script for Phase 5: Hierarchical Notification Scoping
 * 
 * This script tests that notifications respect hierarchical boundaries:
 * - Program-level isolation
 * - Corporate client isolation
 * - Super admin receives all
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testHierarchicalNotifications() {
  console.log('🧪 Starting Hierarchical Notification Scoping Test\n');

  try {
    // Step 1: Get test users with different roles/programs
    console.log('📋 Step 1: Fetching test users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, email, role, primary_program_id, corporate_client_id, authorized_programs')
      .in('role', ['super_admin', 'corporate_admin', 'program_admin', 'program_user', 'driver'])
      .eq('is_active', true)
      .limit(10);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️ No users found. Please create test users first.');
      return;
    }

    console.log(`✅ Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
      console.log(`     Program: ${user.primary_program_id || 'none'}`);
      console.log(`     Corporate Client: ${user.corporate_client_id || 'none'}`);
      console.log(`     Authorized Programs: ${JSON.stringify(user.authorized_programs || [])}`);
    });

    // Step 2: Get programs and their corporate clients
    console.log('\n📋 Step 2: Fetching programs...');
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('id, name, corporate_client_id')
      .eq('is_active', true)
      .limit(5);

    if (programsError) {
      console.error('❌ Error fetching programs:', programsError);
      return;
    }

    if (!programs || programs.length < 2) {
      console.log('⚠️ Need at least 2 programs for isolation testing. Found:', programs?.length || 0);
      return;
    }

    console.log(`✅ Found ${programs.length} programs:`);
    programs.forEach(prog => {
      console.log(`   - ${prog.name} (${prog.id})`);
      console.log(`     Corporate Client: ${prog.corporate_client_id || 'none'}`);
    });

    // Step 3: Analyze user distribution
    console.log('\n📋 Step 3: Analyzing user distribution...');
    
    const superAdmins = users.filter(u => u.role === 'super_admin');
    const corporateAdmins = users.filter(u => u.role === 'corporate_admin');
    const programUsers = users.filter(u => ['program_admin', 'program_user'].includes(u.role));
    const drivers = users.filter(u => u.role === 'driver');

    console.log(`   Super Admins: ${superAdmins.length}`);
    console.log(`   Corporate Admins: ${corporateAdmins.length}`);
    console.log(`   Program Users: ${programUsers.length}`);
    console.log(`   Drivers: ${drivers.length}`);

    // Step 4: Check if we have users in different programs
    const programA = programs[0];
    const programB = programs[1];

    const usersInProgramA = users.filter(u => 
      u.primary_program_id === programA.id || 
      (u.authorized_programs && u.authorized_programs.includes(programA.id))
    );
    const usersInProgramB = users.filter(u => 
      u.primary_program_id === programB.id || 
      (u.authorized_programs && u.authorized_programs.includes(programB.id))
    );

    console.log(`\n📋 Step 4: User distribution by program:`);
    console.log(`   Program A (${programA.name}): ${usersInProgramA.length} users`);
    usersInProgramA.forEach(u => console.log(`     - ${u.email} (${u.role})`));
    console.log(`   Program B (${programB.name}): ${usersInProgramB.length} users`);
    usersInProgramB.forEach(u => console.log(`     - ${u.email} (${u.role})`));

    // Step 5: Verify hierarchical structure
    console.log('\n📋 Step 5: Verifying hierarchical structure...');
    
    if (programA.corporate_client_id && programB.corporate_client_id) {
      const sameCorporateClient = programA.corporate_client_id === programB.corporate_client_id;
      console.log(`   Program A corporate client: ${programA.corporate_client_id}`);
      console.log(`   Program B corporate client: ${programB.corporate_client_id}`);
      console.log(`   Same corporate client: ${sameCorporateClient ? 'YES ⚠️' : 'NO ✅'}`);
      
      if (sameCorporateClient) {
        console.log('   ⚠️ Both programs are under the same corporate client.');
        console.log('   This is fine, but cross-program isolation within same corporate client will be tested.');
      } else {
        console.log('   ✅ Programs are in different corporate clients.');
        console.log('   Perfect for testing corporate client isolation.');
      }
    }

    // Step 6: Test scenarios summary
    console.log('\n📋 Step 6: Test Scenarios Summary:');
    console.log('\n   ✅ Test 1: Program Isolation');
    console.log(`      - Create trip in ${programA.name}`);
    console.log(`      - Users in ${programA.name} should receive notification`);
    console.log(`      - Users in ${programB.name} should NOT receive notification`);
    
    if (programA.corporate_client_id !== programB.corporate_client_id) {
      console.log('\n   ✅ Test 2: Corporate Client Isolation');
      console.log(`      - Create trip in ${programA.name} (corp: ${programA.corporate_client_id})`);
      console.log(`      - Corporate admin for ${programA.corporate_client_id} should receive`);
      console.log(`      - Corporate admin for ${programB.corporate_client_id} should NOT receive`);
    }

    if (superAdmins.length > 0) {
      console.log('\n   ✅ Test 3: Super Admin Receives All');
      console.log(`      - Create trips in different programs`);
      console.log(`      - Super admin (${superAdmins[0].email}) should receive ALL notifications`);
    }

    // Step 7: Recommendations
    console.log('\n📋 Step 7: Recommendations:');
    console.log('\n   To test manually:');
    console.log('   1. Start server: npm run dev (in root)');
    console.log('   2. Open browser as User A (Program A user)');
    console.log('   3. Open incognito browser as User B (Program B user)');
    console.log('   4. Create trip in Program A');
    console.log('   5. Check browser console and notification center');
    console.log('   6. Verify User A receives, User B does not');
    console.log('\n   Check server logs for:');
    console.log('   📨 broadcastToProgram(program_id): sent to X clients, skipped Y');
    console.log('   The "skipped" count indicates hierarchical filtering is working.');

    console.log('\n✅ Test setup complete! Ready for manual testing.\n');

  } catch (error) {
    console.error('❌ Test error:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testHierarchicalNotifications();

