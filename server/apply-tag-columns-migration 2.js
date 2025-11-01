import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🚀 Applying frequent_locations tag columns migration...');

  try {
    // Read the SQL migration file
    const migrationPath = path.join(process.cwd(), '..', 'add-frequent-locations-tag-columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    console.log('📊 Migration size:', migrationSQL.length, 'characters');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log('🔧 Executing migration...');
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`📝 Executing: ${statement.substring(0, 50)}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error('❌ Migration failed:', error);
          return;
        }
      }
    }

    console.log('✅ Migration completed successfully!');

    // Verify the changes
    console.log('🔍 Verifying migration results...');
    
    const { data: columns, error: verifyError } = await supabase
      .from('frequent_locations')
      .select('*')
      .limit(1);
    
    if (verifyError) {
      console.error('❌ Error verifying results:', verifyError);
      return;
    }

    console.log('📊 Migration verification:');
    console.log('✅ New columns added successfully');
    console.log('✅ Sample record structure:', Object.keys(columns[0] || {}));

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

applyMigration();









