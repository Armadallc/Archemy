import { supabase } from './minimal-supabase';

async function testRLSPolicies() {
  console.log('🔍 Testing RLS policies after successful application...');
  
  // Test with Super Admin
  console.log('\n👑 Testing Super Admin access...');
  const { data: adminAuth, error: adminError } = await supabase.auth.signInWithPassword({
    email: 'admin@monarch.com',
    password: 'admin123'
  });
  
  if (adminError) {
    console.log('❌ Admin auth failed:', adminError.message);
    return;
  }
  
  console.log('✅ Admin authentication successful');
  
  const { data: adminTrips, error: adminTripsError } = await supabase
    .from('trips')
    .select('id, program_id, driver_id, status')
    .limit(5);
    
  if (adminTripsError) {
    console.log('❌ Admin trips access failed:', adminTripsError.message);
  } else {
    console.log(`✅ Super Admin can access ${adminTrips?.length || 0} trips`);
    if (adminTrips && adminTrips.length > 0) {
      console.log('📋 Admin trips:', adminTrips);
    }
  }
  
  // Test with Corporate Admin
  console.log('\n🏢 Testing Corporate Admin access...');
  const { data: corporateAuth, error: corporateError } = await supabase.auth.signInWithPassword({
    email: 'corporate@monarch.com',
    password: 'corporate123'
  });
  
  if (corporateError) {
    console.log('❌ Corporate admin auth failed:', corporateError.message);
  } else {
    console.log('✅ Corporate admin authentication successful');
    
    const { data: corporateTrips, error: corporateTripsError } = await supabase
      .from('trips')
      .select('id, program_id, driver_id, status')
      .limit(5);
      
    if (corporateTripsError) {
      console.log('❌ Corporate admin trips access failed:', corporateTripsError.message);
    } else {
      console.log(`✅ Corporate Admin can access ${corporateTrips?.length || 0} trips`);
      if (corporateTrips && corporateTrips.length > 0) {
        console.log('📋 Corporate admin trips:', corporateTrips);
      }
    }
  }
  
  // Test with Program Admin
  console.log('\n👨‍💼 Testing Program Admin access...');
  const { data: programAdminAuth, error: programAdminError } = await supabase.auth.signInWithPassword({
    email: 'programadmin@monarch.com',
    password: 'programadmin123'
  });
  
  if (programAdminError) {
    console.log('❌ Program admin auth failed:', programAdminError.message);
  } else {
    console.log('✅ Program admin authentication successful');
    
    const { data: programAdminTrips, error: programAdminTripsError } = await supabase
      .from('trips')
      .select('id, program_id, driver_id, status')
      .limit(5);
      
    if (programAdminTripsError) {
      console.log('❌ Program admin trips access failed:', programAdminTripsError.message);
    } else {
      console.log(`✅ Program Admin can access ${programAdminTrips?.length || 0} trips`);
      if (programAdminTrips && programAdminTrips.length > 0) {
        console.log('📋 Program admin trips:', programAdminTrips);
      }
    }
  }
  
  // Test with Program User
  console.log('\n👤 Testing Program User access...');
  const { data: programUserAuth, error: programUserError } = await supabase.auth.signInWithPassword({
    email: 'programuser@monarch.com',
    password: 'programuser123'
  });
  
  if (programUserError) {
    console.log('❌ Program user auth failed:', programUserError.message);
  } else {
    console.log('✅ Program user authentication successful');
    
    const { data: programUserTrips, error: programUserTripsError } = await supabase
      .from('trips')
      .select('id, program_id, driver_id, status')
      .limit(5);
      
    if (programUserTripsError) {
      console.log('❌ Program user trips access failed:', programUserTripsError.message);
    } else {
      console.log(`✅ Program User can access ${programUserTrips?.length || 0} trips`);
      if (programUserTrips && programUserTrips.length > 0) {
        console.log('📋 Program user trips:', programUserTrips);
      }
    }
  }
  
  // Test with Driver
  console.log('\n🚗 Testing Driver access...');
  const { data: driverAuth, error: driverError } = await supabase.auth.signInWithPassword({
    email: 'driver@monarch.com',
    password: 'driver123'
  });
  
  if (driverError) {
    console.log('❌ Driver auth failed:', driverError.message);
  } else {
    console.log('✅ Driver authentication successful');
    
    const { data: driverTrips, error: driverTripsError } = await supabase
      .from('trips')
      .select('id, program_id, driver_id, status')
      .limit(5);
      
    if (driverTripsError) {
      console.log('❌ Driver trips access failed:', driverTripsError.message);
    } else {
      console.log(`✅ Driver can access ${driverTrips?.length || 0} trips`);
      if (driverTrips && driverTrips.length > 0) {
        console.log('📋 Driver trips:', driverTrips);
      }
    }
  }
  
  console.log('\n🎉 RLS Policy Testing Complete!');
}

testRLSPolicies();
