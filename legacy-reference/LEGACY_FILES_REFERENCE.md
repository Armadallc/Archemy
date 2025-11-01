# Legacy Files Reference - HALCYON NMT Transportation System

## 📋 Overview

This document provides a comprehensive reference of all legacy files that were modified, updated, replaced, or removed during the architectural transformation from the old organization-based system to the new corporate client → programs → locations hierarchy.

---

## 🗑️ FILES COMPLETELY REMOVED (40+ files)

### **Migration & Backup Files (25+ files)**
These files were created during various migration attempts and are no longer needed:

```
server/
├── add-cancellation-fields.sql                    # Added cancellation fields to trips
├── add-client-group-id-to-trips-v2.sql           # Added client group support
├── add-recurring-trip-id-to-trips-v2.sql         # Added recurring trip support
├── auth-old.ts                                    # Old authentication system
├── CHECK_*.sql (multiple files)                  # Database check scripts
├── cleanup_*.sql (multiple files)                # Database cleanup scripts
├── COMPLETE_CLEANUP_*.sql (multiple files)       # Complete cleanup scripts
├── COMPREHENSIVE_CLEANUP_*.sql (multiple files)  # Comprehensive cleanup scripts
├── corporate-clients-migration.sql               # Corporate client migration
├── create-driver-locations-table.sql             # Driver locations table creation
├── create-table-manual.sql                       # Manual table creation
├── create-tables.ts                              # Table creation script
├── create-vehicle-tables.ts                      # Vehicle tables creation
├── create-vehicles-table.ts                      # Vehicles table creation
├── database-routes.ts                            # Database-specific routes
├── DELETE_TRIPS_*.sql (multiple files)           # Trip deletion scripts
├── drop-old-users-table.sql                      # Drop old users table
├── FINAL_CLEANUP_*.sql (multiple files)          # Final cleanup scripts
├── FIXED_*.sql (multiple files)                  # Fixed migration scripts
├── make-client-id-nullable-trips-v2.sql          # Made client_id nullable
├── migration_phase1a_*.sql (multiple files)      # Phase 1a migration scripts
├── REASSIGN_TRIPS_*.sql (multiple files)         # Trip reassignment scripts
├── RENAME_TABLES_*.sql (multiple files)          # Table rename scripts
├── rename-tables-direct.js                       # Direct table renaming
├── restore-schema-to-d8bfd17.sql                 # Schema restoration script
├── REVERT_TABLE_RENAME_*.sql (multiple files)    # Table rename reversion
├── run-schema-restoration.js                     # Schema restoration runner
├── SIMPLE_CLEANUP_*.sql (multiple files)         # Simple cleanup scripts
├── simple-storage.ts                             # Simple storage implementation
├── storage.ts.backup                             # Storage backup
├── supabase-storage.ts                           # Supabase storage implementation
├── supabase.ts                                   # Supabase client
├── update-cross-org-access.ts                    # Cross-organization access
└── validation-middleware.ts                      # Validation middleware
```

### **Client-Side Removed Files (10+ files)**
These files were part of optimization attempts and are no longer needed:

```
client/src/
├── lib/queryConfig.ts                            # React Query configuration
├── hooks/useOptimizedQueries.ts                  # Optimized query hooks
├── pages/clients-optimized.tsx                   # Optimized clients page
├── lib/errorHandling.ts                          # Error handling utilities
├── components/ErrorBoundary.tsx                  # Error boundary component
├── hooks/useEnhancedToast.ts                     # Enhanced toast hooks
├── lib/enhancedApiRequest.ts                     # Enhanced API request utilities
├── pages/clients-enhanced.tsx                    # Enhanced clients page
└── components/booking/ (legacy booking components)
```

### **Configuration Files Removed (15+ files)**
These files were part of various configuration attempts:

```
├── .prettierrc                                   # Prettier configuration
├── .eslintignore                                 # ESLint ignore file
├── .prettierignore                               # Prettier ignore file
├── .vscode/settings.json                         # VS Code settings
├── LINTING_AND_FORMATTING.md                     # Linting documentation
├── ARCHITECTURAL_STYLE_GUIDE.md                  # Style guide
├── tests/naming-conventions.test.ts              # Naming convention tests
├── .husky/pre-commit                             # Pre-commit hooks
├── vitest.config.ts                              # Vitest configuration
├── tests/setup.ts                                # Test setup
├── ARCHITECTURAL_IMPLEMENTATION_SUMMARY.md       # Implementation summary
├── REACT_QUERY_OPTIMIZATION_GUIDE.md             # React Query guide
├── ERROR_HANDLING_IMPROVEMENTS_GUIDE.md          # Error handling guide
└── server/vite.ts                                # Vite server configuration
```

---

## ✏️ FILES COMPLETELY REWRITTEN

### **Server Core Architecture (7 files)**

#### **`server/minimal-supabase.ts`**
- **Before**: Organization-based storage functions
- **After**: Corporate client → programs → locations hierarchy
- **Changes**: 
  - Added `corporateClientsStorage`
  - Updated `programsStorage` (renamed from organizations)
  - Updated `locationsStorage` (renamed from service_areas)
  - Added new storage functions for all entities
  - Updated all CRUD operations for new schema

#### **`server/auth.ts`**
- **Before**: Simple role-based authentication
- **After**: 5-tier role hierarchy system
- **Changes**:
  - Added `super_admin`, `corporate_admin`, `program_admin`, `program_user`, `driver` roles
  - Updated permission system
  - Added corporate client and program access controls
  - Updated user creation and management

#### **`server/permissions.ts`**
- **Before**: Basic permission system
- **After**: Simplified, role-based permission system
- **Changes**:
  - Streamlined permission definitions
  - Added role-based access controls
  - Updated middleware functions

#### **`server/environment-config.ts`**
- **Before**: Organization-based configuration
- **After**: Corporate client and program-based configuration
- **Changes**:
  - Added corporate client configuration
  - Updated program configuration
  - Added location configuration
  - Updated trip categories and vehicle types

#### **`server/api-routes.ts`**
- **Before**: Basic API routes
- **After**: Comprehensive API with all new features
- **Changes**:
  - Added corporate client routes
  - Added program and location routes
  - Added trip category routes
  - Added enhanced trip management routes
  - Added driver schedule routes
  - Added vehicle management routes
  - Added calendar system routes
  - Added mobile API routes
  - Added notification system routes

#### **`server/index.ts`**
- **Before**: Basic Express server
- **After**: Enhanced server with new features
- **Changes**:
  - Updated CORS configuration
  - Added user creation endpoint
  - Updated middleware
  - Fixed Vite integration issues

#### **`server/db.ts`**
- **Before**: Basic database connection
- **After**: Enhanced connection with new schema
- **Changes**:
  - Updated connection configuration
  - Added new table references
  - Updated test queries

### **Frontend Core Files (10+ files)**

#### **`client/src/lib/environment.ts`**
- **Before**: Organization-based configuration
- **After**: Corporate client and program-based configuration
- **Changes**:
  - Added corporate client configuration
  - Updated program configuration
  - Added location configuration
  - Added trip categories and vehicle types
  - Added calendar and mobile configuration

#### **`client/src/hooks/useAuth.tsx`**
- **Before**: Basic authentication hook
- **After**: Enhanced authentication with new roles
- **Changes**:
  - Updated user interface
  - Added role-based access controls
  - Updated authentication flow

#### **`client/src/hooks/useOrganization.tsx`**
- **Before**: Organization-based context
- **After**: Program-based context
- **Changes**:
  - Renamed to `useProgram` context
  - Updated to handle programs instead of organizations
  - Added corporate client support

#### **`client/src/pages/dashboard.tsx`**
- **Before**: Basic dashboard
- **After**: Comprehensive dashboard with new architecture
- **Changes**:
  - Updated to use programs instead of organizations
  - Added corporate client awareness
  - Updated component interfaces
  - Added new dashboard features

#### **`client/src/components/layout/sidebar.tsx`**
- **Before**: Organization-based navigation
- **After**: Program-based navigation
- **Changes**:
  - Updated navigation structure
  - Added program switching logic
  - Updated accessibility attributes

#### **`client/src/components/layout/header.tsx`**
- **Before**: Basic header
- **After**: Enhanced header with program information
- **Changes**:
  - Added program and corporate client display
  - Updated user information display
  - Added new header features

#### **`client/src/pages/trips.tsx`**
- **Before**: Basic trip management
- **After**: Enhanced trip management
- **Changes**:
  - Updated for new trip categories
  - Added group trip support
  - Updated trip status management

#### **`client/src/pages/clients.tsx`**
- **Before**: Basic client management
- **After**: Enhanced client management
- **Changes**:
  - Updated for new client structure
  - Added location assignment
  - Updated client group management

#### **`client/src/pages/drivers.tsx`**
- **Before**: Basic driver management
- **After**: Enhanced driver management
- **Changes**:
  - Updated for new driver structure
  - Added program assignment
  - Updated driver scheduling

#### **`client/src/pages/users.tsx`**
- **Before**: Basic user management
- **After**: Enhanced user management
- **Changes**:
  - Updated for new role system
  - Added program assignment
  - Updated permission management

---

## 🆕 NEW FILES CREATED

### **Server Storage Files (7 files)**

#### **`server/trip-categories-storage.ts`**
- **Purpose**: Trip category management
- **Features**: CRUD operations for trip categories
- **Integration**: Used by enhanced trips storage

#### **`server/enhanced-trips-storage.ts`**
- **Purpose**: Advanced trip management
- **Features**: 
  - Trip creation and management
  - Recurring trip support
  - Group trip support
  - Status management
- **Integration**: Used by API routes and mobile API

#### **`server/driver-schedules-storage.ts`**
- **Purpose**: Driver scheduling system
- **Features**:
  - Weekly schedule management
  - Duty status tracking
  - Availability queries
- **Integration**: Used by mobile API and calendar system

#### **`server/vehicles-storage.ts`**
- **Purpose**: Vehicle fleet management
- **Features**:
  - Vehicle CRUD operations
  - Maintenance tracking
  - Assignment management
- **Integration**: Used by driver management and mobile API

#### **`server/calendar-system.ts`**
- **Purpose**: 3-tier calendar system
- **Features**:
  - Program calendar
  - Corporate calendar
  - Universal calendar
  - Ride sharing optimization
- **Integration**: Used by API routes and dashboard

#### **`server/mobile-api.ts`**
- **Purpose**: Mobile app API endpoints
- **Features**:
  - Driver profile management
  - Trip management
  - Location tracking
  - Offline sync
- **Integration**: Used by mobile app

#### **`server/notification-system.ts`**
- **Purpose**: Multi-channel notification system
- **Features**:
  - Push notifications
  - SMS notifications
  - Email notifications
  - User preferences
- **Integration**: Used by trip management and mobile API

### **Utility Files (6 files)**

#### **`server/create-complete-schema.sql`**
- **Purpose**: Complete database schema
- **Features**: All tables, views, indexes, triggers, and seed data
- **Size**: 677 lines

#### **`server/create-super-admin.js`**
- **Purpose**: Super admin user creation
- **Features**: Creates super admin user with proper permissions
- **Usage**: Run once to create initial admin user

#### **`server/test-database.js`**
- **Purpose**: Database testing and validation
- **Features**: Tests all tables, views, and data
- **Usage**: Run to verify database functionality

#### **`server/validate-schema.js`**
- **Purpose**: Schema validation
- **Features**: Comprehensive schema validation
- **Usage**: Run after schema deployment

#### **`server/deploy-schema.js`**
- **Purpose**: Schema deployment
- **Features**: Automated schema deployment
- **Usage**: Deploy schema to Supabase

#### **`server/DEPLOYMENT_GUIDE.md`**
- **Purpose**: Manual deployment instructions
- **Features**: Step-by-step deployment guide
- **Usage**: Manual schema deployment

### **Configuration Files (3 files)**

#### **`.eslintrc.json`**
- **Purpose**: ESLint configuration
- **Features**: Naming conventions and linting rules
- **Integration**: Used by development environment

#### **`NAMING_CONVENTIONS.md`**
- **Purpose**: Naming conventions documentation
- **Features**: Database, backend, and frontend conventions
- **Usage**: Development reference

#### **`ARCHITECTURAL_REFERENCE.md`**
- **Purpose**: Complete architectural reference
- **Features**: Blueprint, entities, and system capabilities
- **Usage**: Development and maintenance reference

---

## 📝 FILES PARTIALLY UPDATED

### **Server Files (3 files)**

#### **`server/webhook-routes.ts`**
- **Changes**: Updated for new organizational structure
- **Impact**: Webhook handling for new entities

#### **`server/upload.ts`**
- **Changes**: Updated file handling for new structure
- **Impact**: File uploads for new entities

#### **`server/notification-service.ts`**
- **Changes**: Updated notification logic
- **Impact**: Notifications for new features

### **Frontend Files (6 files)**

#### **`client/src/App.tsx`**
- **Changes**: Updated routing for new structure
- **Impact**: Navigation and page routing

#### **`client/src/main.tsx`**
- **Changes**: Updated app initialization
- **Impact**: App startup and configuration

#### **`client/src/components/TripCalendar.tsx`**
- **Changes**: Updated calendar logic
- **Impact**: Trip calendar functionality

#### **`client/src/components/RecentActivity.tsx`**
- **Changes**: Updated activity display
- **Impact**: Recent activity tracking

#### **`client/src/components/stats/dashboard-stats.tsx`**
- **Changes**: Updated statistics
- **Impact**: Dashboard statistics display

#### **`client/src/lib/types.ts`**
- **Changes**: Updated type definitions
- **Impact**: TypeScript type safety

---

## 🔄 NAMING CONVENTION CHANGES

### **Database Changes**
- `organizations` → `programs`
- `service_areas` → `locations`
- `primary_organization_id` → `primary_program_id`
- `organization_id` → `program_id`

### **Backend Changes**
- `currentOrganization` → `currentProgram`
- `setCurrentOrganization` → `setCurrentProgram`
- `useOrganization` → `useProgram`
- `OrganizationContext` → `ProgramContext`

### **Frontend Changes**
- `currentOrganization` → `currentProgram`
- `setCurrentOrganization` → `setCurrentProgram`
- `useOrganization` → `useProgram`
- `OrganizationContext` → `ProgramContext`

---

## 📊 IMPACT SUMMARY

### **Files Removed**: 40+ files
### **Files Completely Rewritten**: 17+ files
### **New Files Created**: 16+ files
### **Files Partially Updated**: 9+ files
### **Total Files Affected**: 82+ files

### **Major Changes**
1. **Organizational Structure**: Complete transformation from organizations to corporate clients → programs → locations
2. **Role System**: Updated from basic roles to 5-tier hierarchy
3. **Database Schema**: Complete rewrite with 22 new tables
4. **API Endpoints**: Comprehensive API with all new features
5. **Frontend Components**: Updated for new architecture
6. **Mobile Support**: Complete mobile app integration
7. **Notification System**: Multi-channel notification system
8. **Calendar System**: 3-tier calendar architecture

---

**Last Updated**: 2024-01-01  
**Version**: 2.0.0  
**Status**: Complete



