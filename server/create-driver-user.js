/**
 * Create a driver user for testing
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDriverUser() {
  try {
    console.log('🚀 Creating driver user for testing...\n');

    const email = 'testdriver@monarch.com';
    const password = 'driver123';

    // Check if user already exists
    const { data: existingUser, error: getUserError } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.find(u => u.email === email);
    if (userExists) {
      console.log('✅ Driver user already exists:', email);
      console.log('🔑 Password:', password);
      return;
    }

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        user_name: 'Test Driver',
        role: 'driver'
      }
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError.message);
      return;
    }

    console.log('✅ Supabase Auth user created:', email);
    console.log('🆔 Auth User ID:', authUser.user.id);

    // Create user in database
    const userId = `test_driver_${Date.now()}`;
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .insert({
        user_id: userId,
        user_name: 'Test Driver',
        email: email,
        password_hash: '$2b$10$dummyhashfortest', // Placeholder - auth handled by Supabase
        role: 'driver',
        primary_program_id: 'monarch_competency',
        corporate_client_id: 'monarch',
        authorized_programs: ['monarch_competency'],
        auth_user_id: authUser.user.id,
        is_active: true
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Error creating database user:', dbError.message);
      return;
    }

    console.log('✅ Database user created:', email);
    console.log('🆔 User ID:', userId);

    // Create driver profile
    const driverId = `test_driver_${Date.now()}`;
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .insert({
        id: driverId,
        user_id: userId,
        license_number: 'TEST123456',
        is_active: true
      })
      .select()
      .single();

    if (driverError) {
      console.error('❌ Error creating driver profile:', driverError.message);
      return;
    }

    console.log('✅ Driver profile created:', driverId);

    // Assign some trips to this driver
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('id')
      .is('driver_id', null)
      .limit(2);

    if (tripsError) {
      console.error('❌ Error fetching unassigned trips:', tripsError.message);
      return;
    }

    if (trips && trips.length > 0) {
      const { error: updateError } = await supabase
        .from('trips')
        .update({ driver_id: driverId })
        .in('id', trips.map(t => t.id));

      if (updateError) {
        console.error('❌ Error assigning trips:', updateError.message);
      } else {
        console.log(`✅ Assigned ${trips.length} trips to driver`);
      }
    }

    console.log('\n🎉 Driver user creation completed!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🆔 User ID:', userId);
    console.log('🚗 Driver ID:', driverId);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createDriverUser();
