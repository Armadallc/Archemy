/**
 * Script to update a user's role
 * Usage: tsx server/scripts/update-user-role.ts <email|userId> <newRole>
 * Example: tsx server/scripts/update-user-role.ts angie.vereen@example.com super_admin
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateUserRole(identifier: string, newRole: string) {
  try {
    console.log(`🔍 Searching for user: ${identifier}\n`);

    // First, try to find the user by email or user_id
    const { data: users, error: searchError } = await supabase
      .from('users')
      .select('*')
      .or(`email.ilike.%${identifier}%,user_id.eq.${identifier},first_name.ilike.%${identifier}%,last_name.ilike.%${identifier}%`)
      .limit(10);

    if (searchError) {
      console.error('❌ Error searching for user:', searchError.message);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.error('❌ User not found');
      process.exit(1);
    }

    if (users.length > 1) {
      console.log('⚠️  Multiple users found:');
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.first_name || ''} ${user.last_name || ''} (${user.email}) - ${user.role}`);
      });
      console.log('\nPlease be more specific (use email or user_id)');
      process.exit(1);
    }

    const user = users[0];
    console.log(`✅ Found user:`);
    console.log(`   Name: ${user.first_name || ''} ${user.last_name || ''}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   User ID: ${user.user_id}\n`);

    // Validate role
    const validRoles = ['super_admin', 'corporate_admin', 'program_admin', 'program_user', 'driver'];
    if (!validRoles.includes(newRole)) {
      console.error(`❌ Invalid role: ${newRole}`);
      console.log(`   Valid roles: ${validRoles.join(', ')}`);
      process.exit(1);
    }

    // Prepare update data
    const updateData: any = {
      role: newRole,
      updated_at: new Date().toISOString(),
    };

    // If changing to super_admin, clear organization-specific fields
    if (newRole === 'super_admin') {
      updateData.primary_program_id = null;
      updateData.corporate_client_id = null;
      updateData.authorized_programs = null;
      console.log('   Clearing organization-specific fields (super_admin doesn\'t need them)');
    }

    // Update the user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', user.user_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating user:', updateError.message);
      process.exit(1);
    }

    console.log(`\n✅ Successfully updated user role to: ${newRole}`);
    console.log(`   Updated User ID: ${updatedUser.user_id}`);
    console.log(`   New Role: ${updatedUser.role}`);
    if (newRole === 'super_admin') {
      console.log(`   Primary Program ID: ${updatedUser.primary_program_id || 'null'}`);
      console.log(`   Corporate Client ID: ${updatedUser.corporate_client_id || 'null'}`);
    }
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: tsx server/scripts/update-user-role.ts <email|userId|name> <newRole>');
  console.log('Example: tsx server/scripts/update-user-role.ts angie.vereen@example.com super_admin');
  console.log('Example: tsx server/scripts/update-user-role.ts "Angie Vereen" super_admin');
  process.exit(1);
}

const identifier = args[0];
const newRole = args[1];

updateUserRole(identifier, newRole);














