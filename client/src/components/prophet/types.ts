/**
 * PROPHET Calculator Types
 * Precision Revenue Outcome Planning for Healthcare Expense Tracking
 */

// ============================================================================
// SERVICE CODES
// ============================================================================

export type ServiceCategory = 'BHST' | 'NEMT' | 'NMT' | 'Behavioral' | 'Other';
export type RateType = 'per_trip' | 'per_mile' | 'per_15min' | 'per_30min' | 'per_hour' | 'per_diem';

// Unit types for click-to-toggle functionality
export const RATE_TYPE_CYCLE: RateType[] = ['per_mile', 'per_15min', 'per_30min', 'per_hour', 'per_trip', 'per_diem'];

export const RATE_TYPE_LABELS: Record<RateType, string> = {
  'per_mile': '/mile',
  'per_15min': '/15min',
  'per_30min': '/30min',
  'per_hour': '/hour',
  'per_trip': '/trip',
  'per_diem': '/day',
};

// Mileage band structure for NMT
export interface MileageBand {
  id: string;
  modifier: string;
  minMiles: number;
  maxMiles: number | null; // null = unlimited
  rate: number;
  description: string;
}

export interface AllowableLimits {
  unitsPerPerson?: number;
  perDay?: number;
  perMonth?: number;
  perYear?: number;
}

export interface ServiceCodeRestrictions {
  requiresWaiver?: boolean;
  waiverTypes?: WaiverType[];
  requiresCrisis?: boolean;
  providerTypes?: string[];
  maxTripsPerDay?: number;
  notes?: string;
}

export interface ServiceCode {
  id: string;
  code: string;
  modifier?: string;
  category: ServiceCategory;
  description: string;
  
  // Editable rate fields
  rateType: RateType;
  baseRate: number;
  mileageRate?: number;
  mileageCode?: string;
  unit: string;
  
  // Editable limits
  allowable: AllowableLimits;
  
  // Timestamps
  effectiveDate: string;
  lastUpdated: string;
  
  restrictions?: ServiceCodeRestrictions;
  notes?: string;
  isCustom?: boolean;
  isBlocked?: boolean;  // For moratorium codes like NEMT
  blockReason?: string;
}

// ============================================================================
// TREATMENT FACILITIES
// ============================================================================

export type FacilityType = 'mental_behavioral' | 'sober_living' | 'medical_detox' | 'transitional_living';
export type WaiverType = 'CMHS' | 'DD' | 'SLS' | 'Other';
export type TripDistributionType = 'medical' | 'therapy' | 'community' | 'legal';

export interface FacilityCensus {
  bedCapacity: number;
  currentPopulation: number;
  occupancyRate: number;  // Auto-calculated
}

export interface PaymentStructure {
  acceptsCash: boolean;
  acceptsMedicaid: boolean;
  acceptsPrivateInsurance: boolean;
}

export interface FacilityWaivers {
  hasWaivers: boolean;
  types: WaiverType[];
  clientsWithWaivers: number;
  waiverPercentage: number;  // Auto-calculated
}

export interface OperatingHours {
  open: string;   // "06:00"
  close: string;  // "22:00"
}

export interface FacilityLocation {
  address: string;
  city: string;
  zipCode: string;
  avgMilesToDestinations: number;
}

export interface TripDistribution {
  medical: number;    // % of trips
  therapy: number;
  community: number;
  legal: number;
}

export interface FacilityTransport {
  scheduledTripsPerWeek: number;
  tripsPerClient: number;
  peakHours: string[];
  distribution: TripDistribution;
}

export interface FacilityBillingCode {
  codeId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  estimatedVolume: number;
}

export interface TreatmentFacility {
  id: string;
  slot: 1 | 2 | 3;
  name: string;
  type: FacilityType;
  
  census: FacilityCensus;
  paymentStructure: PaymentStructure;
  waivers: FacilityWaivers;
  
  operations: {
    hours: OperatingHours;
    location: FacilityLocation;
  };
  
  transport: FacilityTransport;
  billingCodes: FacilityBillingCode[];
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// COST STRUCTURE
// ============================================================================

export interface FixedCosts {
  // Insurance
  insuranceCommercialAuto: number;
  insuranceGeneralLiability: number;
  
  // Licensing
  hcpfEnrollment: number;
  countyBHSTLicense: number;
  countyCount: number;  // Multiplier for county licenses
  pucLicense: number;
  
  // Vehicle
  vehicleLease: number;
  maintenanceReserve: number;
  
  // Other
  software: number;
  drugScreening: number;
  miscAdmin: number;
}

// ============================================================================
// VARIABLE COSTS - Grouped Structures
// ============================================================================

export interface DirectTransportVariableCosts {
  // Per-mile costs
  tiresPerMile: number;           // $0.02-$0.04/mile
  repairsPerMile: number;         // $0.05-$0.10/mile
  oilFilterPerMile: number;       // $0.01-$0.02/mile
  
  // Per-trip costs
  vehicleCleaningPerTrip: number; // $5-15/trip
  disposableSuppliesPerTrip: number; // $2-5/trip
}

export interface DriverStaffVariableCosts {
  perTripDriverPay: number;       // $/trip or $/mile
  perTripDriverPayMode: 'per_trip' | 'per_mile';
  overtimeHoursPerMonth: number;
  overtimeRateMultiplier: number; // e.g., 1.5x base rate
  driverBonusesPerMonth: number;
  additionalShiftsPerMonth: number;
  temporaryDriverFeePerHour: number; // $25-50/hour premium
  trainingHoursPerMonth: number;
  trainingRatePerHour: number;
}

export interface PatientClientVariableCosts {
  tripSpecificSuppliesPerTrip: number; // Equipment rental
  patientMealsPerTrip: number;
  accommodationCostsPerTrip: number;
  tollsParkingPerMonth: number; // Estimated monthly
  waitTimeCompensationPerHour: number;
  avgWaitTimeHoursPerMonth: number;
}

export interface OperationalVariableCosts {
  dispatchOvertimeHoursPerMonth: number;
  dispatchOvertimeRate: number;
  phoneCommunicationOveragePerMonth: number;
  creditCardProcessingPercentage: number; // 2.5-3.5%
  fuelSurchargeThreshold: number; // Price per gallon
  fuelSurchargePercentage: number; // % above threshold
  subcontractorPaymentsPerMonth: number;
  emergencyRoadsidePerMonth: number;
}

export interface AdministrativeVariableCosts {
  billingClaimsProcessingPerClaim: number;
  billingClaimsProcessingPercentage: number; // Alternative to per-claim
  billingClaimsProcessingMode: 'per_claim' | 'percentage';
  collectionsAgencyPercentage: number; // 20-35%
  collectionsAgencyRecoveredAmount: number; // Monthly estimate
  licensingPermitRenewalsPerMonth: number; // Spread annual costs
  insuranceAuditFeesPerMonth: number; // Estimated
}

export interface MarketingVariableCosts {
  referralCommissionsPerClient: number; // $25-100/referred client
  referralCommissionsCount: number; // Monthly referrals
  facilityPartnershipFeePerMonth: number;
  digitalAdvertisingPerMonth: number;
  crmListsPerMonth: number;
}

export interface ComplianceVariableCosts {
  randomDrugTestsPerMonth: number; // Count
  randomDrugTestCost: number; // $50-100
  backgroundCheckRenewalsPerDriver: number; // Annual cost / 12
  cprFirstAidRecertPerDriver: number; // Annual cost / 12 ($6-13/month)
  vehicleInspectionFeesPerMonth: number; // Monthly/quarterly spread
}

export interface TechnologyVariableCosts {
  gpsTelematicsPerVehicle: number; // $15-40/vehicle/month
  rideManagementSoftwarePerTrip: number; // Alternative: per month
  rideManagementSoftwareMode: 'per_trip' | 'per_month';
  rideManagementSoftwareMonthly: number;
  dataOveragePerMonth: number;
  softwareAddonsPerMonth: number;
}

export interface VehicleSpecificVariableCosts {
  depreciationPerMile: number; // Miles-based depreciation
  registrationFeesPerVehicle: number; // Annual / 12
  personalPropertyTaxPerVehicle: number; // Monthly
  parkingStoragePerVehicle: number; // Monthly
}

export interface HybridSpecificVariableCosts {
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
}

export interface SeasonalVariableCosts {
  winterOperationsPerMonth: number; // Nov-Mar estimate
  winterOperationsMonths: number[]; // [11, 12, 1, 2, 3] (0-indexed: Nov=10, Dec=11, Jan=0, Feb=1, Mar=2)
  extremeWeatherCostsPerMonth: number; // Estimated
  eventBasedDemandPerMonth: number; // Estimated
  vehicleDowntimeReplacementPerMonth: number; // Rental costs
}

export interface VariableCosts {
  // Existing per-mile costs (preserved for backward compatibility)
  fuelPerMile: number;
  maintenancePerMile: number;
  insuranceVariablePerMile: number;
  
  // Fuel configuration (existing)
  fuelMode: 'api' | 'manual' | 'compare';
  fuelApiPrice: number | null;
  fuelManualPrice: number;
  vehicleMpg: number;
  
  // New grouped cost categories
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

export interface StaffMember {
  enabled: boolean;
  hourlyRate: number;
  hoursPerMonth: number;
  benefitsPercentage: number;
  basePay: number;      // Auto-calculated
  totalCost: number;    // Auto-calculated
}

export interface StaffingCosts {
  owner: StaffMember;
  driver: StaffMember;
  admin: StaffMember;
  additionalDrivers: number;  // Count of additional drivers
}

export interface CostStructure {
  fixed: FixedCosts;
  variable: VariableCosts;
  staffing: StaffingCosts;
  
  // Calculated totals
  totalFixed: number;
  totalVariable: number;
  totalStaffing: number;
  totalMonthlyCosts: number;
}

// ============================================================================
// TRIP SCENARIOS
// ============================================================================

export type TripServiceType = 'BHST' | 'NEMT' | 'NMT' | 'Legal' | 'Community';
export type BillingMethod = 'medicaid' | 'contract' | 'mileage' | 'nmt';

export interface TripScenario {
  id: string;
  name: string;
  serviceType: TripServiceType;
  
  // Category and billing code selection
  category?: ServiceCategory; // BHST, NEMT, NMT, Behavioral, Other
  selectedCodeId?: string; // Selected billing code ID
  selectedModifier?: string; // Selected modifier (for reference only)
  
  tripsPerMonth: number;
  clients: number; // Number of clients (multiplies trips)
  roundTrip: boolean; // Keep for backward compatibility
  multiplier?: number; // Custom multiplier (defaults to 1 if roundTrip false, 2 if roundTrip true)
  avgMiles: number;
  
  // Billing
  billingMethod: BillingMethod;
  baseRatePerTrip: number;
  mileageRate: number;
  contractFee?: number;
  
  // Waiver info (for NMT)
  requiresWaiver: boolean;
  percentWithWaiver: number;
  
  // Calculated
  estimatedRevenue: number;
  
  // Flags
  isBlocked?: boolean;
  blockReason?: string;
  
  notes?: string;
}

// ============================================================================
// BUSINESS SCENARIO
// ============================================================================

export interface BusinessScenario {
  id: string;
  name: string;
  description?: string;
  
  // Linked facilities
  facilityIds: string[];
  
  // Trip scenarios
  trips: TripScenario[];
  
  // Cost structure reference
  costs: CostStructure;
  
  // Fleet
  vehicles: number;
  drivers: number;
  
  // Monthly projections
  projectedMiles: number;
  
  // Calculated results
  totalRevenue: number;
  totalCosts: number;
  netIncome: number;
  margin: number;
  
  // Analysis
  breakEvenTrips: number;
  tripsGap: number;
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// STORE STATE
// ============================================================================

export interface ProphetState {
  // Service Codes
  serviceCodes: ServiceCode[];
  
  // Treatment Facilities (max 3)
  facilities: TreatmentFacility[];
  
  // Cost Structure
  costStructure: CostStructure;
  
  // Business Scenarios
  scenarios: BusinessScenario[];
  activeScenarioId: string | null;
  
  // UI State
  activeTab: 'costs' | 'codes' | 'facilities' | 'scenarios';
  
  // Sync State
  lastSyncedAt: string | null;
  pendingSync: boolean;
}

// ============================================================================
// FACILITY TYPE LABELS
// ============================================================================

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  mental_behavioral: 'Mental/Behavioral Health',
  sober_living: 'Sober Living',
  medical_detox: 'Medical Detox',
  transitional_living: 'Transitional Living',
};

export const WAIVER_TYPE_LABELS: Record<WaiverType, string> = {
  CMHS: 'CMHS (Community Mental Health)',
  DD: 'DD (Developmental Disabilities)',
  SLS: 'SLS (Supported Living Services)',
  Other: 'Other',
};

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  BHST: 'Behavioral Health Secure Transport',
  NEMT: 'Non-Emergency Medical Transport',
  NMT: 'Non-Medical Transport',
  Behavioral: 'Behavioral Services',
  Other: 'Other',
};

