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

async function getAuthUserId() {
  try {
    console.log('🔍 Getting auth user ID for admin@monarch.com...');

    // Test authentication to get the user ID
    const { data: testAuth, error: testError } = await supabase.auth.signInWithPassword({
      email: 'admin@monarch.com',
      password: 'admin123'
    });

    if (testError) {
      console.error('❌ Authentication failed:', testError);
      return;
    }

    console.log('✅ Authentication successful!');
    console.log('📋 User ID:', testAuth.user?.id);
    console.log('');
    console.log('🔧 MANUAL SETUP REQUIRED:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run these SQL commands:');
    console.log('');
    console.log('-- Add auth_user_id column to users table');
    console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);');
    console.log('');
    console.log('-- Update the admin user with the auth ID');
    console.log(`UPDATE users SET auth_user_id = '${testAuth.user?.id}' WHERE email = 'admin@monarch.com';`);
    console.log('');
    console.log('4. After running the SQL, test the frontend login!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

getAuthUserId();


