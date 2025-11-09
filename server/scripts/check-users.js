/**
 * Check what users exist in the database
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');

    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, email, role, primary_program_id')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.user_id}: ${user.email} (${user.role}) - program: ${user.primary_program_id}`);
    });

    // Check drivers table
    console.log('\n👤 Checking drivers table:');
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('id, user_id, is_active')
      .order('created_at', { ascending: false });
    
    if (driversError) {
      console.error('❌ Error fetching drivers:', driversError);
      return;
    }
    
    console.log(`Found ${drivers.length} drivers:`);
    drivers.forEach(driver => {
      console.log(`  - ${driver.id}: user_id=${driver.user_id}, active=${driver.is_active}`);
    });

    // Check auth.users (Supabase Auth)
    console.log('\n🔐 Checking Supabase Auth users:');
    const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error('❌ Error fetching auth users:', authUsersError);
      return;
    }
    
    console.log(`Found ${authUsers.users.length} auth users:`);
    authUsers.users.forEach(user => {
      console.log(`  - ${user.id}: ${user.email} (created: ${user.created_at})`);
    });

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkUsers();





