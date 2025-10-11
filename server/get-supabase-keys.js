import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Required environment variables for the new hierarchical system
const REQUIRED_ENV_VARS = {
  // Backend (server)
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SESSION_SECRET: process.env.SESSION_SECRET,
  
  // Frontend (client)
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
};

// Expected project ID from the URL
const EXPECTED_PROJECT_ID = 'iuawurdssgbkbavyyvbs';

async function validateSupabaseKeys() {
  console.log('🔍 Validating Supabase configuration for HALCYON hierarchical system...\n');
  
  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found! Please create one with the required variables.');
    return false;
  }
  
  console.log('✅ .env file found');
  
  // Validate all required environment variables
  let allValid = true;
  console.log('\n📋 Environment Variables Status:');
  console.log('================================');
  
  for (const [key, value] of Object.entries(REQUIRED_ENV_VARS)) {
    if (!value) {
      console.log(`❌ ${key}: Missing`);
      allValid = false;
    } else if (key.includes('KEY') && value.length < 50) {
      console.log(`⚠️  ${key}: Too short (likely placeholder)`);
      allValid = false;
    } else {
      const displayValue = key.includes('KEY') ? `${value.substring(0, 20)}...` : value;
      console.log(`✅ ${key}: ${displayValue}`);
    }
  }
  
  if (!allValid) {
    console.log('\n❌ Some environment variables are missing or invalid!');
    return false;
  }
  
  // Validate project ID matches URL
  const urlProjectId = REQUIRED_ENV_VARS.SUPABASE_URL?.split('//')[1]?.split('.')[0];
  if (urlProjectId !== EXPECTED_PROJECT_ID) {
    console.log(`\n⚠️  Project ID mismatch! Expected: ${EXPECTED_PROJECT_ID}, Found: ${urlProjectId}`);
  } else {
    console.log(`\n✅ Project ID matches expected: ${EXPECTED_PROJECT_ID}`);
  }
  
  // Test database connection
  console.log('\n🔗 Testing database connection...');
  try {
    const supabase = createClient(REQUIRED_ENV_VARS.SUPABASE_URL, REQUIRED_ENV_VARS.SUPABASE_SERVICE_ROLE_KEY);
    
    // Test with a simple query
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log(`✅ Database connection successful! Users count: ${data || 0}`);
    
  } catch (error) {
    console.log('❌ Database connection error:', error.message);
    return false;
  }
  
  // Check if anon key is a placeholder
  const anonKey = REQUIRED_ENV_VARS.VITE_SUPABASE_ANON_KEY;
  if (anonKey && (anonKey.includes('your_') || anonKey.includes('placeholder') || anonKey.length < 50)) {
    console.log('\n⚠️  WARNING: Anon key appears to be a placeholder!');
    console.log('🔧 TO GET THE CORRECT ANON KEY:');
    console.log('1. Go to: https://supabase.com/dashboard/project/iuawurdssgbkbavyyvbs/settings/api');
    console.log('2. Copy the "anon public" key');
    console.log('3. Update your .env file with:');
    console.log('   VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here');
    console.log('4. Restart your development servers');
    return false;
  }
  
  console.log('\n🎉 All Supabase configuration is valid!');
  console.log('✅ Ready for HALCYON hierarchical system');
  return true;
}

// Run validation
validateSupabaseKeys().then(success => {
  if (!success) {
    console.log('\n💡 Next steps:');
    console.log('1. Fix the missing/invalid environment variables');
    console.log('2. Run this script again to verify');
    console.log('3. Start your development servers');
    process.exit(1);
  }
});


