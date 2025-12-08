# BENTOBOX Calendar - Integration Implementation Plan

## 📋 Document Overview

**Purpose**: Integrate BENTOBOX Clinical Encounter Scheduling into HALCYON's existing architecture  
**Status**: Planning Phase  
**Last Updated**: 2025-01-18  
**Related Docs**: 
- `HALCYON_APP_OVERVIEW_AND_THEMING_GUIDE.md`
- `/Users/sefebrun/Desktop/BENTOBOX Additional Features.rtf`

---

## 🎯 Executive Summary

### Current State
- **BentoBox Calendar** exists as experimental feature at `/calendar-experiment`
- Uses **localStorage** (Zustand) for persistence
- Has **mock data** for staff, activities, clients
- **Standalone** - not integrated with HALCYON database
- **Atomic Design System** - Atoms, Molecules, Organisms

### Target State
- **Database-backed** templates and encounters
- **Multi-tenant scoped** to location/program/corporate client
- **Real-time sync** with existing user/client data
- **Preserve** all current functionality
- **Optional** billing code tracking

### Key Principle
**DO NOT BREAK EXISTING FUNCTIONALITY** - All changes must be additive and backward-compatible.

---

## 🏗 Architecture Integration Points

### Existing HALCYON Infrastructure (Leverage These)

#### 1. Multi-Tenant Context
**Location**: `client/src/hooks/useHierarchy.tsx`

```typescript
// Available context
const { 
  selectedLocation,      // string | null
  selectedProgram,       // string | null
  selectedCorporateClient, // string | null
  getFilterParams        // Returns { locationId?, programId?, corporateClientId? }
} = useHierarchy();
```

**Usage**: All BentoBox queries will filter by `location_id` (and optionally `program_id`, `corporate_client_id`)

#### 2. Database Schema
**Location**: `shared/schema.ts`

**Existing Tables to Reference**:
- `users` - Staff members (has `role`, `first_name`, `last_name`, `corporate_client_id`, `primary_program_id`)
- `clients` - Client participants (has `id`, `first_name`, `last_name`, `location_id`, `program_id`)
- `locations` - Location data (has `id`, `name`, `program_id`)
- `programs` - Program data (has `id`, `name`, `corporate_client_id`)
- `corporateClients` - Corporate client data

**Pattern to Follow**: Use Drizzle ORM with existing schema patterns

#### 3. React Query Setup
**Already Configured**: `@tanstack/react-query` is set up system-wide

**Pattern**:
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['bentobox', 'templates', locationId],
  queryFn: () => fetchTemplates(locationId),
});
```

#### 4. Authentication
**Location**: `client/src/hooks/useAuth.tsx`

**Available**: `user` object with `user_id`, `role`, etc.

**Usage**: `created_by` fields will use `user.user_id`

---

## 📊 Database Schema Design

### New Tables (Add to `shared/schema.ts`)

#### 1. `encounter_templates` - BentoBox Templates

```typescript
export const encounterTemplates = pgTable("encounter_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Multi-tenant scoping (matches HALCYON pattern)
  corporate_client_id: varchar("corporate_client_id", { length: 50 })
    .references(() => corporateClients.id, { onDelete: 'cascade' }),
  program_id: varchar("program_id", { length: 50 })
    .references(() => programs.id, { onDelete: 'cascade' }),
  location_id: varchar("location_id", { length: 50 })
    .references(() => locations.id, { onDelete: 'cascade' }),
  
  // Template metadata
  template_name: varchar("template_name", { length: 255 }).notNull(),
  template_type: varchar("template_type", { length: 20 }).default('complete'), // 'complete' | 'shell'
  description: text("description"),
  
  // Template fields (from current BentoBox structure)
  activity_name: varchar("activity_name", { length: 255 }),
  activity_code: varchar("activity_code", { length: 50 }), // Optional billing code
  category: varchar("category", { length: 50 }), // 'clinical', 'life-skills', etc.
  duration_minutes: integer("duration_minutes"),
  
  // Staff assignment
  staff_ids: text("staff_ids").array(), // Array of user_id references
  
  // Client groups (stored as JSON for flexibility)
  client_groups: jsonb("client_groups"), // Array of { id, name, clientIds[] }
  
  // Location
  location_name: varchar("location_name", { length: 255 }),
  
  // Shell template fields (if template_type = 'shell')
  shell_fixed_fields: jsonb("shell_fixed_fields"), // { staff_id, start_time, location_name }
  shell_variable_fields: text("shell_variable_fields").array(), // ['activity', 'clients']
  
  // Recurrence (optional)
  applies_to_days: integer("applies_to_days").array(), // [0,1,2,3,4] = Mon-Fri
  default_start_time: time("default_start_time"),
  
  // Metadata
  is_active: boolean("is_active").default(true),
  created_by: varchar("created_by", { length: 50 })
    .references(() => users.user_id, { onDelete: 'set null' }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});
```

#### 2. `scheduled_encounters` - Calendar Events

```typescript
export const scheduledEncounters = pgTable("scheduled_encounters", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Multi-tenant scoping
  corporate_client_id: varchar("corporate_client_id", { length: 50 })
    .references(() => corporateClients.id, { onDelete: 'cascade' }),
  program_id: varchar("program_id", { length: 50 })
    .references(() => programs.id, { onDelete: 'cascade' }),
  location_id: varchar("location_id", { length: 50 })
    .references(() => locations.id, { onDelete: 'cascade' }),
  
  // Template relationship
  template_id: uuid("template_id")
    .references(() => encounterTemplates.id, { onDelete: 'set null' }),
  is_template_instance: boolean("is_template_instance").default(false),
  
  // Scheduling
  scheduled_date: date("scheduled_date").notNull(),
  start_time: time("start_time").notNull(),
  end_time: time("end_time").notNull(),
  duration_minutes: integer("duration_minutes").notNull(),
  
  // Session details
  activity_name: varchar("activity_name", { length: 255 }).notNull(),
  activity_code: varchar("activity_code", { length: 50 }), // Optional billing code
  category: varchar("category", { length: 50 }),
  
  // Participants
  staff_ids: text("staff_ids").array().notNull(), // Array of user_id
  client_ids: text("client_ids").array().notNull(), // Array of client.id
  
  // Location
  location_name: varchar("location_name", { length: 255 }),
  
  // Status
  status: varchar("status", { length: 20 }).default('scheduled'), 
    // 'scheduled', 'in_progress', 'completed', 'cancelled'
  
  // Overrides (if instance was edited, breaking template link)
  overrides: jsonb("overrides"), // { activity_name?, client_ids?, staff_ids? }
  
  // Billing (optional)
  billing_code: varchar("billing_code", { length: 50 }),
  units_billed: integer("units_billed"),
  rate_per_unit: decimal("rate_per_unit", { precision: 10, scale: 2 }),
  estimated_revenue: decimal("estimated_revenue", { precision: 10, scale: 2 }),
  
  // Notes
  notes: text("notes"),
  completion_notes: text("completion_notes"),
  
  // Metadata
  created_by: varchar("created_by", { length: 50 })
    .references(() => users.user_id, { onDelete: 'set null' }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});
```

#### 3. `client_groups` - Pre-defined Client Groups

```typescript
export const clientGroups = pgTable("client_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Multi-tenant scoping
  location_id: varchar("location_id", { length: 50 })
    .references(() => locations.id, { onDelete: 'cascade' }).notNull(),
  
  // Group definition
  group_name: varchar("group_name", { length: 255 }).notNull(),
  group_type: varchar("group_type", { length: 50 }), // 'treatment', 'skill_building', etc.
  
  // Members
  client_ids: text("client_ids").array().notNull(), // Array of client.id
  
  // Metadata
  description: text("description"),
  color_code: varchar("color_code", { length: 7 }), // Hex color for UI
  is_active: boolean("is_active").default(true),
  created_by: varchar("created_by", { length: 50 })
    .references(() => users.user_id, { onDelete: 'set null' }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});
```

#### 4. `cache_activity_pool` - Billing Codes Library (Optional)

```typescript
export const cacheActivityPool = pgTable("cache_activity_pool", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Activity definition
  activity_code: varchar("activity_code", { length: 50 }).unique().notNull(), // '90834', 'H2017'
  activity_name: varchar("activity_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'Behavioral', 'Rehabilitation'
  
  // Billing details
  rate_per_unit: decimal("rate_per_unit", { precision: 10, scale: 2 }).notNull(),
  unit_type: varchar("unit_type", { length: 20 }).notNull(), // '15min', '30min', 'hour', 'session'
  duration_minutes: integer("duration_minutes"), // NULL if variable
  
  // Constraints
  max_participants: integer("max_participants"),
  min_participants: integer("min_participants").default(1),
  requires_credential: varchar("requires_credential", { length: 20 }), // 'LSW', 'LPC', NULL
  encounter_type: varchar("encounter_type", { length: 20 }), // 'individual', 'group', 'family'
  
  // Metadata
  is_active: boolean("is_active").default(true),
  effective_date: date("effective_date"),
  last_synced: timestamp("last_synced").defaultNow(),
});
```

### Indexes (Add for Performance)

```typescript
// In shared/schema.ts, add indexes using Drizzle's index() helper
import { index } from 'drizzle-orm/pg-core';

// Encounter templates
export const encounterTemplatesLocationIdx = index("idx_encounter_templates_location")
  .on(encounterTemplates.location_id);

// Scheduled encounters
export const scheduledEncountersLocationDateIdx = index("idx_scheduled_encounters_location_date")
  .on(scheduledEncounters.location_id, scheduledEncounters.scheduled_date);

export const scheduledEncountersTemplateIdx = index("idx_scheduled_encounters_template")
  .on(scheduledEncounters.template_id);

// Client groups
export const clientGroupsLocationIdx = index("idx_client_groups_location")
  .on(clientGroups.location_id);
```

---

## 🔄 Data Migration Strategy

### Phase 1: Dual-Write Pattern (Preserve localStorage)

**Strategy**: Write to both localStorage AND database during transition period

```typescript
// Modified store action
addTemplate: (templateData) => {
  // 1. Save to localStorage (existing behavior)
  const template = { ...templateData, id: generateId() };
  set((state) => ({
    library: { ...state.library, templates: [...state.library.templates, template] }
  }));
  
  // 2. Also save to database (new)
  if (locationId) {
    saveTemplateToDatabase(template, locationId).catch(console.error);
  }
}
```

**Benefits**:
- No breaking changes
- Gradual migration
- Fallback if database fails

### Phase 2: Read from Database, Fallback to localStorage

```typescript
// Modified store initialization
useEffect(() => {
  if (locationId) {
    // Try database first
    fetchTemplatesFromDatabase(locationId)
      .then(templates => {
        if (templates.length > 0) {
          set({ library: { ...state.library, templates } }); // Use DB data
        } else {
          // Fallback to localStorage
          const localTemplates = getLocalStorageTemplates();
          set({ library: { ...state.library, templates: localTemplates } });
        }
      });
  }
}, [locationId]);
```

### Phase 3: Full Database Migration

- Remove localStorage persistence
- All data from database
- Keep localStorage as backup/export only

---

## 🛠 Implementation Phases

### **Phase 1: Database Schema & API Endpoints** (Week 1)

#### Tasks
1. ✅ Add new tables to `shared/schema.ts`
2. ✅ Create database migration file
3. ✅ Create API endpoints in `server/routes/`
4. ✅ Add TypeScript types for new entities

#### Files to Create/Modify

**New Files**:
- `server/routes/bentobox.ts` - API endpoints
- `migrations/XXXX_add_bentobox_tables.sql` - Database migration
- `shared/types/bentobox.ts` - TypeScript types

**Modify**:
- `shared/schema.ts` - Add new table definitions

#### API Endpoints Structure

```typescript
// server/routes/bentobox.ts

// Templates
GET    /api/bentobox/templates?locationId=xxx
POST   /api/bentobox/templates
PUT    /api/bentobox/templates/:id
DELETE /api/bentobox/templates/:id

// Scheduled Encounters
GET    /api/bentobox/encounters?locationId=xxx&startDate=xxx&endDate=xxx
POST   /api/bentobox/encounters
PUT    /api/bentobox/encounters/:id
DELETE /api/bentobox/encounters/:id

// Client Groups
GET    /api/bentobox/client-groups?locationId=xxx
POST   /api/bentobox/client-groups
PUT    /api/bentobox/client-groups/:id
DELETE /api/bentobox/client-groups/:id

// Staff Pool (from existing users table)
GET    /api/bentobox/staff?locationId=xxx

// Activity Pool (optional billing codes)
GET    /api/bentobox/activities
```

#### Success Criteria
- ✅ Tables created in database
- ✅ API endpoints return data
- ✅ Multi-tenant filtering works
- ✅ No breaking changes to existing BentoBox

---

### **Phase 2: Replace Mock Data with Database Queries** (Week 2)

#### Tasks
1. ✅ Create React Query hooks for BentoBox data
2. ✅ Replace mock staff pool with real users query
3. ✅ Replace mock activities with database query (or keep current if billing not needed)
4. ✅ Replace mock clients with real clients query
5. ✅ Update LibrarySection to use real data

#### Files to Create/Modify

**New Files**:
- `client/src/hooks/useBentoBoxData.ts` - React Query hooks
- `client/src/lib/api/bentobox.ts` - API client functions

**Modify**:
- `client/src/components/bentobox-calendar/LibrarySection.tsx` - Use real data
- `client/src/components/bentobox-calendar/store.ts` - Add database sync

#### Implementation Pattern

```typescript
// client/src/hooks/useBentoBoxData.ts
import { useQuery } from '@tanstack/react-query';
import { useHierarchy } from './useHierarchy';
import { fetchStaffPool, fetchClientGroups, fetchTemplates } from '@/lib/api/bentobox';

export function useStaffPool() {
  const { selectedLocation } = useHierarchy();
  
  return useQuery({
    queryKey: ['bentobox', 'staff', selectedLocation],
    queryFn: () => fetchStaffPool(selectedLocation!),
    enabled: !!selectedLocation,
  });
}

export function useClientGroups() {
  const { selectedLocation } = useHierarchy();
  
  return useQuery({
    queryKey: ['bentobox', 'client-groups', selectedLocation],
    queryFn: () => fetchClientGroups(selectedLocation!),
    enabled: !!selectedLocation,
  });
}

export function useEncounterTemplates() {
  const { selectedLocation } = useHierarchy();
  
  return useQuery({
    queryKey: ['bentobox', 'templates', selectedLocation],
    queryFn: () => fetchTemplates(selectedLocation!),
    enabled: !!selectedLocation,
  });
}
```

#### Success Criteria
- ✅ Library section shows real staff from `users` table
- ✅ Library section shows real clients from `clients` table
- ✅ Client groups load from database
- ✅ No mock data remaining
- ✅ Loading states implemented

---

### **Phase 3: Template System Database Integration** (Week 3)

#### Tasks
1. ✅ Update TemplateBuilder to save to database
2. ✅ Update TemplateEditor to save to database
3. ✅ Update PoolSection to load from database
4. ✅ Implement dual-write (localStorage + database)
5. ✅ Add template inheritance (optional)

#### Files to Modify

**Modify**:
- `client/src/components/bentobox-calendar/TemplateBuilder.tsx`
- `client/src/components/bentobox-calendar/TemplateEditor.tsx`
- `client/src/components/bentobox-calendar/PoolSection.tsx`
- `client/src/components/bentobox-calendar/store.ts`

#### Implementation Pattern

```typescript
// In TemplateBuilder.tsx
const handleSaveTemplate = async () => {
  // 1. Create template object
  const newTemplate = { /* ... */ };
  
  // 2. Save to localStorage (existing)
  addTemplate(newTemplate);
  
  // 3. Save to database (new)
  const { selectedLocation } = useHierarchy();
  if (selectedLocation) {
    try {
      await saveTemplateToDatabase(newTemplate, selectedLocation);
      toast.success('Template saved to database');
    } catch (error) {
      toast.error('Failed to save to database, saved locally only');
      console.error(error);
    }
  }
};
```

#### Success Criteria
- ✅ Templates save to database
- ✅ Templates load from database
- ✅ Template editing works
- ✅ Pool section shows database templates
- ✅ localStorage still works as fallback

---

### **Phase 4: Scheduled Encounters Database Integration** (Week 4)

#### Tasks
1. ✅ Update BentoBoxGanttView to load encounters from database
2. ✅ Update drag-drop handlers to save to database
3. ✅ Implement encounter CRUD operations
4. ✅ Add encounter status updates
5. ✅ Implement template instance linking

#### Files to Modify

**Modify**:
- `client/src/components/bentobox-calendar/BentoBoxGanttView.tsx`
- `client/src/components/bentobox-calendar/store.ts`
- `client/src/components/bentobox-calendar/EncounterActions.tsx`

#### Implementation Pattern

```typescript
// In BentoBoxGanttView.tsx
const { data: scheduledEncounters, isLoading } = useQuery({
  queryKey: ['bentobox', 'encounters', selectedLocation, currentDate],
  queryFn: () => fetchScheduledEncounters(selectedLocation!, currentDate),
  enabled: !!selectedLocation,
});

// On drag-drop
const handleTimeSlotDrop = async (day: Date, hour: number, payload: any) => {
  // 1. Create encounter object
  const encounter = { /* ... */ };
  
  // 2. Save to localStorage (existing)
  scheduleEncounter(encounter);
  
  // 3. Save to database (new)
  if (selectedLocation) {
    await saveEncounterToDatabase(encounter, selectedLocation);
  }
};
```

#### Success Criteria
- ✅ Encounters load from database
- ✅ Drag-drop creates database records
- ✅ Edit/delete encounters works
- ✅ Template instances link correctly
- ✅ Status updates persist

---

### **Phase 5: Client Groups Database Integration** (Week 5)

#### Tasks
1. ✅ Update ClientGroupBuilder to save to database
2. ✅ Update PoolSection to show database groups
3. ✅ Update drag-drop to use database groups
4. ✅ Add client group CRUD operations

#### Files to Modify

**Modify**:
- `client/src/components/bentobox-calendar/ClientGroupBuilder.tsx`
- `client/src/components/bentobox-calendar/PoolSection.tsx`
- `client/src/components/bentobox-calendar/store.ts`

#### Success Criteria
- ✅ Client groups save to database
- ✅ Client groups load from database
- ✅ Drag-drop groups to encounters works
- ✅ Merge/replace logic works with database groups

---

### **Phase 6: Billing Code Integration (Optional)** (Week 6)

#### Tasks
1. ✅ Seed `cache_activity_pool` with billing codes
2. ✅ Update activity selection to show billing codes
3. ✅ Calculate revenue on encounter creation
4. ✅ Display billing info in encounter cards
5. ✅ Add billing summary (optional)

#### Files to Create/Modify

**New Files**:
- `server/scripts/seed-billing-codes.ts` - Seed script
- `client/src/lib/billing-utils.ts` - Revenue calculation

**Modify**:
- `client/src/components/bentobox-calendar/LibrarySection.tsx`
- `client/src/components/bentobox-calendar/BentoBoxGanttView.tsx`

#### Success Criteria
- ✅ Billing codes available in activity pool
- ✅ Revenue calculated automatically
- ✅ Billing info displayed (if enabled)

---

## 🔐 Security & Permissions

### Role-Based Access

Use existing HALCYON permission system:

```typescript
// In API routes
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

router.post('/templates', 
  requireAuth,
  requirePermission('bentobox:create_template'),
  async (req, res) => {
    // Create template
  }
);
```

### Multi-Tenant Isolation

**Critical**: Always filter by `location_id` (and optionally `program_id`, `corporate_client_id`)

```typescript
// In API routes
const { locationId, programId, corporateClientId } = req.user.scope;

const templates = await db
  .select()
  .from(encounterTemplates)
  .where(
    and(
      eq(encounterTemplates.location_id, locationId),
      // Optionally add program/corporate client filters
    )
  );
```

---

## 🧪 Testing Strategy

### Unit Tests
- Test database queries with mock data
- Test React Query hooks
- Test store actions

### Integration Tests
- Test API endpoints with real database
- Test multi-tenant filtering
- Test template inheritance (if implemented)

### E2E Tests
- Test full workflow: create template → schedule encounter → edit → delete
- Test with different user roles
- Test multi-tenant isolation

---

## 📝 Migration Checklist

### Pre-Implementation
- [ ] Review existing `useHierarchy` hook usage
- [ ] Verify database connection and Drizzle setup
- [ ] Confirm multi-tenant context availability
- [ ] Review existing permission system
- [ ] Backup current localStorage data (export feature)

### Phase 1
- [ ] Add tables to `shared/schema.ts`
- [ ] Create migration file
- [ ] Run migration on development database
- [ ] Create API endpoints
- [ ] Test API endpoints with Postman/curl

### Phase 2
- [ ] Create React Query hooks
- [ ] Update LibrarySection
- [ ] Test with real user data
- [ ] Verify loading states

### Phase 3
- [ ] Update TemplateBuilder
- [ ] Update TemplateEditor
- [ ] Update PoolSection
- [ ] Test template CRUD operations
- [ ] Verify dual-write pattern

### Phase 4
- [ ] Update BentoBoxGanttView
- [ ] Update drag-drop handlers
- [ ] Test encounter scheduling
- [ ] Test encounter editing
- [ ] Verify template instance linking

### Phase 5
- [ ] Update ClientGroupBuilder
- [ ] Test client group CRUD
- [ ] Test merge/replace logic

### Phase 6 (Optional)
- [ ] Seed billing codes
- [ ] Update activity selection
- [ ] Test revenue calculation

### Post-Implementation
- [ ] Remove localStorage persistence (Phase 3)
- [ ] Add data export feature (backup)
- [ ] Update documentation
- [ ] Train users on new features

---

## 🚨 Risk Mitigation

### Risk 1: Breaking Existing Functionality
**Mitigation**: 
- Use dual-write pattern initially
- Keep localStorage as fallback
- Extensive testing before removing localStorage

### Risk 2: Multi-Tenant Data Leakage
**Mitigation**:
- Always filter by `location_id` in queries
- Add database-level constraints
- Test with multiple tenants

### Risk 3: Performance Issues
**Mitigation**:
- Add proper database indexes
- Use React Query caching
- Implement pagination if needed

### Risk 4: Migration Data Loss
**Mitigation**:
- Export localStorage data before migration
- Implement data import feature
- Keep localStorage as backup during transition

---

## 📚 Reference Files

### Key Files to Reference

1. **Multi-Tenant Context**: `client/src/hooks/useHierarchy.tsx`
2. **Database Schema**: `shared/schema.ts`
3. **API Pattern**: `server/routes/` (any existing route file)
4. **React Query Pattern**: Any page using `useQuery`
5. **Auth Pattern**: `client/src/hooks/useAuth.tsx`
6. **Current BentoBox Store**: `client/src/components/bentobox-calendar/store.ts`

### Example Implementations

- **API Route Example**: `server/routes/clients.ts` or `server/routes/drivers.ts`
- **React Query Hook Example**: Any page in `client/src/pages/`
- **Database Query Example**: Any service file in `server/services/`

---

## 🎯 Success Metrics

### Phase 1 Success
- ✅ All tables created
- ✅ API endpoints functional
- ✅ Multi-tenant filtering works

### Phase 2 Success
- ✅ No mock data in UI
- ✅ Real staff/clients displayed
- ✅ Loading states work

### Phase 3 Success
- ✅ Templates save to database
- ✅ Templates load from database
- ✅ No localStorage dependency for templates

### Phase 4 Success
- ✅ Encounters save to database
- ✅ Calendar loads from database
- ✅ All CRUD operations work

### Overall Success
- ✅ Zero breaking changes
- ✅ All existing features work
- ✅ Data persists across sessions
- ✅ Multi-tenant isolation verified
- ✅ Performance acceptable

---

## 📞 Questions & Clarifications

### Before Starting Implementation

1. **Multi-Tenant Context**: Confirm `useHierarchy` provides `selectedLocation` when on `/calendar-experiment` page
2. **User Context**: Confirm how to get `currentUserId` for `created_by` fields
3. **Billing Codes**: Are billing codes required now, or can this be Phase 6 (optional)?
4. **Template Inheritance**: Is template inheritance (updating template updates instances) required, or can instances be independent?
5. **Navigation**: Should BentoBox be in main navigation, or remain at `/calendar-experiment`?

### During Implementation

- If unclear about existing patterns, reference similar features (trips, clients, drivers)
- Follow existing code style and patterns
- Test thoroughly before moving to next phase

---

## 🔄 Version History

- **v1.0.0** (2025-01-18): Initial implementation plan created
  - Based on HALCYON architecture review
  - Aligned with existing patterns
  - Preserves current functionality

---

**Next Steps**: Review this plan, answer clarification questions, then begin Phase 1 implementation.



