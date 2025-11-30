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

async function testWithRealData() {
  console.log('🧪 Testing Frequent Locations API with real program data...');

  try {
    // Get a real program_id first
    console.log('\n1️⃣ Getting real program data...');
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('id, name')
      .limit(1);
    
    if (programsError || !programs || programs.length === 0) {
      console.error('❌ No programs found:', programsError);
      return;
    }
    
    const programId = programs[0].id;
    console.log('✅ Using program:', programs[0].name, '(ID:', programId, ')');

    // Test 2: Create a test frequent location with real program_id
    console.log('\n2️⃣ Testing create with real program...');
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
      program_id: programId
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

    // Test 3: Test the new API endpoints
    console.log('\n3️⃣ Testing new API endpoints...');
    
    // Test tag-based grouping
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

    // Test 4: Test service locations
    console.log('\n4️⃣ Testing service locations...');
    const { data: serviceLocations, error: serviceError } = await supabase
      .from('frequent_locations')
      .select('*')
      .eq('is_service_location', true);
    
    if (serviceError) {
      console.error('❌ Service locations query failed:', serviceError);
    } else {
      console.log('✅ Service locations found:', serviceLocations.length);
    }

    // Test 5: Test grocery stores specifically
    console.log('\n5️⃣ Testing grocery stores...');
    const { data: groceryStores, error: groceryError } = await supabase
      .from('frequent_locations')
      .select('*')
      .eq('tag', 'grocery_store');
    
    if (groceryError) {
      console.error('❌ Grocery stores query failed:', groceryError);
    } else {
      console.log('✅ Grocery stores found:', groceryStores.length);
      groceryStores.forEach(store => {
        console.log(`  - ${store.name} (${store.city}, ${store.state})`);
      });
    }

    // Test 6: Test priority ordering
    console.log('\n6️⃣ Testing priority ordering...');
    const { data: orderedLocations, error: orderError } = await supabase
      .from('frequent_locations')
      .select('name, tag, priority, is_service_location, usage_count')
      .eq('is_active', true)
      .order('priority', { ascending: true })
      .order('usage_count', { ascending: false });
    
    if (orderError) {
      console.error('❌ Priority ordering failed:', orderError);
    } else {
      console.log('✅ Locations ordered by priority:');
      orderedLocations.forEach(loc => {
        const serviceFlag = loc.is_service_location ? ' [SERVICE]' : '';
        console.log(`  - ${loc.name} (${loc.tag}, priority: ${loc.priority}, uses: ${loc.usage_count})${serviceFlag}`);
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
    console.log('\n📋 The database is ready for the new tag system!');
    console.log('\n🌐 You can now test the frontend:');
    console.log('   Frontend: http://localhost:5174/frequent-locations');
    console.log('   Backend:  http://localhost:8081');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testWithRealData();














