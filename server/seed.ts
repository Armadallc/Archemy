import { db } from "./db";
import { organizations, users, serviceAreas, clients, drivers, trips } from "@shared/schema";
import bcrypt from "bcrypt";

async function seedDatabase() {
  console.log("Starting database seeding...");

  try {
    // Create organizations
    const orgs = await db.insert(organizations).values([
      {
        id: "monarch_competency",
        name: "Monarch Competency",
        operatingHoursStart: "08:00",
        operatingHoursEnd: "22:00",
      },
      {
        id: "monarch_mental_health", 
        name: "Monarch Mental Health",
        operatingHoursStart: "08:00",
        operatingHoursEnd: "20:00",
      },
      {
        id: "monarch_sober_living",
        name: "Monarch Sober Living", 
        operatingHoursStart: "06:00",
        operatingHoursEnd: "23:00",
      },
      {
        id: "monarch_launch",
        name: "Monarch Launch",
        operatingHoursStart: "09:00",
        operatingHoursEnd: "18:00",
      },
    ]).onConflictDoNothing().returning();

    console.log("Organizations created:", orgs.length);

    // Create service areas
    const serviceAreaData = await db.insert(serviceAreas).values([
      {
        organizationId: "monarch_competency",
        nickname: "Lowell Men's",
        fullAddress: "5241 Lowell Blvd, Denver, CO 80221",
      },
      {
        organizationId: "monarch_competency", 
        nickname: "Lowell Women's",
        fullAddress: "5201 Lowell Blvd, Denver, CO 80221",
      },
      {
        organizationId: "monarch_competency",
        nickname: "The Office",
        fullAddress: "5335 Newton St, Denver, CO 80221",
      },
      {
        organizationId: "monarch_mental_health",
        nickname: "Downtown Hub",
        fullAddress: "123 Main St, Denver, CO 80202",
      },
      {
        organizationId: "monarch_sober_living",
        nickname: "Recovery Center",
        fullAddress: "456 Oak Ave, Denver, CO 80203",
      },
    ]).onConflictDoNothing().returning();

    console.log("Service areas created:", serviceAreaData.length);

    // Create users
    const hashedPassword = await bcrypt.hash("password123", 10);
    const userData = await db.insert(users).values([
      {
        userId: "monarch_owner_001",
        userName: "Sarah Johnson",
        email: "sarah@monarch.com",
        passwordHash: hashedPassword,
        role: "monarch_owner",
        primaryOrganizationId: null,
        authorizedOrganizations: ["monarch_competency", "monarch_mental_health", "monarch_sober_living", "monarch_launch"],
      },
      {
        userId: "admin_competency_001",
        userName: "John Doe",
        email: "john@monarch.com", 
        passwordHash: hashedPassword,
        role: "organization_admin",
        primaryOrganizationId: "monarch_competency",
        authorizedOrganizations: ["monarch_competency"],
      },
      {
        userId: "kiosk_competency_001",
        userName: "Lisa Smith",
        email: "lisa@monarch.com",
        passwordHash: hashedPassword,
        role: "organization_user",
        primaryOrganizationId: "monarch_competency",
        authorizedOrganizations: ["monarch_competency"],
      },
      {
        userId: "driver_001",
        userName: "Mike Wilson",
        email: "mike@monarch.com",
        passwordHash: hashedPassword,
        role: "driver",
        primaryOrganizationId: "monarch_competency",
        authorizedOrganizations: ["monarch_competency", "monarch_mental_health"],
      },
      {
        userId: "driver_002",
        userName: "Maria Garcia",
        email: "maria@monarch.com",
        passwordHash: hashedPassword,
        role: "driver",
        primaryOrganizationId: "monarch_competency", 
        authorizedOrganizations: ["monarch_competency"],
      },
    ]).onConflictDoNothing().returning();

    console.log("Users created:", userData.length);

    // Create drivers
    const driverData = await db.insert(drivers).values([
      {
        userId: "driver_001",
        licenseNumber: "DL123456",
        vehicleInfo: "Honda Accord - Silver",
        primaryOrganizationId: "monarch_competency",
        authorizedOrganizations: ["monarch_competency", "monarch_mental_health"],
      },
      {
        userId: "driver_002",
        licenseNumber: "DL789012",
        vehicleInfo: "Toyota Camry - Blue",
        primaryOrganizationId: "monarch_competency",
        authorizedOrganizations: ["monarch_competency"],
      },
    ]).onConflictDoNothing().returning();

    console.log("Drivers created:", driverData.length);

    // Create clients
    const clientData = await db.insert(clients).values([
      {
        organizationId: "monarch_competency",
        serviceAreaId: serviceAreaData[0]?.id || "default",
        firstName: "Robert",
        lastName: "Anderson",
        phone: "303-555-0101",
        email: "robert.anderson@email.com",
      },
      {
        organizationId: "monarch_competency",
        serviceAreaId: serviceAreaData[1]?.id || "default",
        firstName: "Jennifer",
        lastName: "Taylor",
        phone: "303-555-0102", 
        email: "jennifer.taylor@email.com",
      },
      {
        organizationId: "monarch_competency",
        serviceAreaId: serviceAreaData[0]?.id || "default",
        firstName: "David",
        lastName: "Brown",
        phone: "303-555-0103",
        email: "david.brown@email.com",
      },
      {
        organizationId: "monarch_competency",
        serviceAreaId: serviceAreaData[2]?.id || "default",
        firstName: "Emily",
        lastName: "Davis",
        phone: "303-555-0104",
        email: "emily.davis@email.com",
      },
    ]).onConflictDoNothing().returning();

    console.log("Clients created:", clientData.length);

    // Create sample trips
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tripData = await db.insert(trips).values([
      {
        organizationId: "monarch_competency",
        clientId: clientData[0]?.id || "default",
        driverId: "driver_001",
        pickupAddress: "5241 Lowell Blvd, Denver, CO 80221",
        dropoffAddress: "University of Colorado Hospital, Aurora, CO",
        scheduledPickupTime: new Date(today.setHours(10, 30, 0, 0)),
        tripType: "one_way",
        passengerCount: 1,
        status: "confirmed",
        createdBy: "kiosk_competency_001",
      },
      {
        organizationId: "monarch_competency",
        clientId: clientData[1]?.id || "default",
        driverId: "driver_002",
        pickupAddress: "5201 Lowell Blvd, Denver, CO 80221",
        dropoffAddress: "Presbyterian/St. Joseph Hospital, Denver, CO",
        scheduledPickupTime: new Date(today.setHours(14, 15, 0, 0)),
        tripType: "round_trip",
        passengerCount: 1,
        status: "in_progress",
        createdBy: "kiosk_competency_001",
      },
      {
        organizationId: "monarch_competency",
        clientId: clientData[2]?.id || "default",
        driverId: "driver_001",
        pickupAddress: "5241 Lowell Blvd, Denver, CO 80221",
        dropoffAddress: "Denver Health Medical Center, Denver, CO",
        scheduledPickupTime: new Date(today.setHours(16, 0, 0, 0)),
        tripType: "one_way",
        passengerCount: 2,
        status: "scheduled",
        createdBy: "admin_competency_001",
      },
      {
        organizationId: "monarch_competency",
        clientId: clientData[3]?.id || "default",
        driverId: "driver_002",
        pickupAddress: "5335 Newton St, Denver, CO 80221",
        dropoffAddress: "National Jewish Health, Denver, CO",
        scheduledPickupTime: new Date(tomorrow.setHours(9, 45, 0, 0)),
        tripType: "one_way",
        passengerCount: 1,
        status: "scheduled",
        createdBy: "kiosk_competency_001",
      },
    ]).onConflictDoNothing().returning();

    console.log("Trips created:", tripData.length);
    console.log("Database seeding completed successfully!");

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export { seedDatabase };