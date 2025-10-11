#!/usr/bin/env node

/**
 * Database Test Script for HALCYON NMT Transportation System
 * Tests basic database connectivity and functionality
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('corporate_clients')
      .select('id, name')
      .limit(1);
    
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (err) {
    console.log('❌ Database connection error:', err.message);
    return false;
  }
}

async function testTables() {
  try {
    console.log('\n🔍 Testing table access...');
    
    const tables = [
      'corporate_clients',
      'programs', 
      'locations',
      'users',
      'clients',
      'drivers',
      'vehicles',
      'trips',
      'trip_categories'
    ];
    
    let successCount = 0;
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: accessible`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }
    
    console.log(`\n📊 Table access summary: ${successCount}/${tables.length} tables accessible`);
    return successCount === tables.length;
  } catch (err) {
    console.log('❌ Table testing error:', err.message);
    return false;
  }
}

async function testData() {
  try {
    console.log('\n🔍 Testing data access...');
    
    // Test corporate clients
    const { data: corporateClients, error: ccError } = await supabase
      .from('corporate_clients')
      .select('id, name')
      .eq('is_active', true);
    
    if (ccError) {
      console.log('❌ Corporate clients error:', ccError.message);
      return false;
    }
    
    console.log(`✅ Corporate clients: ${corporateClients.length} found`);
    corporateClients.forEach(cc => console.log(`   - ${cc.name} (${cc.id})`));
    
    // Test programs
    const { data: programs, error: pError } = await supabase
      .from('programs')
      .select('id, name, corporate_client_id')
      .eq('is_active', true);
    
    if (pError) {
      console.log('❌ Programs error:', pError.message);
      return false;
    }
    
    console.log(`✅ Programs: ${programs.length} found`);
    programs.forEach(p => console.log(`   - ${p.name} (${p.id}) - Corporate: ${p.corporate_client_id}`));
    
    // Test trip categories
    const { data: tripCategories, error: tcError } = await supabase
      .from('trip_categories')
      .select('id, name, program_id')
      .eq('is_active', true);
    
    if (tcError) {
      console.log('❌ Trip categories error:', tcError.message);
      return false;
    }
    
    console.log(`✅ Trip categories: ${tripCategories.length} found`);
    
    // Test super admin user
    const { data: superAdmin, error: saError } = await supabase
      .from('users')
      .select('user_id, email, role, primary_program_id')
      .eq('email', 'admin@monarch.com')
      .single();
    
    if (saError) {
      console.log('❌ Super admin error:', saError.message);
      return false;
    }
    
    console.log(`✅ Super admin: ${superAdmin.email} (${superAdmin.role}) - Program: ${superAdmin.primary_program_id}`);
    
    return true;
  } catch (err) {
    console.log('❌ Data testing error:', err.message);
    return false;
  }
}

async function testViews() {
  try {
    console.log('\n🔍 Testing views...');
    
    const views = ['program_hierarchy', 'trip_statistics'];
    let successCount = 0;
    
    for (const view of views) {
      try {
        const { error } = await supabase
          .from(view)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ View ${view}: ${error.message}`);
        } else {
          console.log(`✅ View ${view}: accessible`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ View ${view}: ${err.message}`);
      }
    }
    
    console.log(`\n📊 View access summary: ${successCount}/${views.length} views accessible`);
    return successCount === views.length;
  } catch (err) {
    console.log('❌ View testing error:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting HALCYON NMT Database Test...\n');
  
  let allTestsPassed = true;
  
  // Test database connection
  const connectionTest = await testDatabaseConnection();
  if (!connectionTest) allTestsPassed = false;
  
  // Test table access
  const tableTest = await testTables();
  if (!tableTest) allTestsPassed = false;
  
  // Test data access
  const dataTest = await testData();
  if (!dataTest) allTestsPassed = false;
  
  // Test views
  const viewTest = await testViews();
  if (!viewTest) allTestsPassed = false;
  
  console.log('\n' + '='.repeat(60));
  
  if (allTestsPassed) {
    console.log('🎉 SUCCESS: All database tests passed!');
    console.log('✅ HALCYON NMT Transportation System database is ready');
  } else {
    console.log('❌ FAILURE: Some database tests failed');
    console.log('🔧 Please check the deployment and try again');
    process.exit(1);
  }
}

// Check if we're running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
