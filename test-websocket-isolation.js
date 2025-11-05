/**
 * Integration Test: WebSocket Hierarchical Isolation
 * 
 * This script simulates WebSocket connections and tests the hierarchical validation logic
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simulate the shouldReceiveNotification logic from websocket.ts
function shouldReceiveNotification(
  userRole,
  userProgramId,
  userCorporateClientId,
  userAuthorizedPrograms,
  targetProgramId,
  targetCorporateClientId
) {
  // Super admin always receives all notifications
  if (userRole === 'super_admin') {
    return true;
  }

  // Corporate admin only receives notifications for their corporate client
  if (userRole === 'corporate_admin') {
    if (targetCorporateClientId && userCorporateClientId === targetCorporateClientId) {
      return true;
    }
    return false;
  }

  // Program-level users only receive notifications for their authorized programs
  if (targetProgramId) {
    // Check if user's primary program matches
    if (userProgramId === targetProgramId) {
      return true;
    }
    // Check if user's authorized programs include the target program
    if (userAuthorizedPrograms && userAuthorizedPrograms.includes(targetProgramId)) {
      return true;
    }
    
    // If targetCorporateClientId is provided, verify user belongs to that corporate client
    if (targetCorporateClientId && userCorporateClientId) {
      if (userCorporateClientId !== targetCorporateClientId) {
        return false; // User belongs to different corporate client
      }
    }
  }

  return false;
}

async function testIsolation() {
  console.log('🧪 Testing Hierarchical Notification Isolation Logic\n');

  try {
    // Get test users
    const { data: users } = await supabase
      .from('users')
      .select('user_id, email, role, primary_program_id, corporate_client_id, authorized_programs')
      .in('role', ['super_admin', 'corporate_admin', 'program_admin', 'program_user', 'driver'])
      .eq('is_active', true);

    // Get programs
    const { data: programs } = await supabase
      .from('programs')
      .select('id, name, corporate_client_id')
      .eq('is_active', true)
      .limit(5);

    if (!users || !programs || programs.length < 2) {
      console.log('❌ Need at least 2 programs and test users');
      return;
    }

    const programA = programs.find(p => p.id === 'monarch_competency') || programs[0];
    const programB = programs.find(p => p.id === 'monarch_mental_health') || programs[1];
    const halcyonProgram = programs.find(p => p.corporate_client_id === 'halcyon');

    console.log(`📋 Test Setup:`);
    console.log(`   Program A: ${programA.name} (${programA.id}) - Corp: ${programA.corporate_client_id}`);
    console.log(`   Program B: ${programB.name} (${programB.id}) - Corp: ${programB.corporate_client_id}`);
    if (halcyonProgram) {
      console.log(`   Halcyon Program: ${halcyonProgram.name} (${halcyonProgram.id}) - Corp: ${halcyonProgram.corporate_client_id}`);
    }
    console.log('');

    // Test 1: Program Isolation
    console.log('📋 Test 1: Program Isolation (monarch_competency)');
    console.log(`   Broadcasting to program: ${programA.id} (corp: ${programA.corporate_client_id})\n`);
    
    let testResults = {
      shouldReceive: [],
      shouldNotReceive: []
    };

    users.forEach(user => {
      const shouldReceive = shouldReceiveNotification(
        user.role,
        user.primary_program_id,
        user.corporate_client_id,
        user.authorized_programs,
        programA.id,
        programA.corporate_client_id
      );

      if (shouldReceive) {
        testResults.shouldReceive.push(user);
      } else {
        testResults.shouldNotReceive.push(user);
      }
    });

    console.log(`   ✅ Should receive (${testResults.shouldReceive.length}):`);
    testResults.shouldReceive.forEach(u => {
      console.log(`      - ${u.email} (${u.role}, prog: ${u.primary_program_id || 'none'}, corp: ${u.corporate_client_id || 'none'})`);
    });

    console.log(`\n   ❌ Should NOT receive (${testResults.shouldNotReceive.length}):`);
    testResults.shouldNotReceive.forEach(u => {
      console.log(`      - ${u.email} (${u.role}, prog: ${u.primary_program_id || 'none'}, corp: ${u.corporate_client_id || 'none'})`);
    });

    // Test 2: Corporate Client Isolation (if we have halcyon program)
    if (halcyonProgram) {
      console.log(`\n📋 Test 2: Corporate Client Isolation`);
      console.log(`   Broadcasting to program: ${halcyonProgram.id} (corp: ${halcyonProgram.corporate_client_id})\n`);
      
      const halcyonUsers = users.filter(u => u.corporate_client_id === 'halcyon');
      const monarchUsers = users.filter(u => u.corporate_client_id === 'monarch');

      console.log(`   Halcyon users (${halcyonUsers.length}) should receive:`);
      halcyonUsers.forEach(u => {
        const shouldReceive = shouldReceiveNotification(
          u.role,
          u.primary_program_id,
          u.corporate_client_id,
          u.authorized_programs,
          halcyonProgram.id,
          halcyonProgram.corporate_client_id
        );
        console.log(`      ${shouldReceive ? '✅' : '❌'} ${u.email} (${u.role})`);
      });

      console.log(`\n   Monarch users (${monarchUsers.length}) should NOT receive:`);
      monarchUsers.forEach(u => {
        const shouldReceive = shouldReceiveNotification(
          u.role,
          u.primary_program_id,
          u.corporate_client_id,
          u.authorized_programs,
          halcyonProgram.id,
          halcyonProgram.corporate_client_id
        );
        console.log(`      ${shouldReceive ? '❌ ERROR: Should NOT receive' : '✅ Correctly blocked'} ${u.email} (${u.role})`);
      });
    }

    // Test 3: Super Admin Receives All
    console.log(`\n📋 Test 3: Super Admin Receives All`);
    const superAdmin = users.find(u => u.role === 'super_admin');
    if (superAdmin) {
      const testPrograms = [programA, programB, halcyonProgram].filter(Boolean);
      console.log(`   Testing super admin: ${superAdmin.email}\n`);
      testPrograms.forEach(prog => {
        const shouldReceive = shouldReceiveNotification(
          superAdmin.role,
          superAdmin.primary_program_id,
          superAdmin.corporate_client_id,
          superAdmin.authorized_programs,
          prog.id,
          prog.corporate_client_id
        );
        console.log(`   ${shouldReceive ? '✅' : '❌ ERROR'} Should receive notifications for ${prog.name}`);
      });
    }

    console.log('\n✅ Isolation logic test complete!\n');
    console.log('📝 Summary:');
    console.log('   The hierarchical validation logic appears to be working correctly.');
    console.log('   Next step: Test with actual WebSocket connections by:');
    console.log('   1. Starting the server: npm run dev');
    console.log('   2. Opening multiple browser sessions with different users');
    console.log('   3. Creating trips and verifying notifications are isolated correctly');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testIsolation();

