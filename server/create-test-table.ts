/**
 * CREATE SIMPLE TEST TABLE
 * Test if we can create tables through the API
 */

import { supabase } from './minimal-supabase';

async function createTestTable() {
  console.log('🧪 Testing table creation...');
  
  try {
    // Try to create a simple test table
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS test_file_storage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_name TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    });
    
    if (error) {
      console.error('❌ Error creating test table:', error);
    } else {
      console.log('✅ Test table created successfully');
      
      // Try to query it
      const { data: testData, error: queryError } = await supabase
        .from('test_file_storage')
        .select('*')
        .limit(1);
      
      if (queryError) {
        console.error('❌ Error querying test table:', queryError);
      } else {
        console.log('✅ Test table is accessible');
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
createTestTable();
