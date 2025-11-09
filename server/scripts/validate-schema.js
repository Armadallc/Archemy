#!/usr/bin/env node

/**
 * Schema Validation Script for HALCYON NMT Transportation System
 * Validates that all required tables and relationships exist
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

// Required tables and their expected columns
const requiredTables = {
  'corporate_clients': ['id', 'name', 'is_active', 'created_at', 'updated_at'],
  'programs': ['id', 'name', 'corporate_client_id', 'is_active', 'created_at', 'updated_at'],
  'locations': ['id', 'name', 'program_id', 'is_active', 'created_at', 'updated_at'],
  'users': ['user_id', 'user_name', 'email', 'role', 'primary_program_id', 'is_active', 'created_at', 'updated_at'],
  'clients': ['id', 'first_name', 'last_name', 'program_id', 'is_active', 'created_at', 'updated_at'],
  'client_groups': ['id', 'name', 'program_id', 'is_active', 'created_at', 'updated_at'],
  'client_group_memberships': ['id', 'client_group_id', 'client_id', 'joined_at'],
  'drivers': ['id', 'user_id', 'program_id', 'is_active', 'created_at', 'updated_at'],
  'vehicles': ['id', 'program_id', 'make', 'model', 'license_plate', 'is_active', 'created_at', 'updated_at'],
  'vehicle_assignments': ['id', 'vehicle_id', 'driver_id', 'program_id', 'created_at', 'updated_at'],
  'vehicle_maintenance': ['id', 'vehicle_id', 'maintenance_type', 'performed_at', 'created_at', 'updated_at'],
  'trip_categories': ['id', 'program_id', 'name', 'is_active', 'created_at', 'updated_at'],
  'trips': ['id', 'program_id', 'client_id', 'trip_type', 'status', 'is_active', 'created_at', 'updated_at'],
  'driver_schedules': ['id', 'driver_id', 'program_id', 'day_of_week', 'start_time', 'end_time', 'created_at', 'updated_at'],
  'driver_duty_status': ['id', 'driver_id', 'program_id', 'status', 'started_at', 'created_at', 'updated_at'],
  'driver_locations': ['id', 'driver_id', 'latitude', 'longitude', 'timestamp', 'created_at'],
  'notification_templates': ['id', 'name', 'type', 'channels', 'title', 'body', 'priority', 'is_active', 'created_at', 'updated_at'],
  'notifications': ['id', 'user_id', 'type', 'title', 'body', 'status', 'created_at', 'updated_at'],
  'notification_deliveries': ['id', 'notification_id', 'user_id', 'channel', 'status', 'created_at', 'updated_at'],
  'notification_preferences': ['id', 'user_id', 'notification_type', 'push_enabled', 'sms_enabled', 'email_enabled', 'created_at', 'updated_at'],
  'trip_status_logs': ['id', 'trip_id', 'status', 'timestamp', 'created_at'],
  'offline_updates': ['id', 'driver_id', 'update_type', 'data', 'synced', 'created_at']
};

// Required views
const requiredViews = [
  'program_hierarchy',
  'trip_statistics'
];

// Required functions
const requiredFunctions = [
  'update_updated_at_column'
];

async function validateTable(tableName, expectedColumns) {
  try {
    console.log(`🔍 Checking table: ${tableName}`);
    
    // Check if table exists by querying it
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Table ${tableName} does not exist or is not accessible: ${error.message}`);
      return false;
    }
    
    // Check if we can get column information
    const { data: columns, error: columnError } = await supabase
      .rpc('get_table_columns', { table_name: tableName });
    
    if (columnError) {
      // Fallback: try to select expected columns
      const { error: selectError } = await supabase
        .from(tableName)
        .select(expectedColumns.join(', '))
        .limit(1);
      
      if (selectError) {
        console.log(`❌ Table ${tableName} missing expected columns: ${selectError.message}`);
        return false;
      }
    }
    
    console.log(`✅ Table ${tableName} exists and is accessible`);
    return true;
  } catch (err) {
    console.log(`❌ Error validating table ${tableName}: ${err.message}`);
    return false;
  }
}

async function validateView(viewName) {
  try {
    console.log(`🔍 Checking view: ${viewName}`);
    
    const { data, error } = await supabase
      .from(viewName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ View ${viewName} does not exist or is not accessible: ${error.message}`);
      return false;
    }
    
    console.log(`✅ View ${viewName} exists and is accessible`);
    return true;
  } catch (err) {
    console.log(`❌ Error validating view ${viewName}: ${err.message}`);
    return false;
  }
}

async function validateFunction(functionName) {
  try {
    console.log(`🔍 Checking function: ${functionName}`);
    
    const { data, error } = await supabase
      .rpc('get_function_info', { function_name: functionName });
    
    if (error) {
      console.log(`❌ Function ${functionName} does not exist or is not accessible: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Function ${functionName} exists and is accessible`);
    return true;
  } catch (err) {
    console.log(`❌ Error validating function ${functionName}: ${err.message}`);
    return false;
  }
}

async function validateData() {
  try {
    console.log(`🔍 Checking initial data...`);
    
    // Check corporate clients
    const { data: corporateClients, error: ccError } = await supabase
      .from('corporate_clients')
      .select('id, name')
      .eq('is_active', true);
    
    if (ccError) {
      console.log(`❌ Error checking corporate clients: ${ccError.message}`);
      return false;
    }
    
    console.log(`✅ Found ${corporateClients.length} corporate clients: ${corporateClients.map(cc => cc.name).join(', ')}`);
    
    // Check programs
    const { data: programs, error: pError } = await supabase
      .from('programs')
      .select('id, name, corporate_client_id')
      .eq('is_active', true);
    
    if (pError) {
      console.log(`❌ Error checking programs: ${pError.message}`);
      return false;
    }
    
    console.log(`✅ Found ${programs.length} programs: ${programs.map(p => p.name).join(', ')}`);
    
    // Check trip categories
    const { data: tripCategories, error: tcError } = await supabase
      .from('trip_categories')
      .select('id, name, program_id')
      .eq('is_active', true);
    
    if (tcError) {
      console.log(`❌ Error checking trip categories: ${tcError.message}`);
      return false;
    }
    
    console.log(`✅ Found ${tripCategories.length} trip categories`);
    
    // Check notification templates
    const { data: notificationTemplates, error: ntError } = await supabase
      .from('notification_templates')
      .select('id, name, type')
      .eq('is_active', true);
    
    if (ntError) {
      console.log(`❌ Error checking notification templates: ${ntError.message}`);
      return false;
    }
    
    console.log(`✅ Found ${notificationTemplates.length} notification templates`);
    
    return true;
  } catch (err) {
    console.log(`❌ Error validating data: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting HALCYON NMT Database Schema Validation...\n');
  
  let allValid = true;
  
  // Validate tables
  console.log('📋 Validating Tables...');
  for (const [tableName, expectedColumns] of Object.entries(requiredTables)) {
    const isValid = await validateTable(tableName, expectedColumns);
    if (!isValid) allValid = false;
  }
  
  console.log('\n📊 Validating Views...');
  for (const viewName of requiredViews) {
    const isValid = await validateView(viewName);
    if (!isValid) allValid = false;
  }
  
  console.log('\n🔧 Validating Functions...');
  for (const functionName of requiredFunctions) {
    const isValid = await validateFunction(functionName);
    if (!isValid) allValid = false;
  }
  
  console.log('\n📊 Validating Initial Data...');
  const dataValid = await validateData();
  if (!dataValid) allValid = false;
  
  console.log('\n' + '='.repeat(60));
  
  if (allValid) {
    console.log('🎉 SUCCESS: All database schema components are valid!');
    console.log('✅ Database is ready for the HALCYON NMT Transportation System');
  } else {
    console.log('❌ FAILURE: Some database schema components are missing or invalid');
    console.log('🔧 Please run the schema creation script and try again');
    process.exit(1);
  }
}

main().catch(console.error);
