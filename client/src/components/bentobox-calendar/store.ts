/**
 * BentoBox Calendar - Zustand Store
 * 
 * Manages template library, pool, and scheduled encounters
 * with localStorage persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  TemplateLibrary,
  EncounterTemplate,
  ScheduledEncounter,
  PoolTemplate,
  Atom,
  StaffAtom,
  ActivityAtom,
  ClientAtom,
  ClientGroupAtom,
  LocationAtom,
  DurationAtom,
  TemplateCategory,
  CATEGORY_COLORS,
  SidebarSection,
} from './types';

// ============================================================
// DEFAULT DATA
// ============================================================

const defaultStaff: StaffAtom[] = [
  { id: 'staff-1', name: 'Angie', role: 'Primary Therapist', type: 'staff' },
  { id: 'staff-2', name: 'Dan', role: 'Case Manager', type: 'staff' },
  { id: 'staff-3', name: 'Sarah', role: 'Rec Specialist', type: 'staff' },
  { id: 'staff-4', name: 'Bob M', type: 'staff' },
  { id: 'staff-5', name: 'Mary A', type: 'staff' },
  { id: 'staff-6', name: 'Steve B', type: 'staff' },
  { id: 'staff-7', name: 'Jerry G', type: 'staff' },
];

const defaultActivities: ActivityAtom[] = [
  { id: 'act-1', name: 'Life-Skills Group', category: 'life-skills', type: 'activity' },
  { id: 'act-2', name: 'Fitness', category: 'recreation', type: 'activity' },
  { id: 'act-3', name: 'Transport', category: 'administrative', type: 'activity' },
  { id: 'act-4', name: 'Therapy', category: 'clinical', type: 'activity' },
  { id: 'act-5', name: 'Process Group', category: 'clinical', type: 'activity' },
  { id: 'act-6', name: 'Psychosocial', category: 'clinical', type: 'activity' },
  { id: 'act-7', name: 'Medication Management', category: 'medical', type: 'activity' },
];

const defaultClients: ClientAtom[] = [
  { id: 'client-1', name: 'CLIENT 1', type: 'client' },
  { id: 'client-2', name: 'CLIENT 2', type: 'client' },
  { id: 'client-3', name: 'CLIENT 3', type: 'client' },
  { id: 'client-4', name: 'CLIENT 4', type: 'client' },
];

const defaultClientGroups: ClientGroupAtom[] = [
  { id: 'group-1', name: 'CLIENT GROUP 1', clientIds: ['client-1', 'client-2'], type: 'client-group' },
  { id: 'group-2', name: 'CLIENT GROUP 2', clientIds: ['client-2', 'client-3'], type: 'client-group' },
  { id: 'group-3', name: 'CLIENT GROUP 3', clientIds: ['client-3', 'client-4'], type: 'client-group' },
  { id: 'group-4', name: 'CLIENT GROUP 4', clientIds: ['client-1', 'client-4'], type: 'client-group' },
];

const defaultLocations: LocationAtom[] = [
  { id: 'loc-1', name: 'LOCATION 1', type: 'location' },
  { id: 'loc-2', name: 'LOCATION 2', type: 'location' },
  { id: 'loc-3', name: 'LOCATION 3', type: 'location' },
  { id: 'loc-4', name: 'LOCATION 4', type: 'location' },
];

const defaultDurations: DurationAtom[] = [
  { id: 'dur-30', minutes: 30, label: '30 min', type: 'duration' },
  { id: 'dur-60', minutes: 60, label: '60 min', type: 'duration' },
  { id: 'dur-90', minutes: 90, label: '90 min', type: 'duration' },
  { id: 'dur-120', minutes: 120, label: '120 min', type: 'duration' },
];

// Sample templates for initial testing
const defaultTemplates: EncounterTemplate[] = [
  {
    id: 'template-1',
    name: 'Life-Skills Group',
    description: 'Life skills training session',
    staff: [defaultStaff[0]], // Angie
    activity: defaultActivities[0], // Life-Skills Group
    clients: [defaultClientGroups[1]], // CLIENT GROUP 2
    location: defaultLocations[1], // LOCATION 2
    duration: defaultDurations[3], // 120 min
    category: 'life-skills',
    color: CATEGORY_COLORS['life-skills'],
    rules: {
      clientCapacity: { min: 2, max: 8 },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  },
  {
    id: 'template-2',
    name: 'Group Therapy',
    description: 'Process group therapy session',
    staff: [defaultStaff[1]], // Dan
    activity: defaultActivities[4], // Process Group
    clients: [defaultClientGroups[0]], // CLIENT GROUP 1
    location: defaultLocations[0], // LOCATION 1
    duration: defaultDurations[3], // 120 min
    category: 'clinical',
    color: CATEGORY_COLORS['clinical'],
    rules: {
      clientCapacity: { min: 3, max: 10 },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  },
];

const defaultLibrary: TemplateLibrary = {
  atoms: {
    staff: defaultStaff,
    activities: defaultActivities,
    clients: defaultClients,
    clientGroups: defaultClientGroups,
    locations: defaultLocations,
    durations: defaultDurations,
  },
  molecules: [],
  templates: defaultTemplates,
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getQuickInfo(template: EncounterTemplate): PoolTemplate['quickInfo'] {
  const staffInitials = template.staff
    .map(s => s.name.split(' ').map(n => n[0]).join(''))
    .join(', ') || 'N/A';
  
  const activityCode = template.activity.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 3)
    .toUpperCase();
  
  const clientCount = template.clients.reduce((count, c) => {
    if (c.type === 'client') return count + 1;
    if (c.type === 'client-group') return count + c.clientIds.length;
    return count;
  }, 0);
  
  return {
    staffInitials,
    activityCode,
    clientCount,
    duration: template.duration.label,
  };
}

// ============================================================
// STORE INTERFACE
// ============================================================

interface BentoBoxActions {
  // Template Library
  addTemplate: (template: Omit<EncounterTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => void;
  updateTemplate: (id: string, updates: Partial<EncounterTemplate>) => void;
  deleteTemplate: (id: string) => void;
  
  // Pool
  addToPool: (templateId: string) => void;
  addClientGroupToPool: (clientGroupId: string) => void;
  removeFromPool: (poolId: string) => void;
  clearPool: () => void;
  
  // Scheduled Encounters
  scheduleEncounter: (templateId: string, start: Date, end: Date) => ScheduledEncounter;
  updateScheduledEncounter: (id: string, updates: Partial<ScheduledEncounter>) => void;
  deleteScheduledEncounter: (id: string, deleteAll?: boolean) => void;
  duplicateEncounter: (id: string) => ScheduledEncounter | null;
  
  // Atoms (for builder)
  addAtom: <T extends Atom>(atom: T, type: T['type']) => void;
  updateAtom: <T extends Atom>(id: string, updates: Partial<T>, type: T['type']) => void;
  deleteAtom: (id: string, type: Atom['type']) => void;
  
      // UI State
      setActiveSidebarSection: (section: SidebarSection) => void;
      setSelectedTemplate: (template?: EncounterTemplate) => void;
      setSelectedEncounter: (encounter?: ScheduledEncounter) => void;
      setBuilderTemplate: (template?: Partial<EncounterTemplate>) => void;
      setCurrentView: (view: "day" | "week" | "month") => void;
      setCurrentDate: (date: Date) => void;
      setActiveTab: (tab: "stage" | "builder") => void;
      setEditingTemplateId: (id: string | null) => void;
      getTemplateById: (id: string) => EncounterTemplate | undefined;
      updatePoolTemplate: (poolTemplateId: string, updates: Partial<PoolTemplate>) => void;
      
      // Sync (for future Supabase integration)
      syncToSupabase: () => Promise<void>;
      syncFromSupabase: () => Promise<void>;
}

interface BentoBoxState {
  // Template Library
  library: TemplateLibrary;
  
  // Pool
  pool: PoolTemplate[];
  
  // Scheduled Encounters
  scheduledEncounters: ScheduledEncounter[];
  
  // UI State
  activeSidebarSection: SidebarSection;
  selectedTemplate?: EncounterTemplate;
  selectedEncounter?: ScheduledEncounter;
  builderTemplate?: Partial<EncounterTemplate>;
  currentView: "day" | "week" | "month";
  currentDate: Date;
  activeTab: "stage" | "builder";
  editingTemplateId: string | null;
}

// ============================================================
// STORE
// ============================================================

export const useBentoBoxStore = create<BentoBoxState & BentoBoxActions>()(
  persist(
    (set, get) => ({
      // Initial State
      library: defaultLibrary,
      pool: [],
      scheduledEncounters: [],
      activeSidebarSection: "navigation",
      currentView: "week",
      currentDate: new Date(),
      activeTab: "stage",
      editingTemplateId: null,
      
      // ========== TEMPLATE LIBRARY ==========
      
      addTemplate: (templateData) => {
        const template: EncounterTemplate = {
          ...templateData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          color: CATEGORY_COLORS[templateData.category],
        };
        
        set((state) => ({
          library: {
            ...state.library,
            templates: [...state.library.templates, template],
          },
        }));
      },
      
      updateTemplate: (id, updates) => {
        set((state) => ({
          library: {
            ...state.library,
            templates: state.library.templates.map((t) =>
              t.id === id
                ? {
                    ...t,
                    ...updates,
                    updatedAt: new Date().toISOString(),
                    version: t.version + 1,
                  }
                : t
            ),
          },
        }));
      },
      
      deleteTemplate: (id) => {
        set((state) => ({
          library: {
            ...state.library,
            templates: state.library.templates.filter((t) => t.id !== id),
          },
          pool: state.pool.filter((p) => p.templateId !== id),
        }));
      },
      
      // ========== POOL ==========
      
      addToPool: (templateId) => {
        const state = get();
        const template = state.library.templates.find((t) => t.id === templateId);
        if (!template) return;
        
        const poolTemplate: PoolTemplate = {
          id: generateId(),
          templateId,
          name: template.name,
          category: template.category,
          color: template.color,
          quickInfo: getQuickInfo(template),
        };
        
        set((state) => ({
          pool: [...state.pool, poolTemplate],
        }));
      },
      
      addClientGroupToPool: (clientGroupId) => {
        const state = get();
        const clientGroup = state.library.atoms.clientGroups.find((g) => g.id === clientGroupId);
        if (!clientGroup) return;
        
        const poolTemplate: PoolTemplate = {
          id: generateId(),
          templateId: clientGroupId, // Use clientGroup ID as templateId for identification
          name: clientGroup.name,
          category: 'administrative',
          color: 'silver',
          quickInfo: {
            staffInitials: 'CG',
            activityCode: 'CG',
            clientCount: clientGroup.clientIds.length,
            duration: 'N/A',
          },
        };
        
        set((state) => ({
          pool: [...state.pool, poolTemplate],
        }));
      },
      
      removeFromPool: (poolId) => {
        set((state) => ({
          pool: state.pool.filter((p) => p.id !== poolId),
        }));
      },
      
      clearPool: () => {
        set({ pool: [] });
      },
      
      // ========== SCHEDULED ENCOUNTERS ==========
      
      scheduleEncounter: (templateId, start, end) => {
        const state = get();
        const template = state.library.templates.find((t) => t.id === templateId);
        if (!template) {
          throw new Error(`Template ${templateId} not found`);
        }
        
        const encounter: ScheduledEncounter = {
          id: generateId(),
          templateId,
          templateVersion: template.version,
          isDuplicate: false,
          start,
          end,
          title: template.name,
          description: template.description,
          color: template.color as any, // Map to EventColor
          location: template.location?.name,
          status: 'scheduled',
        };
        
        set((state) => ({
          scheduledEncounters: [...state.scheduledEncounters, encounter],
        }));
        
        return encounter;
      },
      
      updateScheduledEncounter: (id, updates) => {
        set((state) => ({
          scheduledEncounters: state.scheduledEncounters.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }));
      },
      
      deleteScheduledEncounter: (id, deleteAll = false) => {
        const state = get();
        const encounter = state.scheduledEncounters.find((e) => e.id === id);
        
        if (!encounter) return;
        
        if (deleteAll && encounter.parentId) {
          // Delete parent and all children
          const parentId = encounter.parentId;
          set((state) => ({
            scheduledEncounters: state.scheduledEncounters.filter(
              (e) => e.id !== parentId && e.parentId !== parentId
            ),
          }));
        } else if (deleteAll && encounter.childIds) {
          // Delete this and all children
          const childIds = encounter.childIds;
          set((state) => ({
            scheduledEncounters: state.scheduledEncounters.filter(
              (e) => e.id !== id && !childIds.includes(e.id)
            ),
          }));
        } else {
          // Delete only this instance
          set((state) => ({
            scheduledEncounters: state.scheduledEncounters.filter((e) => e.id !== id),
          }));
        }
      },
      
      duplicateEncounter: (id) => {
        const state = get();
        const encounter = state.scheduledEncounters.find((e) => e.id === id);
        if (!encounter) return null;
        
        // Create duplicate for next day at same time
        const nextDay = new Date(encounter.start);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const duration = encounter.end.getTime() - encounter.start.getTime();
        const newEnd = new Date(nextDay.getTime() + duration);
        
        const duplicate: ScheduledEncounter = {
          ...encounter,
          id: generateId(),
          start: nextDay,
          end: newEnd,
          isDuplicate: true,
          parentId: encounter.id,
        };
        
        // Update parent to track children
        const updatedEncounter = {
          ...encounter,
          childIds: [...(encounter.childIds || []), duplicate.id],
        };
        
        set((state) => ({
          scheduledEncounters: [
            ...state.scheduledEncounters.map((e) =>
              e.id === id ? updatedEncounter : e
            ),
            duplicate,
          ],
        }));
        
        return duplicate;
      },
      
      // ========== ATOMS ==========
      
      addAtom: (atom, type) => {
        const key = type === 'staff' ? 'staff' :
                   type === 'activity' ? 'activities' :
                   type === 'client' ? 'clients' :
                   type === 'client-group' ? 'clientGroups' :
                   type === 'location' ? 'locations' :
                   'durations';
        
        set((state) => ({
          library: {
            ...state.library,
            atoms: {
              ...state.library.atoms,
              [key]: [...state.library.atoms[key], atom as any],
            },
          },
        }));
      },
      
      updateAtom: (id, updates, type) => {
        const key = type === 'staff' ? 'staff' :
                   type === 'activity' ? 'activities' :
                   type === 'client' ? 'clients' :
                   type === 'client-group' ? 'clientGroups' :
                   type === 'location' ? 'locations' :
                   'durations';
        
        set((state) => ({
          library: {
            ...state.library,
            atoms: {
              ...state.library.atoms,
              [key]: state.library.atoms[key].map((a: any) =>
                a.id === id ? { ...a, ...updates } : a
              ),
            },
          },
        }));
      },
      
      deleteAtom: (id, type) => {
        const key = type === 'staff' ? 'staff' :
                   type === 'activity' ? 'activities' :
                   type === 'client' ? 'clients' :
                   type === 'client-group' ? 'clientGroups' :
                   type === 'location' ? 'locations' :
                   'durations';
        
        set((state) => ({
          library: {
            ...state.library,
            atoms: {
              ...state.library.atoms,
              [key]: state.library.atoms[key].filter((a: any) => a.id !== id),
            },
          },
        }));
      },
      
      // ========== UI STATE ==========
      
      setActiveSidebarSection: (section) => {
        set({ activeSidebarSection: section });
      },
      
      setSelectedTemplate: (template) => {
        set({ selectedTemplate: template });
      },
      
      setSelectedEncounter: (encounter) => {
        set({ selectedEncounter: encounter });
      },
      
      setBuilderTemplate: (template) => {
        set({ builderTemplate: template });
      },
      
      setCurrentView: (view) => {
        set({ currentView: view });
      },
      
      setCurrentDate: (date) => {
        set({ currentDate: date });
      },
      
      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },
      
      setEditingTemplateId: (id) => {
        set({ editingTemplateId: id });
      },
      
      getTemplateById: (id) => {
        const state = get();
        return state.library.templates.find((t) => t.id === id);
      },
      
      updatePoolTemplate: (poolTemplateId, updates) => {
        set((state) => ({
          pool: state.pool.map((p) =>
            p.id === poolTemplateId ? { ...p, ...updates } : p
          ),
        }));
      },
      
      // ========== SYNC (Placeholder) ==========
      
      syncToSupabase: async () => {
        // TODO: Implement Supabase sync
        console.log('Sync to Supabase (not implemented yet)');
      },
      
      syncFromSupabase: async () => {
        // TODO: Implement Supabase sync
        console.log('Sync from Supabase (not implemented yet)');
      },
    }),
    {
      name: 'bentobox-calendar-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist library, pool, and scheduled encounters
      partialize: (state) => ({
        library: state.library,
        pool: state.pool,
        scheduledEncounters: state.scheduledEncounters,
      }),
    }
  )
);

