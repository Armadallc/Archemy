/**
 * Colorado Medicaid Service Codes - July 2025 Rates
 * Pre-loaded data for PROPHET Calculator
 * 
 * IMPORTANT: These rates are editable by users and should be updated
 * when HCPF publishes new fee schedules.
 * 
 * References:
 * - Health First Colorado Fee Schedule (10/01/2025 v1.1)
 * - HCBS BI, CMHS, EBD Billing Manual
 * - Denver Regional Pricing Appendix
 */

import { ServiceCode, MileageBand } from '../types';

const now = new Date().toISOString();

// ============================================================================
// NMT MILEAGE BANDS - Non-Medical Transport Distance-Based Rates
// ============================================================================

export const nmtMileageBands: MileageBand[] = [
  {
    id: 'band-1',
    modifier: 'U1',
    minMiles: 0,
    maxMiles: 10,
    rate: 22.28,
    description: 'Band 1: 0-10 miles',
  },
  {
    id: 'band-2',
    modifier: 'U2',
    minMiles: 11,
    maxMiles: 25,
    rate: 33.42,
    description: 'Band 2: 11-25 miles',
  },
  {
    id: 'band-3',
    modifier: 'U3',
    minMiles: 26,
    maxMiles: 50,
    rate: 55.70,
    description: 'Band 3: 26-50 miles',
  },
  {
    id: 'band-4',
    modifier: 'U4',
    minMiles: 51,
    maxMiles: null, // Unlimited
    rate: 78.00,
    description: 'Band 4: 51+ miles',
  },
];

// Helper to get band by miles
export function getMileageBand(miles: number): MileageBand | undefined {
  return nmtMileageBands.find(band => 
    miles >= band.minMiles && (band.maxMiles === null || miles <= band.maxMiles)
  );
}

// ============================================================================
// BHST CODES - Behavioral Health Secure Transport (CRISIS ONLY)
// ============================================================================

export const bhstCodes: ServiceCode[] = [
  {
    id: 'bhst-a0999-et',
    code: 'A0999',
    modifier: 'ET',
    category: 'BHST',
    description: 'Behavioral Health Secure Transport - Base Rate',
    rateType: 'per_trip',
    baseRate: 267.91,
    mileageCode: 'A0425',
    mileageRate: 6.51,
    unit: 'trip',
    allowable: {
      perDay: 2, // Typically 1 round trip
    },
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    restrictions: {
      requiresCrisis: true,
      providerTypes: ['13/124', '13/324', '97/773'],
      notes: 'CRISIS ONLY: Transport from crisis site to facility, or inter-facility. One member per vehicle. Requires M-1 hold or voluntary crisis admission.',
    },
    notes: 'Base rate per trip. Add A0425-ET for mileage. Both required for full reimbursement.',
  },
  {
    id: 'bhst-a0425-et',
    code: 'A0425',
    modifier: 'ET',
    category: 'BHST',
    description: 'BHST Mileage - Per Statute Mile',
    rateType: 'per_mile',
    baseRate: 6.51,
    unit: 'mile',
    allowable: {},
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    restrictions: {
      requiresCrisis: true,
      notes: 'Bill with A0999-ET base rate. Loaded miles only (patient on board).',
    },
    notes: 'Mileage component for BHST. Use with A0999-ET base rate.',
  },
];

// ============================================================================
// NEMT CODES - Non-Emergency Medical Transport (MORATORIUM)
// ============================================================================

export const nemtCodes: ServiceCode[] = [
  {
    id: 'nemt-a0120',
    code: 'A0120',
    category: 'NEMT',
    description: 'Ambulatory Van Transport',
    rateType: 'per_trip',
    baseRate: 36.40,
    mileageCode: 'S0215',
    mileageRate: 3.00,
    unit: 'trip',
    allowable: {
      perDay: 4, // 2 round trips
    },
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    isBlocked: true,
    blockReason: '⚠️ MORATORIUM: New NEMT provider enrollment blocked through October 2025',
    restrictions: {
      maxTripsPerDay: 4,
      notes: 'Ambulatory members only. No wheelchair or stretcher.',
    },
    notes: 'Standard ambulatory van. Add S0215 for mileage.',
  },
  {
    id: 'nemt-a0130',
    code: 'A0130',
    category: 'NEMT',
    description: 'Wheelchair Van Transport',
    rateType: 'per_trip',
    baseRate: 35.40,
    mileageCode: 'S0209',
    mileageRate: 3.00,
    unit: 'trip',
    allowable: {
      perDay: 4,
    },
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    isBlocked: true,
    blockReason: '⚠️ MORATORIUM: New NEMT provider enrollment blocked through October 2025',
  },
  {
    id: 'nemt-a0100',
    code: 'A0100',
    category: 'NEMT',
    description: 'Taxicab Transport',
    rateType: 'per_trip',
    baseRate: 36.98,
    unit: 'trip',
    allowable: {
      perDay: 4,
    },
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    isBlocked: true,
    blockReason: '⚠️ MORATORIUM: New NEMT provider enrollment blocked through October 2025',
    restrictions: {
      maxTripsPerDay: 4,
      notes: 'Max 2 round trips per day. Prior auth may be required.',
    },
  },
  {
    id: 'nemt-t2005',
    code: 'T2005',
    category: 'NEMT',
    description: 'Stretcher Van Transport',
    rateType: 'per_trip',
    baseRate: 51.24,
    mileageCode: 'T2049',
    mileageRate: 1.93,
    unit: 'trip',
    allowable: {},
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    isBlocked: true,
    blockReason: '⚠️ MORATORIUM: New NEMT provider enrollment blocked through October 2025',
    notes: 'For members requiring stretcher but not ambulance level care.',
  },
  // Mileage codes for NEMT
  {
    id: 'nemt-s0215',
    code: 'S0215',
    category: 'NEMT',
    description: 'Mileage - Ambulatory Van (A0120)',
    rateType: 'per_mile',
    baseRate: 3.00,
    unit: 'mile',
    allowable: {},
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    isBlocked: true,
    blockReason: '⚠️ MORATORIUM',
    notes: 'Mileage add-on for A0120. Loaded miles only.',
  },
  {
    id: 'nemt-s0209',
    code: 'S0209',
    category: 'NEMT',
    description: 'Mileage - Wheelchair Van (A0130)',
    rateType: 'per_mile',
    baseRate: 3.00,
    unit: 'mile',
    allowable: {},
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    isBlocked: true,
    blockReason: '⚠️ MORATORIUM',
    notes: 'Mileage add-on for A0130. Loaded miles only.',
  },
  {
    id: 'nemt-t2049',
    code: 'T2049',
    category: 'NEMT',
    description: 'Mileage - Stretcher Van (T2005)',
    rateType: 'per_mile',
    baseRate: 1.93,
    unit: 'mile',
    allowable: {},
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    isBlocked: true,
    blockReason: '⚠️ MORATORIUM',
    notes: 'Mileage add-on for T2005. Loaded miles only.',
  },
];

// ============================================================================
// NMT CODES - Non-Medical Transport (HCBS Waivers)
// Primary revenue source for HCBS transport providers
// ============================================================================

export const nmtCodes: ServiceCode[] = [
  // T2003 - Main NMT code with mileage bands
  {
    id: 'nmt-t2003-u1',
    code: 'T2003',
    modifier: 'U1',
    category: 'NMT',
    description: 'NMT - Band 1 (0-10 miles one-way)',
    rateType: 'per_trip',
    baseRate: 22.28,
    unit: 'trip',
    allowable: {
      perDay: 4,
    },
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    restrictions: {
      requiresWaiver: true,
      waiverTypes: ['CMHS', 'DD', 'SLS'],
      notes: 'HCBS waiver members ONLY. Short local trips.',
    },
    notes: 'Most common for neighborhood medical appointments. One-way trip.',
  },
  {
    id: 'nmt-t2003-u2',
    code: 'T2003',
    modifier: 'U2',
    category: 'NMT',
    description: 'NMT - Band 2 (11-25 miles one-way)',
    rateType: 'per_trip',
    baseRate: 33.42,
    unit: 'trip',
    allowable: {
      perDay: 4,
    },
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    restrictions: {
      requiresWaiver: true,
      waiverTypes: ['CMHS', 'DD', 'SLS'],
      notes: 'HCBS waiver members ONLY. Medium distance community trips.',
    },
    notes: 'Most common band. Used for therapy, medical, community access.',
  },
  {
    id: 'nmt-t2003-u3',
    code: 'T2003',
    modifier: 'U3',
    category: 'NMT',
    description: 'NMT - Band 3 (26-50 miles one-way)',
    rateType: 'per_trip',
    baseRate: 55.70,
    unit: 'trip',
    allowable: {
      perDay: 4,
    },
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    restrictions: {
      requiresWaiver: true,
      waiverTypes: ['CMHS', 'DD', 'SLS'],
      notes: 'HCBS waiver members ONLY. Longer distance trips.',
    },
    notes: 'Specialists, regional hospitals, cross-county trips.',
  },
  {
    id: 'nmt-t2003-u4',
    code: 'T2003',
    modifier: 'U4',
    category: 'NMT',
    description: 'NMT - Band 4 (51+ miles one-way)',
    rateType: 'per_trip',
    baseRate: 78.00,
    unit: 'trip',
    allowable: {
      perDay: 2,
    },
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    restrictions: {
      requiresWaiver: true,
      waiverTypes: ['CMHS', 'DD', 'SLS'],
      notes: 'HCBS waiver members ONLY. Long distance - prior auth recommended.',
    },
    notes: 'Rural/mountain areas, specialized care facilities.',
  },
  // H2014 - Life Skills with transport component
  {
    id: 'nmt-h2014-ua',
    code: 'H2014',
    modifier: 'UA',
    category: 'NMT',
    description: 'Skills Training & Development (CMHS) - includes transport',
    rateType: 'per_15min',
    baseRate: 13.29,
    unit: '15 min',
    allowable: {
      perDay: 24, // 6 hours max
      unitsPerPerson: 24,
    },
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    restrictions: {
      requiresWaiver: true,
      waiverTypes: ['CMHS'],
      providerTypes: ['Licensed behavioral health staff'],
      notes: 'Transportation CAN be billed as part of service. Max 24 units (6 hrs)/day.',
    },
    notes: '⭐ HIGH VALUE: Transport time billable when staff accompanies member. Combine with T2003 for standalone transport.',
  },
  // 97537 - Community Reintegration (explicitly includes transport training)
  {
    id: 'nmt-97537',
    code: '97537',
    category: 'NMT',
    description: 'Community/Work Reintegration Training',
    rateType: 'per_15min',
    baseRate: 18.00,
    unit: '15 min',
    allowable: {
      perDay: 32, // 8 hours max
    },
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    restrictions: {
      providerTypes: ['OT', 'PT', 'Licensed therapist'],
      notes: 'EXPLICITLY includes transportation training. 1-on-1 service. Requires licensed staff.',
    },
    notes: '⭐ KEY CODE: "Community reintegration training" includes teaching clients to navigate transportation systems.',
  },
];

// ============================================================================
// FACILITY CLINICAL CODES - For Treatment Facility Revenue Analysis
// These are billed BY facilities, not by transport providers
// Used in Treatment Facility module for contract analysis
// ============================================================================

export const facilityClinicalCodes: ServiceCode[] = [
  // Assessment & Evaluation
  {
    id: 'fac-90791',
    code: '90791',
    category: 'Behavioral',
    description: 'Psychiatric Diagnostic Evaluation',
    rateType: 'per_hour',
    baseRate: 150.00,
    unit: 'hour',
    allowable: {},
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    notes: 'Initial competency assessment. Facility code.',
  },
  {
    id: 'fac-96116',
    code: '96116',
    category: 'Behavioral',
    description: 'Neurobehavioral Status Exam',
    rateType: 'per_hour',
    baseRate: 100.00,
    unit: 'hour',
    allowable: {},
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    notes: 'Cognitive assessment for competency. Facility code.',
  },
  // Individual Therapy
  {
    id: 'fac-90832',
    code: '90832',
    category: 'Behavioral',
    description: 'Psychotherapy, 30 min',
    rateType: 'per_30min',
    baseRate: 65.00,
    unit: '30 min',
    allowable: {},
    effectiveDate: '2025-07-01',
    lastUpdated: now,
  },
  {
    id: 'fac-90834',
    code: '90834',
    category: 'Behavioral',
    description: 'Psychotherapy, 45 min',
    rateType: 'per_hour',
    baseRate: 95.00,
    unit: '45 min',
    allowable: {},
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    notes: 'Standard individual therapy session.',
  },
  {
    id: 'fac-90837',
    code: '90837',
    category: 'Behavioral',
    description: 'Psychotherapy, 60 min',
    rateType: 'per_hour',
    baseRate: 125.00,
    unit: 'hour',
    allowable: {},
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    notes: 'Intensive individual therapy.',
  },
  // Group Services ⭐ HIGH VOLUME
  {
    id: 'fac-90853',
    code: '90853',
    category: 'Behavioral',
    description: 'Group Psychotherapy',
    rateType: 'per_hour',
    baseRate: 35.00,
    unit: 'hour',
    allowable: {},
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    notes: '⭐ HIGH VOLUME: Per person rate. 10 clients × $35 = $350/session.',
  },
  {
    id: 'fac-h2017',
    code: 'H2017',
    category: 'Behavioral',
    description: 'Psychosocial Rehabilitation - per 15 min',
    rateType: 'per_15min',
    baseRate: 12.00,
    unit: '15 min',
    allowable: {
      perDay: 32,
    },
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    notes: '⭐ MONARCH MODEL: Life skills groups. 8 units × 13 residents = $1,248 for 2-hr grocery trip.',
  },
  {
    id: 'fac-h2018',
    code: 'H2018',
    category: 'Behavioral',
    description: 'Psychosocial Rehabilitation - per diem',
    rateType: 'per_diem',
    baseRate: 75.00,
    unit: 'day',
    allowable: {},
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    notes: 'Day program activities. Alternative to H2017 per-unit billing.',
  },
  // Case Management
  {
    id: 'fac-t1016',
    code: 'T1016',
    category: 'Behavioral',
    description: 'Case Management - per 15 min',
    rateType: 'per_15min',
    baseRate: 15.00,
    unit: '15 min',
    allowable: {},
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    notes: 'Care coordination. Facility code.',
  },
  {
    id: 'fac-t1017',
    code: 'T1017',
    category: 'Behavioral',
    description: 'Targeted Case Management - per 15 min',
    rateType: 'per_15min',
    baseRate: 18.00,
    unit: '15 min',
    allowable: {},
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    notes: 'Intensive case management. Higher rate for complex clients.',
  },
  // Crisis Services
  {
    id: 'fac-h0023',
    code: 'H0023',
    category: 'Behavioral',
    description: 'Behavioral Health Outreach - per 15 min',
    rateType: 'per_15min',
    baseRate: 15.00,
    unit: '15 min',
    allowable: {},
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    notes: 'Crisis intervention, community stabilization.',
  },
  {
    id: 'fac-h2011',
    code: 'H2011',
    category: 'Behavioral',
    description: 'Crisis Intervention - per 15 min',
    rateType: 'per_15min',
    baseRate: 18.00,
    unit: '15 min',
    allowable: {},
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    notes: 'Acute crisis response. Higher rate.',
  },
  // Counseling
  {
    id: 'fac-h0004',
    code: 'H0004',
    category: 'Behavioral',
    description: 'Behavioral Health Counseling - per 15 min',
    rateType: 'per_15min',
    baseRate: 18.00,
    unit: '15 min',
    allowable: {},
    effectiveDate: '2025-07-01',
    lastUpdated: now,
    notes: 'Individual counseling in community settings.',
  },
];

// ============================================================================
// MILEAGE REIMBURSEMENT (Non-Medicaid)
// For private/contract billing reference
// ============================================================================

export const mileageReimbursement: ServiceCode[] = [
  {
    id: 'mileage-irs-2025',
    code: 'MILEAGE',
    category: 'Other',
    description: 'IRS Standard Mileage Rate (2025)',
    rateType: 'per_mile',
    baseRate: 0.70,
    unit: 'mile',
    allowable: {},
    effectiveDate: '2025-01-01',
    lastUpdated: now,
    notes: 'IRS business mileage rate. Use for private pay/contract billing baseline.',
  },
  {
    id: 'mileage-medical-2025',
    code: 'MED-MILE',
    category: 'Other',
    description: 'IRS Medical Mileage Rate (2025)',
    rateType: 'per_mile',
    baseRate: 0.22,
    unit: 'mile',
    allowable: {},
    effectiveDate: '2025-01-01',
    lastUpdated: now,
    notes: 'IRS medical mileage rate. Member reimbursement baseline.',
  },
];

// ============================================================================
// BLANK TEMPLATE (for custom codes)
// ============================================================================

export const blankCodeTemplate: Omit<ServiceCode, 'id'> = {
  code: '',
  category: 'Other',
  description: '',
  rateType: 'per_trip',
  baseRate: 0,
  unit: 'trip',
  allowable: {},
  effectiveDate: new Date().toISOString().split('T')[0],
  lastUpdated: new Date().toISOString(),
  isCustom: true,
};

// ============================================================================
// ALL CODES COMBINED - Main export for the store
// ============================================================================

export const allServiceCodes: ServiceCode[] = [
  ...bhstCodes,
  ...nemtCodes,
  ...nmtCodes,
  ...facilityClinicalCodes,
  ...mileageReimbursement,
];

// Transport-only codes (for filtering)
export const transportCodes: ServiceCode[] = [
  ...bhstCodes,
  ...nemtCodes,
  ...nmtCodes,
  ...mileageReimbursement,
];

// Facility codes (for Treatment Facility module)
export const facilityBillingCodes: ServiceCode[] = [
  ...facilityClinicalCodes,
];

export default allServiceCodes;
