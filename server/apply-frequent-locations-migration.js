import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyFrequentLocationsMigration() {
  try {
    console.log('🚀 Applying frequent_locations migration...\n');

    // Read the migration file
    const migrationPath = join(__dirname, '..', 'migrations', '0026_create_frequent_locations_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log('📊 Migration size:', migrationSQL.length, 'characters');

    // Apply the migration
    console.log('\n🔧 Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }

    console.log('✅ Migration applied successfully!');
    console.log('📊 Result:', data);

    // Verify the table was created
    console.log('\n🔍 Verifying table creation...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'frequent_locations');

    if (tableError) {
      console.error('❌ Error checking table:', tableError);
      return;
    }

    if (tables && tables.length > 0) {
      console.log('✅ frequent_locations table created successfully!');
    } else {
      console.log('❌ frequent_locations table not found');
    }

    // Check sample data
    console.log('\n🔍 Checking sample data...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('frequent_locations')
      .select('*')
      .limit(5);

    if (sampleError) {
      console.error('❌ Error checking sample data:', sampleError);
      return;
    }

    console.log(`✅ Found ${sampleData?.length || 0} sample records`);
    if (sampleData && sampleData.length > 0) {
      sampleData.forEach((location, index) => {
        console.log(`  ${index + 1}. ${location.name} (${location.location_type})`);
      });
    }

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  }
}

applyFrequentLocationsMigration();






