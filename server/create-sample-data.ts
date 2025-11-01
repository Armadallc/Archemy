/**
 * Create Sample Data for HALCYON NMT Dashboard
 * 
 * This script creates realistic sample data following our ID mapping patterns
 * to populate the dashboard with working data.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Sample data following our ID patterns
const sampleData = {
  // Corporate Clients (Level 1)
  corporateClients: [
    {
      id: 'monarch',
      name: 'Monarch Health',
      description: 'Leading healthcare provider specializing in mental health and competency restoration',
      address: '123 Healthcare Plaza, Medical City, MC 12345',
      phone: '555-1000',
      email: 'contact@monarch.com',
      website: 'https://monarch.com',
      logo_url: 'https://monarch.com/logo.png',
      is_active: true
    },
    {
      id: 'halcyon',
      name: 'Halcyon Recovery',
      description: 'Comprehensive addiction treatment and recovery services',
      address: '456 Recovery Road, Wellness City, WC 67890',
      phone: '555-2000',
      email: 'info@halcyon.com',
      website: 'https://halcyon.com',
      logo_url: 'https://halcyon.com/logo.png',
      is_active: true
    }
  ],

  // Programs (Level 2)
  programs: [
    {
      id: 'monarch_competency',
      name: 'Monarch Competency',
      short_name: 'Competency',
      description: 'Monarch Competency',
      corporate_client_id: 'monarch',
      address: '789 Competency St, Medical City, MC 12345',
      phone: '555-1100',
      email: 'competency@monarch.com',
      logo_url: 'https://monarch.com/competency.png',
      is_active: true
    },
    {
      id: 'monarch_mental_health',
      name: 'Monarch Mental Health',
      short_name: 'Mental Health',
      description: 'Monarch Mental Health',
      corporate_client_id: 'monarch',
      address: '321 Mental Health Ave, Medical City, MC 12345',
      phone: '555-1200',
      email: 'mentalhealth@monarch.com',
      logo_url: 'https://monarch.com/mentalhealth.png',
      is_active: true
    },
    {
      id: 'monarch_sober_living',
      name: 'Monarch Sober Living',
      short_name: 'Sober Living',
      description: 'Monarch Sober Living',
      corporate_client_id: 'monarch',
      address: '654 Sober Living Blvd, Medical City, MC 12345',
      phone: '555-1300',
      email: 'soberliving@monarch.com',
      logo_url: 'https://monarch.com/soberliving.png',
      is_active: true
    },
    {
      id: 'halcyon_detox',
      name: 'Halcyon Detox',
      short_name: 'Detox',
      description: 'Halcyon Detox',
      corporate_client_id: 'halcyon',
      address: '987 Detox Drive, Wellness City, WC 67890',
      phone: '555-2100',
      email: 'detox@halcyon.com',
      logo_url: 'https://halcyon.com/detox.png',
      is_active: true
    },
    {
      id: 'halcyon_outpatient',
      name: 'Halcyon Outpatient',
      short_name: 'Outpatient',
      description: 'Halcyon Outpatient',
      corporate_client_id: 'halcyon',
      address: '147 Outpatient Lane, Wellness City, WC 67890',
      phone: '555-2200',
      email: 'outpatient@halcyon.com',
      logo_url: 'https://halcyon.com/outpatient.png',
      is_active: true
    }
  ],

  // Locations (Level 3)
  locations: [
    {
      id: 'monarch_competency_main',
      name: 'Main Campus',
      description: 'Primary location for competency restoration services',
      program_id: 'monarch_competency',
      address: '789 Competency St, Medical City, MC 12345',
      phone: '555-1101',
      contact_person: 'Dr. Sarah Johnson',
      latitude: 40.7128,
      longitude: -74.0060,
      is_active: true
    },
    {
      id: 'monarch_competency_clinic',
      name: 'Assessment Clinic',
      description: 'Specialized assessment and evaluation center',
      program_id: 'monarch_competency',
      address: '456 Assessment Ave, Medical City, MC 12345',
      phone: '555-1102',
      contact_person: 'Dr. Michael Chen',
      latitude: 40.7589,
      longitude: -73.9851,
      is_active: true
    },
    {
      id: 'monarch_mental_health_main',
      name: 'Mental Health Center',
      description: 'Main outpatient mental health facility',
      program_id: 'monarch_mental_health',
      address: '321 Mental Health Ave, Medical City, MC 12345',
      phone: '555-1201',
      contact_person: 'Dr. Lisa Rodriguez',
      latitude: 40.7831,
      longitude: -73.9712,
      is_active: true
    },
    {
      id: 'halcyon_detox_main',
      name: 'Detox Center',
      description: 'Medical detoxification facility',
      program_id: 'halcyon_detox',
      address: '987 Detox Drive, Wellness City, WC 67890',
      phone: '555-2101',
      contact_person: 'Dr. James Wilson',
      latitude: 34.0522,
      longitude: -118.2437,
      is_active: true
    }
  ],

  // Users (Level 3)
  users: [
    {
      user_id: 'super_admin_monarch_1758946085586',
      user_name: 'Super Admin',
      email: 'admin@monarch.com',
      password_hash: '$2b$10$example_hash',
      role: 'super_admin',
      primary_program_id: 'monarch_competency',
      authorized_programs: ['monarch_competency', 'monarch_mental_health', 'monarch_sober_living'],
      corporate_client_id: 'monarch',
      avatar_url: 'https://monarch.com/avatars/admin.png',
      phone: '555-0001',
      is_active: true,
      last_login: new Date().toISOString()
    },
    {
      user_id: 'corporate_admin_halcyon_1758946085587',
      user_name: 'Halcyon Admin',
      email: 'admin@halcyon.com',
      password_hash: '$2b$10$example_hash',
      role: 'corporate_admin',
      primary_program_id: 'halcyon_detox',
      authorized_programs: ['halcyon_detox', 'halcyon_outpatient'],
      corporate_client_id: 'halcyon',
      avatar_url: 'https://halcyon.com/avatars/admin.png',
      phone: '555-0002',
      is_active: true,
      last_login: new Date().toISOString()
    },
    {
      user_id: 'program_admin_competency_1758946085588',
      user_name: 'Competency Program Admin',
      email: 'programadmin@monarch.com',
      password_hash: '$2b$10$example_hash',
      role: 'program_admin',
      primary_program_id: 'monarch_competency',
      authorized_programs: ['monarch_competency'],
      corporate_client_id: 'monarch',
      avatar_url: 'https://monarch.com/avatars/programadmin.png',
      phone: '555-0003',
      is_active: true,
      last_login: new Date().toISOString()
    }
  ],

  // Clients (Level 3)
  clients: [
    {
      id: 'monarch_competency_patient_001',
      first_name: 'John',
      last_name: 'Doe',
      program_id: 'monarch_competency',
      location_id: 'monarch_competency_main',
      phone: '555-3001',
      email: 'john.doe@example.com',
      address: '123 Patient St, Medical City, MC 12345',
      emergency_contact: 'Jane Doe',
      emergency_phone: '555-3002',
      special_requirements: 'Wheelchair accessible',
      is_active: true
    },
    {
      id: 'monarch_competency_patient_002',
      first_name: 'Sarah',
      last_name: 'Smith',
      program_id: 'monarch_competency',
      location_id: 'monarch_competency_clinic',
      phone: '555-3003',
      email: 'sarah.smith@example.com',
      address: '456 Client Ave, Medical City, MC 12345',
      emergency_contact: 'Bob Smith',
      emergency_phone: '555-3004',
      special_requirements: 'None',
      is_active: true
    },
    {
      id: 'monarch_mental_health_client_001',
      first_name: 'Michael',
      last_name: 'Johnson',
      program_id: 'monarch_mental_health',
      location_id: 'monarch_mental_health_main',
      phone: '555-3005',
      email: 'michael.johnson@example.com',
      address: '789 Therapy St, Medical City, MC 12345',
      emergency_contact: 'Lisa Johnson',
      emergency_phone: '555-3006',
      special_requirements: 'None',
      is_active: true
    },
    {
      id: 'halcyon_detox_patient_001',
      first_name: 'Emily',
      last_name: 'Davis',
      program_id: 'halcyon_detox',
      location_id: 'halcyon_detox_main',
      phone: '555-3007',
      email: 'emily.davis@example.com',
      address: '321 Recovery Rd, Wellness City, WC 67890',
      emergency_contact: 'Tom Davis',
      emergency_phone: '555-3008',
      special_requirements: 'Medical monitoring required',
      is_active: true
    }
  ],

  // Drivers (Level 3)
  drivers: [
    {
      id: 'monarch_competency_driver_001',
      user_id: 'driver_monarch_1758946085589',
      program_id: 'monarch_competency',
      license_number: 'DL123456789',
      license_expiry: '2025-12-31',
      phone: '555-4001',
      emergency_contact: {
        name: 'Mary Driver',
        phone: '555-4002',
        relationship: 'Spouse'
      },
      current_vehicle_id: 'monarch_competency_vehicle_001',
      is_active: true
    },
    {
      id: 'monarch_competency_driver_002',
      user_id: 'driver_monarch_1758946085590',
      program_id: 'monarch_competency',
      license_number: 'DL987654321',
      license_expiry: '2025-06-30',
      phone: '555-4003',
      emergency_contact: {
        name: 'John Driver',
        phone: '555-4004',
        relationship: 'Brother'
      },
      current_vehicle_id: 'monarch_competency_vehicle_002',
      is_active: true
    },
    {
      id: 'halcyon_detox_driver_001',
      user_id: 'driver_halcyon_1758946085591',
      program_id: 'halcyon_detox',
      license_number: 'DL456789123',
      license_expiry: '2025-09-15',
      phone: '555-4005',
      emergency_contact: {
        name: 'Susan Driver',
        phone: '555-4006',
        relationship: 'Sister'
      },
      current_vehicle_id: 'halcyon_detox_vehicle_001',
      is_active: true
    }
  ],

  // Vehicles (Level 3)
  vehicles: [
    {
      id: 'monarch_competency_vehicle_001',
      program_id: 'monarch_competency',
      make: 'Ford',
      model: 'Transit',
      year: 2023,
      license_plate: 'MC001',
      vin: '1FTBR2CM8HKA12345',
      color: 'White',
      capacity: 8,
      vehicle_type: 'van',
      fuel_type: 'gasoline',
      current_driver_id: 'monarch_competency_driver_001',
      notes: 'Regular maintenance required',
      is_active: true
    },
    {
      id: 'monarch_competency_vehicle_002',
      program_id: 'monarch_competency',
      make: 'Chevrolet',
      model: 'Express',
      year: 2024,
      license_plate: 'MC002',
      vin: '1GC1YXC85LZ123456',
      color: 'Blue',
      capacity: 12,
      vehicle_type: 'van',
      fuel_type: 'gasoline',
      current_driver_id: 'monarch_competency_driver_002',
      notes: 'New vehicle',
      is_active: true
    },
    {
      id: 'halcyon_detox_vehicle_001',
      program_id: 'halcyon_detox',
      make: 'Mercedes',
      model: 'Sprinter',
      year: 2023,
      license_plate: 'HD001',
      vin: 'WDB9066331LA12345',
      color: 'Silver',
      capacity: 10,
      vehicle_type: 'van',
      fuel_type: 'diesel',
      current_driver_id: 'halcyon_detox_driver_001',
      notes: 'Wheelchair accessible',
      is_active: true
    }
  ],

  // Trip Categories (Level 3)
  tripCategories: [
    {
      id: 'monarch_competency_category_medical',
      program_id: 'monarch_competency',
      name: 'Medical Appointments',
      description: 'Transportation to medical appointments and evaluations',
      is_active: true
    },
    {
      id: 'monarch_competency_category_court',
      program_id: 'monarch_competency',
      name: 'Court Appearances',
      description: 'Transportation to court hearings and legal proceedings',
      is_active: true
    },
    {
      id: 'halcyon_detox_category_emergency',
      program_id: 'halcyon_detox',
      name: 'Emergency Transport',
      description: 'Urgent medical transportation for detox patients',
      is_active: true
    }
  ],

  // Trips (Level 3)
  trips: [
    {
      id: 'monarch_competency_trip_1758946085586_001',
      program_id: 'monarch_competency',
      pickup_location_id: 'monarch_competency_main',
      dropoff_location_id: 'monarch_competency_clinic',
      client_id: 'monarch_competency_patient_001',
      driver_id: 'monarch_competency_driver_001',
      trip_type: 'one_way',
      pickup_address: '123 Patient St, Medical City, MC 12345',
      dropoff_address: '456 Assessment Ave, Medical City, MC 12345',
      scheduled_pickup_time: '2024-01-15T09:00:00Z',
      scheduled_return_time: null,
      actual_pickup_time: null,
      actual_dropoff_time: null,
      actual_return_time: null,
      passenger_count: 1,
      special_requirements: 'Wheelchair accessible',
      status: 'scheduled',
      notes: 'Regular assessment appointment',
      trip_category_id: 'monarch_competency_category_medical'
    },
    {
      id: 'monarch_competency_trip_1758946085586_002',
      program_id: 'monarch_competency',
      pickup_location_id: 'monarch_competency_main',
      dropoff_location_id: null,
      client_id: 'monarch_competency_patient_002',
      driver_id: 'monarch_competency_driver_002',
      trip_type: 'round_trip',
      pickup_address: '456 Client Ave, Medical City, MC 12345',
      dropoff_address: '789 Court House, Legal City, LC 54321',
      scheduled_pickup_time: '2024-01-15T10:30:00Z',
      scheduled_return_time: '2024-01-15T12:00:00Z',
      actual_pickup_time: '2024-01-15T10:35:00Z',
      actual_dropoff_time: '2024-01-15T11:45:00Z',
      actual_return_time: '2024-01-15T12:15:00Z',
      passenger_count: 1,
      special_requirements: 'None',
      status: 'completed',
      notes: 'Court appearance - completed successfully',
      trip_category_id: 'monarch_competency_category_court'
    },
    {
      id: 'halcyon_detox_trip_1758946085586_001',
      program_id: 'halcyon_detox',
      pickup_location_id: null,
      dropoff_location_id: 'halcyon_detox_main',
      client_id: 'halcyon_detox_patient_001',
      driver_id: 'halcyon_detox_driver_001',
      trip_type: 'one_way',
      pickup_address: '321 Recovery Rd, Wellness City, WC 67890',
      dropoff_address: '987 Detox Drive, Wellness City, WC 67890',
      scheduled_pickup_time: '2024-01-15T08:00:00Z',
      scheduled_return_time: null,
      actual_pickup_time: '2024-01-15T08:05:00Z',
      actual_dropoff_time: '2024-01-15T08:45:00Z',
      actual_return_time: null,
      passenger_count: 1,
      special_requirements: 'Medical monitoring required',
      status: 'completed',
      notes: 'Emergency detox transport - completed',
      trip_category_id: 'halcyon_detox_category_emergency'
    }
  ]
};

async function createSampleData() {
  console.log('🚀 Starting sample data creation...');

  try {
    // 1. Create Corporate Clients
    console.log('📊 Creating corporate clients...');
    for (const client of sampleData.corporateClients) {
      const { error } = await supabase
        .from('corporate_clients')
        .upsert(client, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ Error creating corporate client ${client.id}:`, error);
      } else {
        console.log(`✅ Created corporate client: ${client.name}`);
      }
    }

    // 2. Create Programs
    console.log('🏥 Creating programs...');
    for (const program of sampleData.programs) {
      const { error } = await supabase
        .from('programs')
        .upsert(program, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ Error creating program ${program.id}:`, error);
      } else {
        console.log(`✅ Created program: ${program.name}`);
      }
    }

    // 3. Create Locations
    console.log('📍 Creating locations...');
    for (const location of sampleData.locations) {
      const { error } = await supabase
        .from('locations')
        .upsert(location, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ Error creating location ${location.id}:`, error);
      } else {
        console.log(`✅ Created location: ${location.name}`);
      }
    }

    // 4. Create Users
    console.log('👥 Creating users...');
    for (const user of sampleData.users) {
      const { error } = await supabase
        .from('users')
        .upsert(user, { onConflict: 'user_id' });
      
      if (error) {
        console.error(`❌ Error creating user ${user.user_id}:`, error);
      } else {
        console.log(`✅ Created user: ${user.user_name}`);
      }
    }

    // 5. Create Clients
    console.log('👤 Creating clients...');
    for (const client of sampleData.clients) {
      const { error } = await supabase
        .from('clients')
        .upsert(client, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ Error creating client ${client.id}:`, error);
      } else {
        console.log(`✅ Created client: ${client.first_name} ${client.last_name}`);
      }
    }

    // 6. Create Drivers
    console.log('🚗 Creating drivers...');
    for (const driver of sampleData.drivers) {
      const { error } = await supabase
        .from('drivers')
        .upsert(driver, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ Error creating driver ${driver.id}:`, error);
      } else {
        console.log(`✅ Created driver: ${driver.id}`);
      }
    }

    // 7. Create Vehicles
    console.log('🚐 Creating vehicles...');
    for (const vehicle of sampleData.vehicles) {
      const { error } = await supabase
        .from('vehicles')
        .upsert(vehicle, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ Error creating vehicle ${vehicle.id}:`, error);
      } else {
        console.log(`✅ Created vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`);
      }
    }

    // 8. Create Trip Categories
    console.log('📋 Creating trip categories...');
    for (const category of sampleData.tripCategories) {
      const { error } = await supabase
        .from('trip_categories')
        .upsert(category, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ Error creating trip category ${category.id}:`, error);
      } else {
        console.log(`✅ Created trip category: ${category.name}`);
      }
    }

    // 9. Create Trips
    console.log('🚌 Creating trips...');
    for (const trip of sampleData.trips) {
      const { error } = await supabase
        .from('trips')
        .upsert(trip, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ Error creating trip ${trip.id}:`, error);
      } else {
        console.log(`✅ Created trip: ${trip.id}`);
      }
    }

    console.log('🎉 Sample data creation completed!');
    
    // 10. Verify data
    console.log('🔍 Verifying data...');
    const { data: corporateClients } = await supabase.from('corporate_clients').select('count');
    const { data: programs } = await supabase.from('programs').select('count');
    const { data: locations } = await supabase.from('locations').select('count');
    const { data: users } = await supabase.from('users').select('count');
    const { data: clients } = await supabase.from('clients').select('count');
    const { data: drivers } = await supabase.from('drivers').select('count');
    const { data: vehicles } = await supabase.from('vehicles').select('count');
    const { data: trips } = await supabase.from('trips').select('count');

    console.log('📊 Final counts:');
    console.log(`   Corporate Clients: ${corporateClients?.length || 0}`);
    console.log(`   Programs: ${programs?.length || 0}`);
    console.log(`   Locations: ${locations?.length || 0}`);
    console.log(`   Users: ${users?.length || 0}`);
    console.log(`   Clients: ${clients?.length || 0}`);
    console.log(`   Drivers: ${drivers?.length || 0}`);
    console.log(`   Vehicles: ${vehicles?.length || 0}`);
    console.log(`   Trips: ${trips?.length || 0}`);

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createSampleData();
}

export { createSampleData };


