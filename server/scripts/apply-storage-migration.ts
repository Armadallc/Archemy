/**
 * SUPABASE STORAGE MIGRATION SCRIPT
 * This script applies the storage system migration to Supabase
 */

import { supabase } from './minimal-supabase';
import fs from 'fs';
import path from 'path';

async function applyStorageMigration() {
  console.log('🚀 Starting Supabase Storage Migration...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), '..', 'migrations', '0023_create_supabase_storage_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            console.log('Statement:', statement.substring(0, 100) + '...');
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err);
          console.log('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }
    
    console.log('🎉 Migration completed!');
    
    // Verify the migration
    await verifyMigration();
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying migration...');
  
  try {
    // Check if buckets exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error checking buckets:', bucketsError);
      return;
    }
    
    const bucketNames = buckets?.map(b => b.name) || [];
    console.log('📦 Available buckets:', bucketNames);
    
    if (bucketNames.includes('documents') && bucketNames.includes('photos')) {
      console.log('✅ Storage buckets created successfully');
    } else {
      console.log('⚠️  Storage buckets may not be created properly');
    }
    
    // Check if file_metadata table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'file_metadata');
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
    } else if (tables && tables.length > 0) {
      console.log('✅ file_metadata table created successfully');
    } else {
      console.log('⚠️  file_metadata table may not be created properly');
    }
    
    // Check if file_access_audit table exists
    const { data: auditTables, error: auditError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'file_access_audit');
    
    if (auditError) {
      console.error('❌ Error checking audit tables:', auditError);
    } else if (auditTables && auditTables.length > 0) {
      console.log('✅ file_access_audit table created successfully');
    } else {
      console.log('⚠️  file_access_audit table may not be created properly');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run the migration
applyStorageMigration();
