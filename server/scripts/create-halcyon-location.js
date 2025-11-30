import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createHalcyonLocation() {
  try {
    console.log('🔍 Creating Halcyon Detox location...');

    // Location data for Halcyon Detox
    const locationData = {
      id: 'halcyon_detox_main',
      name: 'Halcyon Detox Main Location',
      description: 'Primary treatment facility for Halcyon Detox program',
      program_id: 'halcyon_detox',
      address: '1234 Market Street, Denver, CO 80202',
      phone: '303-555-0100',
      contact_person: 'Program Coordinator',
      latitude: '39.7392',
      longitude: '-104.9903',
      is_active: true,
    };

    // Insert the location
    const { data, error } = await supabase
      .from('locations')
      .insert(locationData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        console.log('⚠️  Location already exists. Updating...');
        const { data: updated, error: updateError } = await supabase
          .from('locations')
          .update(locationData)
          .eq('id', locationData.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating location:', updateError);
          process.exit(1);
        }
        console.log('✅ Location updated successfully:', updated);
        return updated;
      } else {
        console.error('❌ Error creating location:', error);
        process.exit(1);
      }
    }

    console.log('✅ Location created successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

createHalcyonLocation()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

