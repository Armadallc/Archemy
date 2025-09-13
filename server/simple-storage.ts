import { db } from './supabase';
import * as schema from '../shared/schema';
import { eq } from 'drizzle-orm';
import type { 
  Organization, 
  User, 
  ServiceArea, 
  Client, 
  Driver, 
  Trip,
  InsertOrganization,
  InsertUser,
  InsertServiceArea,
  InsertClient,
  InsertDriver,
  InsertTrip
} from '@shared/schema';

export class SimpleStorage {
  // Organizations
  async getAllOrganizations(): Promise<Organization[]> {
    return await db.select().from(schema.organizations);
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const result = await db.select().from(schema.organizations).where(eq(schema.organizations.id, id)).limit(1);
    return result[0];
  }

  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const result = await db.insert(schema.organizations).values(organization).returning();
    return result[0];
  }

  // Users
  async getUser(userId: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.userId, userId)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(user).returning();
    return result[0];
  }

  // Service Areas
  async getServiceAreasByOrganization(organizationId: string): Promise<ServiceArea[]> {
    return await db.select().from(schema.serviceAreas).where(eq(schema.serviceAreas.organizationId, organizationId));
  }

  async createServiceArea(serviceArea: InsertServiceArea): Promise<ServiceArea> {
    const result = await db.insert(schema.serviceAreas).values(serviceArea).returning();
    return result[0];
  }

  // Clients
  async getClientsByOrganization(organizationId: string): Promise<Client[]> {
    return await db.select().from(schema.clients).where(eq(schema.clients.organizationId, organizationId));
  }

  async createClient(client: InsertClient): Promise<Client> {
    const result = await db.insert(schema.clients).values(client).returning();
    return result[0];
  }

  // Drivers
  async getDriversByOrganization(organizationId: string): Promise<Driver[]> {
    return await db.select().from(schema.drivers).where(eq(schema.drivers.primaryOrganizationId, organizationId));
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const result = await db.insert(schema.drivers).values(driver).returning();
    return result[0];
  }

  // Trips
  async getTripsByOrganization(organizationId: string): Promise<Trip[]> {
    return await db.select().from(schema.trips).where(eq(schema.trips.organizationId, organizationId));
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const result = await db.insert(schema.trips).values(trip).returning();
    return result[0];
  }
}

export const storage = new SimpleStorage();