/**
 * BentoBox Calendar - Atomic Design System Types
 * 
 * Based on Atomic Design principles:
 * - Atoms: Basic units (Staff, Activity, Client, Duration, Location)
 * - Molecules: Pre-built combinations
 * - Organisms: Complete encounter templates
 */

import { CalendarEvent } from "../event-calendar/types";

// ============================================================
// COLOR MAPPING (Fire Design System)
// ============================================================

export type TemplateCategory = 
  | "clinical"      // Clinical Groups (coral)
  | "life-skills"   // Life Skills (lime)
  | "recreation"    // Recreation (ice)
  | "medical"        // Medical (charcoal)
  | "administrative"; // Administrative (silver)

export type FireColor = "coral" | "lime" | "ice" | "charcoal" | "silver";

export const CATEGORY_COLORS: Record<TemplateCategory, FireColor> = {
  clinical: "coral",
  "life-skills": "lime",
  recreation: "ice",
  medical: "charcoal",
  administrative: "silver",
};

// ============================================================
// ATOMS (Basic Units)
// ============================================================

export interface StaffAtom {
  id: string;
  name: string;
  role?: string;
  type: "staff";
}

export interface ActivityAtom {
  id: string;
  name: string;
  category: TemplateCategory;
  type: "activity";
}

export interface ClientAtom {
  id: string;
  name: string;
  type: "client";
}

export interface ClientGroupAtom {
  id: string;
  name: string;
  clientIds: string[];
  type: "client-group";
}

export interface LocationAtom {
  id: string;
  name: string;
  type: "location";
}

export interface DurationAtom {
  id: string;
  minutes: number;
  label: string; // e.g., "30 min", "2 hours"
  type: "duration";
}

export type Atom = 
  | StaffAtom 
  | ActivityAtom 
  | ClientAtom 
  | ClientGroupAtom 
  | LocationAtom 
  | DurationAtom;

// ============================================================
// MOLECULES (Pre-built Combinations)
// ============================================================

export interface Molecule {
  id: string;
  name: string;
  atoms: Atom[];
  type: "molecule";
  category?: TemplateCategory;
}

// ============================================================
// ORGANISMS (Complete Encounter Templates)
// ============================================================

export interface EncounterTemplate {
  id: string;
  name: string;
  description?: string;
  
  // Composition
  staff: StaffAtom[];
  activity: ActivityAtom;
  clients: (ClientAtom | ClientGroupAtom)[];
  location?: LocationAtom;
  duration: DurationAtom;
  
  // Metadata
  category: TemplateCategory;
  color: FireColor;
  
  // Rules & Constraints
  rules: {
    staffRequirements?: string[]; // Required staff roles
    clientCapacity?: {
      min: number;
      max: number;
    };
    recurrence?: {
      pattern: "daily" | "weekly" | "monthly";
      daysOfWeek?: number[]; // 0 = Sunday, 6 = Saturday
    };
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ============================================================
// SCHEDULED ENCOUNTERS (Instances on Calendar)
// ============================================================

export interface ScheduledEncounter extends CalendarEvent {
  templateId: string;
  templateVersion: number;
  isDuplicate: boolean;
  parentId?: string; // If this is a duplicate, reference parent
  childIds?: string[]; // If this has duplicates
  
  // Overrides (if template was modified for this instance)
  overrides?: {
    staff?: StaffAtom[];
    clients?: (ClientAtom | ClientGroupAtom)[];
    location?: LocationAtom;
    duration?: DurationAtom;
  };
  
  // Status
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
}

// ============================================================
// TEMPLATE LIBRARY STATE
// ============================================================

export interface TemplateLibrary {
  atoms: {
    staff: StaffAtom[];
    activities: ActivityAtom[];
    clients: ClientAtom[];
    clientGroups: ClientGroupAtom[];
    locations: LocationAtom[];
    durations: DurationAtom[];
  };
  molecules: Molecule[];
  templates: EncounterTemplate[];
}

// ============================================================
// POOL STATE (Ready-to-drag templates)
// ============================================================

export interface PoolTemplate {
  id: string;
  templateId: string;
  name: string;
  category: TemplateCategory;
  color: FireColor;
  quickInfo: {
    staffInitials: string;
    activityCode: string;
    clientCount: number;
    duration: string;
  };
}

// ============================================================
// UI STATE
// ============================================================

export type SidebarSection = "navigation" | "builder" | "pool";

export interface BentoBoxCalendarState {
  // Template Library
  library: TemplateLibrary;
  
  // Pool (ready to drag)
  pool: PoolTemplate[];
  
  // Scheduled Encounters
  scheduledEncounters: ScheduledEncounter[];
  
  // UI State
  activeSidebarSection: SidebarSection;
  selectedTemplate?: EncounterTemplate;
  selectedEncounter?: ScheduledEncounter;
  
  // Builder State
  builderTemplate?: Partial<EncounterTemplate>;
  
  // View State
  currentView: "day" | "week" | "month";
  currentDate: Date;
}





