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

async function checkSupabaseSettings() {
  try {
    console.log('🔍 Checking Supabase authentication settings...');

    // Test authentication to see current behavior
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
    console.log('📋 Access Token:', testAuth.session?.access_token?.substring(0, 20) + '...');
    console.log('📋 Token Type:', testAuth.session?.token_type);
    console.log('📋 Expires At:', new Date(testAuth.session?.expires_at * 1000).toLocaleString());
    
    // Check if the token is valid
    const { data: { user }, error: userError } = await supabase.auth.getUser(testAuth.session?.access_token);
    
    if (userError) {
      console.error('❌ Token validation failed:', userError);
    } else {
      console.log('✅ Token validation successful:', user.email);
    }

    console.log('');
    console.log('🔧 SUPABASE DASHBOARD SETTINGS TO CHECK:');
    console.log('1. Go to: https://supabase.com/dashboard/project/iuawurdssgbkbavyyvbs/auth/settings');
    console.log('2. Verify these settings:');
    console.log('   - Email OTP Expiry: 3600 seconds (1 hour)');
    console.log('   - JWT Expiry: 86400 seconds (24 hours)');
    console.log('   - Email Confirmation: DISABLED (for development)');
    console.log('   - Password Reset: ENABLED');
    console.log('');
    console.log('3. Site URL should be: http://localhost:5173');
    console.log('4. Redirect URLs should include: http://localhost:5173/**');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSupabaseSettings();


