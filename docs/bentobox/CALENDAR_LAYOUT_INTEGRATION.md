# Calendar Layout Integration Plan

## Problem Statement
BentoBox calendar has responsive behavior issues. We want to use the proven responsive layout/grid from full-calendar repo while keeping all BentoBox functionality.

## Approach: Layout Extraction

### What We're Doing
1. **Extract** only the grid/layout structure from full-calendar
2. **Preserve** all BentoBox logic (DnD, encounters, templates)
3. **Adapt** the layout to work with BentoBox data model

### Key Principle
**Layout is structure, not logic.** We're replacing the container divs and CSS classes, not the business logic.

## File Mapping

### Full-Calendar → BentoBox

| Full-Calendar File | What We Extract | BentoBox Integration |
|-------------------|----------------|---------------------|
| `week-view.tsx` | Grid container, time slots layout | Replace grid in `BentoBoxGanttView.tsx` |
| `day-view.tsx` | Day column structure | Use for day view mode |
| `month-view.tsx` | Month grid layout | Already have, but can improve |
| `helpers.ts` | Layout calculation functions | Adapt for BentoBox time slots (6 AM - 10 PM) |
| `hooks.ts` | Responsive hooks | Use for height/width calculations |

## Integration Steps

### Step 1: Extract Layout Components
```typescript
// Create: client/src/components/bentobox-calendar/layouts/CalendarGrid.tsx
// This will be a wrapper that uses full-calendar's grid structure
// but renders BentoBox encounters inside
```

### Step 2: Create Adapter Layer
```typescript
// Create: client/src/components/bentobox-calendar/layouts/adapters/layout-adapter.ts
// Maps BentoBox encounters to layout props
// Handles time slot calculations (6 AM - 10 PM)
```

### Step 3: Update BentoBoxGanttView
```typescript
// Replace grid structure but keep:
// - getEventsForDay() logic
// - DnD handlers
// - Encounter rendering
// - All BentoBox-specific features
```

## Preserved Functionality

✅ **All of these stay exactly the same:**
- Drag and drop (DnD context)
- Encounter rendering
- Template system
- Pool system
- Store/state management
- Color system
- Feature flags
- Time format toggle
- Staff filtering
- Event resizing

## What Changes

🔄 **Only these change:**
- Grid container structure (flex → grid or improved flex)
- Time slot height calculations
- Day column width calculations
- Scroll container structure
- Responsive breakpoints

## Risk Mitigation

1. **Feature Flag:** `VITE_ENABLE_FULL_CALENDAR_LAYOUT`
2. **Gradual Rollout:** Test with flag, then enable
3. **Fallback:** Keep old layout code commented
4. **Testing:** Test all DnD, resizing, filtering with new layout

## Success Criteria

- ✅ Calendar is fully responsive (height and width)
- ✅ All BentoBox features work (DnD, resize, filter)
- ✅ No visual regressions
- ✅ Performance is same or better
- ✅ Mobile experience improved




