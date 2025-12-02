/**
 * PROPHET Calculator - Zustand Store
 * With localStorage persistence and Supabase sync
 */

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

const defaultVariableCosts: VariableCosts = {
  fuelPerMile: 0.20,
  maintenancePerMile: 0.15,
  insuranceVariablePerMile: 0.05,
  fuelMode: 'api',
  fuelApiPrice: null,
  fuelManualPrice: 3.50,
  vehicleMpg: 17.5,
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

function calculateTotalVariable(variable: VariableCosts, miles: number): number {
  const totalPerMile = variable.fuelPerMile + variable.maintenancePerMile + variable.insuranceVariablePerMile;
  return totalPerMile * miles;
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
          
          // Fetch scenarios
          const { data: scenarios } = await supabase
            .from('prophet_scenarios')
            .select('*')
            .eq('user_id', user.id);
          
          // Fetch facilities
          const { data: facilities } = await supabase
            .from('prophet_facilities')
            .select('*')
            .eq('user_id', user.id);
          
          // Fetch custom codes
          const { data: customCodes } = await supabase
            .from('prophet_service_codes')
            .select('*')
            .eq('user_id', user.id);
          
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
          const multiplier = trip.roundTrip ? 2 : 1;
          
          if (trip.billingMethod === 'contract' && trip.contractFee) {
            totalRevenue += trip.contractFee;
          } else if (trip.billingMethod === 'medicaid' || trip.billingMethod === 'nmt') {
            const effectiveTrips = trip.requiresWaiver
              ? trip.tripsPerMonth * (trip.percentWithWaiver / 100)
              : trip.tripsPerMonth;
            
            const tripRevenue = trip.baseRatePerTrip + (trip.avgMiles * trip.mileageRate);
            totalRevenue += effectiveTrips * tripRevenue * multiplier;
          } else if (trip.billingMethod === 'mileage') {
            totalRevenue += trip.tripsPerMonth * trip.avgMiles * 0.49 * multiplier;
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
        
        const costs = scenario.costs;
        const fixed = calculateTotalFixed(costs.fixed);
        const variable = calculateTotalVariable(costs.variable, totalMiles);
        const staffing = calculateTotalStaffing(costs.staffing);
        
        return fixed + variable + staffing;
      },

      calculateBreakEven: (scenarioId) => {
        const state = get();
        const scenario = state.scenarios.find((s) => s.id === scenarioId);
        if (!scenario) return { breakEvenTrips: 0, tripsGap: 0 };
        
        const totalTrips = scenario.trips.reduce((sum, trip) => {
          const multiplier = trip.roundTrip ? 2 : 1;
          return sum + (trip.tripsPerMonth * multiplier);
        }, 0);
        
        const revenue = get().calculateScenarioRevenue(scenarioId);
        const avgRevenuePerTrip = totalTrips > 0 ? revenue / totalTrips : 0;
        
        // Calculate variable cost per trip
        const avgMiles = scenario.trips.reduce((sum, trip) => sum + trip.avgMiles, 0) / (scenario.trips.length || 1);
        const variable = scenario.costs.variable;
        const variableCostPerTrip = avgMiles * (variable.fuelPerMile + variable.maintenancePerMile + variable.insuranceVariablePerMile);
        
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
      version: 1,
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

export default useProphetStore;

