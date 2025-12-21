/**
 * PROPHET Calculator - Zustand Store
 * With localStorage persistence and Supabase sync
 */

// Ensure React is loaded before Zustand (Zustand uses React hooks internally)
import 'react';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../../../lib/supabase';
import {
  ProphetState,
  ServiceCode,
  TreatmentFacility,
  CostStructure,
  BusinessScenario,
  FixedCosts,
  VariableCosts,
  StaffingCosts,
  DirectTransportVariableCosts,
  DriverStaffVariableCosts,
  PatientClientVariableCosts,
  OperationalVariableCosts,
  AdministrativeVariableCosts,
  MarketingVariableCosts,
  ComplianceVariableCosts,
  TechnologyVariableCosts,
  VehicleSpecificVariableCosts,
  HybridSpecificVariableCosts,
  SeasonalVariableCosts,
} from '../types';
import { allServiceCodes } from '../data/coloradoMedicaidCodes';

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const defaultFixedCosts: FixedCosts = {
  insuranceCommercialAuto: 450,
  insuranceGeneralLiability: 150,
  hcpfEnrollment: 100,
  countyBHSTLicense: 50,
  countyCount: 1,
  pucLicense: 0,
  vehicleLease: 400,
  maintenanceReserve: 200,
  software: 69,
  drugScreening: 30,
  miscAdmin: 100,
};

// Default values for grouped variable costs
const defaultDirectTransport: DirectTransportVariableCosts = {
  tiresPerMile: 0.03,              // $0.02-$0.04/mile
  repairsPerMile: 0.075,            // $0.05-$0.10/mile
  oilFilterPerMile: 0.015,         // $0.01-$0.02/mile
  vehicleCleaningPerTrip: 10,       // $5-15/trip
  disposableSuppliesPerTrip: 3.50,  // $2-5/trip
};

const defaultDriverStaff: DriverStaffVariableCosts = {
  perTripDriverPay: 0,
  perTripDriverPayMode: 'per_trip',
  overtimeHoursPerMonth: 0,
  overtimeRateMultiplier: 1.5,
  driverBonusesPerMonth: 0,
  additionalShiftsPerMonth: 0,
  temporaryDriverFeePerHour: 37.50, // $25-50/hour premium
  trainingHoursPerMonth: 0,
  trainingRatePerHour: 25,
};

const defaultPatientClient: PatientClientVariableCosts = {
  tripSpecificSuppliesPerTrip: 0,
  patientMealsPerTrip: 0,
  accommodationCostsPerTrip: 0,
  tollsParkingPerMonth: 0,
  waitTimeCompensationPerHour: 20,
  avgWaitTimeHoursPerMonth: 0,
};

const defaultOperational: OperationalVariableCosts = {
  dispatchOvertimeHoursPerMonth: 0,
  dispatchOvertimeRate: 30,
  phoneCommunicationOveragePerMonth: 0,
  creditCardProcessingPercentage: 2.75, // 2.5-3.5%
  fuelSurchargeThreshold: 4.00, // Price per gallon
  fuelSurchargePercentage: 5, // % above threshold
  subcontractorPaymentsPerMonth: 0,
  emergencyRoadsidePerMonth: 0,
};

const defaultAdministrative: AdministrativeVariableCosts = {
  billingClaimsProcessingPerClaim: 0,
  billingClaimsProcessingPercentage: 0,
  billingClaimsProcessingMode: 'per_claim',
  collectionsAgencyPercentage: 25, // 20-35%
  collectionsAgencyRecoveredAmount: 0,
  licensingPermitRenewalsPerMonth: 0,
  insuranceAuditFeesPerMonth: 0,
};

const defaultMarketing: MarketingVariableCosts = {
  referralCommissionsPerClient: 50, // $25-100/referred client
  referralCommissionsCount: 0,
  facilityPartnershipFeePerMonth: 0,
  digitalAdvertisingPerMonth: 0,
  crmListsPerMonth: 0,
};

const defaultCompliance: ComplianceVariableCosts = {
  randomDrugTestsPerMonth: 0,
  randomDrugTestCost: 75, // $50-100
  backgroundCheckRenewalsPerDriver: 0, // Annual cost / 12
  cprFirstAidRecertPerDriver: 9.50, // $75-150/year ≈ $6-13/month
  vehicleInspectionFeesPerMonth: 0,
};

const defaultTechnology: TechnologyVariableCosts = {
  gpsTelematicsPerVehicle: 25, // $15-40/vehicle/month
  rideManagementSoftwarePerTrip: 0,
  rideManagementSoftwareMode: 'per_month',
  rideManagementSoftwareMonthly: 0,
  dataOveragePerMonth: 0,
  softwareAddonsPerMonth: 0,
};

const defaultVehicleSpecific: VehicleSpecificVariableCosts = {
  depreciationPerMile: 0.10, // Miles-based
  registrationFeesPerVehicle: 0, // Annual / 12
  personalPropertyTaxPerVehicle: 0,
  parkingStoragePerVehicle: 0,
};

const defaultHybridSpecific: HybridSpecificVariableCosts = {
  medicaidBillingSupportPerClaim: 0,
  medicaidBillingSupportPercentage: 0,
  medicaidBillingSupportMode: 'per_claim',
  priorAuthorizationPerRequest: 0,
  priorAuthorizationCountPerMonth: 0,
  hcbsWaiverCoordinationHoursPerMonth: 0,
  hcbsWaiverCoordinationRate: 30,
  privatePayCollectionHoursPerMonth: 0,
  privatePayCollectionRate: 30,
  dualBillingSystemMaintenancePerMonth: 0,
};

const defaultSeasonal: SeasonalVariableCosts = {
  winterOperationsPerMonth: 0,
  winterOperationsMonths: [10, 11, 0, 1, 2], // Nov, Dec, Jan, Feb, Mar (0-indexed)
  extremeWeatherCostsPerMonth: 0,
  eventBasedDemandPerMonth: 0,
  vehicleDowntimeReplacementPerMonth: 0,
};

const defaultVariableCosts: VariableCosts = {
  // Existing per-mile costs (preserved for backward compatibility)
  fuelPerMile: 0.20,
  maintenancePerMile: 0.15,
  insuranceVariablePerMile: 0.05,
  
  // Fuel configuration (existing)
  fuelMode: 'api',
  fuelApiPrice: null,
  fuelManualPrice: 3.50,
  vehicleMpg: 17.5,
  
  // New grouped cost categories
  directTransport: defaultDirectTransport,
  driverStaff: defaultDriverStaff,
  patientClient: defaultPatientClient,
  operational: defaultOperational,
  administrative: defaultAdministrative,
  marketing: defaultMarketing,
  compliance: defaultCompliance,
  technology: defaultTechnology,
  vehicleSpecific: defaultVehicleSpecific,
  hybridSpecific: defaultHybridSpecific,
  seasonal: defaultSeasonal,
};

const defaultStaffingCosts: StaffingCosts = {
  owner: {
    enabled: true,
    hourlyRate: 50,
    hoursPerMonth: 160,
    benefitsPercentage: 15,
    basePay: 8000,
    totalCost: 9200,
  },
  driver: {
    enabled: false,
    hourlyRate: 25,
    hoursPerMonth: 160,
    benefitsPercentage: 25,
    basePay: 4000,
    totalCost: 5000,
  },
  admin: {
    enabled: false,
    hourlyRate: 20,
    hoursPerMonth: 40,
    benefitsPercentage: 15,
    basePay: 800,
    totalCost: 920,
  },
  additionalDrivers: 0,
};

const defaultCostStructure: CostStructure = {
  fixed: defaultFixedCosts,
  variable: defaultVariableCosts,
  staffing: defaultStaffingCosts,
  totalFixed: 0,
  totalVariable: 0,
  totalStaffing: 0,
  totalMonthlyCosts: 0,
};

const initialState: ProphetState = {
  serviceCodes: allServiceCodes,
  facilities: [],
  costStructure: defaultCostStructure,
  scenarios: [],
  activeScenarioId: null,
  activeTab: 'costs',
  lastSyncedAt: null,
  pendingSync: false,
};

// ============================================================================
// MIGRATION FUNCTION
// ============================================================================

/**
 * Migrates old VariableCosts structure to new grouped structure
 * Ensures backward compatibility with existing localStorage data
 */
function migrateVariableCosts(oldVariable: any): VariableCosts {
  // If already has new structure, return as-is
  if (oldVariable.directTransport && oldVariable.driverStaff) {
    return oldVariable as VariableCosts;
  }
  
  // Otherwise, merge old structure with new defaults
  return {
    // Preserve existing values
    fuelPerMile: oldVariable.fuelPerMile ?? defaultVariableCosts.fuelPerMile,
    maintenancePerMile: oldVariable.maintenancePerMile ?? defaultVariableCosts.maintenancePerMile,
    insuranceVariablePerMile: oldVariable.insuranceVariablePerMile ?? defaultVariableCosts.insuranceVariablePerMile,
    fuelMode: oldVariable.fuelMode ?? defaultVariableCosts.fuelMode,
    fuelApiPrice: oldVariable.fuelApiPrice ?? defaultVariableCosts.fuelApiPrice,
    fuelManualPrice: oldVariable.fuelManualPrice ?? defaultVariableCosts.fuelManualPrice,
    vehicleMpg: oldVariable.vehicleMpg ?? defaultVariableCosts.vehicleMpg,
    
    // Add new grouped structures with defaults
    directTransport: defaultDirectTransport,
    driverStaff: defaultDriverStaff,
    patientClient: defaultPatientClient,
    operational: defaultOperational,
    administrative: defaultAdministrative,
    marketing: defaultMarketing,
    compliance: defaultCompliance,
    technology: defaultTechnology,
    vehicleSpecific: defaultVehicleSpecific,
    hybridSpecific: defaultHybridSpecific,
    seasonal: defaultSeasonal,
  };
}

/**
 * Migrates old CostStructure to ensure new variable costs structure exists
 */
function migrateCostStructure(oldCostStructure: any): CostStructure {
  return {
    ...oldCostStructure,
    variable: migrateVariableCosts(oldCostStructure?.variable || {}),
  };
}

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface ProphetActions {
  // Service Codes
  updateServiceCode: (id: string, updates: Partial<ServiceCode>) => void;
  addServiceCode: (code: Omit<ServiceCode, 'id'>) => void;
  deleteServiceCode: (id: string) => void;
  resetServiceCodes: () => void;
  
  // Treatment Facilities
  addFacility: (facility: Omit<TreatmentFacility, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateFacility: (id: string, updates: Partial<TreatmentFacility>) => void;
  deleteFacility: (id: string) => void;
  
  // Cost Structure
  updateFixedCosts: (updates: Partial<FixedCosts>) => void;
  updateVariableCosts: (updates: Partial<VariableCosts>) => void;
  updateStaffingCosts: (updates: Partial<StaffingCosts>) => void;
  setFuelApiPrice: (price: number) => void;
  recalculateCosts: () => void;
  
  // Scenarios
  addScenario: (scenario: Omit<BusinessScenario, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateScenario: (id: string, updates: Partial<BusinessScenario>) => void;
  deleteScenario: (id: string) => void;
  setActiveScenario: (id: string | null) => void;
  
  // UI
  setActiveTab: (tab: ProphetState['activeTab']) => void;
  
  // Sync
  syncToSupabase: () => Promise<void>;
  syncFromSupabase: () => Promise<void>;
  
  // Calculations
  calculateFacilityRevenue: (facilityId: string) => number;
  calculateScenarioRevenue: (scenarioId: string) => number;
  calculateScenarioCosts: (scenarioId: string, totalMiles: number) => number;
  calculateBreakEven: (scenarioId: string) => { breakEvenTrips: number; tripsGap: number };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function calculateStaffMemberCost(staff: StaffingCosts['owner']): number {
  if (!staff.enabled) return 0;
  const basePay = staff.hourlyRate * staff.hoursPerMonth;
  return basePay * (1 + staff.benefitsPercentage / 100);
}

function calculateTotalFixed(fixed: FixedCosts): number {
  return (
    fixed.insuranceCommercialAuto +
    fixed.insuranceGeneralLiability +
    fixed.hcpfEnrollment +
    (fixed.countyBHSTLicense * fixed.countyCount) +
    fixed.pucLicense +
    fixed.vehicleLease +
    fixed.maintenanceReserve +
    fixed.software +
    fixed.drugScreening +
    fixed.miscAdmin
  );
}

function calculateTotalVariable(variable: VariableCosts, miles: number, trips: number = 0, revenue: number = 0, baseDriverRate: number = 25): number {
  // Per-mile costs (existing + new direct transport per-mile)
  const perMileCosts = miles * (
    variable.fuelPerMile +
    variable.maintenancePerMile +
    variable.insuranceVariablePerMile +
    variable.directTransport.tiresPerMile +
    variable.directTransport.repairsPerMile +
    variable.directTransport.oilFilterPerMile +
    variable.vehicleSpecific.depreciationPerMile
  );
  
  // Per-trip costs
  const perTripCosts = trips * (
    variable.directTransport.vehicleCleaningPerTrip +
    variable.directTransport.disposableSuppliesPerTrip +
    variable.patientClient.tripSpecificSuppliesPerTrip +
    variable.patientClient.patientMealsPerTrip +
    variable.patientClient.accommodationCostsPerTrip
  );
  
  // Driver/Staff variable costs
  const driverStaffCosts = (
    // Per-trip driver pay
    (variable.driverStaff.perTripDriverPayMode === 'per_trip' 
      ? variable.driverStaff.perTripDriverPay * trips
      : variable.driverStaff.perTripDriverPay * miles) +
    // Overtime
    variable.driverStaff.overtimeHoursPerMonth * baseDriverRate * variable.driverStaff.overtimeRateMultiplier +
    // Bonuses
    variable.driverStaff.driverBonusesPerMonth +
    // Additional shifts (estimate based on base rate)
    variable.driverStaff.additionalShiftsPerMonth * baseDriverRate * 8 + // 8 hours per shift
    // Temporary drivers (estimate hours)
    (variable.driverStaff.temporaryDriverFeePerHour * 0) + // User sets hours separately
    // Training
    variable.driverStaff.trainingHoursPerMonth * variable.driverStaff.trainingRatePerHour
  );
  
  // Patient/Client related monthly costs
  const patientClientCosts = (
    variable.patientClient.tollsParkingPerMonth +
    variable.patientClient.waitTimeCompensationPerHour * variable.patientClient.avgWaitTimeHoursPerMonth
  );
  
  // Operational variable costs
  const operationalCosts = (
    variable.operational.dispatchOvertimeHoursPerMonth * variable.operational.dispatchOvertimeRate +
    variable.operational.phoneCommunicationOveragePerMonth +
    (revenue > 0 ? (revenue * variable.operational.creditCardProcessingPercentage / 100) : 0) +
    // Fuel surcharge (if applicable)
    (variable.fuelApiPrice && variable.fuelApiPrice > variable.operational.fuelSurchargeThreshold
      ? miles * (variable.fuelApiPrice - variable.operational.fuelSurchargeThreshold) * (variable.operational.fuelSurchargePercentage / 100) / variable.vehicleMpg
      : 0) +
    variable.operational.subcontractorPaymentsPerMonth +
    variable.operational.emergencyRoadsidePerMonth
  );
  
  // Administrative variable costs
  const administrativeCosts = (
    (variable.administrative.billingClaimsProcessingMode === 'per_claim'
      ? variable.administrative.billingClaimsProcessingPerClaim * trips // Estimate: 1 claim per trip
      : revenue * variable.administrative.billingClaimsProcessingPercentage / 100) +
    (variable.administrative.collectionsAgencyRecoveredAmount * variable.administrative.collectionsAgencyPercentage / 100) +
    variable.administrative.licensingPermitRenewalsPerMonth +
    variable.administrative.insuranceAuditFeesPerMonth
  );
  
  // Marketing costs
  const marketingCosts = (
    variable.marketing.referralCommissionsPerClient * variable.marketing.referralCommissionsCount +
    variable.marketing.facilityPartnershipFeePerMonth +
    variable.marketing.digitalAdvertisingPerMonth +
    variable.marketing.crmListsPerMonth
  );
  
  // Compliance costs
  const complianceCosts = (
    variable.compliance.randomDrugTestsPerMonth * variable.compliance.randomDrugTestCost +
    variable.compliance.backgroundCheckRenewalsPerDriver * 0 + // User sets driver count separately
    variable.compliance.cprFirstAidRecertPerDriver * 0 + // User sets driver count separately
    variable.compliance.vehicleInspectionFeesPerMonth
  );
  
  // Technology costs
  const technologyCosts = (
    variable.technology.gpsTelematicsPerVehicle * 0 + // User sets vehicle count separately
    (variable.technology.rideManagementSoftwareMode === 'per_trip'
      ? variable.technology.rideManagementSoftwarePerTrip * trips
      : variable.technology.rideManagementSoftwareMonthly) +
    variable.technology.dataOveragePerMonth +
    variable.technology.softwareAddonsPerMonth
  );
  
  // Vehicle specific costs
  const vehicleSpecificCosts = (
    variable.vehicleSpecific.registrationFeesPerVehicle * 0 + // User sets vehicle count separately
    variable.vehicleSpecific.personalPropertyTaxPerVehicle * 0 + // User sets vehicle count separately
    variable.vehicleSpecific.parkingStoragePerVehicle * 0 // User sets vehicle count separately
  );
  
  // Hybrid-specific costs
  const hybridSpecificCosts = (
    (variable.hybridSpecific.medicaidBillingSupportMode === 'per_claim'
      ? variable.hybridSpecific.medicaidBillingSupportPerClaim * trips // Estimate: 1 claim per trip
      : revenue * variable.hybridSpecific.medicaidBillingSupportPercentage / 100) +
    variable.hybridSpecific.priorAuthorizationPerRequest * variable.hybridSpecific.priorAuthorizationCountPerMonth +
    variable.hybridSpecific.hcbsWaiverCoordinationHoursPerMonth * variable.hybridSpecific.hcbsWaiverCoordinationRate +
    variable.hybridSpecific.privatePayCollectionHoursPerMonth * variable.hybridSpecific.privatePayCollectionRate +
    variable.hybridSpecific.dualBillingSystemMaintenancePerMonth
  );
  
  // Seasonal costs (apply only during winter months)
  const currentMonth = new Date().getMonth(); // 0-11
  const isWinterMonth = variable.seasonal.winterOperationsMonths.includes(currentMonth);
  const seasonalCosts = (
    (isWinterMonth ? variable.seasonal.winterOperationsPerMonth : 0) +
    variable.seasonal.extremeWeatherCostsPerMonth +
    variable.seasonal.eventBasedDemandPerMonth +
    variable.seasonal.vehicleDowntimeReplacementPerMonth
  );
  
  return (
    perMileCosts +
    perTripCosts +
    driverStaffCosts +
    patientClientCosts +
    operationalCosts +
    administrativeCosts +
    marketingCosts +
    complianceCosts +
    technologyCosts +
    vehicleSpecificCosts +
    hybridSpecificCosts +
    seasonalCosts
  );
}

function calculateTotalStaffing(staffing: StaffingCosts): number {
  let total = 0;
  if (staffing.owner.enabled) total += calculateStaffMemberCost(staffing.owner);
  if (staffing.driver.enabled) total += calculateStaffMemberCost(staffing.driver);
  if (staffing.admin.enabled) total += calculateStaffMemberCost(staffing.admin);
  // Additional drivers
  if (staffing.additionalDrivers > 0) {
    total += staffing.additionalDrivers * calculateStaffMemberCost(staffing.driver);
  }
  return total;
}

// ============================================================================
// STORE
// ============================================================================

export const useProphetStore = create<ProphetState & ProphetActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========== SERVICE CODES ==========
      
      updateServiceCode: (id, updates) => {
        set((state) => ({
          serviceCodes: state.serviceCodes.map((code) =>
            code.id === id
              ? { ...code, ...updates, lastUpdated: new Date().toISOString() }
              : code
          ),
          pendingSync: true,
        }));
      },

      addServiceCode: (code) => {
        const newCode: ServiceCode = {
          ...code,
          id: generateId(),
          isCustom: true,
          lastUpdated: new Date().toISOString(),
        };
        set((state) => ({
          serviceCodes: [...state.serviceCodes, newCode],
          pendingSync: true,
        }));
      },

      deleteServiceCode: (id) => {
        set((state) => ({
          serviceCodes: state.serviceCodes.filter((code) => code.id !== id),
          pendingSync: true,
        }));
      },

      resetServiceCodes: () => {
        set({
          serviceCodes: allServiceCodes,
          pendingSync: true,
        });
      },

      // ========== TREATMENT FACILITIES ==========
      
      addFacility: (facility) => {
        const state = get();
        if (state.facilities.length >= 3) {
          console.warn('Maximum 3 facilities allowed');
          return;
        }
        
        const usedSlots = state.facilities.map((f) => f.slot);
        const availableSlot = ([1, 2, 3] as const).find((s) => !usedSlots.includes(s));
        
        if (!availableSlot) return;
        
        const newFacility: TreatmentFacility = {
          ...facility,
          id: generateId(),
          slot: availableSlot,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          facilities: [...state.facilities, newFacility],
          pendingSync: true,
        }));
      },

      updateFacility: (id, updates) => {
        set((state) => ({
          facilities: state.facilities.map((facility) =>
            facility.id === id
              ? { ...facility, ...updates, updatedAt: new Date().toISOString() }
              : facility
          ),
          pendingSync: true,
        }));
      },

      deleteFacility: (id) => {
        set((state) => ({
          facilities: state.facilities.filter((f) => f.id !== id),
          pendingSync: true,
        }));
      },

      // ========== COST STRUCTURE ==========
      
      updateFixedCosts: (updates) => {
        set((state) => {
          const newFixed = { ...state.costStructure.fixed, ...updates };
          const totalFixed = calculateTotalFixed(newFixed);
          return {
            costStructure: {
              ...state.costStructure,
              fixed: newFixed,
              totalFixed,
              totalMonthlyCosts: totalFixed + state.costStructure.totalVariable + state.costStructure.totalStaffing,
            },
            pendingSync: true,
          };
        });
      },

      updateVariableCosts: (updates) => {
        set((state) => ({
          costStructure: {
            ...state.costStructure,
            variable: { ...state.costStructure.variable, ...updates },
          },
          pendingSync: true,
        }));
      },

      updateStaffingCosts: (updates) => {
        set((state) => {
          const newStaffing = { ...state.costStructure.staffing, ...updates };
          
          // Recalculate staff totals
          if (newStaffing.owner) {
            newStaffing.owner.basePay = newStaffing.owner.hourlyRate * newStaffing.owner.hoursPerMonth;
            newStaffing.owner.totalCost = calculateStaffMemberCost(newStaffing.owner);
          }
          if (newStaffing.driver) {
            newStaffing.driver.basePay = newStaffing.driver.hourlyRate * newStaffing.driver.hoursPerMonth;
            newStaffing.driver.totalCost = calculateStaffMemberCost(newStaffing.driver);
          }
          if (newStaffing.admin) {
            newStaffing.admin.basePay = newStaffing.admin.hourlyRate * newStaffing.admin.hoursPerMonth;
            newStaffing.admin.totalCost = calculateStaffMemberCost(newStaffing.admin);
          }
          
          const totalStaffing = calculateTotalStaffing(newStaffing);
          
          return {
            costStructure: {
              ...state.costStructure,
              staffing: newStaffing,
              totalStaffing,
              totalMonthlyCosts: state.costStructure.totalFixed + state.costStructure.totalVariable + totalStaffing,
            },
            pendingSync: true,
          };
        });
      },

      setFuelApiPrice: (price) => {
        set((state) => {
          const variable = state.costStructure.variable;
          const fuelPerMile = price / variable.vehicleMpg;
          
          return {
            costStructure: {
              ...state.costStructure,
              variable: {
                ...variable,
                fuelApiPrice: price,
                fuelPerMile: variable.fuelMode === 'api' ? fuelPerMile : variable.fuelPerMile,
              },
            },
          };
        });
      },

      recalculateCosts: () => {
        set((state) => {
          const totalFixed = calculateTotalFixed(state.costStructure.fixed);
          const totalStaffing = calculateTotalStaffing(state.costStructure.staffing);
          // Note: totalVariable depends on miles, calculated per scenario
          
          return {
            costStructure: {
              ...state.costStructure,
              totalFixed,
              totalStaffing,
              totalMonthlyCosts: totalFixed + state.costStructure.totalVariable + totalStaffing,
            },
          };
        });
      },

      // ========== SCENARIOS ==========
      
      addScenario: (scenario) => {
        const newScenario: BusinessScenario = {
          ...scenario,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          scenarios: [...state.scenarios, newScenario],
          activeScenarioId: newScenario.id,
          pendingSync: true,
        }));
      },

      updateScenario: (id, updates) => {
        set((state) => ({
          scenarios: state.scenarios.map((scenario) =>
            scenario.id === id
              ? { ...scenario, ...updates, updatedAt: new Date().toISOString() }
              : scenario
          ),
          pendingSync: true,
        }));
      },

      deleteScenario: (id) => {
        set((state) => ({
          scenarios: state.scenarios.filter((s) => s.id !== id),
          activeScenarioId: state.activeScenarioId === id ? null : state.activeScenarioId,
          pendingSync: true,
        }));
      },

      setActiveScenario: (id) => {
        set({ activeScenarioId: id });
      },

      // ========== UI ==========
      
      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },

      // ========== SYNC ==========
      
      syncToSupabase: async () => {
        const state = get();
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          // Upsert scenarios
          for (const scenario of state.scenarios) {
            await supabase.from('prophet_scenarios').upsert({
              id: scenario.id,
              user_id: user.id,
              name: scenario.name,
              data: scenario,
              updated_at: new Date().toISOString(),
            });
          }
          
          // Upsert facilities
          for (const facility of state.facilities) {
            await supabase.from('prophet_facilities').upsert({
              id: facility.id,
              user_id: user.id,
              slot: facility.slot,
              data: facility,
              updated_at: new Date().toISOString(),
            });
          }
          
          // Save service code overrides (only custom or modified)
          const modifiedCodes = state.serviceCodes.filter((code) => code.isCustom);
          for (const code of modifiedCodes) {
            await supabase.from('prophet_service_codes').upsert({
              id: code.id,
              user_id: user.id,
              code: code.code,
              rate_overrides: code,
              updated_at: new Date().toISOString(),
            });
          }
          
          set({
            lastSyncedAt: new Date().toISOString(),
            pendingSync: false,
          });
        } catch (error) {
          console.error('Error syncing to Supabase:', error);
        }
      },

      syncFromSupabase: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          // Helper to check if error is a "table doesn't exist" error
          const isTableNotFoundError = (error: any) => {
            if (!error) return false;
            // Check for various Supabase error codes/messages that indicate missing tables
            const errorCode = error.code;
            const errorMessage = error.message?.toLowerCase() || '';
            const errorDetails = error.details?.toLowerCase() || '';
            
            return (
              errorCode === 'PGRST116' || // Relation does not exist
              errorCode === '42P01' || // PostgreSQL: relation does not exist
              errorMessage.includes('relation') && errorMessage.includes('does not exist') ||
              errorMessage.includes('table') && errorMessage.includes('does not exist') ||
              errorMessage.includes('404') ||
              errorDetails.includes('relation') && errorDetails.includes('does not exist')
            );
          };
          
          // Fetch scenarios (gracefully handle missing tables - 404 is expected if tables don't exist)
          const { data: scenarios, error: scenariosError } = await supabase
            .from('prophet_scenarios')
            .select('*')
            .eq('user_id', user.id);
          
          // Silently ignore "table doesn't exist" errors - we'll use localStorage
          if (scenariosError && !isTableNotFoundError(scenariosError)) {
            console.warn('Error fetching scenarios:', scenariosError);
          }
          
          // Fetch facilities (gracefully handle missing tables)
          const { data: facilities, error: facilitiesError } = await supabase
            .from('prophet_facilities')
            .select('*')
            .eq('user_id', user.id);
          
          // Silently ignore "table doesn't exist" errors - we'll use localStorage
          if (facilitiesError && !isTableNotFoundError(facilitiesError)) {
            console.warn('Error fetching facilities:', facilitiesError);
          }
          
          // Fetch custom codes (gracefully handle missing tables)
          const { data: customCodes, error: codesError } = await supabase
            .from('prophet_service_codes')
            .select('*')
            .eq('user_id', user.id);
          
          // Silently ignore "table doesn't exist" errors - we'll use localStorage
          if (codesError && !isTableNotFoundError(codesError)) {
            console.warn('Error fetching service codes:', codesError);
          }
          
          if (scenarios || facilities || customCodes) {
            set((state) => ({
              scenarios: scenarios?.map((s) => s.data as BusinessScenario) || state.scenarios,
              facilities: facilities?.map((f) => f.data as TreatmentFacility) || state.facilities,
              serviceCodes: customCodes
                ? [
                    ...allServiceCodes,
                    ...customCodes.map((c) => c.rate_overrides as ServiceCode),
                  ]
                : state.serviceCodes,
              lastSyncedAt: new Date().toISOString(),
            }));
          }
        } catch (error) {
          console.error('Error syncing from Supabase:', error);
        }
      },

      // ========== CALCULATIONS ==========
      
      calculateFacilityRevenue: (facilityId) => {
        const state = get();
        const facility = state.facilities.find((f) => f.id === facilityId);
        if (!facility) return 0;
        
        let revenue = 0;
        
        for (const billing of facility.billingCodes) {
          const code = state.serviceCodes.find((c) => c.id === billing.codeId);
          if (!code) continue;
          
          let volumeMultiplier = 1;
          switch (billing.frequency) {
            case 'daily':
              volumeMultiplier = 22; // working days
              break;
            case 'weekly':
              volumeMultiplier = 4.33; // weeks per month
              break;
            case 'monthly':
              volumeMultiplier = 1;
              break;
          }
          
          revenue += code.baseRate * billing.estimatedVolume * volumeMultiplier;
        }
        
        return revenue;
      },

      calculateScenarioRevenue: (scenarioId) => {
        const state = get();
        const scenario = state.scenarios.find((s) => s.id === scenarioId);
        if (!scenario) return 0;
        
        let totalRevenue = 0;
        
        for (const trip of scenario.trips) {
          const multiplier = trip.multiplier !== undefined ? trip.multiplier : (trip.roundTrip ? 2 : 1);
          
          if (trip.billingMethod === 'contract' && trip.contractFee) {
            totalRevenue += trip.contractFee;
          } else if (trip.billingMethod === 'medicaid' || trip.billingMethod === 'nmt') {
            const clients = trip.clients || 1; // Default to 1 if not set
            const effectiveTrips = trip.requiresWaiver
              ? trip.tripsPerMonth * clients * (trip.percentWithWaiver / 100)
              : trip.tripsPerMonth * clients;
            
            const tripRevenue = trip.baseRatePerTrip + (trip.avgMiles * trip.mileageRate);
            totalRevenue += effectiveTrips * tripRevenue * multiplier;
          } else if (trip.billingMethod === 'mileage') {
            const clients = trip.clients || 1; // Default to 1 if not set
            totalRevenue += trip.tripsPerMonth * clients * trip.avgMiles * 0.49 * multiplier;
          }
        }
        
        // Add facility revenues
        for (const facilityId of scenario.facilityIds) {
          totalRevenue += get().calculateFacilityRevenue(facilityId);
        }
        
        return totalRevenue;
      },

      calculateScenarioCosts: (scenarioId, totalMiles) => {
        const state = get();
        const scenario = state.scenarios.find((s) => s.id === scenarioId);
        if (!scenario) return 0;
        
        // Calculate total trips for per-trip variable costs
        const totalTrips = scenario.trips.reduce((sum, trip) => {
          const multiplier = trip.multiplier !== undefined ? trip.multiplier : (trip.roundTrip ? 2 : 1);
          return sum + (trip.tripsPerMonth * multiplier);
        }, 0);
        
        // Calculate revenue for percentage-based variable costs
        const revenue = get().calculateScenarioRevenue(scenarioId);
        
        // Get base driver rate for overtime calculations
        const baseDriverRate = scenario.costs.staffing.driver.hourlyRate || 25;
        
        const costs = scenario.costs;
        const fixed = calculateTotalFixed(costs.fixed);
        const variable = calculateTotalVariable(costs.variable, totalMiles, totalTrips, revenue, baseDriverRate);
        const staffing = calculateTotalStaffing(costs.staffing);
        
        return fixed + variable + staffing;
      },

      calculateBreakEven: (scenarioId) => {
        const state = get();
        const scenario = state.scenarios.find((s) => s.id === scenarioId);
        if (!scenario) return { breakEvenTrips: 0, tripsGap: 0 };
        
        const totalTrips = scenario.trips.reduce((sum, trip) => {
          const multiplier = trip.multiplier !== undefined ? trip.multiplier : (trip.roundTrip ? 2 : 1);
          return sum + (trip.tripsPerMonth * multiplier);
        }, 0);
        
        const revenue = get().calculateScenarioRevenue(scenarioId);
        const avgRevenuePerTrip = totalTrips > 0 ? revenue / totalTrips : 0;
        
        // Calculate average miles per trip for per-mile variable costs
        const avgMiles = scenario.trips.reduce((sum, trip) => sum + trip.avgMiles, 0) / (scenario.trips.length || 1);
        const variable = scenario.costs.variable;
        const baseDriverRate = scenario.costs.staffing.driver.hourlyRate || 25;
        
        // Calculate variable cost per trip (per-mile + per-trip + monthly variable costs per trip)
        // Per-mile variable costs per trip
        const perMileCostsPerTrip = avgMiles * (
          variable.fuelPerMile +
          variable.maintenancePerMile +
          variable.insuranceVariablePerMile +
          variable.directTransport.tiresPerMile +
          variable.directTransport.repairsPerMile +
          variable.directTransport.oilFilterPerMile +
          variable.vehicleSpecific.depreciationPerMile
        );
        
        // Per-trip variable costs
        const perTripCosts = (
          variable.directTransport.vehicleCleaningPerTrip +
          variable.directTransport.disposableSuppliesPerTrip +
          variable.patientClient.tripSpecificSuppliesPerTrip +
          variable.patientClient.patientMealsPerTrip +
          variable.patientClient.accommodationCostsPerTrip
        );
        
        // Driver/Staff variable costs per trip (estimated)
        const driverStaffCostsPerTrip = totalTrips > 0 ? (
          (variable.driverStaff.perTripDriverPayMode === 'per_trip' 
            ? variable.driverStaff.perTripDriverPay
            : variable.driverStaff.perTripDriverPay * avgMiles) +
          (variable.driverStaff.overtimeHoursPerMonth * baseDriverRate * variable.driverStaff.overtimeRateMultiplier / totalTrips) +
          (variable.driverStaff.driverBonusesPerMonth / totalTrips) +
          (variable.driverStaff.trainingHoursPerMonth * variable.driverStaff.trainingRatePerHour / totalTrips)
        ) : 0;
        
        // Monthly variable costs per trip (estimated)
        const monthlyVariableCostsPerTrip = totalTrips > 0 ? (
          (variable.patientClient.tollsParkingPerMonth / totalTrips) +
          (variable.operational.dispatchOvertimeHoursPerMonth * variable.operational.dispatchOvertimeRate / totalTrips) +
          (variable.operational.phoneCommunicationOveragePerMonth / totalTrips) +
          (variable.administrative.licensingPermitRenewalsPerMonth / totalTrips) +
          (variable.marketing.facilityPartnershipFeePerMonth / totalTrips) +
          (variable.marketing.digitalAdvertisingPerMonth / totalTrips) +
          (variable.compliance.vehicleInspectionFeesPerMonth / totalTrips) +
          (variable.technology.dataOveragePerMonth / totalTrips) +
          (variable.hybridSpecific.dualBillingSystemMaintenancePerMonth / totalTrips)
        ) : 0;
        
        // Percentage-based costs per trip (estimated from revenue)
        const percentageCostsPerTrip = totalTrips > 0 && revenue > 0 ? (
          (revenue * variable.operational.creditCardProcessingPercentage / 100 / totalTrips) +
          (revenue * variable.administrative.billingClaimsProcessingPercentage / 100 / totalTrips) +
          (revenue * variable.hybridSpecific.medicaidBillingSupportPercentage / 100 / totalTrips)
        ) : 0;
        
        const variableCostPerTrip = (
          perMileCostsPerTrip +
          perTripCosts +
          driverStaffCostsPerTrip +
          monthlyVariableCostsPerTrip +
          percentageCostsPerTrip
        );
        
        const contributionMargin = avgRevenuePerTrip - variableCostPerTrip;
        
        if (contributionMargin <= 0) {
          return { breakEvenTrips: Infinity, tripsGap: Infinity };
        }
        
        const fixedCosts = calculateTotalFixed(scenario.costs.fixed) + calculateTotalStaffing(scenario.costs.staffing);
        const breakEvenTrips = Math.ceil(fixedCosts / contributionMargin);
        const tripsGap = breakEvenTrips - totalTrips;
        
        return { breakEvenTrips, tripsGap };
      },
    }),
    {
      name: 'prophet-calculator',
      storage: createJSONStorage(() => localStorage),
      version: 2, // Increment version for new variable costs structure
      migrate: (persistedState: any, version: number) => {
        // Migrate from version 1 to version 2
        if (version < 2) {
          // Migrate cost structure to include new variable costs
          if (persistedState?.costStructure) {
            persistedState.costStructure = migrateCostStructure(persistedState.costStructure);
          }
          
          // Migrate scenarios to include new variable costs in their cost structures
          if (persistedState?.scenarios) {
            persistedState.scenarios = persistedState.scenarios.map((scenario: any) => ({
              ...scenario,
              costs: migrateCostStructure(scenario.costs || {}),
            }));
          }
        }
        return persistedState;
      },
      partialize: (state) => ({
        serviceCodes: state.serviceCodes,
        facilities: state.facilities,
        costStructure: state.costStructure,
        scenarios: state.scenarios,
        activeScenarioId: state.activeScenarioId,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);

