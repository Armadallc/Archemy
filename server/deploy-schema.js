#!/usr/bin/env node

/**
 * Schema Deployment Script for HALCYON NMT Transportation System
 * Deploys the complete database schema to Supabase
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
    
    // Split the schema into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔧 Found ${statements.length} SQL statements to execute`);
    
    // Execute statements in batches to avoid timeout
    const batchSize = 10;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i += batchSize) {
      const batch = statements.slice(i, i + batchSize);
      console.log(`\n📦 Executing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(statements.length / batchSize)} (${batch.length} statements)`);
      
      for (const statement of batch) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.log(`❌ Error executing statement: ${error.message}`);
            console.log(`📝 Statement: ${statement.substring(0, 100)}...`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.log(`❌ Exception executing statement: ${err.message}`);
          console.log(`📝 Statement: ${statement.substring(0, 100)}...`);
          errorCount++;
        }
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Deployment Summary:`);
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📈 Success rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);
    
    if (errorCount === 0) {
      console.log('\n🎉 SUCCESS: Database schema deployed successfully!');
      console.log('✅ HALCYON NMT Transportation System database is ready');
      
      // Run validation
      console.log('\n🔍 Running schema validation...');
      const { spawn } = await import('child_process');
      const validation = spawn('node', ['validate-schema.js'], { cwd: __dirname });
      
      validation.stdout.on('data', (data) => {
        console.log(data.toString());
      });
      
      validation.stderr.on('data', (data) => {
        console.error(data.toString());
      });
      
      validation.on('close', (code) => {
        if (code === 0) {
          console.log('\n🎉 Schema validation completed successfully!');
          console.log('🚀 HALCYON NMT Transportation System is ready to use!');
        } else {
          console.log('\n⚠️ Schema validation completed with warnings');
          console.log('🔧 Please review the validation output above');
        }
      });
      
    } else {
      console.log('\n⚠️ WARNING: Some statements failed to execute');
      console.log('🔧 Please review the errors above and retry if necessary');
      process.exit(1);
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
