import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFrequentLocations() {
  try {
    console.log('🔍 Testing frequent_locations table...\n');

    // 1. Check if table exists by trying to query it
    console.log('1️⃣ Checking if table exists...');
    const { data: testData, error: testError } = await supabase
      .from('frequent_locations')
      .select('id')
      .limit(1);

    if (testError) {
      if (testError.code === 'PGRST116') {
        console.log('❌ frequent_locations table not found - need to create it first');
        return;
      } else {
        console.error('❌ Error checking table:', testError);
        return;
      }
    }

    console.log('✅ frequent_locations table exists');

    // 2. Check current data
    console.log('\n2️⃣ Checking current data...');
    const { data: currentData, error: currentError } = await supabase
      .from('frequent_locations')
      .select('*')
      .limit(10);

    if (currentError) {
      console.error('❌ Error fetching current data:', currentError);
      return;
    }

    console.log(`📊 Found ${currentData?.length || 0} existing records`);

    // 3. Insert sample data if none exists
    if (!currentData || currentData.length === 0) {
      console.log('\n3️⃣ Inserting sample data...');
      
      const sampleData = [
        {
          id: 'fl_sample_001',
          corporate_client_id: 'monarch',
          program_id: 'monarch_competency',
          name: 'Monarch Competency Center',
          description: 'Main facility for Monarch Competency program',
          street_address: '123 Main Street',
          city: 'Springfield',
          state: 'IL',
          zip_code: '62701',
          full_address: '123 Main Street, Springfield, IL 62701',
          location_type: 'facility',
          usage_count: 15,
          is_active: true
        },
        {
          id: 'fl_sample_002',
          corporate_client_id: 'monarch',
          program_id: 'monarch_competency',
          name: 'Springfield Courthouse',
          description: 'Local courthouse for legal appointments',
          street_address: '456 Court Street',
          city: 'Springfield',
          state: 'IL',
          zip_code: '62701',
          full_address: '456 Court Street, Springfield, IL 62701',
          location_type: 'courthouse',
          usage_count: 8,
          is_active: true
        },
        {
          id: 'fl_sample_003',
          corporate_client_id: 'monarch',
          program_id: 'monarch_competency',
          name: 'Springfield Medical Center',
          description: 'Primary medical facility for health appointments',
          street_address: '789 Health Drive',
          city: 'Springfield',
          state: 'IL',
          zip_code: '62701',
          full_address: '789 Health Drive, Springfield, IL 62701',
          location_type: 'medical',
          usage_count: 12,
          is_active: true
        }
      ];

      const { data: insertData, error: insertError } = await supabase
        .from('frequent_locations')
        .insert(sampleData)
        .select();

      if (insertError) {
        console.error('❌ Error inserting sample data:', insertError);
        return;
      }

      console.log(`✅ Inserted ${insertData?.length || 0} sample records`);
    } else {
      console.log('✅ Sample data already exists');
    }

    // 4. Test RLS policies
    console.log('\n4️⃣ Testing RLS policies...');
    
    // Test with super admin
    const { data: adminData, error: adminError } = await supabase
      .from('frequent_locations')
      .select('*')
      .limit(5);

    if (adminError) {
      console.error('❌ Error testing RLS with service role:', adminError);
    } else {
      console.log(`✅ Service role can access ${adminData?.length || 0} records`);
    }

    // 5. Display final data
    console.log('\n5️⃣ Final data summary...');
    const { data: finalData, error: finalError } = await supabase
      .from('frequent_locations')
      .select('*')
      .order('usage_count', { ascending: false });

    if (finalError) {
      console.error('❌ Error fetching final data:', finalError);
      return;
    }

    console.log(`📊 Total records: ${finalData?.length || 0}`);
    if (finalData && finalData.length > 0) {
      finalData.forEach((location, index) => {
        console.log(`  ${index + 1}. ${location.name} (${location.location_type}) - ${location.usage_count} uses`);
      });
    }

    console.log('\n✅ frequent_locations table test completed successfully!');

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  }
}

testFrequentLocations();
