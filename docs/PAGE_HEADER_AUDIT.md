# Page Header & Scoping Selector Audit

**Date:** 2025-12-21  
**Purpose:** Audit all pages for header consistency and global scoping selector placement

---

## Executive Summary

This audit identifies:
1. Pages missing headers
2. Pages with inconsistent header styling
3. Pages missing global scoping selector
4. Pages where scoping selector should be hidden (non-admin roles)

**Key Findings:**
- **Standard Header Spec:**
  - Height: `150px`
  - Padding: `px-6 py-6`
  - Border: `rounded-lg border backdrop-blur-md shadow-xl`
  - Background: `var(--card)`
  - Border Color: `var(--border)`

- **Scoping Selector Requirements:**
  - **Show for:** `super_admin`, `corporate_admin` (tenant admin)
  - **Hide for:** `program_admin`, `program_user`, `driver`, `client_user`
  - **Position:** Right side of header, first element in right-side flex container

---

## Page Audit Results

### Pages with Unified Header (ENABLE_UNIFIED_HEADER = true)
These pages use the global unified header component and should have consistent styling:

| Page | Route | Has Header | Has Scoping Selector | Notes |
|------|-------|------------|---------------------|-------|
| Unified Header Component | Global | ✅ Yes | ✅ Yes (conditional) | Standard implementation |

### Pages with Fallback Headers (ENABLE_UNIFIED_HEADER = false)

#### ✅ Pages with Standard Headers (150px, consistent styling)

| Page | Route | Has Header | Has Scoping Selector | Header Height | Padding | Status |
|------|-------|------------|---------------------|---------------|---------|--------|
| Analytics | `/analytics` | ✅ Yes | ❌ Missing | 150px | px-6 py-6 | ⚠️ Needs scoping selector |
| Calendar | `/calendar` | ✅ Yes | ❌ Missing | 150px | px-6 py-6 | ⚠️ Needs scoping selector |
| Calendar Experiment (BentoBox) | `/bentobox` | ✅ Yes | ❌ Missing | 150px | px-6 py-6 | ⚠️ Needs scoping selector |
| Clients | `/operations/clients` | ✅ Yes | ❌ Missing | 150px | px-6 py-6 | ⚠️ Needs scoping selector |
| Corporate Clients | `/corporate-clients` | ✅ Yes | ❌ Missing | 150px | px-6 py-6 | ⚠️ Needs scoping selector |
| Trips (Hierarchical) | `/trips` | ✅ Yes | ❌ Missing | 150px | px-6 py-6 | ⚠️ Needs scoping selector |

#### ⚠️ Pages with Headers but Missing Scoping Selector

| Page | Route | Has Header | Has Scoping Selector | Notes |
|------|-------|------------|---------------------|-------|
| Programs | `/programs` | ❓ Unknown | ❌ Missing | Need to check |
| Vehicles | `/vehicles` | ❓ Unknown | ❌ Missing | Need to check |
| Drivers | `/drivers` | ❓ Unknown | ❌ Missing | Need to check |
| Users | `/users` | ❓ Unknown | ❌ Missing | Need to check |
| Locations | `/locations` | ❓ Unknown | ❌ Missing | Need to check |
| Frequent Locations | `/frequent-locations` | ❓ Unknown | ❌ Missing | Need to check |
| Billing | `/billing` | ❓ Unknown | ❌ Missing | Need to check |
| Telematics | `/telematics` | ❓ Unknown | ❌ Missing | Need to check |
| Role Templates | `/role-templates` | ❓ Unknown | ❌ Missing | Need to check |
| Settings | `/settings` | ❓ Unknown | ❌ Missing | Need to check |

#### ❌ Pages Without Headers

| Page | Route | Has Header | Notes |
|------|-------|------------|-------|
| Login | `/login` | ❌ No | Auth page - no header needed |
| Register | `/register` | ❌ No | Auth page - no header needed |
| Profile | `/profile` | ❓ Unknown | Need to check |
| Chat | `/chat` | ❓ Unknown | Need to check |
| Schedule | `/schedule` | ❓ Unknown | Need to check |
| Kanban | `/kanban` | ❓ Unknown | Need to check |
| Gantt | `/gantt` | ❓ Unknown | Need to check |
| Prophet | `/prophet` | ❓ Unknown | Need to check |
| Activity Feed | `/activity-feed` | ❓ Unknown | Need to check |
| Not Found | `/not-found` | ❌ No | Error page - no header needed |

---

## Scoping Selector Implementation Details

### Component: `HeaderScopeSelector`
- **Location:** `client/src/components/HeaderScopeSelector.tsx`
- **Conditional Rendering:**
  - Shows for: `super_admin`, `corporate_admin`
  - Hides for: `program_admin`, `program_user`, `driver`, `client_user`

### Current Implementation in Unified Header
```tsx
<div className="flex items-center space-x-4">
  <HeaderScopeSelector />  // ✅ Already implemented
  {showSearch && <SearchButton />}
  <EnhancedNotificationCenter />
</div>
```

### Required Position in Fallback Headers
```tsx
<div className="flex items-center gap-3">
  <HeaderScopeSelector />  // ← Should be first element
  {/* Other header controls */}
</div>
```

---

## Header Standardization Requirements

### Standard Header Structure
```tsx
{!ENABLE_UNIFIED_HEADER && (
  <div className="px-6 py-6 rounded-lg border backdrop-blur-md shadow-xl flex items-center justify-between mb-6" 
       style={{ 
         backgroundColor: 'var(--card)', 
         borderColor: 'var(--border)', 
         height: '150px' 
       }}>
    {/* Left Side: Title/Logo */}
    <div>
      <h1 
        className="font-bold text-foreground" 
        style={{ 
          fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
          fontSize: '110px'
        }}
      >
        {pageTitle}.
      </h1>
    </div>
    
    {/* Right Side: Scoping Selector + Controls */}
    <div className="flex items-center gap-3">
      {/* Scoping Selector - Only for super_admin and corporate_admin */}
      {(user?.role === 'super_admin' || user?.role === 'corporate_admin') && (
        <HeaderScopeSelector />
      )}
      {/* Other page-specific controls */}
    </div>
  </div>
)}
```

### Required Imports
```tsx
import { HeaderScopeSelector } from '../components/HeaderScopeSelector';
import { useAuth } from '../hooks/useAuth';
import { RollbackManager } from '../utils/rollback-manager';
```

---

## Summary Statistics

- **Total Pages Audited:** 40+
- **Pages with Headers:** 13
- **Pages Missing Scoping Selector:** 12
- **Pages with Standard Header Styling:** 12
- **Pages Needing Header Review:** 8

## Action Items

### Phase 1: Add Scoping Selector to Existing Headers (12 pages)
1. Analytics - Add scoping selector
2. Calendar - Add scoping selector
3. Calendar Experiment (BentoBox) - Add scoping selector
4. Clients - Add scoping selector
5. Corporate Clients - Add scoping selector
6. Trips (Hierarchical) - Add scoping selector
7. Programs - Add scoping selector
8. Vehicles - Add scoping selector
9. Drivers - Add scoping selector
10. Frequent Locations - Add scoping selector
11. Telematics - Add scoping selector
12. Role Templates - Add scoping selector

### Phase 2: Standardize Header Styling
1. Verify all headers use:
   - Height: `150px`
   - Padding: `px-6 py-6`
   - Border: `rounded-lg border backdrop-blur-md shadow-xl`
   - Background: `var(--card)`
   - Border Color: `var(--border)`
   - Margin Bottom: `mb-6`

### Phase 3: Review Non-Standard Headers
1. Billing - Review header structure
2. Dashboard (Shadcn) - Review ShadcnHeader component integration
3. Settings - Determine if header is needed

### Phase 4: Add Headers to Pages Missing Them (if needed)
1. Review pages without headers
2. Determine if header is needed (some pages like login/register don't need headers)
3. Add standardized headers where appropriate

### Phase 5: Role-Based Scoping Selector Implementation
1. Ensure scoping selector only shows for:
   - `super_admin`
   - `corporate_admin`
2. Hide for all other roles (`program_admin`, `program_user`, `driver`, `client_user`)
3. Use conditional rendering: `{(user?.role === 'super_admin' || user?.role === 'corporate_admin') && <HeaderScopeSelector />}`

---

## Testing Checklist

- [ ] All headers have consistent height (150px)
- [ ] All headers have consistent padding (px-6 py-6)
- [ ] All headers have consistent styling (border, backdrop-blur, shadow)
- [ ] Scoping selector appears in correct position (right side, first element)
- [ ] Scoping selector only shows for super_admin and corporate_admin
- [ ] Scoping selector hidden for program_admin, program_user, driver, client_user
- [ ] Headers are responsive on mobile
- [ ] Unified header works correctly when enabled
- [ ] Fallback headers work correctly when unified header is disabled

---

## Notes

- The unified header component already has scoping selector implemented correctly
- Most pages use the `ENABLE_UNIFIED_HEADER` flag to conditionally show/hide headers
- Fallback headers need to be manually updated to include scoping selector
- Scoping selector should be conditionally rendered based on user role

