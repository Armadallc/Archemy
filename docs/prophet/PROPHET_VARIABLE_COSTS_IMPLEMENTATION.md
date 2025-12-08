# PROPHET Calculator - Variable Costs Expansion Implementation Plan

## 📋 Document Overview

**Purpose**: Expand PROPHET Calculator variable costs to include comprehensive per-mile, per-trip, and operational variable expenses  
**Current State**: Basic variable costs (fuel, maintenance, insurance per mile)  
**Target State**: Complete variable cost tracking across all operational categories  
**Reference**: `/Users/sefebrun/Library/Mobile Documents/com~apple~CloudDocs/2025 Transport/PROPHET VARIABLE COSTS.txt`

---

## 🎯 Executive Summary

### Current Implementation
The PROPHET Calculator currently tracks:
- **Variable Costs (Per Mile)**: Fuel, Maintenance, Insurance Variable
- **Fixed Costs**: Insurance, Licensing, Vehicle Lease, Software, etc.
- **Staffing Costs**: Owner, Driver, Admin with hourly rates

### Required Additions
The PROPHET VARIABLE COSTS document outlines **11 categories** of variable costs:
1. Direct Transport Costs (per mile/per trip)
2. Driver/Staff Variables
3. Patient/Client Related
4. Operational Variables
5. Administrative Variables
6. Marketing/Acquisition
7. Compliance & Safety
8. Technology Variables
9. Vehicle Specific
10. Hybrid-Specific Variables
11. Seasonal/Unexpected

### Key Principle
**Preserve existing functionality** - All new costs should be additive and optional. Existing calculations must continue to work.

---

## 📊 Current Architecture Audit

### Existing Files

#### Core Components
- `client/src/components/prophet/ProphetCalculator.tsx` - Main orchestrator
- `client/src/components/prophet/CostStructureManager/index.tsx` - Cost structure manager
- `client/src/components/prophet/CostStructureManager/VariableCosts.tsx` - Current variable costs UI
- `client/src/components/prophet/CostStructureManager/FixedCosts.tsx` - Fixed costs UI
- `client/src/components/prophet/CostStructureManager/StaffingCosts.tsx` - Staffing costs UI

#### Data & State
- `client/src/components/prophet/types.ts` - TypeScript type definitions
- `client/src/components/prophet/hooks/useProphetStore.ts` - Zustand store with localStorage persistence

#### Pages
- `client/src/pages/prophet.tsx` - Page wrapper with auth check

### Current VariableCosts Type Structure

```typescript
export interface VariableCosts {
  // Per-mile costs (existing)
  fuelPerMile: number;
  maintenancePerMile: number;
  insuranceVariablePerMile: number;
  
  // Fuel configuration (existing)
  fuelMode: 'api' | 'manual' | 'compare';
  fuelApiPrice: number | null;
  fuelManualPrice: number;
  vehicleMpg: number;
}
```

### Current Calculation Pattern

```typescript
// In useProphetStore.ts
const totalPerMile = (
  variable.fuelPerMile +
  variable.maintenancePerMile +
  variable.insuranceVariablePerMile
);
```

---

## 🔍 Requirements Analysis

### Category 1: Direct Transport Costs (Per Mile/Per Trip)

**From Document**:
- Fuel - $0.15-$0.25/mile ✅ **ALREADY IMPLEMENTED** (as `fuelPerMile`)
- Maintenance Reserve - $0.08-$0.15/mile ✅ **ALREADY IMPLEMENTED** (as `maintenancePerMile`)
- Tires - $0.02-$0.04/mile ❌ **NEW**
- Repairs - $0.05-$0.10/mile ❌ **NEW**
- Oil/Filter Changes - $0.01-$0.02/mile ❌ **NEW**
- Vehicle Cleaning/Sanitization - $5-15/trip ❌ **NEW** (per-trip)
- Disposable Supplies - $2-5/trip ❌ **NEW** (per-trip)

**Status**: Partially implemented. Need to add: tires, repairs, oil/filter (per-mile), cleaning, supplies (per-trip)

### Category 2: Driver/Staff Variables

**From Document**:
- Per-Trip Driver Pay - $X/trip or $/mile for contractors ❌ **NEW**
- Overtime Hours - Variable based on demand ❌ **NEW**
- Driver Bonuses/Incentives - Performance-based ❌ **NEW**
- Additional Shifts - Extra hours beyond base schedule ❌ **NEW**
- Temporary/Relief Driver Fees - $25-50/hour premium ❌ **NEW**
- Training Hours - New driver onboarding ❌ **NEW**

**Status**: Not implemented. These are variable staffing costs beyond base staffing.

### Category 3: Patient/Client Related

**From Document**:
- Trip-specific Supplies - Wheelchair/bariatric equipment rental ❌ **NEW**
- Patient Meals/Snacks - For long transports ❌ **NEW**
- Accommodation Costs - For multi-day/out-of-state transports ❌ **NEW**
- Tolls/Parking - Actual incurred ❌ **NEW**
- Wait Time Compensation - When exceeding standard pickup windows ❌ **NEW**

**Status**: Not implemented. These are trip-specific variable costs.

### Category 4: Operational Variables

**From Document**:
- Dispatch/Scheduling Hours - Extra hours during high volume ❌ **NEW**
- Phone/Communication Minutes - Exceeding base plan ❌ **NEW**
- Credit Card Processing Fees - 2.5-3.5% of private pay revenue ❌ **NEW**
- Fuel Surcharge - When fuel exceeds threshold price ❌ **NEW**
- Subcontractor Payments - For overflow capacity ❌ **NEW**
- Emergency Roadside - Tows/jump-starts beyond AAA coverage ❌ **NEW**

**Status**: Not implemented. These are operational overhead variables.

### Category 5: Administrative Variables

**From Document**:
- Billing/Claims Processing - Per-claim or percentage of collections ❌ **NEW**
- Collections Agency Fees - 20-35% of recovered amounts ❌ **NEW**
- Licensing/Permit Renewals - Spread monthly ❌ **NEW** (could be fixed or variable)
- Insurance Audit/Adjustment Fees - When claims occur ❌ **NEW**

**Status**: Not implemented. These are administrative overhead variables.

### Category 6: Marketing/Acquisition

**From Document**:
- Referral Commissions - $25-100/referred client ❌ **NEW**
- Facility Partnership Fees - Revenue share or per-client fees ❌ **NEW**
- Digital Advertising - Google/Facebook ads (pay-per-click) ❌ **NEW**
- CRM/Lists - Per lead or per contact ❌ **NEW**

**Status**: Not implemented. These are customer acquisition costs.

### Category 7: Compliance & Safety

**From Document**:
- Random Drug Tests - $50-100/test × frequency ❌ **NEW**
- Background Check Renewals - Annual/bi-annual per driver ❌ **NEW**
- CPR/First Aid Recertification - $75-150/driver annually (≈$6-13/month) ❌ **NEW**
- Vehicle Inspection Fees - Monthly/quarterly inspections ❌ **NEW**

**Status**: Not implemented. These could be fixed (monthly) or variable (per driver).

### Category 8: Technology Variables

**From Document**:
- GPS/Telematics - Per vehicle monthly fee ($15-40/vehicle) ❌ **NEW**
- Ride Management Software - Per trip or monthly user fees ❌ **NEW**
- Data Overage - Mobile hotspots/tablet data ❌ **NEW**
- Software Add-ons - Extra features as needed ❌ **NEW**

**Status**: Partially implemented. `software` exists in FixedCosts, but per-vehicle/per-trip tech costs are new.

### Category 9: Vehicle Specific (Per Active Vehicle)

**From Document**:
- Depreciation - Miles-based depreciation ✅ **PARTIALLY** (maintenancePerMile might cover some)
- Registration Fees - Annual prorated monthly ❌ **NEW** (could be fixed)
- Personal Property Tax - Monthly accrual ❌ **NEW** (could be fixed)
- Parking/Storage - If not company-owned ❌ **NEW** (could be fixed)

**Status**: Not implemented. These are per-vehicle costs.

### Category 10: Hybrid-Specific Variables

**From Document**:
- Medicaid Billing Support - Per claim or percentage ❌ **NEW**
- Prior Authorization Assistance - Per authorization request ❌ **NEW**
- HCBS Waiver Coordination - Time spent on waiver paperwork ❌ **NEW**
- Private Pay Collection Efforts - Time/software for self-pay clients ❌ **NEW**
- Dual-Billing System Maintenance - Managing two revenue streams ❌ **NEW**

**Status**: Not implemented. These are specific to hybrid NMT/Private Pay operations.

### Category 11: Seasonal/Unexpected

**From Document**:
- Winter Operations - Snow tires, chains, extra cleaning ❌ **NEW**
- Extreme Weather Costs - Idling time, rerouting ❌ **NEW**
- Event-Based Demand - Extra staffing for conferences/events ❌ **NEW**
- Vehicle Downtime Replacement - Rental vehicles ❌ **NEW**

**Status**: Not implemented. These are irregular/seasonal costs.

---

## 🏗 Implementation Strategy

### Phase 1: Extend Type Definitions (Week 1)

#### Task 1.1: Update VariableCosts Interface

**File**: `client/src/components/prophet/types.ts`

**Add new interface sections**:

```typescript
export interface VariableCosts {
  // Existing per-mile costs
  fuelPerMile: number;
  maintenancePerMile: number;
  insuranceVariablePerMile: number;
  
  // Existing fuel configuration
  fuelMode: 'api' | 'manual' | 'compare';
  fuelApiPrice: number | null;
  fuelManualPrice: number;
  vehicleMpg: number;
  
  // NEW: Additional per-mile costs
  tiresPerMile: number;
  repairsPerMile: number;
  oilFilterPerMile: number;
  
  // NEW: Per-trip costs
  vehicleCleaningPerTrip: number;
  disposableSuppliesPerTrip: number;
  
  // NEW: Driver/Staff Variables
  perTripDriverPay: number; // $/trip or $/mile (toggle)
  perTripDriverPayMode: 'per_trip' | 'per_mile';
  overtimeHoursPerMonth: number;
  overtimeRateMultiplier: number; // e.g., 1.5x base rate
  driverBonusesPerMonth: number;
  additionalShiftsPerMonth: number;
  temporaryDriverFeePerHour: number;
  trainingHoursPerMonth: number;
  trainingRatePerHour: number;
  
  // NEW: Patient/Client Related
  tripSpecificSuppliesPerTrip: number; // Equipment rental
  patientMealsPerTrip: number;
  accommodationCostsPerTrip: number;
  tollsParkingPerMonth: number; // Estimated monthly
  waitTimeCompensationPerHour: number;
  avgWaitTimeHoursPerMonth: number;
  
  // NEW: Operational Variables
  dispatchOvertimeHoursPerMonth: number;
  dispatchOvertimeRate: number;
  phoneCommunicationOveragePerMonth: number;
  creditCardProcessingPercentage: number; // 2.5-3.5%
  fuelSurchargeThreshold: number; // Price per gallon
  fuelSurchargePercentage: number; // % above threshold
  subcontractorPaymentsPerMonth: number;
  emergencyRoadsidePerMonth: number;
  
  // NEW: Administrative Variables
  billingClaimsProcessingPerClaim: number;
  billingClaimsProcessingPercentage: number; // Alternative to per-claim
  billingClaimsProcessingMode: 'per_claim' | 'percentage';
  collectionsAgencyPercentage: number; // 20-35%
  collectionsAgencyRecoveredAmount: number; // Monthly estimate
  licensingPermitRenewalsPerMonth: number; // Spread annual costs
  insuranceAuditFeesPerMonth: number; // Estimated
  
  // NEW: Marketing/Acquisition
  referralCommissionsPerClient: number;
  referralCommissionsCount: number; // Monthly referrals
  facilityPartnershipFeePerMonth: number;
  digitalAdvertisingPerMonth: number;
  crmListsPerMonth: number;
  
  // NEW: Compliance & Safety
  randomDrugTestsPerMonth: number; // Count
  randomDrugTestCost: number; // $50-100
  backgroundCheckRenewalsPerDriver: number; // Annual cost / 12
  cprFirstAidRecertPerDriver: number; // Annual cost / 12
  vehicleInspectionFeesPerMonth: number; // Monthly/quarterly spread
  
  // NEW: Technology Variables
  gpsTelematicsPerVehicle: number; // $15-40/vehicle/month
  rideManagementSoftwarePerTrip: number; // Alternative: per month
  rideManagementSoftwareMode: 'per_trip' | 'per_month';
  rideManagementSoftwareMonthly: number;
  dataOveragePerMonth: number;
  softwareAddonsPerMonth: number;
  
  // NEW: Vehicle Specific (per active vehicle)
  depreciationPerMile: number; // Miles-based
  registrationFeesPerVehicle: number; // Annual / 12
  personalPropertyTaxPerVehicle: number; // Monthly
  parkingStoragePerVehicle: number; // Monthly
  
  // NEW: Hybrid-Specific
  medicaidBillingSupportPerClaim: number;
  medicaidBillingSupportPercentage: number;
  medicaidBillingSupportMode: 'per_claim' | 'percentage';
  priorAuthorizationPerRequest: number;
  priorAuthorizationCountPerMonth: number;
  hcbsWaiverCoordinationHoursPerMonth: number;
  hcbsWaiverCoordinationRate: number;
  privatePayCollectionHoursPerMonth: number;
  privatePayCollectionRate: number;
  dualBillingSystemMaintenancePerMonth: number;
  
  // NEW: Seasonal/Unexpected
  winterOperationsPerMonth: number; // Nov-Mar estimate
  winterOperationsMonths: number[]; // [11, 12, 1, 2, 3]
  extremeWeatherCostsPerMonth: number; // Estimated
  eventBasedDemandPerMonth: number; // Estimated
  vehicleDowntimeReplacementPerMonth: number; // Rental costs
}
```

**Note**: This is a comprehensive structure. We may want to group some into sub-objects for better organization.

#### Task 1.2: Create Grouped Structure (Alternative Approach)

**Better organization** - Group related costs:

```typescript
export interface DirectTransportVariableCosts {
  // Per-mile
  tiresPerMile: number;
  repairsPerMile: number;
  oilFilterPerMile: number;
  
  // Per-trip
  vehicleCleaningPerTrip: number;
  disposableSuppliesPerTrip: number;
}

export interface DriverStaffVariableCosts {
  perTripDriverPay: number;
  perTripDriverPayMode: 'per_trip' | 'per_mile';
  overtimeHoursPerMonth: number;
  overtimeRateMultiplier: number;
  driverBonusesPerMonth: number;
  additionalShiftsPerMonth: number;
  temporaryDriverFeePerHour: number;
  trainingHoursPerMonth: number;
  trainingRatePerHour: number;
}

export interface PatientClientVariableCosts {
  tripSpecificSuppliesPerTrip: number;
  patientMealsPerTrip: number;
  accommodationCostsPerTrip: number;
  tollsParkingPerMonth: number;
  waitTimeCompensationPerHour: number;
  avgWaitTimeHoursPerMonth: number;
}

// ... etc for other categories

export interface VariableCosts {
  // Existing
  fuelPerMile: number;
  maintenancePerMile: number;
  insuranceVariablePerMile: number;
  fuelMode: 'api' | 'manual' | 'compare';
  fuelApiPrice: number | null;
  fuelManualPrice: number;
  vehicleMpg: number;
  
  // New grouped costs
  directTransport: DirectTransportVariableCosts;
  driverStaff: DriverStaffVariableCosts;
  patientClient: PatientClientVariableCosts;
  operational: OperationalVariableCosts;
  administrative: AdministrativeVariableCosts;
  marketing: MarketingVariableCosts;
  compliance: ComplianceVariableCosts;
  technology: TechnologyVariableCosts;
  vehicleSpecific: VehicleSpecificVariableCosts;
  hybridSpecific: HybridSpecificVariableCosts;
  seasonal: SeasonalVariableCosts;
}
```

**Recommendation**: Use **grouped structure** for better organization and UI management.

---

### Phase 2: Update Store & Defaults (Week 1)

#### Task 2.1: Update Default Values

**File**: `client/src/components/prophet/hooks/useProphetStore.ts`

**Add default values** for all new cost categories with realistic Colorado-specific defaults:

```typescript
const defaultDirectTransport: DirectTransportVariableCosts = {
  tiresPerMile: 0.03, // $0.02-$0.04/mile
  repairsPerMile: 0.075, // $0.05-$0.10/mile
  oilFilterPerMile: 0.015, // $0.01-$0.02/mile
  vehicleCleaningPerTrip: 10, // $5-15/trip
  disposableSuppliesPerTrip: 3.50, // $2-5/trip
};

const defaultDriverStaff: DriverStaffVariableCosts = {
  perTripDriverPay: 0, // User sets
  perTripDriverPayMode: 'per_trip',
  overtimeHoursPerMonth: 0,
  overtimeRateMultiplier: 1.5,
  driverBonusesPerMonth: 0,
  additionalShiftsPerMonth: 0,
  temporaryDriverFeePerHour: 37.50, // $25-50/hour premium
  trainingHoursPerMonth: 0,
  trainingRatePerHour: 25,
};

// ... defaults for all categories
```

#### Task 2.2: Update Calculation Functions

**File**: `client/src/components/prophet/hooks/useProphetStore.ts`

**Extend calculation functions** to include new variable costs:

```typescript
calculateTotalVariableCosts: (scenarioId, totalMiles, totalTrips) => {
  const state = get();
  const scenario = state.scenarios.find((s) => s.id === scenarioId);
  if (!scenario) return 0;
  
  const variable = scenario.costs.variable;
  
  // Existing per-mile costs
  const perMileCosts = totalMiles * (
    variable.fuelPerMile +
    variable.maintenancePerMile +
    variable.insuranceVariablePerMile +
    variable.directTransport.tiresPerMile +
    variable.directTransport.repairsPerMile +
    variable.directTransport.oilFilterPerMile +
    variable.vehicleSpecific.depreciationPerMile
  );
  
  // Per-trip costs
  const perTripCosts = totalTrips * (
    variable.directTransport.vehicleCleaningPerTrip +
    variable.directTransport.disposableSuppliesPerTrip +
    variable.patientClient.tripSpecificSuppliesPerTrip +
    variable.patientClient.patientMealsPerTrip +
    variable.patientClient.accommodationCostsPerTrip
  );
  
  // Monthly variable costs (not tied to miles/trips)
  const monthlyVariableCosts = (
    variable.driverStaff.overtimeHoursPerMonth * variable.driverStaff.overtimeRateMultiplier * baseDriverRate +
    variable.driverStaff.driverBonusesPerMonth +
    variable.patientClient.tollsParkingPerMonth +
    variable.operational.dispatchOvertimeHoursPerMonth * variable.operational.dispatchOvertimeRate +
    // ... etc
  );
  
  return perMileCosts + perTripCosts + monthlyVariableCosts;
}
```

---

### Phase 3: UI Components (Week 2-3)

#### Task 3.1: Create Expandable Variable Costs Component

**File**: `client/src/components/prophet/CostStructureManager/VariableCosts.tsx`

**Restructure** to use tabs or accordion for cost categories:

```typescript
export function VariableCosts() {
  const { costStructure, updateVariableCosts } = useProphetStore();
  const [activeCategory, setActiveCategory] = useState<'basic' | 'direct' | 'driver' | 'patient' | 'operational' | 'admin' | 'marketing' | 'compliance' | 'technology' | 'vehicle' | 'hybrid' | 'seasonal'>('basic');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Variable Costs</CardTitle>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList>
            <TabsTrigger value="basic">Basic (Per Mile)</TabsTrigger>
            <TabsTrigger value="direct">Direct Transport</TabsTrigger>
            <TabsTrigger value="driver">Driver/Staff</TabsTrigger>
            <TabsTrigger value="patient">Patient/Client</TabsTrigger>
            <TabsTrigger value="operational">Operational</TabsTrigger>
            <TabsTrigger value="admin">Administrative</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="technology">Technology</TabsTrigger>
            <TabsTrigger value="vehicle">Vehicle Specific</TabsTrigger>
            <TabsTrigger value="hybrid">Hybrid-Specific</TabsTrigger>
            <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            {/* Existing fuel, maintenance, insurance */}
          </TabsContent>
          
          <TabsContent value="direct">
            <DirectTransportCosts />
          </TabsContent>
          
          {/* ... other tabs */}
        </Tabs>
      </CardHeader>
    </Card>
  );
}
```

#### Task 3.2: Create Category Sub-Components

**New Files**:
- `client/src/components/prophet/CostStructureManager/VariableCosts/DirectTransportCosts.tsx`
- `client/src/components/prophet/CostStructureManager/VariableCosts/DriverStaffCosts.tsx`
- `client/src/components/prophet/CostStructureManager/VariableCosts/PatientClientCosts.tsx`
- `client/src/components/prophet/CostStructureManager/VariableCosts/OperationalCosts.tsx`
- `client/src/components/prophet/CostStructureManager/VariableCosts/AdministrativeCosts.tsx`
- `client/src/components/prophet/CostStructureManager/VariableCosts/MarketingCosts.tsx`
- `client/src/components/prophet/CostStructureManager/VariableCosts/ComplianceCosts.tsx`
- `client/src/components/prophet/CostStructureManager/VariableCosts/TechnologyCosts.tsx`
- `client/src/components/prophet/CostStructureManager/VariableCosts/VehicleSpecificCosts.tsx`
- `client/src/components/prophet/CostStructureManager/VariableCosts/HybridSpecificCosts.tsx`
- `client/src/components/prophet/CostStructureManager/VariableCosts/SeasonalCosts.tsx`

**Pattern**: Each component follows the same structure as existing `VariableCosts.tsx` with EditableField components.

---

### Phase 4: Update Calculations (Week 3)

#### Task 4.1: Update Scenario Revenue Calculations

**File**: `client/src/components/prophet/hooks/useProphetStore.ts`

**Modify** `calculateScenarioRevenue` and `calculateScenarioCosts` to account for:
- Per-trip variable costs
- Monthly variable costs
- Percentage-based costs (credit card processing, collections, etc.)

#### Task 4.2: Update Break-Even Calculations

**File**: `client/src/components/prophet/hooks/useProphetStore.ts`

**Modify** `calculateBreakEven` to include all variable costs in contribution margin calculation.

---

### Phase 5: Summary & Reporting (Week 4)

#### Task 5.1: Update Cost Structure Summary

**File**: `client/src/components/prophet/CostStructureManager/index.tsx`

**Add** breakdown of variable costs by category in summary card.

#### Task 5.2: Add Variable Cost Breakdown View

**New Component**: `client/src/components/prophet/CostStructureManager/VariableCostsBreakdown.tsx`

**Display**:
- Per-mile variable costs total
- Per-trip variable costs total
- Monthly variable costs total
- Category breakdowns
- Projected monthly variable costs based on scenario

---

## 📝 Implementation Checklist

### Phase 1: Type Definitions
- [ ] Update `VariableCosts` interface in `types.ts`
- [ ] Create grouped cost interfaces (recommended approach)
- [ ] Add default values for all new cost fields
- [ ] Update TypeScript types throughout codebase

### Phase 2: Store Updates
- [ ] Add default values to `useProphetStore.ts`
- [ ] Update `updateVariableCosts` action to handle nested structures
- [ ] Update calculation functions to include new costs
- [ ] Test calculations with new cost structure

### Phase 3: UI Components
- [ ] Restructure `VariableCosts.tsx` with tabs/accordion
- [ ] Create `DirectTransportCosts.tsx` component
- [ ] Create `DriverStaffCosts.tsx` component
- [ ] Create `PatientClientCosts.tsx` component
- [ ] Create `OperationalCosts.tsx` component
- [ ] Create `AdministrativeCosts.tsx` component
- [ ] Create `MarketingCosts.tsx` component
- [ ] Create `ComplianceCosts.tsx` component
- [ ] Create `TechnologyCosts.tsx` component
- [ ] Create `VehicleSpecificCosts.tsx` component
- [ ] Create `HybridSpecificCosts.tsx` component
- [ ] Create `SeasonalCosts.tsx` component
- [ ] Test all UI components

### Phase 4: Calculations
- [ ] Update `calculateTotalVariableCosts` function
- [ ] Update `calculateScenarioRevenue` (if needed for percentage-based costs)
- [ ] Update `calculateBreakEven` function
- [ ] Test calculations with various scenarios
- [ ] Verify backward compatibility

### Phase 5: Summary & Reporting
- [ ] Update summary card in `CostStructureManager/index.tsx`
- [ ] Create `VariableCostsBreakdown.tsx` component
- [ ] Add variable cost projections to scenario view
- [ ] Test all reporting features

---

## 🎨 UI/UX Considerations

### Organization Strategy

**Option 1: Tabs** (Recommended for many categories)
- Clean separation
- Easy navigation
- Prevents overwhelming UI

**Option 2: Accordion**
- All visible at once (collapsed)
- Better for quick scanning
- More scrolling required

**Option 3: Collapsible Sections**
- Hybrid approach
- Most important (Basic) always visible
- Others collapsible

### Default Visibility

**Recommendation**: 
- **Basic (Per Mile)** - Always visible (existing costs)
- **Direct Transport** - Expanded by default (most commonly used)
- **Other categories** - Collapsed by default (advanced users)

### Input Patterns

**Per-Mile Costs**: Use same pattern as existing (EditableField with `/mi` suffix)
**Per-Trip Costs**: Use EditableField with `/trip` suffix
**Monthly Costs**: Use EditableField with `/month` suffix
**Percentage Costs**: Use EditableField with `%` suffix and toggle for per-claim vs percentage

---

## 🔢 Calculation Examples

### Example 1: Per-Mile Variable Costs

```
Scenario: 6,000 miles/month

Fuel: $0.20/mile × 6,000 = $1,200
Maintenance: $0.15/mile × 6,000 = $900
Insurance Variable: $0.05/mile × 6,000 = $300
Tires: $0.03/mile × 6,000 = $180
Repairs: $0.075/mile × 6,000 = $450
Oil/Filter: $0.015/mile × 6,000 = $90
Depreciation: $0.10/mile × 6,000 = $600

Total Per-Mile: $3,720/month
```

### Example 2: Per-Trip Variable Costs

```
Scenario: 400 trips/month

Vehicle Cleaning: $10/trip × 400 = $4,000
Disposable Supplies: $3.50/trip × 400 = $1,400
Trip Supplies: $5/trip × 400 = $2,000
Patient Meals: $2/trip × 400 = $800

Total Per-Trip: $8,200/month
```

### Example 3: Monthly Variable Costs

```
Driver Overtime: 80 hours × $37.50/hour = $3,000
Driver Bonuses: $500
Tolls/Parking: $200
Dispatch Overtime: 20 hours × $30/hour = $600
Credit Card Processing: 2.5% × $50,000 revenue = $1,250
Collections Agency: 25% × $2,000 recovered = $500

Total Monthly Variable: $6,050/month
```

### Example 4: Total Variable Costs

```
Per-Mile: $3,720
Per-Trip: $8,200
Monthly: $6,050

TOTAL VARIABLE: $17,970/month
```

---

## 🚨 Important Considerations

### Backward Compatibility

**Critical**: Existing scenarios must continue to work. New cost fields should default to `0` if not set.

### Performance

**Consideration**: With 11 categories and 50+ cost fields, ensure:
- Calculations remain fast
- UI doesn't lag with many inputs
- localStorage persistence doesn't slow down

### User Experience

**Recommendation**: 
- Start with most commonly used categories (Direct Transport, Driver/Staff)
- Make advanced categories (Marketing, Seasonal) optional/collapsed
- Provide tooltips/help text for each cost field
- Show calculation examples in UI

### Data Validation

**Required**: 
- Ensure all numeric inputs are validated
- Prevent negative values where inappropriate
- Validate percentage fields (0-100%)
- Validate mode toggles (per_trip vs per_mile, etc.)

---

## 📚 Reference Files

### Key Files to Modify
1. `client/src/components/prophet/types.ts` - Type definitions
2. `client/src/components/prophet/hooks/useProphetStore.ts` - Store and calculations
3. `client/src/components/prophet/CostStructureManager/VariableCosts.tsx` - Main UI component

### New Files to Create
1. `client/src/components/prophet/CostStructureManager/VariableCosts/DirectTransportCosts.tsx`
2. `client/src/components/prophet/CostStructureManager/VariableCosts/DriverStaffCosts.tsx`
3. `client/src/components/prophet/CostStructureManager/VariableCosts/PatientClientCosts.tsx`
4. `client/src/components/prophet/CostStructureManager/VariableCosts/OperationalCosts.tsx`
5. `client/src/components/prophet/CostStructureManager/VariableCosts/AdministrativeCosts.tsx`
6. `client/src/components/prophet/CostStructureManager/VariableCosts/MarketingCosts.tsx`
7. `client/src/components/prophet/CostStructureManager/VariableCosts/ComplianceCosts.tsx`
8. `client/src/components/prophet/CostStructureManager/VariableCosts/TechnologyCosts.tsx`
9. `client/src/components/prophet/CostStructureManager/VariableCosts/VehicleSpecificCosts.tsx`
10. `client/src/components/prophet/CostStructureManager/VariableCosts/HybridSpecificCosts.tsx`
11. `client/src/components/prophet/CostStructureManager/VariableCosts/SeasonalCosts.tsx`
12. `client/src/components/prophet/CostStructureManager/VariableCostsBreakdown.tsx` - Summary component

---

## 🎯 Success Criteria

### Phase 1 Success
- ✅ All new cost types defined
- ✅ Default values set
- ✅ TypeScript compilation passes

### Phase 2 Success
- ✅ Store updated with new structure
- ✅ Calculations include new costs
- ✅ Existing scenarios still work

### Phase 3 Success
- ✅ All category components created
- ✅ UI is organized and intuitive
- ✅ All inputs functional

### Phase 4 Success
- ✅ Calculations accurate
- ✅ Break-even includes all costs
- ✅ Performance acceptable

### Overall Success
- ✅ All 11 cost categories implemented
- ✅ Backward compatibility maintained
- ✅ User can track comprehensive variable costs
- ✅ Calculations match document examples

---

**Next Steps**: Review this plan, then begin Phase 1 implementation.



