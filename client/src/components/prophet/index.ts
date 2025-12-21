/**
 * PROPHET Calculator Module
 * Main export file
 */

// Main Component
export { ProphetCalculator } from './ProphetCalculator';

// Sub-modules
export { CostStructureManager, FixedCosts, VariableCosts, StaffingCosts } from './CostStructureManager';
export { ServiceCodeLibrary, ServiceCodeTable } from './ServiceCodeLibrary';
export { TreatmentFacilitiesManager, FacilityCard, FacilityForm } from './TreatmentFacilities';
export { ScenarioBuilder } from './ScenarioBuilder';

// Store
export { useProphetStore } from './hooks/useProphetStore';

// Types
export * from './types';

// Data
export { 
  allServiceCodes, 
  bhstCodes, 
  nemtCodes, 
  nmtCodes, 
  nmtMileageBands,
  getMileageBand,
  facilityClinicalCodes,
  facilityBillingCodes,
  transportCodes,
  mileageReimbursement,
} from './data/coloradoMedicaidCodes';

