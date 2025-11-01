/**
 * CHECK EXISTING TABLES
 * Check what tables exist in the database
 */

import { supabase } from './minimal-supabase';

async function checkExistingTables() {
  console.log('🔍 Checking existing tables...');
  
  try {
    // Check if key tables exist by trying to query them
    const tablesToCheck = [
      'users',
      'programs', 
      'locations',
      'clients',
      'trips',
      'drivers',
      'vehicles',
      'file_metadata',
      'file_access_audit'
    ];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${tableName}' does not exist or not accessible`);
        } else {
          console.log(`✅ Table '${tableName}' exists`);
        }
      } catch (err) {
        console.log(`❌ Table '${tableName}' does not exist`);
      }
    }
    
  } catch (error) {
    console.error('💥 Check failed:', error);
  }
}

// Run the check
checkExistingTables();
