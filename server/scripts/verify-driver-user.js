/**
 * Verify driver user exists and auth_user_id matches
 */
import pkg from '@supabase/supabase-js';
const { createClient } = pkg;
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function verifyDriverUser() {
  try {
    console.log('🔍 Verifying driver@monarch.com user...\n');

    const email = 'driver@monarch.com';
    const password = 'driver123';

    // 1. Check if user exists in Supabase Auth
    console.log('1️⃣ Checking Supabase Auth...');
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('❌ Supabase Auth error:', authError.message);
      return;
    }

    if (!authData.user) {
      console.error('❌ No user returned from Supabase Auth');
      return;
    }

    console.log('✅ Supabase Auth successful');
    console.log('   Auth User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);

    // 2. Check if user exists in users table
    console.log('\n2️⃣ Checking users table...');
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (dbError) {
      console.error('❌ Database query error:', dbError.message);
      return;
    }

    if (!dbUser) {
      console.error('❌ User not found in users table');
      return;
    }

    console.log('✅ User found in users table');
    console.log('   User ID:', dbUser.user_id);
    console.log('   Auth User ID in DB:', dbUser.auth_user_id);
    console.log('   Role:', dbUser.role);
    console.log('   Is Active:', dbUser.is_active);

    // 3. Verify auth_user_id matches
    console.log('\n3️⃣ Verifying auth_user_id match...');
    if (dbUser.auth_user_id === authData.user.id) {
      console.log('✅ auth_user_id matches!');
    } else {
      console.error('❌ auth_user_id MISMATCH!');
      console.error('   Auth User ID from Supabase:', authData.user.id);
      console.error('   Auth User ID in database:', dbUser.auth_user_id);
      console.error('\n🔧 Fix: Update users table with correct auth_user_id');
      console.error(`   UPDATE users SET auth_user_id = '${authData.user.id}' WHERE email = '${email}';`);
    }

    // 4. Test the login endpoint
    console.log('\n4️⃣ Testing login endpoint...');
    const response = await fetch('http://localhost:8081/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const responseData = await response.json();
    console.log('   Status:', response.status);
    console.log('   Response:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('✅ Login endpoint working!');
    } else {
      console.error('❌ Login endpoint failed');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyDriverUser().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});

