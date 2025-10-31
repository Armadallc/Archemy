# HALCYON NMT Transportation System - Architectural Reference

## Project Overview

**HALCYON NMT Transportation System** is a comprehensive transportation management platform designed for non-medical transportation services, specifically built for corporate clients managing multiple programs and locations.

---

## ARCHITECTURAL BLUEPRINT

### **Organizational Hierarchy**
```
Corporate Clients
    ↓
Programs (formerly Organizations)
    ↓
Locations (formerly Service Areas)
    ↓
Clients/Patients (passive entities)
```

### **Role-Based Access Control (5-Tier System)**
1. **`super_admin`** - System-wide access, can manage all corporate clients
2. **`corporate_admin`** - Corporate client level access, manages all programs within their corporate client
3. **`program_admin`** - Program level access, manages all locations and users within their program
4. **`program_user`** - Program user access, can manage trips and clients within their program
5. **`driver`** - Driver access, can view and update their assigned trips

### **Core Entities**

#### **Corporate Clients**
- **Purpose**: Top-level organizational structure
- **Fields**: `id`, `name`, `description`, `address`, `phone`, `email`, `website`, `logo_url`, `is_active`
- **Relationships**: One-to-many with Programs

#### **Programs** (formerly Organizations)
- **Purpose**: Mid-level organizational structure
- **Fields**: `id`, `name`, `description`, `corporate_client_id`, `address`, `phone`, `email`, `logo_url`, `is_active`
- **Relationships**: Belongs to Corporate Client, has many Locations and Users

#### **Locations** (formerly Service Areas)
- **Purpose**: Physical locations where services are provided
- **Fields**: `id`, `name`, `description`, `program_id`, `address`, `phone`, `contact_person`, `latitude`, `longitude`, `is_active`
- **Relationships**: Belongs to Program, has many Clients

#### **Clients** (Passive Entities)
- **Purpose**: Service recipients (patients, clients)
- **Fields**: `id`, `first_name`, `last_name`, `program_id`, `location_id`, `phone`, `email`, `address`, `date_of_birth`, `emergency_contact_name`, `emergency_contact_phone`, `medical_conditions`, `special_requirements`, `billing_pin`, `is_active`
- **Relationships**: Belongs to Program and Location

### **Trip Management System**

#### **Trip Categories** (8 Categories per Program)
1. **Medical** - Medical appointments and healthcare visits
2. **Legal** - Legal appointments and court visits
3. **Personal** - Personal errands and appointments
4. **Program** - Program-related activities and meetings
5. **12-Step** - 12-Step program meetings and activities
6. **Group** - Group activities and outings
7. **Staff** - Staff transportation and meetings
8. **Carpool** - Carpool and shared transportation

#### **Trip Types**
- **Individual vs Group** - Single passenger or multiple passengers
- **One-way vs Round-trip** - Single destination or return journey

#### **Trip Statuses**
- `scheduled` - Trip is scheduled but not confirmed
- `confirmed` - Trip is confirmed and ready
- `in_progress` - Trip is currently in progress
- `completed` - Trip has been completed
- `cancelled` - Trip has been cancelled

### **Driver & Vehicle Ecosystem**

#### **Drivers**
- **Fields**: `id`, `user_id`, `program_id`, `license_number`, `license_expiry`, `phone`, `emergency_contact`, `current_vehicle_id`, `is_active`
- **Relationships**: Belongs to User and Program, can be assigned to Vehicles

#### **Vehicles**
- **Fields**: `id`, `program_id`, `make`, `model`, `year`, `license_plate`, `vin`, `color`, `capacity`, `vehicle_type`, `fuel_type`, `current_driver_id`, `notes`, `is_active`
- **Types**: `sedan`, `suv`, `van`, `bus`, `wheelchair_accessible`
- **Fuel Types**: `gasoline`, `diesel`, `electric`, `hybrid`

#### **Vehicle Management**
- **Assignments** - Track which driver is assigned to which vehicle
- **Maintenance** - Track maintenance history, costs, and schedules
- **Schedules** - Weekly driver schedules and availability

### **Calendar System Architecture**

#### **3-Tier Calendar System**
1. **Program Calendar** - Program-level trip scheduling
2. **Corporate Calendar** - Corporate client level overview
3. **Universal Calendar** - Cross-client calendar for optimization

#### **Features**
- **Ride Sharing Optimization** - Automatically optimize routes and share rides
- **Capacity Planning** - Predictive capacity planning
- **Recurring Trips** - Support for recurring trip patterns
- **Group Trip Management** - Manage group trips and client groups

### **Mobile App Experience**

#### **Driver Dashboard**
- **Profile Management** - Update driver profile and availability
- **Trip Management** - View and update assigned trips
- **Location Tracking** - GPS tracking and location sharing
- **Duty Status** - Update duty status (off_duty, on_duty, on_trip, break, unavailable)
- **Offline Sync** - Offline capability with data synchronization

#### **Features**
- **Real-time Updates** - Live trip status updates
- **GPS Integration** - Location tracking and navigation
- **Push Notifications** - Trip reminders and updates
- **Offline Support** - Work without internet connection

### **Notification System**

#### **Multi-Channel Notifications**
- **Push Notifications** - Mobile app notifications
- **SMS** - Text message notifications
- **Email** - Email notifications

#### **Notification Types**
- **Trip Reminders** - Advance trip notifications
- **Driver Updates** - Driver status and location updates
- **System Alerts** - System-wide alerts and notifications
- **Maintenance Reminders** - Vehicle maintenance notifications

#### **User Preferences**
- **Channel Selection** - Choose notification channels
- **Timing Control** - Set advance notification times
- **Quiet Hours** - Set do-not-disturb periods
- **Timezone Support** - Respect user timezones

### **Analytics & Optimization**

#### **Reporting Engine**
- **Trip Statistics** - Trip completion rates, delays, cancellations
- **Driver Performance** - Driver efficiency and reliability metrics
- **Cost Tracking** - Transportation cost analysis
- **Client Satisfaction** - Client feedback and satisfaction metrics

#### **Optimization Features**
- **Route Optimization** - Automatic route planning and optimization
- **Ride Sharing** - Match compatible trips for sharing
- **Capacity Planning** - Predictive capacity and resource planning
- **Recurring Trip Analysis** - Identify patterns and optimize recurring trips

---

## 📁 LEGACY FILES REFERENCE

### **🗑️ FILES REMOVED (40+ files)**

#### **Migration & Backup Files**
```
server/
├── add-cancellation-fields.sql
├── add-client-group-id-to-trips-v2.sql
├── add-recurring-trip-id-to-trips-v2.sql
├── auth-old.ts
├── CHECK_*.sql (all check files)
├── cleanup_*.sql (all cleanup files)
├── COMPLETE_CLEANUP_*.sql
├── COMPREHENSIVE_CLEANUP_*.sql
├── corporate-clients-migration.sql
├── create-driver-locations-table.sql
├── create-table-manual.sql
├── create-tables.ts
├── create-vehicle-tables.ts
├── create-vehicles-table.ts
├── database-routes.ts
├── DELETE_TRIPS_*.sql (all delete files)
├── drop-old-users-table.sql
├── FINAL_CLEANUP_*.sql
├── FIXED_*.sql (all fixed files)
├── make-client-id-nullable-trips-v2.sql
├── migration_phase1a_*.sql
├── REASSIGN_TRIPS_*.sql
├── RENAME_TABLES_*.sql
├── rename-tables-direct.js
├── restore-schema-to-d8bfd17.sql
├── REVERT_TABLE_RENAME_*.sql
├── run-schema-restoration.js
├── SIMPLE_CLEANUP_*.sql
├── simple-storage.ts
├── storage.ts.backup
├── supabase-storage.ts
├── supabase.ts
├── update-cross-org-access.ts
└── validation-middleware.ts
```

#### **Client-Side Removed Files**
```
client/src/
├── lib/queryConfig.ts
├── hooks/useOptimizedQueries.ts
├── pages/clients-optimized.tsx
├── lib/errorHandling.ts
├── components/ErrorBoundary.tsx
├── hooks/useEnhancedToast.ts
├── lib/enhancedApiRequest.ts
├── pages/clients-enhanced.tsx
└── components/booking/ (if any legacy booking components)
```

#### **Configuration Files Removed**
```
├── .prettierrc
├── .eslintignore
├── .prettierignore
├── .vscode/settings.json
├── LINTING_AND_FORMATTING.md
├── ARCHITECTURAL_STYLE_GUIDE.md
├── tests/naming-conventions.test.ts
├── .husky/pre-commit
├── vitest.config.ts
├── tests/setup.ts
├── ARCHITECTURAL_IMPLEMENTATION_SUMMARY.md
├── REACT_QUERY_OPTIMIZATION_GUIDE.md
└── ERROR_HANDLING_IMPROVEMENTS_GUIDE.md
```

### **✏️ FILES COMPLETELY REWRITTEN**

#### **Server Core Architecture**
```
server/
├── minimal-supabase.ts          # Complete rewrite for new schema
├── auth.ts                      # New 5-tier role system
├── permissions.ts               # Simplified permission system
├── environment-config.ts        # New organizational structure
├── api-routes.ts               # All endpoints updated
├── index.ts                    # CORS and middleware updates
└── db.ts                       # Connection logic updates
```

#### **Frontend Core Files**
```
client/src/
├── lib/environment.ts           # New organizational structure
├── hooks/useAuth.tsx           # Updated for new roles
├── hooks/useOrganization.tsx   # Programs/locations instead of organizations
├── components/layout/sidebar.tsx    # New navigation structure
├── components/layout/header.tsx     # Updated header
├── pages/dashboard.tsx         # Complete rewrite for new architecture
├── pages/trips.tsx             # Updated trip management
├── pages/clients.tsx           # Updated client management
├── pages/drivers.tsx           # Updated driver management
├── pages/users.tsx             # Updated user management
└── pages/service-areas.tsx     # Replaced with locations
```

### **🆕 NEW FILES CREATED**

#### **Server - Core Storage Files**
```
server/
├── trip-categories-storage.ts      # Trip category management
├── enhanced-trips-storage.ts       # Advanced trip management
├── driver-schedules-storage.ts     # Driver scheduling system
├── vehicles-storage.ts             # Vehicle fleet management
├── calendar-system.ts              # 3-tier calendar system
├── mobile-api.ts                   # Mobile app API endpoints
├── notification-system.ts          # Multi-channel notifications
└── create-complete-schema.sql      # Complete database schema
```

#### **Server - Utility Files**
```
server/
├── create-super-admin.js           # Super admin creation script
├── test-database.js                # Database testing script
├── validate-schema.js              # Schema validation script
├── deploy-schema.js                # Schema deployment script
├── simple-deploy-schema.js         # Alternative deployment script
└── DEPLOYMENT_GUIDE.md             # Manual deployment instructions
```

#### **Configuration Files**
```
├── .eslintrc.json                  # ESLint configuration
├── NAMING_CONVENTIONS.md           # Naming conventions documentation
└── ARCHITECTURAL_REFERENCE.md      # This reference file
```

### **📝 FILES PARTIALLY UPDATED**

#### **Server Files**
```
server/
├── webhook-routes.ts               # Updated for new structure
├── upload.ts                       # Updated file handling
└── notification-service.ts         # Updated notification logic
```

#### **Frontend Files**
```
client/src/
├── App.tsx                         # Updated routing
├── main.tsx                        # Updated app initialization
├── components/TripCalendar.tsx     # Updated calendar logic
├── components/RecentActivity.tsx   # Updated activity display
├── components/stats/dashboard-stats.tsx  # Updated statistics
└── lib/types.ts                    # Updated type definitions
```

---

## 🔄 NAMING CONVENTIONS

### **Database (snake_case)**
- Table names: `corporate_clients`, `programs`, `locations`
- Column names: `user_id`, `primary_program_id`, `corporate_client_id`
- Function names: `update_updated_at_column`

### **Backend (camelCase)**
- Function names: `getAllCorporateClients`, `createUser`
- Variable names: `currentProgram`, `primaryProgramId`
- File names: `trip-categories-storage.ts`

### **Frontend (camelCase)**
- Component names: `CorporateClientSelector`, `ProgramDashboard`
- Hook names: `useCorporateClients`, `usePrograms`
- Variable names: `currentProgram`, `setCurrentProgram`

---

## 🗄️ DATABASE SCHEMA

### **Core Tables (22 total)**
1. `corporate_clients` - Corporate client management
2. `programs` - Program management (renamed from organizations)
3. `locations` - Location management (renamed from service_areas)
4. `users` - User management with 5-tier roles
5. `clients` - Client/patient management
6. `client_groups` - Group trip management
7. `client_group_memberships` - Group memberships
8. `drivers` - Driver management
9. `vehicles` - Vehicle fleet management
10. `vehicle_assignments` - Vehicle-driver assignments
11. `vehicle_maintenance` - Maintenance tracking
12. `trip_categories` - Trip category system
13. `trips` - Enhanced trip management
14. `driver_schedules` - Weekly driver schedules
15. `driver_duty_status` - Real-time driver status
16. `driver_locations` - GPS tracking
17. `notification_templates` - Notification templates
18. `notifications` - Notification management
19. `notification_deliveries` - Delivery tracking
20. `notification_preferences` - User preferences
21. `trip_status_logs` - Audit trail
22. `offline_updates` - Mobile sync support

### **Views (2 total)**
1. `program_hierarchy` - Program hierarchy view
2. `trip_statistics` - Trip statistics view

---

## 🚀 DEPLOYMENT STATUS

### **✅ Completed**
- [x] Database schema deployed to Supabase
- [x] All 22 tables created with relationships
- [x] Initial seed data inserted
- [x] Row Level Security enabled
- [x] Backend server running on port 8081
- [x] Super admin user created
- [x] API endpoints functional
- [x] Frontend components updated

### **🔄 In Progress**
- [ ] Frontend testing and integration
- [ ] User role testing
- [ ] Trip management testing
- [ ] Mobile app testing

### **📋 Pending**
- [ ] Production deployment
- [ ] Performance optimization
- [ ] Security audit
- [ ] User acceptance testing

---

## 🔐 AUTHENTICATION

### **Super Admin Credentials**
- **Email**: `admin@monarch.com`
- **Password**: `admin123`
- **Role**: `super_admin`
- **Access**: Full system access

### **API Endpoints**
- `POST /api/auth/login` - Standard user login
- `POST /api/auth/super-admin-login` - Super admin login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

---

## 📊 SYSTEM CAPABILITIES

### **Trip Management**
- ✅ 8 trip categories per program
- ✅ Individual and group trips
- ✅ One-way and round-trip support
- ✅ Recurring trip patterns
- ✅ Real-time status updates
- ✅ GPS tracking integration

### **Driver Management**
- ✅ Driver profiles and schedules
- ✅ Vehicle assignments
- ✅ Duty status tracking
- ✅ GPS location tracking
- ✅ Mobile app support

### **Client Management**
- ✅ Client profiles and groups
- ✅ Location assignments
- ✅ Medical conditions tracking
- ✅ Emergency contact management
- ✅ Privacy controls

### **Calendar System**
- ✅ 3-tier calendar architecture
- ✅ Program, corporate, and universal views
- ✅ Ride sharing optimization
- ✅ Capacity planning
- ✅ Recurring trip management

### **Notification System**
- ✅ Multi-channel notifications (push, SMS, email)
- ✅ User-configurable preferences
- ✅ Scheduled notifications
- ✅ Real-time updates

---

## 🎯 NEXT STEPS

1. **Frontend Testing** - Test all components with new backend
2. **User Management** - Create users with different roles
3. **Trip Management** - Test trip creation and management
4. **Mobile App** - Test mobile driver functionality
5. **Production Deployment** - Deploy to production environment

---

**Last Updated**: 2024-01-01  
**Version**: 2.0.0  
**Status**: Development Complete, Testing Phase



