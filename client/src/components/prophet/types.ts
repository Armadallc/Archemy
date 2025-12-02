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

export interface ContractAnalysis {
  proposedMonthlyFee: number;
  estimatedRevenue: number;
  overheadCosts: number;
  mutualBenefit: boolean;
  margin: number;
  marginPercentage: number;
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
  contractAnalysis?: ContractAnalysis;
  
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

export interface VariableCosts {
  fuelPerMile: number;
  maintenancePerMile: number;
  insuranceVariablePerMile: number;
  
  // Fuel configuration
  fuelMode: 'api' | 'manual' | 'compare';
  fuelApiPrice: number | null;
  fuelManualPrice: number;
  vehicleMpg: number;
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
  
  tripsPerMonth: number;
  roundTrip: boolean;
  avgMiles: number;
  
  // Billing
  billingMethod: BillingMethod;
  selectedCodeId?: string;
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

