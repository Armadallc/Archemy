# BENTOBOX Calendar - Quick Reference Guide

## 🚀 Quick Start

### Current State
- **Location**: `/calendar-experiment`
- **Storage**: localStorage (Zustand)
- **Data**: Mock data (staff, activities, clients)
- **Status**: Experimental, standalone

### Integration Goal
- **Storage**: Supabase database
- **Data**: Real users, clients, locations
- **Scoping**: Multi-tenant (location/program/corporate client)
- **Status**: Production-ready, integrated

---

## 🔑 Key Integration Points

### 1. Multi-Tenant Context

```typescript
import { useHierarchy } from '@/hooks/useHierarchy';

const { 
  selectedLocation,      // string | null - REQUIRED for all queries
  selectedProgram,       // string | null - Optional filter
  selectedCorporateClient, // string | null - Optional filter
  getFilterParams        // Helper function
} = useHierarchy();

// Usage in queries
const locationId = selectedLocation; // Always filter by this
```

### 2. Database Schema Pattern

```typescript
// Follow existing pattern in shared/schema.ts
export const encounterTemplates = pgTable("encounter_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // ALWAYS include multi-tenant fields
  corporate_client_id: varchar("corporate_client_id", { length: 50 })
    .references(() => corporateClients.id, { onDelete: 'cascade' }),
  program_id: varchar("program_id", { length: 50 })
    .references(() => programs.id, { onDelete: 'cascade' }),
  location_id: varchar("location_id", { length: 50 })
    .references(() => locations.id, { onDelete: 'cascade' }),
  
  // ... rest of fields
});
```

### 3. React Query Pattern

```typescript
import { useQuery } from '@tanstack/react-query';
import { useHierarchy } from '@/hooks/useHierarchy';

export function useEncounterTemplates() {
  const { selectedLocation } = useHierarchy();
  
  return useQuery({
    queryKey: ['bentobox', 'templates', selectedLocation],
    queryFn: () => fetchTemplates(selectedLocation!),
    enabled: !!selectedLocation, // Only run if location selected
  });
}
```

### 4. API Endpoint Pattern

```typescript
// server/routes/bentobox.ts
import { requireAuth } from '../middleware/auth';
import { db } from '../db';
import { encounterTemplates } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

router.get('/templates', requireAuth, async (req, res) => {
  const { locationId } = req.query;
  const userId = req.user.user_id; // From auth middleware
  
  // ALWAYS filter by location_id
  const templates = await db
    .select()
    .from(encounterTemplates)
    .where(
      and(
        eq(encounterTemplates.location_id, locationId),
        eq(encounterTemplates.is_active, true)
      )
    );
  
  res.json(templates);
});
```

### 5. Dual-Write Pattern (Transition Period)

```typescript
// Save to both localStorage AND database
const handleSave = async () => {
  // 1. Save to localStorage (existing)
  addTemplate(template);
  
  // 2. Save to database (new)
  if (selectedLocation) {
    try {
      await saveTemplateToDatabase(template, selectedLocation);
    } catch (error) {
      console.error('Database save failed, using localStorage only');
    }
  }
};
```

---

## 📊 Database Tables Reference

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `encounter_templates` | BentoBox templates | `template_name`, `activity_name`, `staff_ids`, `client_groups` |
| `scheduled_encounters` | Calendar events | `scheduled_date`, `start_time`, `template_id`, `status` |
| `client_groups` | Pre-defined groups | `group_name`, `client_ids` |
| `cache_activity_pool` | Billing codes (optional) | `activity_code`, `activity_name`, `rate_per_unit` |

### Existing Tables to Reference

| Table | Use For |
|-------|---------|
| `users` | Staff pool (filter by `role` = 'staff' or similar) |
| `clients` | Client participants (filter by `location_id`) |
| `locations` | Location data |
| `programs` | Program data |
| `corporateClients` | Corporate client data |

---

## 🔄 Data Flow

### Current Flow (localStorage)
```
User Action → Zustand Store → localStorage
```

### Target Flow (Database)
```
User Action → Zustand Store → API Call → Supabase → Database
                              ↓
                         React Query Cache
```

### Transition Flow (Dual-Write)
```
User Action → Zustand Store → localStorage (immediate)
                              ↓
                         API Call → Database (async)
```

---

## 🛠 Common Patterns

### Pattern 1: Fetching Staff Pool

```typescript
// API Route
router.get('/staff', requireAuth, async (req, res) => {
  const { locationId } = req.query;
  
  // Get users with staff role, scoped to location
  const staff = await db
    .select({
      user_id: users.user_id,
      first_name: users.first_name,
      last_name: users.last_name,
      role: users.role,
    })
    .from(users)
    .where(
      and(
        eq(users.role, 'program_user'), // Or appropriate staff role
        // Add location filtering if users have location_id
      )
    );
  
  res.json(staff);
});

// React Hook
export function useStaffPool() {
  const { selectedLocation } = useHierarchy();
  
  return useQuery({
    queryKey: ['bentobox', 'staff', selectedLocation],
    queryFn: () => fetchStaffPool(selectedLocation!),
    enabled: !!selectedLocation,
  });
}
```

### Pattern 2: Creating Template

```typescript
// Component
const handleSave = async () => {
  const { selectedLocation, selectedProgram, selectedCorporateClient } = useHierarchy();
  const { user } = useAuth();
  
  const template = {
    template_name: templateName,
    activity_name: activity.name,
    staff_ids: staff.map(s => s.id),
    // ... other fields
  };
  
  // Save to database
  await createTemplate({
    ...template,
    location_id: selectedLocation!,
    program_id: selectedProgram,
    corporate_client_id: selectedCorporateClient,
    created_by: user.user_id,
  });
};
```

### Pattern 3: Loading Encounters for Calendar

```typescript
// React Hook
export function useScheduledEncounters(startDate: Date, endDate: Date) {
  const { selectedLocation } = useHierarchy();
  
  return useQuery({
    queryKey: ['bentobox', 'encounters', selectedLocation, startDate, endDate],
    queryFn: () => fetchEncounters(selectedLocation!, startDate, endDate),
    enabled: !!selectedLocation,
  });
}

// API Route
router.get('/encounters', requireAuth, async (req, res) => {
  const { locationId, startDate, endDate } = req.query;
  
  const encounters = await db
    .select()
    .from(scheduledEncounters)
    .where(
      and(
        eq(scheduledEncounters.location_id, locationId),
        gte(scheduledEncounters.scheduled_date, startDate),
        lte(scheduledEncounters.scheduled_date, endDate),
      )
    );
  
  res.json(encounters);
});
```

---

## ⚠️ Critical Rules

### 1. Always Filter by Location
```typescript
// ✅ CORRECT
.where(eq(encounterTemplates.location_id, locationId))

// ❌ WRONG - No location filter
.select().from(encounterTemplates)
```

### 2. Always Include Multi-Tenant Fields
```typescript
// ✅ CORRECT
{
  location_id: selectedLocation!,
  program_id: selectedProgram,
  corporate_client_id: selectedCorporateClient,
}

// ❌ WRONG - Missing location_id
{
  template_name: 'My Template',
  // Missing location_id!
}
```

### 3. Always Check Location Before Database Operations
```typescript
// ✅ CORRECT
if (selectedLocation) {
  await saveToDatabase(data, selectedLocation);
} else {
  // Fallback to localStorage or show error
}

// ❌ WRONG - No location check
await saveToDatabase(data); // Will fail!
```

### 4. Preserve Existing Functionality
```typescript
// ✅ CORRECT - Dual-write
addTemplate(template); // localStorage
if (locationId) {
  saveToDatabase(template, locationId); // database
}

// ❌ WRONG - Only database
saveToDatabase(template, locationId); // Breaks if no location!
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] React Query hooks return correct data
- [ ] API endpoints filter by location
- [ ] Store actions work with database data

### Integration Tests
- [ ] Templates save and load correctly
- [ ] Encounters schedule correctly
- [ ] Multi-tenant isolation works

### Manual Tests
- [ ] Create template → appears in pool
- [ ] Drag template to calendar → encounter created
- [ ] Edit encounter → changes persist
- [ ] Switch locations → data filters correctly

---

## 📁 File Structure

```
client/src/
├── components/
│   └── bentobox-calendar/
│       ├── store.ts              # Modify: Add database sync
│       ├── TemplateBuilder.tsx   # Modify: Save to database
│       ├── TemplateEditor.tsx    # Modify: Update database
│       ├── BentoBoxGanttView.tsx # Modify: Load from database
│       ├── PoolSection.tsx       # Modify: Load from database
│       └── LibrarySection.tsx    # Modify: Use real data
│
├── hooks/
│   └── useBentoBoxData.ts        # NEW: React Query hooks
│
└── lib/
    └── api/
        └── bentobox.ts           # NEW: API client functions

server/
├── routes/
│   └── bentobox.ts               # NEW: API endpoints
│
└── services/
    └── bentobox-service.ts       # NEW: Business logic (optional)

shared/
├── schema.ts                     # Modify: Add new tables
└── types/
    └── bentobox.ts               # NEW: TypeScript types

migrations/
└── XXXX_add_bentobox_tables.sql  # NEW: Database migration
```

---

## 🚨 Common Pitfalls

### Pitfall 1: Forgetting Location Filter
```typescript
// ❌ WRONG
const templates = await db.select().from(encounterTemplates);

// ✅ CORRECT
const templates = await db
  .select()
  .from(encounterTemplates)
  .where(eq(encounterTemplates.location_id, locationId));
```

### Pitfall 2: Not Handling Missing Location
```typescript
// ❌ WRONG
await saveTemplate(template, selectedLocation); // Crashes if null

// ✅ CORRECT
if (selectedLocation) {
  await saveTemplate(template, selectedLocation);
} else {
  // Fallback or show error
}
```

### Pitfall 3: Breaking Existing localStorage
```typescript
// ❌ WRONG - Removes localStorage immediately
// Only database now

// ✅ CORRECT - Dual-write during transition
addTemplate(template); // localStorage
if (locationId) {
  saveToDatabase(template, locationId); // database
}
```

---

## 📞 Quick Help

### "How do I get the current location?"
```typescript
const { selectedLocation } = useHierarchy();
```

### "How do I get the current user?"
```typescript
const { user } = useAuth();
const userId = user.user_id;
```

### "How do I query with location filter?"
```typescript
.where(eq(tableName.location_id, locationId))
```

### "How do I create a React Query hook?"
```typescript
export function useMyData() {
  const { selectedLocation } = useHierarchy();
  
  return useQuery({
    queryKey: ['bentobox', 'my-data', selectedLocation],
    queryFn: () => fetchMyData(selectedLocation!),
    enabled: !!selectedLocation,
  });
}
```

---

**For detailed implementation plan, see**: `docs/bentobox/BENTOBOX_INTEGRATION_PLAN.md`





