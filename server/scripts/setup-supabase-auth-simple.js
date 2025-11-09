import { createClient } from '@supabase/supabase-js';
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

    // 2. Test the authentication
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
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run this SQL command:');
    console.log('   ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);');
    console.log('4. Update the admin user with the auth ID:');
    console.log(`   UPDATE users SET auth_user_id = '${testAuth.user?.id}' WHERE email = 'admin@monarch.com';`);

  } catch (error) {
    console.error('❌ Setup error:', error);
  }
}

setupSupabaseAuth();


