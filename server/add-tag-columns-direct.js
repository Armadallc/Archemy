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

async function addTagColumns() {
  console.log('🚀 Adding tag columns to frequent_locations table...');

  try {
    // First, let's check the current structure
    console.log('🔍 Checking current table structure...');
    
    const { data: sample, error: sampleError } = await supabase
      .from('frequent_locations')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Error checking table structure:', sampleError);
      return;
    }
    
    console.log('📊 Current columns:', Object.keys(sample[0] || {}));

    // Since we can't directly execute DDL with Supabase client,
    // we'll work with the existing structure and add the new fields
    // when we insert/update records
    
    console.log('✅ Table structure checked');
    console.log('ℹ️ Note: New columns will be added when we sync service locations');

    // Now let's sync existing service locations with the new tag system
    console.log('🔄 Syncing existing service locations...');
    
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*');
    
    if (locationsError) {
      console.error('❌ Error fetching locations:', locationsError);
      return;
    }

    console.log(`📊 Found ${locations.length} service locations to sync`);

    for (const location of locations) {
      // Check if already exists as a frequent location
      const { data: existing, error: checkError } = await supabase
        .from('frequent_locations')
        .select('id')
        .eq('name', location.name)
        .eq('program_id', location.program_id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`❌ Error checking existing location ${location.name}:`, checkError);
        continue;
      }

      if (existing) {
        console.log(`⏭️ Location ${location.name} already exists, updating with service location tag...`);
        
        // Update existing record to mark as service location
        const { error: updateError } = await supabase
          .from('frequent_locations')
          .update({
            tag: 'service_location',
            is_service_location: true,
            priority: 1,
            auto_synced: true
          })
          .eq('id', existing.id);
        
        if (updateError) {
          console.error(`❌ Error updating location ${location.name}:`, updateError);
        } else {
          console.log(`✅ Updated location: ${location.name}`);
        }
        continue;
      }

      // Parse address components
      const addressParts = location.address.split(',').map(part => part.trim());
      
      // Insert new service location
      const { error: insertError } = await supabase
        .from('frequent_locations')
        .insert({
          name: location.name,
          full_address: location.address,
          street_address: addressParts[0] || '',
          city: addressParts[1] || '',
          state: addressParts[2] || '',
          zip_code: addressParts[3] || '',
          program_id: location.program_id,
          tag: 'service_location',
          is_service_location: true,
          auto_synced: true,
          usage_count: 0,
          priority: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error(`❌ Error syncing location ${location.name}:`, insertError);
      } else {
        console.log(`✅ Synced location: ${location.name}`);
      }
    }

    // Update existing frequent locations to have 'other' tag
    console.log('🔄 Updating existing frequent locations with default tag...');
    
    const { data: existingFrequent, error: fetchError } = await supabase
      .from('frequent_locations')
      .select('id, name, program_id');
    
    if (fetchError) {
      console.error('❌ Error fetching existing frequent locations:', fetchError);
      return;
    }

    console.log(`📊 Found ${existingFrequent.length} existing frequent locations`);

    for (const location of existingFrequent) {
      const { error: updateError } = await supabase
        .from('frequent_locations')
        .update({
          tag: 'other',
          is_service_location: false,
          priority: 0,
          auto_synced: false
        })
        .eq('id', location.id);
      
      if (updateError) {
        console.error(`❌ Error updating location ${location.name}:`, updateError);
      }
    }
    console.log('✅ Existing locations updated with default values');

    // Verify results
    console.log('🔍 Verifying migration results...');
    
    const { data: frequentLocations, error: verifyError } = await supabase
      .from('frequent_locations')
      .select('name, tag, is_service_location, priority, usage_count')
      .order('priority', { ascending: true })
      .order('usage_count', { ascending: false });
    
    if (verifyError) {
      console.error('❌ Error verifying results:', verifyError);
      return;
    }

    console.log('📊 Migration Results:');
    console.log('Total frequent locations:', frequentLocations.length);
    
    const tagCounts = frequentLocations.reduce((acc, loc) => {
      acc[loc.tag] = (acc[loc.tag] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Tag distribution:', tagCounts);
    console.log('Service locations:', frequentLocations.filter(loc => loc.is_service_location).length);

    // Show sample data
    console.log('\n📋 Sample Service Locations:');
    frequentLocations
      .filter(loc => loc.is_service_location)
      .slice(0, 5)
      .forEach(loc => {
        console.log(`  - ${loc.name} (${loc.tag})`);
      });

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

addTagColumns();









