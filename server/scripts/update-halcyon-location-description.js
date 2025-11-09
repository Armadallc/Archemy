import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateLocationDescription() {
  try {
    console.log('🔍 Updating Halcyon Detox location description...');

    const { data, error } = await supabase
      .from('locations')
      .update({ description: 'Medical Detox' })
      .eq('id', 'halcyon_detox_main')
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating location:', error);
      process.exit(1);
    }

    console.log('✅ Location description updated successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

updateLocationDescription()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

