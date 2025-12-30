/**
 * Staff Filter Utilities
 * 
 * Helper functions for filtering encounters by staff members
 */

import { ScheduledEncounter, StaffAtom } from '../types';
import { EncounterTemplate } from '../types';

/**
 * Get all staff members associated with an encounter
 * Combines template staff with any overrides
 */
export function getEncounterStaff(
  encounter: ScheduledEncounter,
  template?: EncounterTemplate
): StaffAtom[] {
  // If encounter has staff overrides, use those
  if (encounter.overrides?.staff && encounter.overrides.staff.length > 0) {
    return encounter.overrides.staff;
  }
  
  // Otherwise, use template staff
  if (template?.staff) {
    return template.staff;
  }
  
  return [];
}

/**
 * Get all unique staff IDs from an encounter
 */
export function getEncounterStaffIds(
  encounter: ScheduledEncounter,
  template?: EncounterTemplate
): string[] {
  const staff = getEncounterStaff(encounter, template);
  return staff.map(s => s.id);
}

/**
 * Check if an encounter matches the staff filter
 * Returns true if:
 * - No filters are selected (show all)
 * - OR encounter has at least one staff member in the filter list
 */
export function matchesStaffFilter(
  encounter: ScheduledEncounter,
  selectedStaffIds: string[],
  template?: EncounterTemplate
): boolean {
  // If no filters selected, show all
  if (selectedStaffIds.length === 0) {
    return true;
  }
  
  // Get staff IDs for this encounter
  const encounterStaffIds = getEncounterStaffIds(encounter, template);
  
  // Check if any encounter staff matches any selected filter
  return encounterStaffIds.some(staffId => selectedStaffIds.includes(staffId));
}

/**
 * Get all unique staff members from all templates and encounters
 */
export function getAllStaffMembers(
  templates: EncounterTemplate[],
  encounters: ScheduledEncounter[]
): StaffAtom[] {
  const staffMap = new Map<string, StaffAtom>();
  
  // Add staff from templates
  templates.forEach(template => {
    template.staff?.forEach(staff => {
      if (!staffMap.has(staff.id)) {
        staffMap.set(staff.id, staff);
      }
    });
  });
  
  // Add staff from encounter overrides
  encounters.forEach(encounter => {
    encounter.overrides?.staff?.forEach(staff => {
      if (!staffMap.has(staff.id)) {
        staffMap.set(staff.id, staff);
      }
    });
  });
  
  return Array.from(staffMap.values()).sort((a, b) => 
    a.name.localeCompare(b.name)
  );
}




