# NAMING CONVENTIONS

This document outlines the naming conventions for the HALCYON NMT Transportation System.

## **🏗️ DATABASE LAYER (snake_case)**

### **Tables**
- `corporate_clients` - Corporate client entities
- `programs` - Program entities (renamed from organizations)
- `locations` - Location entities (renamed from service_areas)
- `client_groups` - Client group entities
- `users` - User entities
- `drivers` - Driver entities
- `trips` - Trip entities
- `vehicles` - Vehicle entities
- `driver_schedules` - Driver schedule entities
- `client_group_memberships` - Client group membership entities
- `frequent_locations` - Frequent location entities
- `role_permissions` - Role permission entities
- `feature_flags` - Feature flag entities
- `driver_locations` - Driver location tracking entities
- `webhook_integrations` - Webhook integration entities
- `webhook_event_logs` - Webhook event log entities
- `notifications` - Notification entities
- `trip_categories` - Trip category entities

### **Fields**
- `id` - Primary key
- `user_id` - User identifier
- `primary_program_id` - Primary program identifier
- `corporate_client_id` - Corporate client identifier
- `program_id` - Program identifier
- `location_id` - Location identifier
- `client_id` - Client identifier
- `driver_id` - Driver identifier
- `pickup_location_id` - Pickup location identifier
- `dropoff_location_id` - Dropoff location identifier
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp
- `is_active` - Active status flag
- `avatar_url` - Avatar URL
- `billing_pin` - Billing PIN
- `trip_type` - Trip type (one_way, round_trip)
- `trip_status` - Trip status (scheduled, confirmed, in_progress, completed, cancelled)
- `passenger_count` - Number of passengers
- `scheduled_pickup_time` - Scheduled pickup time
- `scheduled_return_time` - Scheduled return time
- `actual_pickup_time` - Actual pickup time
- `actual_dropoff_time` - Actual dropoff time
- `actual_return_time` - Actual return time
- `special_requirements` - Special requirements
- `recurring_trip_id` - Recurring trip identifier
- `recurring_pattern` - Recurring pattern (JSONB)
- `recurring_end_date` - Recurring end date
- `client_group_id` - Client group identifier
- `is_group_trip` - Group trip flag
- `trip_category_id` - Trip category identifier

### **Enums**
- `user_role` - User role (super_admin, corporate_admin, program_admin, program_user, driver)
- `trip_type` - Trip type (one_way, round_trip)
- `trip_status` - Trip status (scheduled, confirmed, in_progress, completed, cancelled)

## **🔄 BACKEND LAYER (camelCase)**

### **Storage Classes**
- `CorporateClientsStorage` - Corporate client storage operations
- `ProgramsStorage` - Program storage operations
- `LocationsStorage` - Location storage operations
- `ClientGroupsStorage` - Client group storage operations
- `UsersStorage` - User storage operations
- `DriversStorage` - Driver storage operations
- `TripsStorage` - Trip storage operations

### **Methods**
- `getAllCorporateClients()` - Get all corporate clients
- `getCorporateClient(id)` - Get corporate client by ID
- `createCorporateClient(data)` - Create corporate client
- `updateCorporateClient(id, data)` - Update corporate client
- `deleteCorporateClient(id)` - Delete corporate client
- `getProgramsByCorporateClient(corporateClientId)` - Get programs by corporate client
- `getLocationsByProgram(programId)` - Get locations by program
- `getClientsByProgram(programId)` - Get clients by program
- `getClientsByLocation(locationId)` - Get clients by location
- `getTripsByProgram(programId)` - Get trips by program
- `getTripsByDriver(driverId)` - Get trips by driver

### **API Routes**
- `/api/corporate-clients` - Corporate client endpoints
- `/api/programs` - Program endpoints
- `/api/locations` - Location endpoints
- `/api/client-groups` - Client group endpoints
- `/api/users` - User endpoints
- `/api/drivers` - Driver endpoints
- `/api/trips` - Trip endpoints

### **Variables and Functions**
- `currentProgram` - Current program
- `currentCorporateClient` - Current corporate client
- `currentLocation` - Current location
- `corporateClientId` - Corporate client ID
- `programId` - Program ID
- `locationId` - Location ID
- `clientId` - Client ID
- `driverId` - Driver ID
- `tripId` - Trip ID
- `isAuthenticated` - Authentication status
- `isLoading` - Loading status
- `refetchProgram()` - Refetch program data
- `switchProgram(programId)` - Switch to program
- `switchCorporateClient(corporateClientId)` - Switch to corporate client
- `switchLocation(locationId)` - Switch to location

## **🎨 FRONTEND LAYER (camelCase)**

### **Components**
- `CorporateClientSelector` - Corporate client selection component
- `ProgramDashboard` - Program dashboard component
- `LocationManagement` - Location management component
- `ClientGroupSelector` - Client group selection component
- `TripCategorySelector` - Trip category selection component
- `DriverMobileDashboard` - Driver mobile dashboard component
- `LocationSharing` - Location sharing component
- `OfflineIndicator` - Offline indicator component

### **Hooks**
- `useCorporateClients()` - Corporate clients hook
- `usePrograms()` - Programs hook
- `useLocations()` - Locations hook
- `useClientGroups()` - Client groups hook
- `useTripCategories()` - Trip categories hook
- `useLocationTracking()` - Location tracking hook

### **Types and Interfaces**
- `CorporateClient` - Corporate client type
- `Program` - Program type
- `Location` - Location type
- `ClientGroup` - Client group type
- `TripCategory` - Trip category type
- `UserRole` - User role type
- `TripType` - Trip type
- `TripStatus` - Trip status

### **Pages**
- `corporate-clients.tsx` - Corporate clients page
- `programs.tsx` - Programs page
- `locations.tsx` - Locations page
- `client-groups.tsx` - Client groups page
- `trip-categories.tsx` - Trip categories page
- `driver-mobile.tsx` - Driver mobile page

## **📁 FILE STRUCTURE**

### **Server Files**
- `corporate-clients-storage.ts` - Corporate client storage
- `programs-storage.ts` - Program storage
- `locations-storage.ts` - Location storage
- `client-groups-storage.ts` - Client group storage
- `users-storage.ts` - User storage
- `drivers-storage.ts` - Driver storage
- `trips-storage.ts` - Trip storage

### **Client Files**
- `CorporateClientSelector.tsx` - Corporate client selector
- `ProgramDashboard.tsx` - Program dashboard
- `LocationManagement.tsx` - Location management
- `ClientGroupSelector.tsx` - Client group selector
- `TripCategorySelector.tsx` - Trip category selector
- `DriverMobileDashboard.tsx` - Driver mobile dashboard

## **🔄 DATA FLOW**

1. **Database** → **Backend Storage** → **API Response** → **Frontend**
2. **snake_case** → **camelCase** → **camelCase** → **camelCase**

### **Example:**
```typescript
// Database (snake_case)
{
  user_id: "user_123",
  primary_program_id: "program_456",
  corporate_client_id: "monarch",
  created_at: "2024-01-01T00:00:00Z"
}

// Backend Storage (camelCase)
{
  userId: "user_123",
  primaryProgramId: "program_456",
  corporateClientId: "monarch",
  createdAt: "2024-01-01T00:00:00Z"
}

// Frontend (camelCase)
const user = {
  userId: "user_123",
  primaryProgramId: "program_456",
  corporateClientId: "monarch",
  createdAt: "2024-01-01T00:00:00Z"
};
```

## **⚠️ EXCEPTIONS**

### **Standard HTTP Headers**
- `Content-Type` - Keep as is
- `Cache-Control` - Keep as is
- `Authorization` - Keep as is
- `Accept` - Keep as is
- `Origin` - Keep as is
- `X-Requested-With` - Keep as is

### **Database Fields**
- All database fields remain in `snake_case` as they are the source of truth
- Conversion to `camelCase` happens in the storage layer

## **✅ ENFORCEMENT**

- **ESLint**: Enforces naming conventions in code
- **TypeScript**: Provides type safety
- **Code Reviews**: Manual verification
- **Documentation**: This file serves as reference

## **🔄 MIGRATION**

When updating existing code:
1. Update database fields to `snake_case`
2. Update backend storage to convert to `camelCase`
3. Update frontend to use `camelCase`
4. Update API routes to use `camelCase`
5. Update components to use `camelCase`
6. Update types to use `camelCase`



