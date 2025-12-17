/**
 * Delete a user completely from database and Supabase Auth
 * 
 * Usage: node server/scripts/delete-user.js <email>
 * Example: node server/scripts/delete-user.js mike@monarch.com
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteUser(email) {
  try {
    console.log(`\n🔧 Deleting user: ${email}\n`);

    // Find user in database
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('user_id, email, auth_user_id')
      .eq('email', email)
      .single();

    if (dbError || !dbUser) {
      console.error('❌ User not found in database:', email);
      process.exit(1);
    }

    console.log('✅ Found database user:', dbUser.user_id);

    // Delete from Supabase Auth if auth_user_id exists
    if (dbUser.auth_user_id) {
      console.log('🔄 Deleting from Supabase Auth...');
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
        dbUser.auth_user_id
      );

      if (authDeleteError) {
        console.error('❌ Error deleting from Supabase Auth:', authDeleteError.message);
        // Continue with database deletion even if Auth deletion fails
      } else {
        console.log('✅ Deleted from Supabase Auth');
      }
    } else {
      console.log('⚠️  No auth_user_id found, skipping Supabase Auth deletion');
    }

    // Delete from database
    console.log('🔄 Deleting from database...');
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('user_id', dbUser.user_id);

    if (deleteError) {
      console.error('❌ Error deleting from database:', deleteError.message);
      process.exit(1);
    }

    console.log('✅ Deleted from database');
    console.log('\n🎉 User deleted successfully!\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('\n📝 Usage: node server/scripts/delete-user.js <email>');
  console.log('   Example: node server/scripts/delete-user.js mike@monarch.com\n');
  process.exit(1);
}

const email = args[0];
deleteUser(email);













