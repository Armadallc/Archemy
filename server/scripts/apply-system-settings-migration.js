import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from project root
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

async function applySystemSettingsMigration() {
  try {
    console.log('🚀 Applying system_settings migration...\n');

    // Read the migration file
    const migrationPath = join(__dirname, '..', '..', 'migrations', '0028_create_system_settings_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log('📊 Migration size:', migrationSQL.length, 'characters');

    // Split into statements (Supabase RPC might not handle transactions well)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('BEGIN') && !stmt.startsWith('COMMIT'));

    console.log(`\n🔧 Executing ${statements.length} SQL statements...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        console.log(`   ${statement.substring(0, 80)}...`);
        
        try {
          // Use direct query execution via Supabase REST API
          const { data, error } = await supabase.rpc('exec_sql', {
            sql: statement + ';'
          });

          if (error) {
            // If exec_sql doesn't exist, try direct table operations
            if (error.message?.includes('exec_sql') || error.code === '42883') {
              console.log('   ⚠️  exec_sql RPC not available, trying alternative method...');
              
              // For CREATE TABLE, we can verify it exists instead
              if (statement.toUpperCase().includes('CREATE TABLE')) {
                console.log('   ℹ️  Table creation will be verified after migration');
                continue;
              }
              
              // For INSERT, try direct insert
              if (statement.toUpperCase().includes('INSERT INTO')) {
                // Skip - will be handled by application logic
                console.log('   ℹ️  Insert will be handled by application');
                continue;
              }
            } else {
              console.error(`   ❌ Error: ${error.message}`);
              // Continue with other statements
            }
          } else {
            console.log(`   ✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`   ❌ Exception: ${err.message}`);
        }
      }
    }

    // Verify the table was created
    console.log('\n🔍 Verifying table creation...');
    const { data: tables, error: tableError } = await supabase
      .from('system_settings')
      .select('*')
      .limit(1);

    if (tableError) {
      if (tableError.code === '42P01') {
        console.error('❌ Table does not exist. Please run the migration manually via Supabase SQL Editor.');
        console.log('\n📋 Manual Migration Steps:');
        console.log('1. Go to Supabase Dashboard > SQL Editor');
        console.log('2. Copy contents of: migrations/0028_create_system_settings_table.sql');
        console.log('3. Paste and run in SQL Editor');
        return;
      } else {
        console.error('❌ Error checking table:', tableError);
        return;
      }
    }

    console.log('✅ Table exists!');

    // Check if default row exists
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 'system')
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('❌ Error checking settings:', settingsError);
      return;
    }

    if (settings) {
      console.log('✅ Default settings row exists');
      console.log('📊 Current settings:', JSON.stringify(settings, null, 2));
    } else {
      console.log('⚠️  Default settings row not found (will be created on first API call)');
    }

    console.log('\n🎉 Migration verification complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applySystemSettingsMigration();

