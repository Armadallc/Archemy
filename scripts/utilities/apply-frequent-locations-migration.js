const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🚀 Starting frequent locations schema migration...');

  try {
    // Step 1: Add new columns to frequent_locations table
    console.log('📝 Adding new columns to frequent_locations table...');
    
    const addColumnsQuery = `
      ALTER TABLE frequent_locations 
      ADD COLUMN IF NOT EXISTS tag VARCHAR(50) DEFAULT 'other',
      ADD COLUMN IF NOT EXISTS is_service_location BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS auto_synced BOOLEAN DEFAULT false;
    `;
    
    const { error: alterError } = await supabase.rpc('exec_sql', { sql: addColumnsQuery });
    if (alterError) {
      console.error('❌ Error adding columns:', alterError);
      return;
    }
    console.log('✅ Columns added successfully');

    // Step 2: Create indexes
    console.log('📊 Creating indexes...');
    
    const createIndexesQuery = `
      CREATE INDEX IF NOT EXISTS idx_frequent_locations_tag ON frequent_locations(tag);
      CREATE INDEX IF NOT EXISTS idx_frequent_locations_priority ON frequent_locations(priority);
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: createIndexesQuery });
    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
      return;
    }
    console.log('✅ Indexes created successfully');

    // Step 3: Update existing records
    console.log('🔄 Updating existing frequent locations...');
    
    const { error: updateError } = await supabase
      .from('frequent_locations')
      .update({ tag: 'other' })
      .is('tag', null);
    
    if (updateError) {
      console.error('❌ Error updating existing records:', updateError);
      return;
    }
    console.log('✅ Existing records updated');

    // Step 4: Create trigger function
    console.log('⚙️ Creating auto-sync trigger function...');
    
    const createFunctionQuery = `
      CREATE OR REPLACE FUNCTION sync_service_location_to_frequent()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO frequent_locations (
          name, 
          full_address, 
          street_address, 
          city, 
          state, 
          zip_code,
          program_id, 
          tag, 
          is_service_location, 
          auto_synced, 
          usage_count,
          priority,
          created_at,
          updated_at
        ) VALUES (
          NEW.name, 
          NEW.address,
          COALESCE(TRIM(SPLIT_PART(NEW.address, ',', 1)), ''),
          COALESCE(TRIM(SPLIT_PART(NEW.address, ',', 2)), ''),
          COALESCE(TRIM(SPLIT_PART(NEW.address, ',', 3)), ''),
          COALESCE(TRIM(SPLIT_PART(NEW.address, ',', 4)), ''),
          NEW.program_id, 
          'service_location', 
          true, 
          true, 
          0,
          1,
          NOW(),
          NOW()
        )
        ON CONFLICT (name, program_id) DO NOTHING;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const { error: functionError } = await supabase.rpc('exec_sql', { sql: createFunctionQuery });
    if (functionError) {
      console.error('❌ Error creating function:', functionError);
      return;
    }
    console.log('✅ Trigger function created');

    // Step 5: Create trigger
    console.log('🔗 Creating auto-sync trigger...');
    
    const createTriggerQuery = `
      DROP TRIGGER IF EXISTS sync_service_locations ON locations;
      CREATE TRIGGER sync_service_locations
        AFTER INSERT ON locations
        FOR EACH ROW
        EXECUTE FUNCTION sync_service_location_to_frequent();
    `;
    
    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: createTriggerQuery });
    if (triggerError) {
      console.error('❌ Error creating trigger:', triggerError);
      return;
    }
    console.log('✅ Trigger created successfully');

    // Step 6: Sync existing service locations
    console.log('🔄 Syncing existing service locations...');
    
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*');
    
    if (locationsError) {
      console.error('❌ Error fetching locations:', locationsError);
      return;
    }

    for (const location of locations) {
      const { error: insertError } = await supabase
        .from('frequent_locations')
        .upsert({
          name: location.name,
          full_address: location.address,
          street_address: location.address.split(',')[0]?.trim() || '',
          city: location.address.split(',')[1]?.trim() || '',
          state: location.address.split(',')[2]?.trim() || '',
          zip_code: location.address.split(',')[3]?.trim() || '',
          program_id: location.program_id,
          tag: 'service_location',
          is_service_location: true,
          auto_synced: true,
          usage_count: 0,
          priority: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'name,program_id'
        });
      
      if (insertError) {
        console.error(`❌ Error syncing location ${location.name}:`, insertError);
      }
    }
    console.log('✅ Service locations synced');

    // Step 7: Verify results
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

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

applyMigration();














