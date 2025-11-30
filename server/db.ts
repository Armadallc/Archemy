
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Debug: Log all environment variables (without sensitive values)
console.log('🔍 Environment check in db.ts:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? `Set (${process.env.SUPABASE_URL.substring(0, 30)}...)` : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set (hidden)' : 'Missing');
console.log('All env vars starting with SUPABASE:', Object.keys(process.env).filter(k => k.startsWith('SUPABASE')));

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'MISSING');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'MISSING');
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
  );
}

console.log("🔍 Connecting to Supabase:", process.env.SUPABASE_URL);

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test connection
supabase.from('users').select('count', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) {
      console.log("❌ Supabase connection failed:", error.message);
    } else {
      console.log("✅ Supabase connected, users count:", count);
    }
  });
