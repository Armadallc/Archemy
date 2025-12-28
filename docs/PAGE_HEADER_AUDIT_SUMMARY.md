# Page Header & Scoping Selector Audit - Executive Summary

**Date:** 2025-12-21  
**Status:** Ready for Implementation

---

## Key Findings

### ✅ What's Working
- **Unified Header Component** correctly implements scoping selector with role-based conditional rendering
- **12 pages** have standardized headers (150px height, consistent styling)
- All fallback headers use consistent styling pattern

### ⚠️ Issues Found
- **12 pages** with headers are **missing the scoping selector**
- Scoping selector should only show for `super_admin` and `corporate_admin`
- Some pages need header review (Billing, Dashboard, Settings)

---

## Pages Requiring Scoping Selector (12 total)

All these pages have standard headers but are missing the scoping selector:

1. **Analytics** (`/analytics`)
2. **Calendar** (`/calendar`)
3. **Calendar Experiment/BentoBox** (`/bentobox`)
4. **Clients** (`/operations/clients`)
5. **Corporate Clients** (`/corporate-clients`)
6. **Trips (Hierarchical)** (`/trips`)
7. **Programs** (`/programs`)
8. **Vehicles** (`/vehicles`)
9. **Drivers** (`/drivers`)
10. **Frequent Locations** (`/frequent-locations`)
11. **Telematics** (`/telematics`)
12. **Role Templates** (`/role-templates`)

---

## Standard Header Implementation

### Required Code Pattern
```tsx
import { HeaderScopeSelector } from '../components/HeaderScopeSelector';
import { useAuth } from '../hooks/useAuth';
import { RollbackManager } from '../utils/rollback-manager';

// Inside component:
const { user } = useAuth();
const ENABLE_UNIFIED_HEADER = RollbackManager.isUnifiedHeaderEnabled();

// In JSX:
{!ENABLE_UNIFIED_HEADER && (
  <div className="px-6 py-6 rounded-lg border backdrop-blur-md shadow-xl flex items-center justify-between mb-6" 
       style={{ 
         backgroundColor: 'var(--card)', 
         borderColor: 'var(--border)', 
         height: '150px' 
       }}>
    {/* Left Side: Title */}
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

---

## Role-Based Scoping Requirements

### Show Scoping Selector For:
- ✅ `super_admin` - Can switch between global, corporate clients, and programs
- ✅ `corporate_admin` - Can switch between their corporate client and programs

### Hide Scoping Selector For:
- ❌ `program_admin` - Scoped to their program
- ❌ `program_user` - Scoped to their program
- ❌ `driver` - Scoped to their program
- ❌ `client_user` - Scoped to their program

---

## Implementation Plan

### Step 1: Add Imports
Add to each page file:
```tsx
import { HeaderScopeSelector } from '../components/HeaderScopeSelector';
```

### Step 2: Add Conditional Rendering
In the header's right-side flex container, add:
```tsx
{(user?.role === 'super_admin' || user?.role === 'corporate_admin') && (
  <HeaderScopeSelector />
)}
```

### Step 3: Verify Position
Ensure scoping selector is:
- First element in the right-side flex container
- Uses `gap-3` spacing
- Positioned before other header controls

---

## Testing Checklist

- [ ] Scoping selector appears on all 12 pages for super_admin
- [ ] Scoping selector appears on all 12 pages for corporate_admin
- [ ] Scoping selector hidden for program_admin
- [ ] Scoping selector hidden for program_user
- [ ] Scoping selector hidden for driver
- [ ] Scoping selector hidden for client_user
- [ ] Scoping selector positioned correctly (right side, first element)
- [ ] Headers maintain consistent styling (150px height, padding, borders)
- [ ] Unified header still works when enabled
- [ ] Fallback headers work when unified header is disabled

---

## Estimated Effort

- **Time:** ~2-3 hours
- **Files to Modify:** 12 page files
- **Risk Level:** Low (additive changes only, no breaking changes)

---

## Next Steps

1. Review and approve this summary
2. Implement scoping selector on all 12 pages
3. Test with different user roles
4. Verify header consistency across all pages
5. Update documentation if needed

