# Archemy Clinical Module - Complete Build Plan & Reference

**Status:** Planning Complete - Ready for Implementation  
**Created:** 2025-01-28  
**Start Date:** After Team Management sections completion

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Critical Corrections](#critical-corrections)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Integration Points](#integration-points)
7. [File Structure](#file-structure)
8. [Implementation Checklist](#implementation-checklist)
9. [Code Examples](#code-examples)
10. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### Decision: Hybrid Approach

**Shared Data (Read-Only References):**
- `clients` table - Referenced by both transport trips and clinical sessions
- `users` table - Staff/facilitators used in both modules
- `programs` table - Hierarchical scoping
- `locations` table - Facilities used by both

**Isolated Functionality:**
- Database tables: `scheduled_sessions`, `curriculum_modules`, `form_templates`, `form_submissions`, etc.
- API routes: `/api/archemy/*` (separate namespace)
- Frontend routes: `/archemy/*` (separate namespace)
- React components: `components/clinical/*` (separate directory)
- Business logic: Isolated storage functions in `minimal-supabase.ts`

**Reused Infrastructure:**
- Supabase client (from `minimal-supabase.ts`)
- Database-backed feature flags (`useFeatureFlag` hook)
- Auth middleware (`requireSupabaseAuth`, `requirePermission`)
- File storage helpers (`file-storage-helpers.ts`)
- Neumorphic styling system
- Permission system

### Key Principles

1. **Zero Impact on Existing Systems**: No modifications to transport or team management code
2. **Shared Data, Isolated Logic**: Clients/staff/appointments reference both modules, but functionality is separate
3. **Pattern Reuse**: Leverage existing HALCYON infrastructure where safe
4. **Feature Flag Control**: Database-backed flags for per-tenant rollout
5. **Full Calendar Clone**: Clone Bentobox calendar without affecting existing functionality

---

## Critical Corrections

### 1. Database Schema Type Mismatches

**Issue:** Original plan had type mismatches with existing schema.

**Corrections:**

```sql
-- ❌ WRONG (from original plan):
location_id UUID,
program_id TEXT NOT NULL,
facilitator_id VARCHAR REFERENCES users(user_id),

-- ✅ CORRECT:
location_id VARCHAR(50) REFERENCES locations(id),
program_id VARCHAR(50) NOT NULL REFERENCES programs(id),
facilitator_id VARCHAR(50) REFERENCES users(user_id),
```

**Reason:** Must match existing table types exactly:
- `locations.id` is `VARCHAR(50)`
- `programs.id` is `VARCHAR(50)`
- `users.user_id` is `VARCHAR(50)`

### 2. API Pattern Consistency

**Issue:** Plan showed Drizzle ORM examples, but HALCYON uses Supabase client.

**Correct Pattern:**
```typescript
// ✅ CORRECT - Use Supabase client (from minimal-supabase.ts)
export const archemyStorage = {
  async getSessionsByProgram(programId: string) {
    const { data, error } = await supabase
      .from('scheduled_sessions')
      .select(`*`)
      .eq('program_id', programId);
    if (error) throw error;
    return data || [];
  }
};
```

### 3. Feature Flag System

**Decision:** Use database-backed feature flags (not environment variables).

**Reason:** 
- Per-tenant control (enable for specific programs/corporate clients)
- Gradual rollout capability
- Admin UI for non-technical users
- Already implemented in HALCYON

**Usage:**
```typescript
// Frontend
const { isEnabled } = useFeatureFlag("archemy_clinical_enabled");

// Backend
const enabled = await featureFlagsStorage.isFeatureEnabled(
  "archemy_clinical_enabled",
  corporateClientId,
  programId
);
```

### 4. Clients Table PIN Field

**Issue:** Plan adds `pin_code`, but table already has `billing_pin`.

**Options:**
- **Option A (Recommended):** Reuse `billing_pin` field for Archemy PIN authentication
- **Option B:** Add separate `pin_code CHAR(4)` if different purpose

**Decision:** TBD during implementation - check if `billing_pin` can be repurposed.

---

## Database Schema

### Migration File

**File:** `migrations/0063_create_archemy_clinical_tables.sql`

### New Tables

1. **curriculum_modules** - Curriculum library
2. **form_templates** - Dynamic form templates (JSON schema)
3. **scheduled_sessions** - Clinical session scheduling
4. **form_submissions** - Client form submissions
5. **client_notification_settings** - Push notification preferences
6. **incentive_transactions** - Gamification/incentive tracking
7. **whiteboard_displays** - Digital whiteboard configuration

### Schema Modifications

**clients table:**
```sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS incentive_balance DECIMAL(10,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_activity_date DATE;
-- Option: Add pin_code if not reusing billing_pin
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pin_code CHAR(4) UNIQUE;
```

**users table:**
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS facilitator_settings JSONB;
```

### Key Schema Rules

1. All foreign keys must match existing table types exactly
2. Use `VARCHAR(50)` for `program_id`, `location_id`, `facilitator_id`
3. Use `UUID` for `client_id` (matches `clients.id`)
4. Follow existing audit trail pattern (`created_by`, `updated_by`, `created_at`, `updated_at`)
5. Add appropriate indexes for query performance

### Drizzle Schema Updates

**File:** `shared/schema.ts`

Add all Archemy tables to Drizzle schema for TypeScript type safety:
- `curriculumModules`
- `formTemplates`
- `scheduledSessions`
- `formSubmissions`
- `clientNotificationSettings`
- `incentiveTransactions`
- `whiteboardDisplays`

---

## Backend Implementation

### Storage Functions

**File:** `server/minimal-supabase.ts`

**Pattern:** Add `archemyStorage` object following existing patterns.

**Key Functions:**
```typescript
export const archemyStorage = {
  // Sessions
  async getSessionsByProgram(programId: string, startDate?: string, endDate?: string),
  async getSession(id: string),
  async createSession(data: any, userId: string),
  async updateSession(id: string, data: any, userId: string),
  async deleteSession(id: string),
  
  // Curriculum
  async getCurriculumByProgram(programId: string),
  async getCurriculumModule(id: string),
  async createCurriculumModule(data: any, userId: string),
  async updateCurriculumModule(id: string, data: any, userId: string),
  async deleteCurriculumModule(id: string),
  
  // Form Templates
  async getFormTemplatesByProgram(programId: string),
  async getFormTemplate(id: string),
  async createFormTemplate(data: any, userId: string),
  async updateFormTemplate(id: string, data: any, userId: string),
  async deleteFormTemplate(id: string),
  
  // Form Submissions
  async getFormSubmissionsBySession(sessionId: string),
  async getFormSubmission(id: string),
  async createFormSubmission(data: any),
  async updateFormSubmission(id: string, data: any, userId: string),
  
  // Billing
  async getPendingBillingSubmissions(programId: string),
  async updateBillingStatus(submissionId: string, status: string, userId: string),
};
```

**Query Pattern:**
```typescript
async getSessionsByProgram(programId: string) {
  const { data, error } = await supabase
    .from('scheduled_sessions')
    .select(`
      *,
      programs:program_id (
        id,
        name,
        corporate_clients:corporate_client_id (
          id,
          name
        )
      ),
      facilitators:facilitator_id (
        user_id,
        user_name,
        first_name,
        last_name,
        email
      ),
      curriculum_modules:curriculum_module_id (
        id,
        title,
        category,
        duration_minutes
      )
    `)
    .eq('program_id', programId)
    .eq('is_active', true)
    .order('session_date', { ascending: true });
  
  if (error) throw error;
  return data || [];
}
```

### API Routes

**File Structure:**
```
server/routes/archemy/
├── index.ts          # Route aggregator
├── sessions.ts       # Session CRUD
├── curriculum.ts     # Curriculum CRUD
├── forms.ts          # Form template CRUD
├── submissions.ts    # Form submission CRUD
└── billing.ts        # Billing & attestation
```

**Route Pattern:**
```typescript
// server/routes/archemy/sessions.ts
import express from "express";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../../supabase-auth";
import { requirePermission } from "../../auth";
import { PERMISSIONS } from "../../permissions";
import { archemyStorage } from "../../minimal-supabase";

const router = express.Router();

router.get("/program/:programId", 
  requireSupabaseAuth, 
  requirePermission(PERMISSIONS.ARCHEMY_VIEW_SESSIONS),
  async (req: SupabaseAuthenticatedRequest, res) => {
    try {
      const { programId } = req.params;
      const sessions = await archemyStorage.getSessionsByProgram(programId);
      res.json(sessions);
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions", error: error.message });
    }
  }
);

// ... other routes
```

**Route Registration:**
```typescript
// server/routes/index.ts
import archemyRoutes from "./archemy";

router.use("/archemy", archemyRoutes);
```

### Permissions

**File:** `server/permissions.ts`

Add Archemy permissions:
```typescript
export const PERMISSIONS = {
  // ... existing permissions
  
  // Archemy Clinical Module
  ARCHEMY_VIEW_SESSIONS: 'archemy:sessions:view',
  ARCHEMY_CREATE_SESSION: 'archemy:sessions:create',
  ARCHEMY_EDIT_SESSION: 'archemy:sessions:edit',
  ARCHEMY_DELETE_SESSION: 'archemy:sessions:delete',
  ARCHEMY_VIEW_CURRICULUM: 'archemy:curriculum:view',
  ARCHEMY_MANAGE_CURRICULUM: 'archemy:curriculum:manage',
  ARCHEMY_VIEW_FORMS: 'archemy:forms:view',
  ARCHEMY_MANAGE_FORMS: 'archemy:forms:manage',
  ARCHEMY_VIEW_BILLING: 'archemy:billing:view',
  ARCHEMY_ATTEST_BILLING: 'archemy:billing:attest',
};
```

### Feature Flag

**File:** `migrations/0064_add_archemy_feature_flag.sql` (or add to 0063)

```sql
-- Insert global Archemy feature flag (disabled by default)
INSERT INTO feature_flags (id, flag_name, is_enabled, description)
VALUES (
  gen_random_uuid()::text,
  'archemy_clinical_enabled',
  false,
  'Enable Archemy Clinical Module for scheduling sessions, managing curriculum, and digital forms'
)
ON CONFLICT DO NOTHING;
```

### File Storage Integration

**File:** `server/file-storage-helpers.ts`

**Update FileCategory:**
```typescript
export type FileCategory = 
  | 'intake_form' 
  | 'trip_photo'
  | 'program_form'      // Existing
  | 'program_curriculum' // Existing
  | 'archemy_curriculum' // NEW
  | 'archemy_form_template' // NEW
  | 'archemy_scanned_form'; // NEW
```

**Update getBucketForCategory:**
```typescript
export function getBucketForCategory(category: FileCategory): string {
  const bucketMap: Record<FileCategory, string> = {
    'archemy_curriculum': 'archemy-curriculum',
    'archemy_form_template': 'archemy-forms',
    'archemy_scanned_form': 'archemy-forms',
    // ... existing mappings
  };
  return bucketMap[category] || 'general-documents';
}
```

**Storage Buckets Needed:**
- `archemy-curriculum` - Curriculum PDFs, videos, documents
- `archemy-forms` - Form templates, scanned submissions

---

## Frontend Implementation

### Routes

**File:** `client/src/components/layout/main-layout.tsx`

Add routes:
```typescript
<Route path="/archemy">
  <ArchemyIndex />
</Route>
<Route path="/archemy/calendar">
  <ArchemyCalendar />
</Route>
<Route path="/archemy/curriculum">
  <ArchemyCurriculum />
</Route>
<Route path="/archemy/forms">
  <ArchemyForms />
</Route>
<Route path="/archemy/billing">
  <ArchemyBilling />
</Route>
```

### Page Components

**Files to Create:**
- `client/src/pages/archemy/index.tsx` - Landing page with stats
- `client/src/pages/archemy/calendar.tsx` - Calendar view (cloned from calendar-experiment.tsx)
- `client/src/pages/archemy/curriculum.tsx` - Curriculum library
- `client/src/pages/archemy/forms.tsx` - Form template builder
- `client/src/pages/archemy/billing.tsx` - Billing dashboard

### Calendar Cloning Strategy

**Source Files:**
- `client/src/pages/calendar-experiment.tsx`
- `client/src/components/bentobox-calendar/*`

**Target Files:**
- `client/src/pages/archemy/calendar.tsx`
- `client/src/components/clinical-calendar/*`

**Cloning Steps:**
1. Copy `calendar-experiment.tsx` → `archemy/calendar.tsx`
2. Copy entire `bentobox-calendar/` directory → `clinical-calendar/`
3. Rename components:
   - `BentoBoxGanttView` → `ArchemyGanttView`
   - `BentoBoxMonthView` → `ArchemyMonthView`
   - `BentoBoxAgendaView` → `ArchemyAgendaView`
   - `TemplateBuilder` → `SessionTemplateBuilder`
4. Replace imports:
   - Transport API → Clinical API
   - Trip types → Session types
   - TripCard → SessionCard
5. Update styling:
   - Bentobox colors → Archemy colors
   - Branding text updates

**Key Changes:**
- Replace `trip` references with `session`
- Replace `encounter` references with `session`
- Replace transport API calls with `/api/archemy/*`
- Update color scheme to Archemy purple/teal
- Create separate Zustand store (`archemy-store.ts`)

### Clinical Components

**Files to Create:**
- `client/src/components/clinical/SessionCard.tsx` - Session display card
- `client/src/components/clinical/FacilitatorPool.tsx` - Staff selection
- `client/src/components/clinical/CurriculumLibrary.tsx` - Drag-drop curriculum browser
- `client/src/components/clinical/FormTemplateBuilder.tsx` - JSON schema form builder
- `client/src/components/clinical/ClientGroupManager.tsx` - Client selection
- `client/src/components/clinical/DAPNotesEditor.tsx` - Speech-to-text DAP notes
- `client/src/components/clinical/BillingDashboard.tsx` - Revenue assurance metrics

### Navigation Integration

**File:** `client/src/components/layout/AdaptiveSidebar.tsx`

Add Archemy section:
```typescript
const { isEnabled: archemyEnabled } = useFeatureFlag("archemy_clinical_enabled");

// In navigationSections array:
{
  id: "clinical",
  label: "Clinical",
  icon: Beaker,
  requiredPermission: "archemy:sessions:view",
  items: [
    { 
      path: "/archemy", 
      label: "Archemy Clinical", 
      icon: Beaker,
      permissions: "archemy:sessions:view",
      roles: ["super_admin", "corporate_admin", "program_admin"]
    },
    { 
      path: "/archemy/curriculum", 
      label: "Curriculum Library", 
      icon: BookOpen,
      permissions: "archemy:curriculum:view"
    },
    { 
      path: "/archemy/forms", 
      label: "Form Templates", 
      icon: FileText,
      permissions: "archemy:forms:view"
    },
    { 
      path: "/archemy/billing", 
      label: "Billing Dashboard", 
      icon: DollarSign,
      permissions: "archemy:billing:view"
    }
  ]
}
```

### API Client

**File:** `client/src/lib/clinical-api.ts`

```typescript
import { apiRequest } from './queryClient';

export const clinicalApi = {
  async getSessions(programId: string, startDate?: string, endDate?: string) {
    const response = await apiRequest("GET", `/api/archemy/sessions/program/${programId}`, {
      startDate,
      endDate
    });
    return await response.json();
  },
  
  async getSession(id: string) {
    const response = await apiRequest("GET", `/api/archemy/sessions/${id}`);
    return await response.json();
  },
  
  async createSession(data: any) {
    const response = await apiRequest("POST", "/api/archemy/sessions", data);
    return await response.json();
  },
  
  async updateSession(id: string, data: any) {
    const response = await apiRequest("PATCH", `/api/archemy/sessions/${id}`, data);
    return await response.json();
  },
  
  async deleteSession(id: string) {
    await apiRequest("DELETE", `/api/archemy/sessions/${id}`);
  },
  
  // Curriculum methods
  async getCurriculum(programId: string) {
    const response = await apiRequest("GET", `/api/archemy/curriculum/program/${programId}`);
    return await response.json();
  },
  
  // Form methods
  async getFormTemplates(programId: string) {
    const response = await apiRequest("GET", `/api/archemy/forms/program/${programId}`);
    return await response.json();
  },
  
  // Submission methods
  async getSubmissions(sessionId: string) {
    const response = await apiRequest("GET", `/api/archemy/submissions/session/${sessionId}`);
    return await response.json();
  },
  
  // Billing methods
  async getPendingBilling(programId: string) {
    const response = await apiRequest("GET", `/api/archemy/billing/pending/${programId}`);
    return await response.json();
  }
};
```

### Styling

**File:** `client/src/index.css`

Add Archemy CSS variables:
```css
:root {
  /* Archemy Clinical Module Colors */
  --archemy-primary: #9b87f5;      /* Soft purple (clinical/healing) */
  --archemy-accent: #a5c8ca;       /* Existing teal (continuity) */
  --archemy-secondary: #f5d0a0;    /* Warm gold (wellness) */
  --archemy-success: #7dd3c0;      /* Calm mint (completion) */
  
  /* Archemy Status Colors */
  --archemy-planned: #9b87f5;      /* Purple */
  --archemy-in-progress: #fbbf24;  /* Amber */
  --archemy-completed: #10b981;    /* Green */
  --archemy-canceled: #ef4444;     /* Red */
  
  /* Neumorphic Shadows for Archemy */
  --shadow-archemy-raised: 8px 8px 16px rgba(155, 135, 245, 0.15),
                           -8px -8px 16px rgba(255, 255, 255, 0.7);
  --shadow-archemy-flat: 4px 4px 8px rgba(155, 135, 245, 0.1),
                         -4px -4px 8px rgba(255, 255, 255, 0.5);
  --shadow-archemy-pressed: inset 4px 4px 8px rgba(155, 135, 245, 0.2),
                            inset -4px -4px 8px rgba(255, 255, 255, 0.3);
}

.dark {
  /* Archemy Dark Mode Colors */
  --archemy-primary: #b19cf5;      /* Lighter purple for contrast */
  --archemy-accent: #a5c8ca;       /* Same teal */
  
  --shadow-archemy-raised: 8px 8px 16px rgba(0, 0, 0, 0.4),
                           -8px -8px 16px rgba(255, 255, 255, 0.05);
}
```

**Component Styling:**
- Use existing neumorphic classes: `card-neu`, `card-neu-flat`, `card-neu-pressed`
- Apply Archemy color variables
- Maintain consistency with existing HALCYON design system

---

## Integration Points

### Shared Infrastructure

1. **Supabase Client**
   - Location: `server/minimal-supabase.ts`
   - Usage: Import `supabase` from this file
   - Pattern: Follow existing storage function patterns

2. **Feature Flags**
   - Hook: `useFeatureFlag("archemy_clinical_enabled")`
   - Storage: `featureFlagsStorage.isFeatureEnabled()`
   - UI: Settings → Feature Flags tab

3. **Authentication**
   - Middleware: `requireSupabaseAuth`
   - Pattern: Use in all API routes

4. **Permissions**
   - Middleware: `requirePermission(PERMISSIONS.ARCHEMY_*)`
   - Pattern: Check permissions in routes and frontend

5. **File Storage**
   - Helper: `file-storage-helpers.ts`
   - Pattern: Use `uploadFile()` with Archemy categories

6. **Styling**
   - System: Neumorphic design system
   - Classes: `card-neu`, `card-neu-flat`, `card-neu-pressed`
   - Colors: Use Archemy CSS variables

### Shared Data Tables

**Read-Only References:**
- `clients` - Client roster for sessions
- `users` - Staff/facilitators for session assignment
- `programs` - Hierarchical scoping
- `locations` - Facility locations

**Usage Pattern:**
```typescript
// In storage functions, join shared tables:
.select(`
  *,
  programs:program_id (
    id,
    name,
    corporate_clients:corporate_client_id (
      id,
      name
    )
  ),
  facilitators:facilitator_id (
    user_id,
    user_name,
    first_name,
    last_name
  )
`)
```

---

## File Structure

### Backend

```
server/
├── minimal-supabase.ts          # ADD: archemyStorage object
├── routes/
│   ├── index.ts                 # MODIFY: Add archemy routes
│   └── archemy/                 # NEW DIRECTORY
│       ├── index.ts             # Route aggregator
│       ├── sessions.ts          # Session CRUD
│       ├── curriculum.ts        # Curriculum CRUD
│       ├── forms.ts             # Form template CRUD
│       ├── submissions.ts       # Form submission CRUD
│       └── billing.ts           # Billing & attestation
├── permissions.ts                # MODIFY: Add Archemy permissions
└── file-storage-helpers.ts      # MODIFY: Add Archemy file categories
```

### Frontend

```
client/src/
├── pages/
│   └── archemy/                 # NEW DIRECTORY
│       ├── index.tsx            # Landing page
│       ├── calendar.tsx         # Calendar view (cloned)
│       ├── curriculum.tsx       # Curriculum library
│       ├── forms.tsx            # Form templates
│       └── billing.tsx          # Billing dashboard
├── components/
│   ├── layout/
│   │   ├── main-layout.tsx      # MODIFY: Add /archemy routes
│   │   └── AdaptiveSidebar.tsx # MODIFY: Add Archemy navigation
│   └── clinical/                # NEW DIRECTORY
│       ├── SessionCard.tsx
│       ├── FacilitatorPool.tsx
│       ├── CurriculumLibrary.tsx
│       ├── FormTemplateBuilder.tsx
│       ├── ClientGroupManager.tsx
│       ├── DAPNotesEditor.tsx
│       └── BillingDashboard.tsx
├── components/
│   └── clinical-calendar/       # NEW DIRECTORY (cloned from bentobox-calendar)
│       ├── ArchemyGanttView.tsx
│       ├── ArchemyMonthView.tsx
│       ├── ArchemyAgendaView.tsx
│       ├── SessionTemplateBuilder.tsx
│       ├── store.ts             # Separate Zustand store
│       └── types.ts
├── lib/
│   └── clinical-api.ts         # NEW: API client
└── index.css                    # MODIFY: Add Archemy CSS variables
```

### Database

```
migrations/
└── 0063_create_archemy_clinical_tables.sql  # NEW: All Archemy tables
└── 0064_add_archemy_feature_flag.sql        # NEW: Feature flag (or combine with 0063)

shared/
└── schema.ts                    # MODIFY: Add Archemy table definitions
```

---

## Implementation Checklist

### Phase 1: Database Foundation

- [ ] Create migration file `0063_create_archemy_clinical_tables.sql`
- [ ] Fix all type mismatches (VARCHAR(50) for foreign keys)
- [ ] Create all Archemy tables:
  - [ ] `curriculum_modules`
  - [ ] `form_templates`
  - [ ] `scheduled_sessions`
  - [ ] `form_submissions`
  - [ ] `client_notification_settings`
  - [ ] `incentive_transactions`
  - [ ] `whiteboard_displays`
- [ ] Add columns to `clients` table (incentive_balance, current_streak, last_activity_date)
- [ ] Add `facilitator_settings` to `users` table
- [ ] Add Archemy tables to Drizzle schema (`shared/schema.ts`)
- [ ] Run migration and verify tables created
- [ ] Create feature flag migration (`0064_add_archemy_feature_flag.sql`)

### Phase 2: Backend Storage

- [ ] Add `archemyStorage` object to `server/minimal-supabase.ts`
- [ ] Implement session CRUD functions
- [ ] Implement curriculum CRUD functions
- [ ] Implement form template CRUD functions
- [ ] Implement form submission CRUD functions
- [ ] Implement billing functions
- [ ] Test all storage functions

### Phase 3: Backend API Routes

- [ ] Create `server/routes/archemy/` directory
- [ ] Create `index.ts` route aggregator
- [ ] Create `sessions.ts` with all session routes
- [ ] Create `curriculum.ts` with curriculum routes
- [ ] Create `forms.ts` with form template routes
- [ ] Create `submissions.ts` with submission routes
- [ ] Create `billing.ts` with billing routes
- [ ] Register routes in `server/routes/index.ts`
- [ ] Add Archemy permissions to `server/permissions.ts`
- [ ] Test all API endpoints

### Phase 4: File Storage

- [ ] Update `FileCategory` type in `file-storage-helpers.ts`
- [ ] Update `getBucketForCategory()` function
- [ ] Create Supabase storage buckets:
  - [ ] `archemy-curriculum`
  - [ ] `archemy-forms`
- [ ] Test file upload functionality

### Phase 5: Frontend Routes & Navigation

- [ ] Create `client/src/pages/archemy/` directory
- [ ] Create `index.tsx` landing page
- [ ] Add routes to `main-layout.tsx`
- [ ] Add Archemy navigation section to `AdaptiveSidebar.tsx`
- [ ] Add feature flag check in navigation
- [ ] Test navigation visibility

### Phase 6: Calendar Cloning

- [ ] Clone `calendar-experiment.tsx` → `archemy/calendar.tsx`
- [ ] Clone `bentobox-calendar/` → `clinical-calendar/`
- [ ] Rename all components (BentoBox → Archemy)
- [ ] Replace transport API calls with clinical API
- [ ] Replace trip types with session types
- [ ] Update styling to Archemy colors
- [ ] Create separate Zustand store
- [ ] Test calendar functionality
- [ ] Verify Bentobox calendar still works

### Phase 7: Clinical Components

- [ ] Create `SessionCard.tsx`
- [ ] Create `FacilitatorPool.tsx`
- [ ] Create `CurriculumLibrary.tsx`
- [ ] Create `FormTemplateBuilder.tsx`
- [ ] Create `ClientGroupManager.tsx`
- [ ] Create `DAPNotesEditor.tsx`
- [ ] Create `BillingDashboard.tsx`
- [ ] Apply neumorphic styling to all components

### Phase 8: API Client

- [ ] Create `client/src/lib/clinical-api.ts`
- [ ] Implement all API methods
- [ ] Test API client with backend

### Phase 9: Styling

- [ ] Add Archemy CSS variables to `index.css`
- [ ] Apply Archemy colors to all components
- [ ] Ensure neumorphic styling consistency
- [ ] Test dark mode compatibility

### Phase 10: Testing & Documentation

- [ ] Write unit tests for storage functions
- [ ] Write integration tests for API routes
- [ ] Write E2E tests for critical workflows
- [ ] Test feature flag toggling
- [ ] Verify zero regressions in Bentobox
- [ ] Update `HALCYON_APP_OVERVIEW_AND_THEMING_GUIDE.md`
- [ ] Document API endpoints
- [ ] Create user guide

---

## Code Examples

### Storage Function Example

```typescript
// server/minimal-supabase.ts

export const archemyStorage = {
  async getSessionsByProgram(programId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('scheduled_sessions')
      .select(`
        *,
        programs:program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        facilitators:facilitator_id (
          user_id,
          user_name,
          first_name,
          last_name,
          email
        ),
        curriculum_modules:curriculum_module_id (
          id,
          title,
          category,
          duration_minutes
        ),
        form_templates:form_template_id (
          id,
          template_name,
          template_code
        )
      `)
      .eq('program_id', programId);
    
    if (startDate) {
      query = query.gte('session_date', startDate);
    }
    if (endDate) {
      query = query.lte('session_date', endDate);
    }
    
    const { data, error } = await query.order('session_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  
  async createSession(data: any, userId: string) {
    const { data: session, error } = await supabase
      .from('scheduled_sessions')
      .insert({
        ...data,
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single();
    
    if (error) throw error;
    return session;
  }
};
```

### API Route Example

```typescript
// server/routes/archemy/sessions.ts

router.post("/", 
  requireSupabaseAuth, 
  requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']),
  requirePermission(PERMISSIONS.ARCHEMY_CREATE_SESSION),
  async (req: SupabaseAuthenticatedRequest, res) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: "User ID not found in session" });
      }
      
      const session = await archemyStorage.createSession(req.body, req.user.userId);
      res.status(201).json(session);
    } catch (error: any) {
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session", error: error.message });
    }
  }
);
```

### Frontend Component Example

```typescript
// client/src/pages/archemy/calendar.tsx

import { useQuery } from "@tanstack/react-query";
import { clinicalApi } from "../../lib/clinical-api";
import { useAuth } from "../../hooks/useAuth";
import { useFeatureFlag } from "../../hooks/use-permissions";
import { ArchemyGanttView } from "../../components/clinical-calendar/ArchemyGanttView";

export default function ArchemyCalendar() {
  const { user } = useAuth();
  const { isEnabled: archemyEnabled } = useFeatureFlag("archemy_clinical_enabled");
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  if (!archemyEnabled) {
    return <div>Archemy Clinical Module is not enabled for this program.</div>;
  }
  
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["archemy-sessions", user?.primary_program_id, selectedDate],
    queryFn: () => clinicalApi.getSessions(user?.primary_program_id || ""),
    enabled: !!user?.primary_program_id
  });
  
  return (
    <div className="archemy-calendar">
      <header className="card-neu p-6 mb-6" style={{ 
        background: 'linear-gradient(135deg, var(--archemy-primary) 0%, var(--archemy-accent) 100%)',
        boxShadow: 'var(--shadow-archemy-raised)'
      }}>
        <h1 className="text-3xl font-bold text-white">Archemy Clinical Calendar</h1>
      </header>
      
      <ArchemyGanttView sessions={sessions || []} />
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests

**Storage Functions:**
- Test all CRUD operations
- Test error handling
- Test query filtering

**API Routes:**
- Test authentication/authorization
- Test request validation
- Test error responses

### Integration Tests

**End-to-End Workflows:**
- Create session → Assign curriculum → Assign clients → Create form submissions
- Complete form → Review → Attest billing
- Feature flag toggle → Navigation visibility

### Regression Tests

**Critical:**
- Bentobox calendar still works
- Transport routes unaffected
- Team management unaffected
- Existing feature flags still work

### Performance Tests

- Calendar loads with 100+ sessions
- Form submission completes in < 500ms
- No memory leaks

---

## Critical Implementation Rules

### DO:

- ✅ Use Supabase client (not Drizzle) for storage functions
- ✅ Use database-backed feature flags (`useFeatureFlag` hook)
- ✅ Follow existing route patterns (`requireSupabaseAuth`, `requirePermission`)
- ✅ Use existing file storage helpers
- ✅ Match foreign key types exactly (VARCHAR(50) for locations, programs, users)
- ✅ Clone calendar completely (don't share components initially)
- ✅ Use neumorphic styling consistently
- ✅ Add Archemy tables to Drizzle schema for type safety
- ✅ Test thoroughly before merging

### DON'T:

- ❌ Modify any files in `components/transport/` or `routes/bentobox/`
- ❌ Modify `trips`, `drivers`, `vehicles` tables
- ❌ Use environment variables for feature flags
- ❌ Create separate Supabase client instance
- ❌ Mix Drizzle ORM with Supabase client patterns
- ❌ Change existing Bentobox calendar functionality
- ❌ Skip type checking in schema

---

## Next Steps

1. **Complete Team Management sections** (current priority)
2. **Review this plan** before starting implementation
3. **Start with Phase 1** (Database Foundation)
4. **Test each phase** before moving to next
5. **Update documentation** as you go

---

## Questions & Decisions Needed

1. **PIN Field:** Reuse `billing_pin` or add separate `pin_code`?
2. **Calendar Sharing:** Full clone or extract shared components later?
3. **Client PWA:** Timeline for client-facing form completion?
4. **Speech-to-Text:** Which service for DAP notes (Web Speech API or cloud service)?

---

**Last Updated:** 2025-01-28  
**Status:** Ready for Implementation (after Team Management completion)

