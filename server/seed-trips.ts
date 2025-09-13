import { storage } from "./minimal-supabase.js";

export async function seedTrips() {
  console.log('🚌 Seeding trip data...');
  
  try {
    // Get existing data to create realistic trips
    const [clients, drivers, serviceAreas] = await Promise.all([
      storage.getClientsByOrganization("monarch_competency"),
      storage.getDriversByOrganization("monarch_competency"),
      storage.getServiceAreasByOrganization("monarch_competency")
    ]);

    if (clients.length === 0 || drivers.length === 0 || serviceAreas.length === 0) {
      console.log('⚠️ Need clients, drivers, and service areas to create trips');
      return false;
    }

    // Create trips for the past few days and upcoming week
    const today = new Date();
    const trips = [];
    
    // Past trips (completed)
    for (let i = 5; i >= 1; i--) {
      const tripDate = new Date(today);
      tripDate.setDate(tripDate.getDate() - i);
      
      const morningPickup = new Date(tripDate);
      morningPickup.setHours(8, 30, 0, 0);
      
      const afternoonDropoff = new Date(tripDate);
      afternoonDropoff.setHours(15, 45, 0, 0);
      
      trips.push({
        id: `trip_past_${i}_morning`,
        organization_id: "monarch_competency",
        client_id: clients[0].id,
        driver_id: drivers[0].id,
        service_area_id: serviceAreas[0].id,
        pickup_address: clients[0].address,
        dropoff_address: "Charlotte Community Health Center, 123 Medical Plaza",
        scheduled_pickup_time: morningPickup.toISOString(),
        scheduled_dropoff_time: new Date(morningPickup.getTime() + 45 * 60000).toISOString(),
        actual_pickup_time: new Date(morningPickup.getTime() + 5 * 60000).toISOString(),
        actual_dropoff_time: new Date(morningPickup.getTime() + 50 * 60000).toISOString(),
        status: 'completed',
        trip_type: 'one_way',
        passenger_count: 1,
        notes: 'Regular medical appointment',
        created_at: new Date(tripDate.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: afternoonDropoff.toISOString()
      });
      
      trips.push({
        id: `trip_past_${i}_return`,
        organization_id: "monarch_competency",
        client_id: clients[0].id,
        driver_id: drivers[0].id,
        service_area_id: serviceAreas[0].id,
        pickup_address: "Charlotte Community Health Center, 123 Medical Plaza",
        dropoff_address: clients[0].address,
        scheduled_pickup_time: afternoonDropoff.toISOString(),
        scheduled_dropoff_time: new Date(afternoonDropoff.getTime() + 45 * 60000).toISOString(),
        actual_pickup_time: new Date(afternoonDropoff.getTime() + 3 * 60000).toISOString(),
        actual_dropoff_time: new Date(afternoonDropoff.getTime() + 48 * 60000).toISOString(),
        status: 'completed',
        trip_type: 'one_way',
        passenger_count: 1,
        notes: 'Return from medical appointment',
        created_at: new Date(tripDate.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(afternoonDropoff.getTime() + 48 * 60000).toISOString()
      });
    }
    
    // Today's trips (in progress and scheduled)
    const todayMorning = new Date(today);
    todayMorning.setHours(9, 0, 0, 0);
    
    const todayAfternoon = new Date(today);
    todayAfternoon.setHours(14, 30, 0, 0);
    
    trips.push({
      id: `trip_today_morning`,
      organization_id: "monarch_competency",
      client_id: clients[0].id,
      driver_id: drivers.length > 1 ? drivers[1].id : drivers[0].id,
      service_area_id: serviceAreas[0].id,
      pickup_address: clients[0].address,
      dropoff_address: "Therapy Associates, 456 Wellness Blvd",
      scheduled_pickup_time: todayMorning.toISOString(),
      scheduled_dropoff_time: new Date(todayMorning.getTime() + 40 * 60000).toISOString(),
      actual_pickup_time: new Date(todayMorning.getTime() + 8 * 60000).toISOString(),
      actual_dropoff_time: null,
      status: 'in_progress',
      trip_type: 'round_trip',
      passenger_count: 1,
      notes: 'Weekly therapy session',
      created_at: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(todayMorning.getTime() + 8 * 60000).toISOString()
    });
    
    trips.push({
      id: `trip_today_afternoon`,
      organization_id: "monarch_competency",
      client_id: clients[0].id,
      driver_id: drivers.length > 2 ? drivers[2].id : drivers[0].id,
      service_area_id: serviceAreas.length > 1 ? serviceAreas[1].id : serviceAreas[0].id,
      pickup_address: "Therapy Associates, 456 Wellness Blvd",
      dropoff_address: clients[0].address,
      scheduled_pickup_time: todayAfternoon.toISOString(),
      scheduled_dropoff_time: new Date(todayAfternoon.getTime() + 40 * 60000).toISOString(),
      actual_pickup_time: null,
      actual_dropoff_time: null,
      status: 'scheduled',
      trip_type: 'round_trip',
      passenger_count: 1,
      notes: 'Return from therapy session',
      created_at: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    });
    
    // Future trips (scheduled)
    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + i);
      
      const morningTime = new Date(futureDate);
      morningTime.setHours(8 + (i % 3), 30, 0, 0);
      
      const destinations = [
        "Carolina Medical Center, 789 Health St",
        "Community Pharmacy, 321 Prescription Ave",
        "Social Services Office, 654 Government Way",
        "Employment Center, 987 Career Blvd"
      ];
      
      const tripTypes = ['one_way', 'round_trip'];
      
      trips.push({
        id: `trip_future_${i}`,
        organization_id: "monarch_competency",
        client_id: clients[0].id,
        driver_id: drivers[i % drivers.length].id,
        service_area_id: serviceAreas[i % serviceAreas.length].id,
        pickup_address: clients[0].address,
        dropoff_address: destinations[i % destinations.length],
        scheduled_pickup_time: morningTime.toISOString(),
        scheduled_dropoff_time: new Date(morningTime.getTime() + (30 + i * 5) * 60000).toISOString(),
        actual_pickup_time: null,
        actual_dropoff_time: null,
        status: 'scheduled',
        trip_type: tripTypes[i % tripTypes.length],
        passenger_count: 1,
        notes: `Scheduled ${tripTypes[i % tripTypes.length]} appointment`,
        created_at: new Date(today.getTime() - (8 - i) * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(today.getTime() - (8 - i) * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    // Create all trips
    let createdCount = 0;
    for (const tripData of trips) {
      try {
        await storage.createTrip(tripData);
        createdCount++;
      } catch (error) {
        console.log(`⚠️ Trip ${tripData.id} may already exist, skipping...`);
      }
    }
    
    console.log(`✅ Created ${createdCount} trips successfully`);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to seed trips:', error);
    return false;
  }
}

// Also seed trips for other organizations
export async function seedAllOrganizationTrips() {
  console.log('🚌 Seeding trips for all organizations...');
  
  const organizations = [
    "monarch_mental_health",
    "monarch_sober_living", 
    "monarch_launch"
  ];
  
  for (const orgId of organizations) {
    try {
      const [clients, drivers] = await Promise.all([
        storage.getClientsByOrganization(orgId),
        storage.getDriversByOrganization(orgId)
      ]);
      
      if (clients.length === 0 || drivers.length === 0) {
        console.log(`⚠️ Skipping ${orgId} - no clients or drivers`);
        continue;
      }
      
      // Create a few sample trips for each org
      const today = new Date();
      const trips = [];
      
      for (let i = 1; i <= 3; i++) {
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + i);
        futureDate.setHours(9 + i, 0, 0, 0);
        
        trips.push({
          id: `trip_${orgId}_${i}`,
          organization_id: orgId,
          client_id: clients[0].id,
          driver_id: drivers[0].id,
          service_area_id: null, // Will use default
          pickup_address: clients[0].address,
          dropoff_address: `${orgId} Service Center`,
          scheduled_pickup_time: futureDate.toISOString(),
          scheduled_dropoff_time: new Date(futureDate.getTime() + 45 * 60000).toISOString(),
          actual_pickup_time: null,
          actual_dropoff_time: null,
          status: 'scheduled',
          trip_type: 'round_trip',
          passenger_count: 1,
          notes: `Program activity for ${orgId}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      for (const tripData of trips) {
        try {
          await storage.createTrip(tripData);
        } catch (error) {
          // Skip if already exists
        }
      }
      
      console.log(`✅ Created trips for ${orgId}`);
      
    } catch (error) {
      console.error(`❌ Failed to seed trips for ${orgId}:`, error);
    }
  }
}