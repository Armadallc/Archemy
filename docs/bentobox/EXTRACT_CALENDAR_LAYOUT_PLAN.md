# Extract Calendar Layout/Grid from Full-Calendar Repo

## Goal
Extract **only** the responsive layout/grid structure from full-calendar while preserving all BentoBox functionality (DnD, encounters, templates, etc.)

## Key Files to Extract

Based on full-calendar repo structure, these are the layout/grid files we need:

### Core Layout Files
1. **`src/modules/components/calendar/calendar-body.tsx`** - Main calendar body that renders views
2. **`src/modules/components/calendar/views/week-view.tsx`** - Week view layout/grid
3. **`src/modules/components/calendar/views/day-view.tsx`** - Day view layout/grid
4. **`src/modules/components/calendar/views/month-view.tsx`** - Month view layout/grid
5. **`src/modules/components/calendar/helpers.ts`** - Layout calculation helpers

### Responsive Grid Components
6. **`src/modules/components/calendar/views/week-view.tsx`** - Time grid structure
7. **`src/modules/components/calendar/views/day-view.tsx`** - Day grid structure

### Layout Utilities
8. **`src/modules/components/calendar/hooks.ts`** - Layout hooks (useCalendarGrid, etc.)

## What We'll Keep from BentoBox
- ✅ All DnD functionality
- ✅ Encounter rendering logic
- ✅ Template system
- ✅ Pool system
- ✅ Store/state management
- ✅ Color system
- ✅ All feature flags

## What We'll Replace
- ❌ Grid container structure (flex/overflow handling)
- ❌ Time slot layout calculations
- ❌ Day column responsive behavior
- ❌ Scroll synchronization
- ❌ Height/width calculations

## Integration Strategy

### Phase 1: Extract Layout Components
1. Fetch layout files from full-calendar
2. Create adapter layer to map BentoBox data to layout props
3. Extract only the grid/layout JSX structure

### Phase 2: Create Layout Wrapper
1. Create `BentoBoxCalendarGrid.tsx` that uses full-calendar layout
2. Pass BentoBox encounters as props
3. Handle BentoBox-specific rendering inside grid cells

### Phase 3: Integrate with Existing Views
1. Replace grid structure in `BentoBoxGanttView.tsx`
2. Keep all encounter rendering logic
3. Preserve DnD handlers

## Files to Fetch

```bash
# Core layout files
src/modules/components/calendar/calendar-body.tsx
src/modules/components/calendar/views/week-view.tsx
src/modules/components/calendar/views/day-view.tsx
src/modules/components/calendar/views/month-view.tsx
src/modules/components/calendar/helpers.ts
src/modules/components/calendar/hooks.ts
```

## Risk Assessment

**Low Risk:**
- Layout structure is isolated
- We're only replacing container divs
- All logic stays in BentoBox

**Medium Risk:**
- Need to ensure DnD still works with new layout
- Scroll synchronization might need adjustment

**Mitigation:**
- Keep feature flag for gradual rollout
- Test thoroughly before enabling
- Keep old layout as fallback




