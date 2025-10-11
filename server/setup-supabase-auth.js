import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupSupabaseAuth() {
  try {
    console.log('🔧 Setting up Supabase authentication...');

    // 1. Create the super admin user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@monarch.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        role: 'super_admin',
        name: 'Super Admin'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('✅ Super admin user already exists in Supabase Auth');
      } else {
        console.error('❌ Error creating auth user:', authError);
        return;
      }
    } else {
      console.log('✅ Super admin user created in Supabase Auth:', authUser.user?.id);
    }

    // 2. Get the auth user ID
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail('admin@monarch.com');
    const authUserId = existingUser?.user?.id;

    if (!authUserId) {
      console.error('❌ Could not find auth user ID');
      return;
    }

    // 3. Update the database user to link with Supabase auth
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        auth_user_id: authUserId,
        is_active: true 
      })
      .eq('email', 'admin@monarch.com');

    if (updateError) {
      console.error('❌ Error updating database user:', updateError);
      return;
    }

    console.log('✅ Database user linked to Supabase auth');

    // 4. Test the authentication
    const { data: testAuth, error: testError } = await supabase.auth.signInWithPassword({
      email: 'admin@monarch.com',
      password: 'admin123'
    });

    if (testError) {
      console.error('❌ Test authentication failed:', testError);
      return;
    }

    console.log('✅ Test authentication successful:', testAuth.user?.email);
    console.log('🎉 Supabase authentication setup complete!');

  } catch (error) {
    console.error('❌ Setup error:', error);
  }
}

setupSupabaseAuth();


