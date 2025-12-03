/**
 * Create Supabase Auth user and link to existing database user
 * 
 * Usage: node server/scripts/create-user-auth.js <email> <password>
 * Example: node server/scripts/create-user-auth.js greg@monarch.com greg123
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAuthUser(email, password) {
  try {
    console.log(`\n🔧 Creating Supabase Auth user for: ${email}\n`);

    // Check if user exists in database
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (dbError || !dbUser) {
      console.error('❌ User not found in database:', email);
      console.log('   Create the user in the app first, then run this script.');
      process.exit(1);
    }

    console.log('✅ Found database user:', dbUser.user_name);

    // Check if auth user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingAuthUser = existingUsers?.users?.find(u => u.email === email);

    let authUserId;

    if (existingAuthUser) {
      console.log('⚠️  Auth user already exists, using existing ID');
      authUserId = existingAuthUser.id;
    } else {
      // Create Supabase Auth user
      const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          user_name: dbUser.user_name,
          role: dbUser.role
        }
      });

      if (authError) {
        console.error('❌ Error creating auth user:', authError.message);
        process.exit(1);
      }

      authUserId = newAuthUser.user.id;
      console.log('✅ Created Supabase Auth user');
    }

    console.log('   Auth User ID:', authUserId);

    // Link auth user to database user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        auth_user_id: authUserId,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error linking auth user:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Linked auth user to database record');
    console.log('\n🎉 SUCCESS! User can now log in with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Auth ID: ${authUserId}\n`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('\n📝 Usage: node server/scripts/create-user-auth.js <email> <password>');
  console.log('   Example: node server/scripts/create-user-auth.js greg@monarch.com greg123\n');
  process.exit(1);
}

const [email, password] = args;
createAuthUser(email, password);

