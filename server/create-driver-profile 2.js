/**
 * Create driver profile for test driver user
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDriverProfile() {
  try {
    console.log('🔍 Creating driver profile for test driver...\n');

    // Find the test driver user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id, email')
      .eq('email', 'testdriver@monarch.com')
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userError);
      return;
    }

    console.log('👤 Found user:', user.user_id);

    // Create driver profile
    const driverId = `test_driver_${Date.now()}`;
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .insert({
        id: driverId,
        user_id: user.user_id,
        program_id: 'monarch_competency',
        license_number: 'TEST123456',
        is_active: true
      })
      .select()
      .single();

    if (driverError) {
      console.error('❌ Error creating driver profile:', driverError);
      return;
    }

    console.log('✅ Driver profile created:', driver.id);

    // Assign some trips to this driver
    const { data: unassignedTrips, error: tripsError } = await supabase
      .from('trips')
      .select('id')
      .is('driver_id', null)
      .limit(3);

    if (tripsError) {
      console.error('❌ Error fetching unassigned trips:', tripsError);
      return;
    }

    if (unassignedTrips && unassignedTrips.length > 0) {
      const { error: updateError } = await supabase
        .from('trips')
        .update({ driver_id: driverId })
        .in('id', unassignedTrips.map(t => t.id));

      if (updateError) {
        console.error('❌ Error assigning trips:', updateError);
      } else {
        console.log(`✅ Assigned ${unassignedTrips.length} trips to driver`);
      }
    }

    console.log('\n🎉 Driver profile creation completed!');
    console.log('🚗 Driver ID:', driverId);
    console.log('👤 User ID:', user.user_id);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createDriverProfile();
