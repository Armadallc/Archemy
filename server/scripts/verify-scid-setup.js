/**
 * Verification script to check SCID setup
 * Run this to diagnose why SCID generation might not be working
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySCIDSetup() {
  console.log('🔍 Verifying SCID Setup...\n');

  // 1. Check if RPC wrapper function exists
  console.log('1️⃣ Checking if RPC wrapper function exists...');
  try {
    const { data, error } = await supabase.rpc('generate_client_scid_rpc', {
      p_program_code: 'TEST'
    });
    
    if (error) {
      if (error.code === '42883' || error.message?.includes('does not exist')) {
        console.error('❌ RPC function generate_client_scid_rpc does not exist!');
        console.error('   → Run migration 004_create_scid_rpc_wrapper.sql');
      } else {
        console.log('⚠️  RPC function exists but returned error:', error.message);
        console.log('   (This is expected for test call with invalid program code)');
      }
    } else {
      console.log('✅ RPC function exists and is callable');
    }
  } catch (err) {
    console.error('❌ Error checking RPC function:', err.message);
  }

  // 2. Check if programs have codes
  console.log('\n2️⃣ Checking if programs have codes...');
  const { data: programs, error: programsError } = await supabase
    .from('programs')
    .select('id, name, code')
    .limit(10);

  if (programsError) {
    console.error('❌ Error fetching programs:', programsError);
  } else {
    console.log(`   Found ${programs?.length || 0} programs`);
    const programsWithoutCode = programs?.filter(p => !p.code) || [];
    if (programsWithoutCode.length > 0) {
      console.error(`❌ ${programsWithoutCode.length} programs missing codes:`);
      programsWithoutCode.forEach(p => {
        console.error(`   - ${p.name} (${p.id})`);
      });
      console.error('   → Run migration 002_backfill_display_ids.sql to populate codes');
    } else {
      console.log('✅ All programs have codes');
      programs?.forEach(p => {
        console.log(`   - ${p.name}: ${p.code || 'MISSING'}`);
      });
    }
  }

  // 3. Check specific program (monarch_competency)
  console.log('\n3️⃣ Checking monarch_competency program...');
  const { data: monarchProgram, error: monarchError } = await supabase
    .from('programs')
    .select('id, name, code')
    .eq('id', 'monarch_competency')
    .single();

  if (monarchError) {
    console.error('❌ Error fetching monarch_competency:', monarchError);
  } else if (monarchProgram) {
    console.log(`   Program: ${monarchProgram.name}`);
    console.log(`   Code: ${monarchProgram.code || 'MISSING'}`);
    if (!monarchProgram.code) {
      console.error('   ❌ This program needs a code!');
    } else {
      console.log('   ✅ Program has code');
    }
  } else {
    console.error('   ❌ Program not found');
  }

  // 4. Check recent clients without SCID
  console.log('\n4️⃣ Checking recent clients without SCID...');
  const { data: clientsWithoutSCID, error: clientsError } = await supabase
    .from('clients')
    .select('id, first_name, last_name, program_id, scid')
    .is('scid', null)
    .order('created_at', { ascending: false })
    .limit(5);

  if (clientsError) {
    console.error('❌ Error fetching clients:', clientsError);
  } else {
    const count = clientsWithoutSCID?.length || 0;
    if (count > 0) {
      console.log(`⚠️  Found ${count} clients without SCID:`);
      clientsWithoutSCID?.forEach(c => {
        console.log(`   - ${c.first_name} ${c.last_name} (${c.id}) - Program: ${c.program_id}`);
      });
      console.log('   → Run migration 002_backfill_display_ids.sql to generate SCIDs');
    } else {
      console.log('✅ All recent clients have SCIDs');
    }
  }

  // 5. Test SCID generation for monarch_competency
  console.log('\n5️⃣ Testing SCID generation...');
  if (monarchProgram?.code) {
    try {
      const { data: testSCID, error: testError } = await supabase.rpc('generate_client_scid_rpc', {
        p_program_code: monarchProgram.code
      });
      
      if (testError) {
        console.error('❌ SCID generation test failed:', testError);
        console.error('   Error code:', testError.code);
        console.error('   Error message:', testError.message);
      } else {
        console.log(`✅ SCID generation test successful: ${testSCID}`);
      }
    } catch (err) {
      console.error('❌ Exception during SCID generation test:', err.message);
    }
  } else {
    console.log('⚠️  Skipping test - program code missing');
  }

  console.log('\n✅ Verification complete!');
}

verifySCIDSetup().catch(console.error);




