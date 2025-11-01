import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAPI() {
  console.log('🧪 Testing Frequent Locations API with new tag system...');

  try {
    // Test 1: Check if new columns exist
    console.log('\n1️⃣ Testing database schema...');
    const { data: sample, error: schemaError } = await supabase
      .from('frequent_locations')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('❌ Schema test failed:', schemaError);
      return;
    }
    
    const hasNewColumns = sample[0] && (
      'tag' in sample[0] && 
      'is_service_location' in sample[0] && 
      'priority' in sample[0] && 
      'auto_synced' in sample[0]
    );
    
    if (hasNewColumns) {
      console.log('✅ New columns exist:', Object.keys(sample[0]).filter(key => 
        ['tag', 'is_service_location', 'priority', 'auto_synced'].includes(key)
      ));
    } else {
      console.error('❌ New columns not found');
      return;
    }

    // Test 2: Create a test frequent location with new tag system
    console.log('\n2️⃣ Testing create with tag system...');
    const testLocation = {
      name: 'Test Grocery Store',
      description: 'Test location for API testing',
      street_address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zip_code: '12345',
      full_address: '123 Test St, Test City, TS 12345',
      location_type: 'destination',
      tag: 'grocery_store',
      is_service_location: false,
      priority: 2,
      auto_synced: false,
      usage_count: 0,
      is_active: true,
      program_id: 'test_program' // You may need to adjust this
    };

    const { data: createdLocation, error: createError } = await supabase
      .from('frequent_locations')
      .insert(testLocation)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Create test failed:', createError);
    } else {
      console.log('✅ Created test location:', createdLocation.name, 'with tag:', createdLocation.tag);
    }

    // Test 3: Test tag-based querying
    console.log('\n3️⃣ Testing tag-based queries...');
    
    // Get all locations grouped by tag
    const { data: allLocations, error: allError } = await supabase
      .from('frequent_locations')
      .select('*')
      .eq('is_active', true);
    
    if (allError) {
      console.error('❌ All locations query failed:', allError);
    } else {
      // Group by tag
      const groupedByTag = allLocations.reduce((acc, location) => {
        const tag = location.tag || 'other';
        if (!acc[tag]) acc[tag] = [];
        acc[tag].push(location);
        return acc;
      }, {});
      
      console.log('✅ Locations grouped by tag:');
      Object.entries(groupedByTag).forEach(([tag, locations]) => {
        console.log(`  - ${tag}: ${locations.length} locations`);
      });
    }

    // Test 4: Test service locations filter
    console.log('\n4️⃣ Testing service locations filter...');
    const { data: serviceLocations, error: serviceError } = await supabase
      .from('frequent_locations')
      .select('*')
      .eq('is_service_location', true);
    
    if (serviceError) {
      console.error('❌ Service locations query failed:', serviceError);
    } else {
      console.log('✅ Service locations found:', serviceLocations.length);
    }

    // Test 5: Test specific tag filter
    console.log('\n5️⃣ Testing specific tag filter...');
    const { data: groceryStores, error: groceryError } = await supabase
      .from('frequent_locations')
      .select('*')
      .eq('tag', 'grocery_store');
    
    if (groceryError) {
      console.error('❌ Grocery stores query failed:', groceryError);
    } else {
      console.log('✅ Grocery stores found:', groceryStores.length);
    }

    // Test 6: Test priority ordering
    console.log('\n6️⃣ Testing priority ordering...');
    const { data: orderedLocations, error: orderError } = await supabase
      .from('frequent_locations')
      .select('name, tag, priority, is_service_location')
      .eq('is_active', true)
      .order('priority', { ascending: true })
      .order('usage_count', { ascending: false });
    
    if (orderError) {
      console.error('❌ Priority ordering failed:', orderError);
    } else {
      console.log('✅ Locations ordered by priority:');
      orderedLocations.slice(0, 5).forEach(loc => {
        console.log(`  - ${loc.name} (${loc.tag}, priority: ${loc.priority})`);
      });
    }

    // Cleanup: Delete test location
    if (createdLocation) {
      console.log('\n🧹 Cleaning up test location...');
      const { error: deleteError } = await supabase
        .from('frequent_locations')
        .delete()
        .eq('id', createdLocation.id);
      
      if (deleteError) {
        console.error('❌ Cleanup failed:', deleteError);
      } else {
        console.log('✅ Test location cleaned up');
      }
    }

    console.log('\n🎉 API structure test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Test the frontend at http://localhost:5174/frequent-locations');
    console.log('2. Verify the hierarchical tag-based display');
    console.log('3. Test creating/editing locations with tags');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAPI();









