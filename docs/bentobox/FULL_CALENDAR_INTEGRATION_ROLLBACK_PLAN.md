# Full Calendar Integration - Rollback Plan & Safety Measures

## Pre-Integration Checklist

### ✅ Current State Documentation

**Date**: December 2025  
**Branch**: `feature/contract-analysis`  
**Modified Files**:
- `client/src/components/bentobox-calendar/BentoBoxGanttView.tsx`
- `client/src/pages/calendar-experiment.tsx`
- `client/src/components/prophet/shared/EditableField.tsx`

**Current Features Working**:
- ✅ Week view with time slots (6 AM - 10 PM)
- ✅ Template-based scheduling
- ✅ Pool drag-and-drop system
- ✅ Library & Builder tabs
- ✅ Responsive height (recently fixed)
- ✅ Border visibility (recently fixed)

---

## Step 1: Create Backup Branch

```bash
# Create backup branch from current state
git checkout -b backup/bentobox-calendar-pre-integration
git add -A
git commit -m "Backup: BentoBox calendar state before full-calendar integration"
git push origin backup/bentobox-calendar-pre-integration

# Return to working branch
git checkout feature/contract-analysis
```

**Backup Branch Name**: `backup/bentobox-calendar-pre-integration`

---

## Step 2: Color Palette Documentation

### Current Fire Design System Colors

**Core Palette** (from `shared/design-tokens/colors.ts`):
```typescript
const palette = {
  charcoal: '#26282b',  // Dark backgrounds, light mode text
  ice: '#e8fffe',      // Light accent backgrounds
  lime: '#f1fec9',     // Elevated surfaces, accent
  coral: '#ff8475',    // Primary actions, highlights
  silver: '#eaeaea',   // Borders, muted backgrounds
  cloud: '#f4f4f4',    // Light mode background
  shadow: '#343434',   // Dark gray accents
  aqua: '#a5c8ca',     // Light teal accents
}
```

### BentoBox Calendar Color Mapping

**Category → Color Mapping** (from `types.ts`):
```typescript
export const CATEGORY_COLORS: Record<TemplateCategory, FireColor> = {
  clinical: "coral",        // #ff8475
  "life-skills": "lime",    // #f1fec9
  recreation: "ice",        // #e8fffe
  medical: "charcoal",      // #26282b
  administrative: "silver",  // #eaeaea
};
```

### Current Color Usage in BentoBox

**BentoBoxGanttView.tsx** (line 158-166):
```typescript
const getColorClasses = (color: FireColor) => {
  const colorMap: Record<FireColor, string> = {
    coral: 'bg-[#ff8475]/20 text-[#ff8475] border-l-4 border-[#ff8475] hover:bg-[#ff8475]/30',
    lime: 'bg-[#f1fec9]/60 text-[#26282b] border-l-4 border-[#d4e5a8] hover:bg-[#f1fec9]/80 dark:text-[#26282b]',
    ice: 'bg-[#e8fffe]/60 text-[#26282b] border-l-4 border-[#b8e5e3] hover:bg-[#e8fffe]/80 dark:text-[#26282b]',
    charcoal: 'bg-[#26282b]/20 text-[#26282b] border-l-4 border-[#26282b] hover:bg-[#26282b]/30 dark:bg-[#26282b]/40 dark:text-[#eaeaea]',
    silver: 'bg-[#eaeaea]/60 text-[#26282b] border-l-4 border-[#d4d4d4] hover:bg-[#eaeaea]/80 dark:text-[#26282b]',
  };
  return colorMap[color] || colorMap.silver;
};
```

**Color Usage Pattern**:
- Background: `bg-[color]/20` or `bg-[color]/60` (opacity)
- Text: `text-[color]` or `text-[#26282b]` (charcoal for contrast)
- Border: `border-l-4 border-[color]` (left border accent)
- Hover: `hover:bg-[color]/30` or `hover:bg-[color]/80`

### Full-Calendar Color Compatibility

**Required**: Map full-calendar's color system to Fire palette:
- Full-calendar uses arbitrary colors
- We must constrain to Fire palette only
- Additional colors can use extended shades (limeDark, coralDark, etc.)

**Color Adapter Function** (to be created):
```typescript
// client/src/components/bentobox-calendar/adapters/color-adapter.ts
export const mapToFireColor = (color: string): FireColor => {
  // Map full-calendar colors to Fire palette
  // Default to silver if no match
  const colorMap: Record<string, FireColor> = {
    'red': 'coral',
    'blue': 'ice',
    'green': 'lime',
    'gray': 'charcoal',
    'yellow': 'lime', // Use lime for yellow
    'purple': 'coral', // Use coral for purple
    'orange': 'coral',
  };
  return colorMap[color.toLowerCase()] || 'silver';
};
```

---

## Step 3: Feature Flags Setup

### Create Feature Flag System

**File**: `client/src/lib/feature-flags.ts`

```typescript
export const FEATURE_FLAGS = {
  // Full Calendar Integration
  FULL_CALENDAR_VIEWS: process.env.NEXT_PUBLIC_ENABLE_FULL_CALENDAR_VIEWS === 'true',
  FULL_CALENDAR_RESIZE: process.env.NEXT_PUBLIC_ENABLE_EVENT_RESIZE === 'true',
  FULL_CALENDAR_AGENDA: process.env.NEXT_PUBLIC_ENABLE_AGENDA_VIEW === 'true',
  FULL_CALENDAR_TIME_FORMAT: process.env.NEXT_PUBLIC_ENABLE_TIME_FORMAT === 'true',
  FULL_CALENDAR_STAFF_FILTER: process.env.NEXT_PUBLIC_ENABLE_STAFF_FILTER === 'true',
} as const;

// Helper to check if any full-calendar feature is enabled
export const isFullCalendarEnabled = () => {
  return Object.values(FEATURE_FLAGS).some(flag => flag === true);
};
```

**Environment Variables** (`.env.local`):
```bash
# Full Calendar Integration Flags
NEXT_PUBLIC_ENABLE_FULL_CALENDAR_VIEWS=false
NEXT_PUBLIC_ENABLE_EVENT_RESIZE=false
NEXT_PUBLIC_ENABLE_AGENDA_VIEW=false
NEXT_PUBLIC_ENABLE_TIME_FORMAT=false
NEXT_PUBLIC_ENABLE_STAFF_FILTER=false
```

---

## Step 4: Integration Safety Measures

### 4.1 Component Isolation

**Strategy**: Create wrapper components that conditionally render new features

```typescript
// client/src/components/bentobox-calendar/views/ViewRouter.tsx
import { useBentoBoxStore } from '../store';
import { FEATURE_FLAGS } from '../../../lib/feature-flags';
import { BentoBoxGanttView } from '../BentoBoxGanttView';
import { MonthView } from './MonthView'; // New
import { AgendaView } from './AgendaView'; // New

export function ViewRouter() {
  const { currentView } = useBentoBoxStore();
  
  // Always use existing view if feature flag is off
  if (!FEATURE_FLAGS.FULL_CALENDAR_VIEWS) {
    return <BentoBoxGanttView />;
  }
  
  // New views only if flag is on
  switch (currentView) {
    case 'month':
      return FEATURE_FLAGS.FULL_CALENDAR_VIEWS ? <MonthView /> : <BentoBoxGanttView />;
    case 'agenda':
      return FEATURE_FLAGS.FULL_CALENDAR_AGENDA ? <AgendaView /> : <BentoBoxGanttView />;
    default:
      return <BentoBoxGanttView />;
  }
}
```

### 4.2 Data Adapter Layer

**Strategy**: Create adapters to convert between data formats

```typescript
// client/src/components/bentobox-calendar/adapters/encounter-adapter.ts
import { ScheduledEncounter } from '../types';
import { CalendarEvent } from '../../../components/event-calendar/types';

/**
 * Converts BentoBox ScheduledEncounter to full-calendar CalendarEvent format
 * Ensures compatibility while preserving BentoBox-specific data
 */
export const toCalendarEvent = (encounter: ScheduledEncounter): CalendarEvent => {
  return {
    id: encounter.id,
    title: encounter.title,
    start: encounter.start,
    end: encounter.end,
    allDay: false, // BentoBox encounters are never all-day
    color: mapToFireColor(encounter.color),
    // Preserve BentoBox data in extended properties
    extendedProps: {
      templateId: encounter.templateId,
      templateVersion: encounter.templateVersion,
      status: encounter.status,
      overrides: encounter.overrides,
    },
  };
};

/**
 * Converts full-calendar CalendarEvent back to BentoBox ScheduledEncounter
 */
export const toScheduledEncounter = (
  event: CalendarEvent,
  originalEncounter?: ScheduledEncounter
): ScheduledEncounter => {
  return {
    ...(originalEncounter || {}),
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    color: mapToFireColor(event.color || 'silver'),
    // Preserve template data
    templateId: originalEncounter?.templateId || '',
    templateVersion: originalEncounter?.templateVersion || 1,
  } as ScheduledEncounter;
};
```

### 4.3 Style Isolation

**Strategy**: Ensure full-calendar components use Fire palette

```typescript
// client/src/components/bentobox-calendar/styles/full-calendar-theme.ts
/**
 * Theme configuration for full-calendar components
 * Ensures all colors align with Fire design system
 */
export const fullCalendarTheme = {
  colors: {
    primary: '#ff8475', // coral
    secondary: '#f1fec9', // lime
    accent: '#e8fffe', // ice
    dark: '#26282b', // charcoal
    light: '#eaeaea', // silver
    background: '#f4f4f4', // cloud
  },
  // Map full-calendar event colors to Fire palette
  eventColors: {
    coral: '#ff8475',
    lime: '#f1fec9',
    ice: '#e8fffe',
    charcoal: '#26282b',
    silver: '#eaeaea',
  },
};
```

---

## Step 5: Rollback Procedures

### 5.1 Quick Rollback (Feature Flags)

**If issues detected**:
1. Set all feature flags to `false` in `.env.local`
2. Restart dev server
3. All new features disabled, original functionality restored

```bash
# .env.local
NEXT_PUBLIC_ENABLE_FULL_CALENDAR_VIEWS=false
NEXT_PUBLIC_ENABLE_EVENT_RESIZE=false
NEXT_PUBLIC_ENABLE_AGENDA_VIEW=false
NEXT_PUBLIC_ENABLE_TIME_FORMAT=false
NEXT_PUBLIC_ENABLE_STAFF_FILTER=false
```

### 5.2 Code Rollback (Git)

**If major issues**:
```bash
# Option 1: Revert to backup branch
git checkout backup/bentobox-calendar-pre-integration
git checkout -b feature/contract-analysis-restored

# Option 2: Reset current branch (if backup exists)
git reset --hard backup/bentobox-calendar-pre-integration

# Option 3: Cherry-pick specific commits
git log --oneline  # Find commit before integration
git reset --hard <commit-hash>
```

### 5.3 Database/Storage Rollback

**If data corruption**:
- BentoBox uses `localStorage` for persistence
- Clear localStorage: `localStorage.removeItem('bentobox-calendar-storage')`
- Or restore from backup if available

---

## Step 6: Testing Checklist

### Pre-Integration Tests

- [ ] All existing calendar features work
- [ ] Week view displays correctly
- [ ] Template drag-and-drop works
- [ ] Pool system functions
- [ ] Library & Builder tabs work
- [ ] Responsive height works
- [ ] Borders are visible
- [ ] Colors match Fire palette

### Post-Integration Tests

- [ ] Feature flags work (can disable new features)
- [ ] Existing views still work with flags off
- [ ] New views work with flags on
- [ ] Color palette matches Fire design system
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Responsive design maintained
- [ ] Dark mode works
- [ ] Data persistence works
- [ ] Template system still functions

### Regression Tests

- [ ] Create template → Add to pool → Drag to calendar
- [ ] Edit scheduled encounter
- [ ] Delete encounter
- [ ] Switch between views
- [ ] Navigate dates
- [ ] Resize browser window
- [ ] Test on mobile viewport

---

## Step 7: Integration Phases

### Phase 1: Foundation (Week 1)
**Risk**: Low  
**Rollback**: Feature flags only

1. Set up feature flags
2. Create adapter layer
3. Add time format toggle
4. Test with flags disabled

### Phase 2: Views (Week 2)
**Risk**: Medium  
**Rollback**: Feature flags + code revert

1. Add Month view
2. Add Agenda view
3. Test view switching
4. Verify color compatibility

### Phase 3: Features (Week 3)
**Risk**: Medium  
**Rollback**: Feature flags + code revert

1. Add event resizing
2. Add staff filtering
3. Improve drag-and-drop
4. Test all interactions

### Phase 4: Polish (Week 4)
**Risk**: Low  
**Rollback**: Feature flags only

1. UI/UX improvements
2. Performance optimization
3. Documentation
4. Final testing

---

## Step 8: Monitoring & Alerts

### Error Tracking

**Add error boundaries**:
```typescript
// client/src/components/bentobox-calendar/ErrorBoundary.tsx
export class CalendarErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service
    console.error('Calendar Error:', error, errorInfo);
    // Auto-disable feature flags on critical errors
    if (error.message.includes('full-calendar')) {
      // Disable all full-calendar features
    }
  }
  
  render() {
    if (this.state.hasError) {
      return <FallbackCalendar />; // Use original BentoBoxGanttView
    }
    return this.props.children;
  }
}
```

### Performance Monitoring

**Track metrics**:
- Calendar render time
- View switch time
- Drag-and-drop performance
- Memory usage

---

## Step 9: Documentation Updates

### Update Files

1. **README.md**: Document new features
2. **BENTOBOX_REFERENCE.md**: Update with new views
3. **FULL_CALENDAR_INTEGRATION_ANALYSIS.md**: Keep as reference
4. **CHANGELOG.md**: Document changes

### User Documentation

- How to use new views
- How to resize events
- How to filter by staff
- How to toggle time format

---

## Step 10: Rollback Decision Tree

```
Issue Detected?
├─ Minor UI issue?
│  └─ Fix in place (no rollback needed)
│
├─ Feature not working?
│  └─ Disable feature flag
│     └─ Still broken?
│        └─ Code rollback (git)
│
├─ Data corruption?
│  └─ Clear localStorage
│     └─ Still corrupted?
│        └─ Full rollback (git + localStorage)
│
└─ Critical error?
   └─ Immediate rollback (git reset)
      └─ Investigate in isolation
```

---

## Emergency Contacts

**If critical issues arise**:
1. Disable all feature flags immediately
2. Revert to backup branch if needed
3. Document the issue
4. Create issue ticket

---

## Success Criteria

**Integration is successful when**:
- ✅ All existing features work
- ✅ New features work with flags enabled
- ✅ No color palette conflicts
- ✅ No performance degradation
- ✅ All tests pass
- ✅ Documentation updated
- ✅ No console errors
- ✅ Responsive design maintained

---

## Notes

- **Always test with feature flags disabled first**
- **Keep backup branch updated**
- **Document any color palette extensions**
- **Maintain Fire design system compliance**
- **Test on multiple viewport sizes**
- **Verify dark mode compatibility**

