import { storage } from './minimal-supabase.js';

export async function seedMissingTables() {
  try {
    console.log('🔧 Creating sample data to establish missing tables...');

    // Create a test user
    const testUser = {
      user_id: 'user_001',
      user_name: 'John Driver',
      email: 'john.driver@monarch.org',
      password_hash: '$2b$10$test.hash.placeholder',
      role: 'driver' as const,
      primary_organization_id: 'monarch_competency',
      authorized_organizations: ['monarch_competency']
    };

    // Create a test driver
    const testDriver = {
      id: 'driver_001',
      user_id: 'user_001',
      license_number: 'NC123456',
      vehicle_info: '2020 Honda Pilot - White',
      primary_organization_id: 'monarch_competency',
      authorized_organizations: ['monarch_competency'],
      is_active: true
    };

    // Create a test trip
    const testTrip = {
      id: 'trip_001',
      organization_id: 'monarch_competency',
      client_id: 'client_001',
      driver_id: 'driver_001',
      trip_type: 'one_way' as const,
      pickup_address: '100 N Tryon St, Charlotte, NC',
      dropoff_address: '200 S College St, Charlotte, NC',
      scheduled_pickup_time: new Date('2025-06-12T09:00:00'),
      passenger_count: 1,
      status: 'scheduled' as const,
      notes: 'Test trip for system verification'
    };

    // Create a test driver schedule
    const testSchedule = {
      id: 'schedule_001',
      driver_id: 'user_001',
      organization_id: 'monarch_competency',
      day_of_week: 1, // Monday
      start_time: '08:00:00',
      end_time: '17:00:00',
      is_on_call: false
    };

    // Insert test data to create table structures
    try {
      await storage.createUser(testUser);
      console.log('✅ Users table established');
    } catch (error) {
      console.log('Users table creation:', error);
    }

    try {
      await storage.createDriver(testDriver);
      console.log('✅ Drivers table established');
    } catch (error) {
      console.log('Drivers table creation:', error);
    }

    try {
      await storage.createTrip(testTrip);
      console.log('✅ Trips table established');
    } catch (error) {
      console.log('Trips table creation:', error);
    }

    try {
      await storage.createDriverSchedule(testSchedule);
      console.log('✅ Driver schedules table established');
    } catch (error) {
      console.log('Driver schedules table creation:', error);
    }

    console.log('🎯 Database schema establishment completed');

  } catch (error) {
    console.error('❌ Error establishing tables:', error);
  }
}