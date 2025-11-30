# Hierarchy Workflow Implementation Priority

**Date:** 2025-01-27  
**Status:** Planning Phase  
**Approach:** Top-Down Implementation

---

## Implementation Strategy

### Priority Order: Top-Down (Super Admin → Lower Roles)

**Rationale:**
- Start with the most complete workflow (super_admin) that has access to all levels
- Implement full end-to-end functionality for super_admin first
- Then work down through the hierarchy, removing/restricting features for each lower role
- This approach is more logical than building up from the bottom, as we'll be removing features rather than adding them

---

## Implementation Phases

### Phase 1: Super Admin Workflow (CURRENT PRIORITY) ⚡

**Goal:** Complete end-to-end workflow for super_admin role

**Tasks:**
1. **URL Navigation**
   - Update `navigateToClient()` to update URL for super_admin
   - Update `navigateToProgram()` to update URL for super_admin
   - Update `navigateToLocation()` to update URL for super_admin
   - Format: `/corporate-client/:corporateClientId` → `/corporate-client/:corporateClientId/program/:programId` → `/corporate-client/:corporateClientId/program/:programId/location/:locationId`

2. **Query Key Updates**
   - Update `useDashboardData` query keys to include `selectedProgram` and `level`
   - Ensure all data queries react to hierarchy state changes
   - Add `selectedLocation` to query keys where applicable

3. **Page Reactivity**
   - Ensure all pages respond to hierarchy state changes
   - Update dashboard to refetch data when hierarchy changes
   - Update trips, clients, drivers, locations, etc. pages to filter by hierarchy

4. **DrillDownDropdown Functionality**
   - Verify corporate clients display correctly
   - Verify programs display when corporate client selected
   - Verify locations display when program selected
   - Test navigation through all three levels

5. **End-to-End Testing**
   - Test complete workflow: Corporate → Client → Program → Location
   - Verify data filtering at each level
   - Verify URL updates correctly
   - Verify back navigation works
   - Verify breadcrumbs update correctly

---

### Phase 2: Corporate Admin Workflow

**Goal:** Implement workflow for corporate_admin (restricted from super_admin)

**Tasks:**
- Remove corporate client selection (they only have one)
- Ensure program selection works
- Ensure location selection works
- Test filtering by their corporate client ID
- Verify tenant isolation

---

### Phase 3: Program Admin/User Workflow

**Goal:** Implement workflow for program_admin and program_user (most restricted)

**Tasks:**
- Remove corporate client and program selection (they only have one)
- Ensure location selection works if applicable
- Test filtering by their program ID
- Verify data access restrictions

---

### Phase 4: Driver Workflow

**Goal:** Implement workflow for driver role (most restricted)

**Tasks:**
- Remove all hierarchy navigation
- Ensure they only see their assigned trips
- Verify no access to corporate/program/location selection

---

## Current Status

### Completed ✅
- Added `location` level to hierarchy hook
- Updated DrillDownDropdown to support 3 levels (Corporate Clients → Programs → Locations)
- Fixed corporate clients display issue
- Added `navigateToLocation()` function

### In Progress 🔄
- Super admin workflow implementation
- URL navigation for super_admin
- Query key updates for hierarchy reactivity

### Blocked/Issues 🚫
- **Issue:** Super admin navigation doesn't update URLs, so pages don't react to hierarchy changes
- **Issue:** Query keys don't include all hierarchy values, so React Query doesn't refetch
- **Issue:** Dashboard doesn't properly react to hierarchy state changes

---

## Technical Notes

### URL Format
- **Super Admin (Corporate Level):** `/` or `/dashboard`
- **Super Admin (Client Level):** `/corporate-client/:corporateClientId`
- **Super Admin (Program Level):** `/corporate-client/:corporateClientId/program/:programId`
- **Super Admin (Location Level):** `/corporate-client/:corporateClientId/program/:programId/location/:locationId`

### Query Key Pattern
All queries should include hierarchy state in their query keys:
```typescript
queryKey: ['resource', level, selectedCorporateClient, selectedProgram, selectedLocation]
```

### Navigation Functions
All navigation functions should:
1. Update React state (hierarchy context)
2. Update URL (for proper page reactivity)
3. Update breadcrumbs
4. Clear child selections (e.g., selecting a client clears program/location)

---

## Next Steps

1. **Immediate:** Complete super_admin workflow implementation
2. **After Super Admin:** Move to corporate_admin workflow
3. **After Corporate Admin:** Move to program_admin/user workflow
4. **Final:** Driver workflow

---

**Note:** This top-down approach ensures we build the most complete workflow first, then restrict it for lower roles. This is more efficient than building up from the bottom.

