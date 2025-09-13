import {
  organizations,
  users,
  serviceAreas,
  clientGroups,
  clientGroupMemberships,
  clients,
  drivers,
  driverSchedules,
  trips,
  billingCodes,
  billingModifiers,
  clientBillingInfo,
  billingClaims,
  billingBatches,
  type Organization,
  type User,
  type ServiceArea,
  type ClientGroup,
  type ClientGroupMembership,
  type Client,
  type Driver,
  type DriverSchedule,
  type Trip,
  type BillingCode,
  type BillingModifier,
  type ClientBillingInfo,
  type BillingClaim,
  type BillingBatch,
  type InsertOrganization,
  type InsertUser,
  type InsertServiceArea,
  type InsertClientGroup,
  type InsertClientGroupMembership,
  type InsertClient,
  type InsertDriver,
  type InsertDriverSchedule,
  type InsertTrip,
  type InsertBillingCode,
  type InsertBillingModifier,
  type InsertClientBillingInfo,
  type InsertBillingClaim,
  type InsertBillingBatch,
} from "@shared/schema";
import { supabase } from "./db";
import { eq, and, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Create database connection
const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { logger: false });

export interface IStorage {
  // Organization operations
  getOrganization(id: string): Promise<Organization | undefined>;
  getAllOrganizations(): Promise<Organization[]>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<InsertOrganization>): Promise<Organization>;

  // User operations
  getUser(userId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersByOrganization(organizationId: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: string, updates: Partial<InsertUser>): Promise<User>;

  // Service area operations
  getServiceArea(id: string): Promise<ServiceArea | undefined>;
  getServiceAreasByOrganization(organizationId: string): Promise<ServiceArea[]>;
  createServiceArea(serviceArea: InsertServiceArea): Promise<ServiceArea>;
  updateServiceArea(id: string, updates: Partial<InsertServiceArea>): Promise<ServiceArea>;
  deleteServiceArea(id: string): Promise<void>;

  // Client group operations
  getClientGroup(id: string): Promise<ClientGroup | undefined>;
  getClientGroupsByOrganization(organizationId: string): Promise<ClientGroup[]>;
  createClientGroup(clientGroup: InsertClientGroup): Promise<ClientGroup>;
  updateClientGroup(id: string, updates: Partial<InsertClientGroup>): Promise<ClientGroup>;
  deleteClientGroup(id: string): Promise<void>;

  // Client group membership operations
  addClientToGroup(clientId: string, groupId: string): Promise<ClientGroupMembership>;
  removeClientFromGroup(clientId: string, groupId: string): Promise<void>;
  getClientsByGroup(groupId: string): Promise<Client[]>;
  getGroupsByClient(clientId: string): Promise<ClientGroup[]>;

  // Client operations
  getClient(id: string): Promise<Client | undefined>;
  getClientsByOrganization(organizationId: string): Promise<Client[]>;
  getClientsByServiceArea(serviceAreaId: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, updates: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;

  // Driver operations
  getDriver(id: string): Promise<Driver | undefined>;
  getDriverByUserId(userId: string): Promise<Driver | undefined>;
  getDriversByOrganization(organizationId: string): Promise<Driver[]>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, updates: Partial<InsertDriver>): Promise<Driver>;
  deleteDriver(id: string): Promise<void>;

  // Driver schedule operations
  getDriverSchedules(driverId: string): Promise<DriverSchedule[]>;
  getDriverSchedulesByOrganization(organizationId: string): Promise<DriverSchedule[]>;
  createDriverSchedule(schedule: InsertDriverSchedule): Promise<DriverSchedule>;
  updateDriverSchedule(id: string, updates: Partial<InsertDriverSchedule>): Promise<DriverSchedule>;
  deleteDriverSchedule(id: string): Promise<void>;

  // Trip operations
  getTrip(id: string): Promise<Trip | undefined>;
  getTripsByOrganization(organizationId: string): Promise<Trip[]>;
  getTripsByDriver(driverId: string): Promise<Trip[]>;
  getTripsByClient(clientId: string): Promise<Trip[]>;
  getTripsByDateRange(organizationId: string, startDate: Date, endDate: Date): Promise<Trip[]>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: string, updates: Partial<InsertTrip>): Promise<Trip>;
  deleteTrip(id: string): Promise<void>;

  // Billing operations
  getBillingCodes(): Promise<BillingCode[]>;
  createBillingCode(code: InsertBillingCode): Promise<BillingCode>;
  updateBillingCode(id: string, updates: Partial<InsertBillingCode>): Promise<BillingCode>;

  getBillingModifiers(): Promise<BillingModifier[]>;
  createBillingModifier(modifier: InsertBillingModifier): Promise<BillingModifier>;
  updateBillingModifier(id: string, updates: Partial<InsertBillingModifier>): Promise<BillingModifier>;

  getClientBillingInfo(clientId: string): Promise<ClientBillingInfo | undefined>;
  getClientBillingInfoByOrganization(organizationId: string): Promise<ClientBillingInfo[]>;
  createClientBillingInfo(info: InsertClientBillingInfo): Promise<ClientBillingInfo>;
  updateClientBillingInfo(id: string, updates: Partial<InsertClientBillingInfo>): Promise<ClientBillingInfo>;
  deleteClientBillingInfo(id: string): Promise<void>;

  getBillingClaim(id: string): Promise<BillingClaim | undefined>;
  getBillingClaimsByOrganization(organizationId: string): Promise<BillingClaim[]>;
  getBillingClaimsByClient(clientId: string): Promise<BillingClaim[]>;
  getBillingClaimsByTrip(tripId: string): Promise<BillingClaim[]>;
  createBillingClaim(claim: InsertBillingClaim): Promise<BillingClaim>;
  updateBillingClaim(id: string, updates: Partial<InsertBillingClaim>): Promise<BillingClaim>;
  deleteBillingClaim(id: string): Promise<void>;

  getBillingBatch(id: string): Promise<BillingBatch | undefined>;
  getBillingBatchesByOrganization(organizationId: string): Promise<BillingBatch[]>;
  createBillingBatch(batch: InsertBillingBatch): Promise<BillingBatch>;
  updateBillingBatch(id: string, updates: Partial<InsertBillingBatch>): Promise<BillingBatch>;
  deleteBillingBatch(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Organization operations
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [organization] = await db.select().from(organizations).where(eq(organizations.id, id));
    return organization;
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations);
  }

  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const [newOrganization] = await db
      .insert(organizations)
      .values(organization)
      .returning();
    return newOrganization;
  }

  async updateOrganization(id: string, updates: Partial<InsertOrganization>): Promise<Organization> {
    const [updatedOrganization] = await db
      .update(organizations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updatedOrganization;
  }

  // User operations
  async getUser(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.userId, userId));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  async getUsersByOrganization(organizationId: string): Promise<User[]> {
    return await db.select().from(users).where(
      or(
        eq(users.primaryOrganizationId, organizationId),
        // TODO: Add proper array contains check for authorized organizations
      )
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(user)
      .returning();
    return newUser;
  }

  async updateUser(userId: string, updates: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.userId, userId))
      .returning();
    return updatedUser;
  }

  // Service area operations
  async getServiceArea(id: string): Promise<ServiceArea | undefined> {
    const [serviceArea] = await db.select().from(serviceAreas).where(eq(serviceAreas.id, id));
    return serviceArea;
  }

  async getServiceAreasByOrganization(organizationId: string): Promise<ServiceArea[]> {
    return await db.select().from(serviceAreas).where(eq(serviceAreas.organizationId, organizationId));
  }

  async createServiceArea(serviceArea: InsertServiceArea): Promise<ServiceArea> {
    const [newServiceArea] = await db
      .insert(serviceAreas)
      .values(serviceArea)
      .returning();
    return newServiceArea;
  }

  async updateServiceArea(id: string, updates: Partial<InsertServiceArea>): Promise<ServiceArea> {
    const [updatedServiceArea] = await db
      .update(serviceAreas)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(serviceAreas.id, id))
      .returning();
    return updatedServiceArea;
  }

  async deleteServiceArea(id: string): Promise<void> {
    await db.delete(serviceAreas).where(eq(serviceAreas.id, id));
  }

  // Client group operations
  async getClientGroup(id: string): Promise<ClientGroup | undefined> {
    const [clientGroup] = await db.select().from(clientGroups).where(eq(clientGroups.id, id));
    return clientGroup;
  }

  async getClientGroupsByOrganization(organizationId: string): Promise<ClientGroup[]> {
    return await db.select().from(clientGroups)
      .where(and(
        eq(clientGroups.organizationId, organizationId),
        eq(clientGroups.isActive, true)
      ));
  }

  async createClientGroup(clientGroup: InsertClientGroup): Promise<ClientGroup> {
    const [newClientGroup] = await db
      .insert(clientGroups)
      .values(clientGroup)
      .returning();
    return newClientGroup;
  }

  async updateClientGroup(id: string, updates: Partial<InsertClientGroup>): Promise<ClientGroup> {
    const [updatedClientGroup] = await db
      .update(clientGroups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clientGroups.id, id))
      .returning();
    return updatedClientGroup;
  }

  async deleteClientGroup(id: string): Promise<void> {
    // First remove all memberships
    await db.delete(clientGroupMemberships).where(eq(clientGroupMemberships.groupId, id));
    // Then soft delete the group
    await db.update(clientGroups)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(clientGroups.id, id));
  }

  // Client group membership operations
  async addClientToGroup(clientId: string, groupId: string): Promise<ClientGroupMembership> {
    const [membership] = await db
      .insert(clientGroupMemberships)
      .values({ clientId, groupId })
      .returning();
    return membership;
  }

  async removeClientFromGroup(clientId: string, groupId: string): Promise<void> {
    await db.delete(clientGroupMemberships)
      .where(and(
        eq(clientGroupMemberships.clientId, clientId),
        eq(clientGroupMemberships.groupId, groupId)
      ));
  }

  async getClientsByGroup(groupId: string): Promise<Client[]> {
    const result = await db
      .select({
        id: clients.id,
        organizationId: clients.organizationId,
        serviceAreaId: clients.serviceAreaId,
        firstName: clients.firstName,
        lastName: clients.lastName,
        phone: clients.phone,
        email: clients.email,
        notes: clients.notes,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
      })
      .from(clients)
      .innerJoin(clientGroupMemberships, eq(clients.id, clientGroupMemberships.clientId))
      .where(eq(clientGroupMemberships.groupId, groupId));
    return result;
  }

  async getGroupsByClient(clientId: string): Promise<ClientGroup[]> {
    const result = await db
      .select({
        id: clientGroups.id,
        organizationId: clientGroups.organizationId,
        name: clientGroups.name,
        description: clientGroups.description,
        serviceAreaId: clientGroups.serviceAreaId,
        isActive: clientGroups.isActive,
        createdAt: clientGroups.createdAt,
        updatedAt: clientGroups.updatedAt,
      })
      .from(clientGroups)
      .innerJoin(clientGroupMemberships, eq(clientGroups.id, clientGroupMemberships.groupId))
      .where(and(
        eq(clientGroupMemberships.clientId, clientId),
        eq(clientGroups.isActive, true)
      ));
    return result;
  }

  // Client operations
  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getClientsByOrganization(organizationId: string): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.organizationId, organizationId));
  }

  async getClientsByServiceArea(serviceAreaId: string): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.serviceAreaId, serviceAreaId));
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db
      .insert(clients)
      .values(client)
      .returning();
    return newClient;
  }

  async updateClient(id: string, updates: Partial<InsertClient>): Promise<Client> {
    const [updatedClient] = await db
      .update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Driver operations
  async getDriver(id: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }

  async getDriverByUserId(userId: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.userId, userId));
    return driver;
  }

  async getDriversByOrganization(organizationId: string): Promise<Driver[]> {
    return await db.select().from(drivers).where(
      or(
        eq(drivers.primaryOrganizationId, organizationId),
        // TODO: Add proper array contains check for authorized organizations
      )
    );
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const [newDriver] = await db
      .insert(drivers)
      .values(driver)
      .returning();
    return newDriver;
  }

  async updateDriver(id: string, updates: Partial<InsertDriver>): Promise<Driver> {
    const [updatedDriver] = await db
      .update(drivers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();
    return updatedDriver;
  }

  async deleteDriver(id: string): Promise<void> {
    await db.delete(drivers).where(eq(drivers.id, id));
  }

  // Driver schedule operations
  async getDriverSchedules(driverId: string): Promise<DriverSchedule[]> {
    return await db.select().from(driverSchedules).where(eq(driverSchedules.driverId, driverId));
  }

  async getDriverSchedulesByOrganization(organizationId: string): Promise<DriverSchedule[]> {
    return await db.select().from(driverSchedules).where(eq(driverSchedules.organizationId, organizationId));
  }

  async createDriverSchedule(schedule: InsertDriverSchedule): Promise<DriverSchedule> {
    const [newSchedule] = await db
      .insert(driverSchedules)
      .values(schedule)
      .returning();
    return newSchedule;
  }

  async updateDriverSchedule(id: string, updates: Partial<InsertDriverSchedule>): Promise<DriverSchedule> {
    const [updatedSchedule] = await db
      .update(driverSchedules)
      .set(updates)
      .where(eq(driverSchedules.id, id))
      .returning();
    return updatedSchedule;
  }

  async deleteDriverSchedule(id: string): Promise<void> {
    await db.delete(driverSchedules).where(eq(driverSchedules.id, id));
  }

  // Trip operations
  async getTrip(id: string): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip;
  }

  async getTripsByOrganization(organizationId: string): Promise<Trip[]> {
    return await db.select().from(trips).where(eq(trips.organizationId, organizationId));
  }

  async getTripsByDriver(driverId: string): Promise<Trip[]> {
    return await db.select().from(trips).where(eq(trips.driverId, driverId));
  }

  async getTripsByClient(clientId: string): Promise<Trip[]> {
    return await db.select().from(trips).where(eq(trips.clientId, clientId));
  }

  async getTripsByDateRange(organizationId: string, startDate: Date, endDate: Date): Promise<Trip[]> {
    return await db.select().from(trips).where(
      and(
        eq(trips.organizationId, organizationId),
        // TODO: Add proper date range filtering
      )
    );
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const [newTrip] = await db
      .insert(trips)
      .values(trip)
      .returning();
    return newTrip;
  }

  async updateTrip(id: string, updates: Partial<InsertTrip>): Promise<Trip> {
    const [updatedTrip] = await db
      .update(trips)
      .set({ ...updates, modifiedAt: new Date() })
      .where(eq(trips.id, id))
      .returning();
    return updatedTrip;
  }

  async deleteTrip(id: string): Promise<void> {
    await db.delete(trips).where(eq(trips.id, id));
  }

  // Billing operations
  async getBillingCodes(): Promise<BillingCode[]> {
    return await db.select().from(billingCodes).where(eq(billingCodes.isActive, true));
  }

  async createBillingCode(code: InsertBillingCode): Promise<BillingCode> {
    const [newCode] = await db
      .insert(billingCodes)
      .values(code)
      .returning();
    return newCode;
  }

  async updateBillingCode(id: string, updates: Partial<InsertBillingCode>): Promise<BillingCode> {
    const [updatedCode] = await db
      .update(billingCodes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(billingCodes.id, id))
      .returning();
    return updatedCode;
  }

  async getBillingModifiers(): Promise<BillingModifier[]> {
    return await db.select().from(billingModifiers).where(eq(billingModifiers.isActive, true));
  }

  async createBillingModifier(modifier: InsertBillingModifier): Promise<BillingModifier> {
    const [newModifier] = await db
      .insert(billingModifiers)
      .values(modifier)
      .returning();
    return newModifier;
  }

  async updateBillingModifier(id: string, updates: Partial<InsertBillingModifier>): Promise<BillingModifier> {
    const [updatedModifier] = await db
      .update(billingModifiers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(billingModifiers.id, id))
      .returning();
    return updatedModifier;
  }

  async getClientBillingInfo(clientId: string): Promise<ClientBillingInfo | undefined> {
    const [info] = await db.select().from(clientBillingInfo).where(eq(clientBillingInfo.clientId, clientId));
    return info;
  }

  async getClientBillingInfoByOrganization(organizationId: string): Promise<ClientBillingInfo[]> {
    return await db.select().from(clientBillingInfo).where(eq(clientBillingInfo.organizationId, organizationId));
  }

  async createClientBillingInfo(info: InsertClientBillingInfo): Promise<ClientBillingInfo> {
    const [newInfo] = await db
      .insert(clientBillingInfo)
      .values(info)
      .returning();
    return newInfo;
  }

  async updateClientBillingInfo(id: string, updates: Partial<InsertClientBillingInfo>): Promise<ClientBillingInfo> {
    const [updatedInfo] = await db
      .update(clientBillingInfo)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clientBillingInfo.id, id))
      .returning();
    return updatedInfo;
  }

  async deleteClientBillingInfo(id: string): Promise<void> {
    await db.delete(clientBillingInfo).where(eq(clientBillingInfo.id, id));
  }

  async getBillingClaim(id: string): Promise<BillingClaim | undefined> {
    const [claim] = await db.select().from(billingClaims).where(eq(billingClaims.id, id));
    return claim;
  }

  async getBillingClaimsByOrganization(organizationId: string): Promise<BillingClaim[]> {
    return await db.select().from(billingClaims).where(eq(billingClaims.organizationId, organizationId));
  }

  async getBillingClaimsByClient(clientId: string): Promise<BillingClaim[]> {
    return await db.select().from(billingClaims).where(eq(billingClaims.clientId, clientId));
  }

  async getBillingClaimsByTrip(tripId: string): Promise<BillingClaim[]> {
    return await db.select().from(billingClaims).where(eq(billingClaims.tripId, tripId));
  }

  async createBillingClaim(claim: InsertBillingClaim): Promise<BillingClaim> {
    const [newClaim] = await db
      .insert(billingClaims)
      .values(claim)
      .returning();
    return newClaim;
  }

  async updateBillingClaim(id: string, updates: Partial<InsertBillingClaim>): Promise<BillingClaim> {
    const [updatedClaim] = await db
      .update(billingClaims)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(billingClaims.id, id))
      .returning();
    return updatedClaim;
  }

  async deleteBillingClaim(id: string): Promise<void> {
    await db.delete(billingClaims).where(eq(billingClaims.id, id));
  }

  async getBillingBatch(id: string): Promise<BillingBatch | undefined> {
    const [batch] = await db.select().from(billingBatches).where(eq(billingBatches.id, id));
    return batch;
  }

  async getBillingBatchesByOrganization(organizationId: string): Promise<BillingBatch[]> {
    return await db.select().from(billingBatches).where(eq(billingBatches.organizationId, organizationId));
  }

  async createBillingBatch(batch: InsertBillingBatch): Promise<BillingBatch> {
    const [newBatch] = await db
      .insert(billingBatches)
      .values(batch)
      .returning();
    return newBatch;
  }

  async updateBillingBatch(id: string, updates: Partial<InsertBillingBatch>): Promise<BillingBatch> {
    const [updatedBatch] = await db
      .update(billingBatches)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(billingBatches.id, id))
      .returning();
    return updatedBatch;
  }

  async deleteBillingBatch(id: string): Promise<void> {
    await db.delete(billingBatches).where(eq(billingBatches.id, id));
  }
}

export const storage = new DatabaseStorage();
import postgres from "postgres";


export async function getClientsByOrganizationDirect(organizationId: string) {
  const directClient = postgres(process.env.DATABASE_URL!, { prepare: false });
  try {
    const result = await directClient`SELECT * FROM clients WHERE organization_id = ${organizationId}`;
    await directClient.end();
    return result;
  } catch (error) {
    await directClient.end();
    throw error;
  }
}
