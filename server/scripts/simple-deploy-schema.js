#!/usr/bin/env node

/**
 * Simple Schema Deployment Script for HALCYON NMT Transportation System
 * Uses direct SQL execution via Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deploySchema() {
  try {
    console.log('🚀 Starting HALCYON NMT Database Schema Deployment...\n');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'create-complete-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Schema file loaded successfully');
    console.log(`📊 Schema size: ${(schemaSQL.length / 1024).toFixed(2)} KB`);
    
    // Execute the schema using Supabase's SQL editor functionality
    console.log('🔧 Executing schema...');
    
    const { data, error } = await supabase
      .from('_sql')
      .select('*')
      .eq('query', schemaSQL);
    
    if (error) {
      console.log('❌ Error executing schema:', error.message);
      
      // Try alternative approach - execute in smaller chunks
      console.log('🔄 Trying alternative approach with smaller chunks...');
      
      const statements = schemaSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`🔧 Found ${statements.length} SQL statements to execute`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        try {
          // Try to execute each statement
          const { error: stmtError } = await supabase
            .rpc('exec_sql', { sql: statement });
          
          if (stmtError) {
            console.log(`❌ Error executing statement ${i + 1}: ${stmtError.message}`);
            console.log(`📝 Statement: ${statement.substring(0, 100)}...`);
            errorCount++;
          } else {
            successCount++;
            if (i % 10 === 0) {
              console.log(`✅ Executed ${i + 1}/${statements.length} statements`);
            }
          }
        } catch (err) {
          console.log(`❌ Exception executing statement ${i + 1}: ${err.message}`);
          errorCount++;
        }
        
        // Small delay between statements
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      console.log('\n' + '='.repeat(60));
      console.log(`📊 Deployment Summary:`);
      console.log(`✅ Successful statements: ${successCount}`);
      console.log(`❌ Failed statements: ${errorCount}`);
      console.log(`📈 Success rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);
      
      if (errorCount === 0) {
        console.log('\n🎉 SUCCESS: Database schema deployed successfully!');
        console.log('✅ HALCYON NMT Transportation System database is ready');
      } else {
        console.log('\n⚠️ WARNING: Some statements failed to execute');
        console.log('🔧 Please review the errors above and retry if necessary');
      }
      
    } else {
      console.log('✅ Schema executed successfully!');
      console.log('🎉 HALCYON NMT Transportation System database is ready');
    }
    
  } catch (error) {
    console.error('❌ Fatal error during schema deployment:', error.message);
    process.exit(1);
  }
}

// Check if we're running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deploySchema();
}

export { deploySchema };


