# HALCYON Telematics MVP - Summary & Execution Plan

**Date:** December 18, 2024  
**Status:** Planning Phase  
**Priority:** Revenue Critical Features First

---

## 📋 EXECUTIVE SUMMARY

This document outlines the implementation plan for HALCYON Telematics MVP, focusing on integrating existing infrastructure rather than building from scratch. The plan prioritizes revenue-critical features and leverages existing systems where possible.

### Top 5 Must-Haves (MVP Priority)
1. ✅ **GPS Tracking** - Partially exists, needs enhancement
2. ❌ **Trip Purpose Coding** - Needs to be built (Legal, Groceries, Community, Program (adjacent), Medical, Non-Medical)
3. ❌ **Mileage by Service Type** - Needs to be built (with Legs system: Leg A, Leg B, etc.)
4. ⚠️ **Driver Safety Monitoring** - Basic exists, needs enhancement
5. ❌ **HCBS Waiver Eligibility Verification** - Needs to be built

### Revenue Critical Features
- Accurate mileage tracking (by trip type, billing code, per leg)
- Wait time logging (separate timer, can start/stop without completing trip)
- Round trip verification
- Trip Code (CPT/HCPCS) integration with Prophet calculator
- Modifier selection (2 uppercase letters, only when Trip Code selected)

### Key Requirements (Updated)
- **Trip Purpose Options:** Legal, Groceries, Community, Program (adjacent), Medical, Non-Medical
- **Trip Code (Billing Code):** Optional CPT/HCPCS codes (A0120, T2001, T2004, etc.) from Prophet calculator
- **Modifier:** 2 uppercase letters (e.g., "HA"), only shown if Trip Code is selected
- **Client Groups:** Can have trip_purpose assigned (purpose doesn't change even if clients in group change)
- **Trip Legs System:** 
  - Leg A = Initial pickup to first dropoff
  - Leg B = Additional legs (return home, additional pickups/dropoffs)
  - Multiple legs per trip supported
  - Each leg has: mileage, estimated time, actual time
- **Mileage Tracking:**
  - Appointment time
  - Pickup time (calculated from current location to PU location)
  - Miles between PU & DO
  - Approx time to PU location from current location
  - EST Time per leg and total trip
- **Wait Time Timer:** Separate button in mobile app, can start/stop without completing trip (for client appointments)

---

## 🔍 EXISTING INFRASTRUCTURE ANALYSIS

### ✅ **ALREADY BUILT - Can Integrate/Enhance**

#### 1. GPS & Location Tracking
**Status:** ✅ Built, needs enhancement
- **Location:** `server/mobile-api.ts`, `shared/schema.ts` (driver_locations table)
- **Features:**
  - `driver_locations` table with lat/lng, speed, heading, timestamp
  - `updateDriverLocation()` API endpoint
  - Mobile app location tracking (10-second intervals)
  - Emergency location tracking
- **Enhancement Needed:**
  - Increase update frequency to 30-60 seconds for telematics
  - Add vehicle_id to location tracking
  - Store location history for route adherence
  - Add trip_id linkage to locations

#### 2. Trip Tracking & Times
**Status:** ✅ Built, needs enhancement
- **Location:** `server/enhanced-trips-storage.ts`, `client/src/services/tripTracking.ts`
- **Features:**
  - `actual_pickup_time`, `actual_dropoff_time`, `actual_return_time` fields
  - Trip status workflow (scheduled → in_progress → completed)
  - Location capture on trip start/end
  - Distance calculation (basic)
- **Enhancement Needed:**
  - Add `wait_time_minutes` field
  - Add `trip_purpose` field (BHST, NEMT, NMT, Legal, Community)
  - Add `service_code_id` field (link to Prophet service codes)
  - Add `billing_code` field
  - Enhanced route tracking (store waypoints)

#### 3. Mileage Tracking
**Status:** ⚠️ Partially built
- **Location:** `client/src/services/tripTracking.ts`, `client/src/lib/location.ts`
- **Features:**
  - Distance calculation between start/end points
  - `distance_miles` stored in trip notes (not structured)
- **Enhancement Needed:**
  - Add `distance_miles` column to trips table
  - Track mileage by service type
  - Separate loaded vs. deadhead miles
  - Calculate round trip mileage

#### 4. Vehicle Management
**Status:** ✅ Built
- **Location:** `server/vehicles-storage.ts`, `shared/schema.ts`
- **Features:**
  - `vehicles` table (make, model, year, license_plate, status)
  - `vehicle_assignments` table (driver-vehicle assignments)
  - `vehicle_maintenance` table (maintenance history, next_due_date)
  - Vehicle status tracking (active, maintenance, inactive)
- **Enhancement Needed:**
  - Add mileage-based maintenance alerts
  - Add insurance/registration expiry tracking
  - Calculate vehicle utilization rate

#### 5. Incident Reporting
**Status:** ✅ Built (Emergency System)
- **Location:** `mobile/services/emergency.ts`
- **Features:**
  - `reportIncident()` function with location, timestamp, severity
  - Emergency/incident types
  - WebSocket real-time alerts
- **Enhancement Needed:**
  - Create dedicated incident reports table
  - Add incident report templates
  - Web app form for follow-up reports
  - Link incidents to trips/drivers/vehicles

#### 6. Service Codes & Billing
**Status:** ✅ Built (Prophet Calculator)
- **Location:** `client/src/components/prophet/data/coloradoMedicaidCodes.ts`
- **Features:**
  - BHST codes (A0999-ET, A0425-ET)
  - NEMT codes (A0120, A0130, A0100, T2005)
  - NMT codes (T2003-U1/U2/U3/U4, H2014-UA, 97537)
  - Service code library with rates, modifiers, restrictions
- **Enhancement Needed:**
  - Link service codes to trips
  - Create trip purpose coding system
  - Add billing code selection to trip creation

#### 7. Performance Metrics (Basic)
**Status:** ⚠️ Partially built
- **Location:** `client/src/components/dashboard/PerformanceMetricsWidget.tsx`
- **Features:**
  - Completion rate calculation
  - On-time performance (placeholder)
  - Driver utilization (basic)
- **Enhancement Needed:**
  - Real on-time calculation (scheduled vs. actual)
  - Driver scorecard system
  - Route compliance tracking

#### 8. Driver Duty Status
**Status:** ✅ Built
- **Location:** `server/driver-schedules-storage.ts`, `shared/schema.ts`
- **Features:**
  - `driver_duty_status` table (off_duty, on_duty, on_trip, break, unavailable)
  - Real-time status tracking
  - Driver schedules (day of week, time blocks)
- **Enhancement Needed:**
  - Break compliance tracking
  - Shift pattern analysis

---

### ❌ **NEEDS TO BE BUILT**

#### 1. Trip Purpose Coding System
**Priority:** HIGH (Revenue Critical)
- **Database:** Add `trip_purpose` enum/field to trips table
- **Values:** BHST, NEMT, NMT, Legal, Community
- **UI:** Add dropdown to trip creation/edit forms
- **Integration:** Link to service codes for billing

#### 2. Wait Time Tracking
**Priority:** HIGH (Revenue Critical)
- **Database:** Add `wait_time_minutes` to trips table
- **Mobile:** Add wait time timer in trip details screen
- **Calculation:** Time between arrival at pickup and actual pickup
- **Billing:** Link to T2004 wait time billing code

#### 3. Mileage by Service Type
**Priority:** HIGH (Revenue Critical)
- **Database:** Add `distance_miles` column to trips table (structured)
- **Enhancement:** Track loaded vs. deadhead miles separately
- **Reporting:** Aggregate mileage by trip purpose/service type
- **Integration:** Use for Prophet calculator revenue analysis

#### 4. HCBS Waiver Eligibility Tracking
**Priority:** HIGH (Must-Have)
- **Database:** Add `hcbs_waiver_status` to clients table
- **Fields:** waiver_type (CMHS, DD, SLS), waiver_number, expiry_date, is_active
- **UI:** Add waiver section to client profile
- **Validation:** Check waiver status before trip creation for NMT trips

#### 5. Client Restrictions/Geofencing
**Priority:** MEDIUM (Behavioral Health Specific)
- **Database:** Add `client_restrictions` table
  - `client_id`, `restricted_address`, `restricted_radius_meters`, `restriction_type`
- **UI:** Add restrictions section to client profile
- **Mobile:** Show alert when driver has restricted client on trip
- **Logic:** Simple address-based check (no real-time geofencing needed)

#### 6. Driver Scorecard System
**Priority:** MEDIUM
- **Database:** Create `driver_metrics` table or calculate on-the-fly
- **Metrics:**
  - Safety score (based on incidents)
  - On-time performance (actual vs. scheduled)
  - Fuel efficiency (if we track fuel)
  - Route compliance (if we implement route tracking)
- **UI:** Create driver scorecard page/component

#### 7. Reviews/Ratings System
**Priority:** LOW (Nice to Have)
- **Database:** Create `driver_reviews` table
- **Features:**
  - Public review page (no login required)
  - 4-digit PIN authentication
  - Anonymous option
  - Approval workflow before posting
- **UI:** Public review form + admin approval interface

#### 8. Real-Time Alerts System
**Priority:** MEDIUM
- **Features:**
  - Speed limit exceedance (use speed from driver_locations)
  - Excessive idle detection
  - Vehicle not moving during shift
  - After-hours movement
- **Implementation:** Background job checking driver_locations + WebSocket alerts

#### 9. Route Adherence Tracking
**Priority:** LOW (User said not necessary if reasonable geofencing)
- **Enhancement:** Store planned route waypoints
- **Logic:** Compare actual route vs. planned (if needed later)
- **Alert:** Only if driver deviates significantly with restricted client

#### 10. Geofencing System
**Priority:** LOW (Simple alerts sufficient)
- **Implementation:** Simple address-based checks
- **No real-time monitoring needed** (per user requirements)
- **Alert:** Show "Red Flag" notice in mobile app when restricted client on trip

---

## 🎯 STREAMLINED EXECUTION PLAN

### **PHASE 1: Revenue Critical (Week 1-2)**

#### 1.1 Trip Purpose Coding & Service Code Integration
**Effort:** Medium-High
- Add `trip_purpose` enum field to trips table (Legal, Groceries, Community, Program (adjacent), Medical, Non-Medical)
- Add `trip_code` field to trips table (CPT/HCPCS code from Prophet - optional)
- Add `trip_modifier` field to trips table (2 uppercase letters, optional, only if trip_code selected)
- Add `trip_purpose` field to client_groups table (purpose for the group)
- Add `appointment_time` field to trips table
- Update trip creation/edit forms (web + mobile)
- Create "Trip Purpose Coding" page under Partner Management
- **Files to Modify:**
  - `server/create-complete-schema.sql` - Add columns
  - `shared/schema.ts` - Update TypeScript schema
  - `client/src/pages/telematics.tsx` - Add trip purpose coding section
  - Trip creation/edit forms (web)
  - `mobile/app/(tabs)/trip-details.tsx` - Add purpose display
  - Client groups form - Add trip_purpose selector

#### 1.2 Mileage Tracking Enhancement (Legs System)
**Effort:** High
- Create `trip_legs` table for multi-leg trip support
  - `leg_number` (A, B, C, etc.)
  - `from_address`, `to_address`
  - `distance_miles`
  - `estimated_time_minutes`
  - `actual_time_minutes`
  - `leg_type` (pickup_to_dropoff, return, additional_pickup, etc.)
- Add `appointment_time` to trips table
- Add pickup time calculation logic (current location to PU location)
- Add estimated time calculation per leg (using maps API, traffic, time of day)
- Calculate total trip time (sum of all legs)
- **Files to Create/Modify:**
  - `server/create-complete-schema.sql` - Create trip_legs table
  - `shared/schema.ts` - Add trip_legs schema
  - `client/src/services/tripTracking.ts` - Enhanced mileage/leg tracking
  - `server/routes/trips.ts` - Leg creation/update logic
  - Create leg calculation service (maps API integration)

#### 1.3 Wait Time Tracking
**Effort:** Medium
- Add `wait_time_minutes` to trips table
- Add `wait_time_started_at` and `wait_time_stopped_at` to trips table (for tracking)
- Add separate wait time timer button to mobile trip details screen
- **Key Requirement:** Timer can be started/stopped WITHOUT completing the trip (for client appointments)
- Calculate: time between wait start and wait stop
- Link to T2004 billing code for wait time billing
- **Files to Modify:**
  - `server/create-complete-schema.sql` - Add columns
  - `mobile/app/(tabs)/trip-details.tsx` - Add separate wait time timer button
  - `server/routes/trips.ts` - Wait time start/stop endpoints (separate from trip completion)
  - `server/mobile-api.ts` - Add wait time tracking endpoints

#### 1.4 Round Trip Verification
**Effort:** Low
- Use existing `trip_type` field ('one_way' | 'round_trip')
- Add verification logic: check if return trip exists
- Add billing validation: ensure round trips are billed correctly
- **Files to Modify:**
  - `server/routes/trips.ts` - Add round trip validation
  - Create billing validation service

---

### **PHASE 2: Must-Have Features (Week 2-3)**

#### 2.1 GPS Tracking Enhancement
**Effort:** Low
- Increase location update frequency to 30-60 seconds
- Add `vehicle_id` to driver_locations table
- Add `trip_id` to driver_locations table
- Store location history for route analysis
- **Files to Modify:**
  - `shared/schema.ts` - Update driver_locations schema
  - `server/mobile-api.ts` - Update location tracking
  - `mobile/services/api.ts` - Update location sending logic

#### 2.2 HCBS Waiver Eligibility Tracking
**Effort:** Medium
- Add waiver fields to clients table:
  - `hcbs_waiver_type` (CMHS, DD, SLS)
  - `hcbs_waiver_number`
  - `hcbs_waiver_expiry_date`
  - `hcbs_waiver_is_active`
- Add waiver section to client profile form
- Add validation: Check waiver before creating NMT trips
- **Files to Modify:**
  - `server/create-complete-schema.sql` - Add columns
  - `shared/schema.ts` - Update schema
  - `client/src/pages/clients.tsx` - Add waiver fields
  - `client/src/components/forms/ComprehensiveClientForm.tsx` - Add waiver section
  - `server/routes/trips.ts` - Add waiver validation

#### 2.3 Driver Safety Monitoring Enhancement
**Effort:** Medium
- Use existing incident reporting system
- Create driver safety score calculation
- Track incidents per driver
- Add safety metrics to driver profile
- **Files to Modify:**
  - Create `driver_safety_metrics` view or table
  - `client/src/pages/drivers.tsx` - Add safety scorecard
  - `server/routes/drivers.ts` - Add safety metrics endpoint

---

### **PHASE 3: Behavioral Health Specific (Week 3-4)**

#### 3.1 Client Restrictions System
**Effort:** Medium
- Create `client_restrictions` table
- Add restrictions UI to client profile
- Add "Red Flag" alert to mobile app when restricted client on trip
- Simple address-based check (no real-time geofencing)
- **Files to Create/Modify:**
  - `server/create-complete-schema.sql` - Create table
  - `client/src/pages/clients.tsx` - Add restrictions section
  - `mobile/app/(tabs)/trip-details.tsx` - Show restriction alerts

#### 3.2 Incident Report Templates & Forms
**Effort:** Medium
- Create `incident_report_templates` table
- Create `incident_reports` table (separate from emergency system)
- Add incident report form to mobile app
- Add follow-up incident report form to web app
- **Files to Create/Modify:**
  - `server/create-complete-schema.sql` - Create tables
  - `mobile/app/(tabs)/trip-details.tsx` - Add incident report button
  - `client/src/pages/incidents.tsx` - Create new page (or add to existing)

---

### **PHASE 4: Operational Efficiency (Week 4-5)**

#### 4.1 Vehicle Utilization Rate
**Effort:** Low
- Calculate: trips assigned to vehicle / total available time
- Use existing `vehicle_assignments` and `trips` tables
- Add utilization widget to telematics page
- **Files to Modify:**
  - `client/src/pages/telematics.tsx` - Add utilization metrics
  - Create utilization calculation service

#### 4.2 Maintenance Alerts Enhancement
**Effort:** Low
- Use existing `vehicle_maintenance` table
- Add mileage-based alerts (check vehicle mileage vs. next maintenance)
- Add time-based alerts (check next_due_date)
- **Files to Modify:**
  - `server/routes/vehicles.ts` - Add alert calculation
  - `client/src/pages/vehicles.tsx` - Show maintenance alerts

#### 4.3 Stop Duration Tracking
**Effort:** Low
- Calculate from `actual_pickup_time` and arrival time
- Store in `wait_time_minutes` (reuse field)
- Approximate is OK (per user requirements)

---

### **PHASE 5: Real-Time Alerts (Week 5-6)**

#### 5.1 Speed Monitoring
**Effort:** Low-Medium
- Use existing `speed` field in `driver_locations` table
- Create background job to check speed limits
- Send WebSocket alerts for exceedances
- **Files to Create/Modify:**
  - Create speed monitoring service
  - `server/websocket.ts` - Add speed alert broadcasting

#### 5.2 Idle Detection
**Effort:** Medium
- Track consecutive location updates with same coordinates
- Alert if vehicle idle > threshold (e.g., 15 minutes during shift)
- **Files to Create:**
  - Create idle detection service

#### 5.3 Vehicle Not Moving During Shift
**Effort:** Low
- Check if driver is `on_duty` or `on_trip` but no location updates
- Alert if no movement for extended period
- **Files to Create:**
  - Create movement monitoring service

---

### **PHASE 6: Analytics & Reporting (Week 6-7)**

#### 6.1 Telematics Analytics Dashboard
**Effort:** Medium
- Enhance existing `telematics.tsx` page
- Add charts for:
  - Mileage by service type
  - Trip purpose distribution
  - Wait time trends
  - Driver performance metrics
- **Files to Modify:**
  - `client/src/pages/telematics.tsx` - Add analytics widgets
  - Create telematics analytics hooks

#### 6.2 Integration with Prophet Calculator
**Effort:** Low
- Use existing Prophet calculator infrastructure
- Feed telematics data (mileage, trips) to Prophet
- Calculate cost per mile, revenue per available mile
- **Files to Modify:**
  - `client/src/components/prophet/hooks/useProphetStore.ts` - Add telematics data source

---

## 📊 DATABASE SCHEMA CHANGES NEEDED

### New Columns for `trips` Table:
```sql
-- Trip Purpose & Billing
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_purpose VARCHAR(20) CHECK (trip_purpose IN ('Legal', 'Groceries', 'Community', 'Program (adjacent)', 'Medical', 'Non-Medical'));
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_code VARCHAR(20); -- CPT/HCPCS code (A0120, T2001, T2004, etc.) - optional
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_modifier VARCHAR(2); -- 2 uppercase letters (e.g., 'HA') - optional, only if trip_code selected

-- Appointment & Timing
ALTER TABLE trips ADD COLUMN IF NOT EXISTS appointment_time TIMESTAMP WITH TIME ZONE; -- When client needs to be at appointment

-- Wait Time Tracking
ALTER TABLE trips ADD COLUMN IF NOT EXISTS wait_time_minutes INTEGER DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS wait_time_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS wait_time_stopped_at TIMESTAMP WITH TIME ZONE;

-- HCBS Waiver
ALTER TABLE trips ADD COLUMN IF NOT EXISTS hcbs_waiver_verified BOOLEAN DEFAULT false;
```

### New Table: `trip_legs`
```sql
CREATE TABLE IF NOT EXISTS trip_legs (
    id VARCHAR(50) PRIMARY KEY,
    trip_id VARCHAR(50) NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    leg_number VARCHAR(10) NOT NULL, -- 'A', 'B', 'C', etc.
    leg_type VARCHAR(50) NOT NULL CHECK (leg_type IN ('pickup_to_dropoff', 'return', 'additional_pickup', 'additional_dropoff')),
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    from_latitude DECIMAL(10, 8),
    from_longitude DECIMAL(11, 8),
    to_latitude DECIMAL(10, 8),
    to_longitude DECIMAL(11, 8),
    distance_miles DECIMAL(10, 2),
    estimated_time_minutes INTEGER, -- Calculated using maps API, traffic, time of day
    actual_time_minutes INTEGER, -- Actual time taken
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, leg_number)
);
```

### New Column for `client_groups` Table:
```sql
ALTER TABLE client_groups ADD COLUMN IF NOT EXISTS trip_purpose VARCHAR(20) CHECK (trip_purpose IN ('Legal', 'Groceries', 'Community', 'Program (adjacent)', 'Medical', 'Non-Medical'));
```

### New Columns for `clients` Table:
```sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS hcbs_waiver_type VARCHAR(10) CHECK (hcbs_waiver_type IN ('CMHS', 'DD', 'SLS'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS hcbs_waiver_number VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS hcbs_waiver_expiry_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS hcbs_waiver_is_active BOOLEAN DEFAULT false;
```

### New Tables:
```sql
-- Client Restrictions
CREATE TABLE client_restrictions (
    id VARCHAR(50) PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    restricted_address TEXT NOT NULL,
    restricted_radius_meters INTEGER DEFAULT 100,
    restriction_type VARCHAR(50), -- 'probation', 'ankle_monitor', 'court_order', etc.
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incident Reports (separate from emergency system)
CREATE TABLE incident_reports (
    id VARCHAR(50) PRIMARY KEY,
    trip_id VARCHAR(50) REFERENCES trips(id) ON DELETE SET NULL,
    driver_id VARCHAR(50) NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    client_id VARCHAR(50) REFERENCES clients(id) ON DELETE SET NULL,
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    location_address TEXT,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reported_by VARCHAR(50) NOT NULL, -- user_id
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incident Report Templates
CREATE TABLE incident_report_templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    fields JSONB, -- Flexible field definitions
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver Reviews
CREATE TABLE driver_reviews (
    id VARCHAR(50) PRIMARY KEY,
    driver_id VARCHAR(50) NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    trip_id VARCHAR(50) REFERENCES trips(id) ON DELETE SET NULL,
    reviewer_pin VARCHAR(4), -- 4-digit PIN for authentication
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    reviewer_name VARCHAR(255), -- Optional, if not anonymous
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by VARCHAR(50),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Enhance `driver_locations` Table:
```sql
ALTER TABLE driver_locations ADD COLUMN IF NOT EXISTS vehicle_id VARCHAR(50) REFERENCES vehicles(id) ON DELETE SET NULL;
ALTER TABLE driver_locations ADD COLUMN IF NOT EXISTS trip_id VARCHAR(50) REFERENCES trips(id) ON DELETE SET NULL;
```

---

## 🔗 INTEGRATION POINTS

### 1. Prophet Calculator Integration
- **Existing:** Service code library, revenue calculations
- **New Connection:** Feed telematics mileage/trip data to Prophet
- **Benefit:** Real-time cost per mile, revenue per available mile

### 2. Analytics Page Integration
- **Existing:** Analytics page with basic metrics
- **New Connection:** Add telematics-specific widgets
- **Benefit:** Unified analytics dashboard

### 3. Mobile App Integration
- **Existing:** Trip details screen, location tracking
- **New Connection:** Add wait time timer, restriction alerts, incident reporting
- **Benefit:** Complete telematics data capture at source

### 4. Billing System Integration
- **Existing:** Service codes, billing codes in Prophet
- **New Connection:** Link trip purpose/service code to billing
- **Benefit:** Automated billing code assignment

---

## 📝 IMPLEMENTATION PRIORITY

### **IMMEDIATE (Week 1)**
1. Trip purpose coding (database + UI)
2. Mileage tracking enhancement (structured storage)
3. Wait time tracking (mobile timer + storage)

### **HIGH PRIORITY (Week 2)**
4. HCBS waiver eligibility tracking
5. Service code integration with trips
6. Round trip verification

### **MEDIUM PRIORITY (Week 3-4)**
7. Client restrictions system
8. Incident report templates & forms
9. GPS tracking enhancement (vehicle_id, trip_id linkage)

### **LOW PRIORITY (Week 5+)**
10. Driver scorecards
11. Real-time alerts (speed, idle, etc.)
12. Reviews/ratings system
13. Advanced analytics

---

## 🎯 SUCCESS METRICS

### MVP Completion Criteria:
- ✅ Trip purpose can be assigned to all trips
- ✅ Mileage tracked and aggregated by service type
- ✅ Wait time logged and billable
- ✅ HCBS waiver status verified before NMT trips
- ✅ Basic driver safety monitoring operational
- ✅ Client restrictions visible to drivers

### Revenue Impact:
- Accurate billing code assignment
- Proper mileage tracking for billing
- Wait time billing enabled
- HCBS waiver compliance verified

---

## 📁 FILES TO CREATE/MODIFY

### New Files:
- `server/routes/telematics.ts` - Telematics-specific endpoints
- `server/services/telematicsService.ts` - Telematics business logic
- `client/src/pages/telematics.tsx` - Enhanced telematics page (already exists, enhance)
- `client/src/components/telematics/TripPurposeCoding.tsx` - Trip purpose management
- `client/src/components/telematics/ClientRestrictions.tsx` - Restrictions management
- `client/src/components/telematics/IncidentReportForm.tsx` - Incident reporting form
- `mobile/app/(tabs)/incident-report.tsx` - Mobile incident report screen

### Files to Modify:
- `server/create-complete-schema.sql` - Add new columns/tables
- `shared/schema.ts` - Update TypeScript schemas
- `server/routes/trips.ts` - Add telematics fields
- `server/mobile-api.ts` - Enhance location tracking
- `client/src/pages/clients.tsx` - Add waiver & restrictions
- `mobile/app/(tabs)/trip-details.tsx` - Add wait time, restrictions, incident reporting
- `client/src/pages/telematics.tsx` - Enhance with new metrics

---

## ⚠️ NOTES & CONSIDERATIONS

1. **Geofencing:** User confirmed simple address-based alerts are sufficient. No real-time geofencing needed.

2. **ELD/HOS:** Not needed for MVP (no hardware currently)

3. **Seat Belt Sensors:** Pre-shift prompts sufficient, no remote monitoring needed

4. **Driver Authentication:** Handled via pre-shift vehicle assignment

5. **Route Adherence:** Not necessary if reasonable geofencing in place (per user)

6. **Reviews:** Public page with PIN auth, approval workflow

7. **Prophet Integration:** Leverage existing calculator for cost/revenue analysis

---

## 🚀 NEXT STEPS

1. Review and approve this plan
2. Start with Phase 1 (Revenue Critical)
3. Create database migration for new columns/tables
4. Build trip purpose coding UI
5. Enhance mileage tracking
6. Implement wait time tracking

---

**Ready to proceed with Phase 1 implementation?**






