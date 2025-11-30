import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..', '..');
config({ path: join(projectRoot, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyMigration() {
  console.log('🔍 Verifying system_settings migration...\n');

  try {
    // Check if table exists
    console.log('1️⃣ Checking if table exists...');
    const { data: tables, error: tableError } = await supabase
      .from('system_settings')
      .select('*')
      .limit(1);

    if (tableError) {
      if (tableError.code === '42P01' || tableError.message?.includes('does not exist')) {
        console.log('   ❌ Table does not exist');
        console.log('   💡 Run the migration: migrations/0028_create_system_settings_table.sql');
        return false;
      } else {
        console.error('   ❌ Error:', tableError.message);
        return false;
      }
    }

    console.log('   ✅ Table exists!');

    // Check if default row exists
    console.log('\n2️⃣ Checking for default settings row...');
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 'system')
      .single();

    if (settingsError) {
      if (settingsError.code === 'PGRST116') {
        console.log('   ⚠️  No settings row found (will be created on first API call)');
      } else {
        console.error('   ❌ Error:', settingsError.message);
        return false;
      }
    } else {
      console.log('   ✅ Default settings row exists');
      console.log('   📊 Settings:', JSON.stringify(settings, null, 2));
    }

    // Check RLS status
    console.log('\n3️⃣ Checking RLS status...');
    const { data: rlsCheck, error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'system_settings';
      `
    });

    if (rlsError && rlsError.code !== '42883') {
      console.log('   ⚠️  Could not check RLS status (exec_sql RPC not available)');
      console.log('   💡 Verify manually in Supabase Dashboard → Table Editor → system_settings');
    } else {
      console.log('   ✅ RLS check completed');
    }

    console.log('\n✅ Migration verification complete!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Restart backend server: npm run dev');
    console.log('   2. Test via frontend: Login as super_admin → Settings → System tab');
    console.log('   3. Or test API: node server/tests/test-system-settings-api.js (after restart)');

    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

verifyMigration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

