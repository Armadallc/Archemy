/**
 * SIMPLE FILE STORAGE TEST
 * Test the basic functionality of the file storage system
 */

import { supabase } from './minimal-supabase';

async function testStorageSystem() {
  console.log('🧪 Testing Supabase Storage System...');
  
  try {
    // Test 1: Check if buckets exist
    console.log('📦 Checking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error checking buckets:', bucketsError);
      return;
    }
    
    console.log('✅ Available buckets:', buckets?.map(b => b.name));
    
    // Test 2: Check if file_metadata table exists
    console.log('📋 Checking file_metadata table...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'file_metadata');
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
    } else if (tables && tables.length > 0) {
      console.log('✅ file_metadata table exists');
    } else {
      console.log('⚠️  file_metadata table does not exist - need to create it');
    }
    
    // Test 3: Try to list files in documents bucket
    console.log('📄 Testing documents bucket access...');
    const { data: documents, error: docsError } = await supabase.storage
      .from('documents')
      .list();
    
    if (docsError) {
      console.error('❌ Error accessing documents bucket:', docsError);
    } else {
      console.log('✅ Documents bucket accessible, files:', documents?.length || 0);
    }
    
    // Test 4: Try to list files in photos bucket
    console.log('📸 Testing photos bucket access...');
    const { data: photos, error: photosError } = await supabase.storage
      .from('photos')
      .list();
    
    if (photosError) {
      console.error('❌ Error accessing photos bucket:', photosError);
    } else {
      console.log('✅ Photos bucket accessible, files:', photos?.length || 0);
    }
    
    console.log('🎉 Storage system test completed!');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testStorageSystem();
