# HALCYON NMT - Entity Relationship Diagram

## **Database Schema Visualization**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                CORPORATE CLIENTS                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ id (VARCHAR) - Primary Key                                             │    │
│  │ name, description, address, phone, email, website, logo_url            │    │
│  │ is_active, created_at, updated_at                                      │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ 1:N
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   PROGRAMS                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ id (VARCHAR) - Primary Key                                             │    │
│  │ corporate_client_id (FK) → corporate_clients.id                        │    │
│  │ name, description, address, phone, email, logo_url                     │    │
│  │ is_active, created_at, updated_at                                      │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ 1:N
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 LOCATIONS                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ id (VARCHAR) - Primary Key                                             │    │
│  │ program_id (FK) → programs.id                                          │    │
│  │ name, description, address, phone, contact_person                      │    │
│  │ latitude, longitude, is_active, created_at, updated_at                 │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ 1:N
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENTS                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ id (VARCHAR) - Primary Key                                             │    │
│  │ program_id (FK) → programs.id                                          │    │
│  │ location_id (FK) → locations.id (optional)                             │    │
│  │ first_name, last_name, phone, email, address                           │    │
│  │ emergency_contact, emergency_phone, special_requirements               │    │
│  │ is_active, created_at, updated_at                                      │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ 1:N
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                    TRIPS                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ id (VARCHAR) - Primary Key                                             │    │
│  │ program_id (FK) → programs.id                                          │    │
│  │ pickup_location_id (FK) → locations.id (optional)                      │    │
│  │ dropoff_location_id (FK) → locations.id (optional)                     │    │
│  │ client_id (FK) → clients.id                                            │    │
│  │ driver_id (FK) → drivers.id (optional)                                 │    │
│  │ trip_type, pickup_address, dropoff_address                             │    │
│  │ scheduled_pickup_time, scheduled_return_time                           │    │
│  │ actual_pickup_time, actual_dropoff_time, actual_return_time            │    │
│  │ passenger_count, special_requirements, status, notes                   │    │
│  │ created_at, updated_at                                                 │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## **User and Driver Relationships**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                    USERS                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ user_id (VARCHAR) - Primary Key                                       │    │
│  │ corporate_client_id (FK) → corporate_clients.id                       │    │
│  │ primary_program_id (FK) → programs.id                                 │    │
│  │ user_name, email, password_hash, role                                 │    │
│  │ first_name, last_name (VARCHAR) - Professional display names          │    │
│  │ authorized_programs (TEXT[]), avatar_url, phone                       │    │
│  │ is_active, last_login, created_at, updated_at                         │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ 1:1
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   DRIVERS                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ id (VARCHAR) - Primary Key                                             │    │
│  │ user_id (FK) → users.user_id                                           │    │
│  │ program_id (FK) → programs.id                                          │    │
│  │ first_name, last_name (VARCHAR) - Professional display names          │    │
│  │ license_number, license_expiry, phone, emergency_contact (JSONB)       │    │
│  │ current_vehicle_id (FK) → vehicles.id (optional)                       │    │
│  │ is_active, created_at, updated_at                                      │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ 1:N
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 VEHICLES                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ id (VARCHAR) - Primary Key                                             │    │
│  │ program_id (FK) → programs.id                                          │    │
│  │ current_driver_id (FK) → drivers.id (optional)                         │    │
│  │ make, model, year, license_plate, vin, color, capacity                 │    │
│  │ vehicle_type, fuel_type, notes                                         │    │
│  │ is_active, created_at, updated_at                                      │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## **Supporting Tables**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT GROUPS                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ id (VARCHAR) - Primary Key                                             │    │
│  │ program_id (FK) → programs.id                                          │    │
│  │ name, description, is_active, created_at, updated_at                   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ 1:N
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT GROUP MEMBERSHIPS                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ id (VARCHAR) - Primary Key                                             │    │
│  │ client_group_id (FK) → client_groups.id                                │    │
│  │ client_id (FK) → clients.id                                            │    │
│  │ joined_at                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                               TRIP CATEGORIES                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ id (VARCHAR) - Primary Key                                             │    │
│  │ program_id (FK) → programs.id                                          │    │
│  │ name, description, is_active, created_at, updated_at                   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              VEHICLE ASSIGNMENTS                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ id (VARCHAR) - Primary Key                                             │    │
│  │ vehicle_id (FK) → vehicles.id                                          │    │
│  │ driver_id (FK) → drivers.id                                            │    │
│  │ program_id (FK) → programs.id                                          │    │
│  │ created_at                                                             │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## **Enhanced User Management System**

### **Flexible Authentication & Display**
- **Email as Username**: Users can log in with email address
- **Custom Usernames**: Professional usernames (e.g., `jdriver`, `sarah_wilson`)
- **Professional Names**: `first_name` + `last_name` for display
- **Smart Display Logic**: Driver professional name > User names > Username

### **Database Schema Enhancements**
```sql
-- Users table
ALTER TABLE users ADD COLUMN first_name VARCHAR(255);
ALTER TABLE users ADD COLUMN last_name VARCHAR(255);

-- Drivers table  
ALTER TABLE drivers ADD COLUMN first_name VARCHAR(255);
ALTER TABLE drivers ADD COLUMN last_name VARCHAR(255);
```

### **Display Name Priority**
1. **Driver Professional Name**: `drivers.first_name` + `drivers.last_name`
2. **User Names**: `users.first_name` + `users.last_name`
3. **Username Fallback**: `users.user_name`

### **Examples**
- **Trip Card**: "John Driver" instead of "jdriver"
- **Driver List**: "Sarah Wilson" instead of "sarah_wilson"
- **Search**: Find by "John", "Driver", "John Driver", or "jdriver"

## **Key Relationships Summary**

### **Primary Hierarchy**
1. **Corporate Clients** → **Programs** → **Locations/Clients/Drivers/Vehicles/Trips**

### **User System**
1. **Users** → **Drivers** (1:1)
2. **Users** → **Corporate Clients** (N:1)
3. **Users** → **Programs** (N:1)

### **Trip System**
1. **Trips** → **Programs** (N:1)
2. **Trips** → **Clients** (N:1)
3. **Trips** → **Drivers** (N:1, optional)
4. **Trips** → **Locations** (N:2, optional)

### **Vehicle System**
1. **Vehicles** → **Programs** (N:1)
2. **Vehicles** → **Drivers** (N:1, optional)
3. **Drivers** → **Users** (1:1)

### **Grouping System**
1. **Client Groups** → **Programs** (N:1)
2. **Client Group Memberships** → **Client Groups** (N:1)
3. **Client Group Memberships** → **Clients** (N:1)

## **Cascade Rules**

### **Hard Cascades (DELETE CASCADE)**
- **Corporate Clients** → **Programs**
- **Programs** → **Locations**, **Clients**, **Drivers**, **Vehicles**, **Trips**
- **Users** → **Drivers**

### **Soft Cascades (SET NULL)**
- **Clients** → **Trips** (client_id set to null)
- **Drivers** → **Vehicles** (current_driver_id set to null)

### **No Cascades (RESTRICT)**
- **Users** → **Corporate Clients** (prevent deletion if users exist)
- **Programs** → **Corporate Clients** (prevent deletion if programs exist)

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Status**: Ready for Implementation
