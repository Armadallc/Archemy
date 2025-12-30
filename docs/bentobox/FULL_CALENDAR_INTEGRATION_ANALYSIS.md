# Full Calendar Integration Analysis

## Overview

This document analyzes the [full-calendar repository](https://github.com/yassir-jeraidi/full-calendar.git) and identifies opportunities to integrate its features into the BentoBox calendar system to enhance the "Stage & Calendar" and "Library & Builder" functionality.

## Current BentoBox Calendar Features

### Strengths
- **Template-Based Scheduling**: Unique atomic design system (atoms → molecules → templates)
- **Pool System**: Drag-and-drop templates from pool to calendar
- **Library & Builder**: Comprehensive template creation and management
- **Gantt-Style View**: Week view with time slots (6 AM - 10 PM)
- **Encounter-Specific Model**: Rich data model for healthcare/clinical encounters
- **Category-Based Colors**: Fire design system (coral, lime, ice, charcoal, silver)
- **Zustand State Management**: Persistent storage with localStorage

### Current Limitations
- Only 3 views: Day, Week, Month (Month view may be incomplete)
- No event resizing capability
- Limited drag-and-drop refinement
- No Agenda/Year views
- No time format toggle (12/24 hour)
- Basic event editing UI
- No user/staff filtering
- Responsive design needs improvement

## Full Calendar Repository Features

### Key Features (from repository)
1. **Multiple Views**: Day, Week, Month, Year, and Agenda views
2. **Event Management**: Create, edit, and delete events with rich UI
3. **Drag & Drop**: Move events between time slots and dates
4. **Event Resizing**: Resize events in day and week views with smooth animations
5. **User Management**: Multi-user support with user filtering
6. **Color Coding**: Events can be color-coded for better organization
7. **Responsive Design**: Works seamlessly across all device sizes
8. **Dark Mode**: Full dark mode support
9. **24/12 Hour Format**: Toggle between 24-hour and 12-hour time formats

### Architecture (from repository)
- **Context-Based State**: Uses React Context for state management
- **Component Structure**:
  - `calendar.tsx` - Main entry point
  - `contexts/calendar-context.tsx` - Core state management
  - `contexts/dnd-context.tsx` - Drag-and-drop provider
  - `header/calendar-header.tsx` - Navigation and filters
  - `views/` - View-specific components (Day, Week, Month, Year, Agenda)
  - `calendar-body.tsx` - Renders active view

## Integration Opportunities

### High Priority (High Value, Low Risk)

#### 1. **Additional Calendar Views**
**What**: Add Month, Year, and Agenda views from full-calendar
**Why**: Provides more ways to visualize and navigate scheduled encounters
**How**:
- Extract view components from full-calendar
- Adapt to use BentoBox's `ScheduledEncounter` type
- Integrate with existing `currentView` state
- Map encounter colors to full-calendar's color system

**Files to Create**:
- `client/src/components/bentobox-calendar/views/MonthView.tsx`
- `client/src/components/bentobox-calendar/views/YearView.tsx`
- `client/src/components/bentobox-calendar/views/AgendaView.tsx`

**Integration Points**:
- Update `BentoBoxGanttView.tsx` to conditionally render views
- Extend `currentView` type to include "year" | "agenda"
- Map `ScheduledEncounter` to full-calendar's event format

#### 2. **Event Resizing**
**What**: Allow users to resize encounters by dragging edges in day/week views
**Why**: Quick way to adjust encounter duration without opening edit dialog
**How**:
- Extract resize logic from full-calendar's day/week views
- Adapt to work with `updateScheduledEncounter` action
- Add visual feedback during resize
- Validate against template duration constraints

**Implementation**:
```typescript
// Add to BentoBoxGanttView.tsx
const handleResizeStart = (encounterId: string, edge: 'start' | 'end') => {
  // Track resize state
};

const handleResize = (encounterId: string, newTime: Date) => {
  // Update encounter time
  updateScheduledEncounter(encounterId, { 
    start: newTime, // or end based on edge
  });
};
```

#### 3. **Time Format Toggle**
**What**: Add 12/24 hour format toggle
**Why**: User preference for time display
**How**:
- Add `timeFormat: '12h' | '24h'` to store
- Update time slot rendering in `BentoBoxGanttView.tsx`
- Add toggle in calendar header

**Implementation**:
```typescript
// In store.ts
interface BentoBoxState {
  // ... existing
  timeFormat: '12h' | '24h';
}

// In BentoBoxGanttView.tsx
const formatTime = (hour: number) => {
  if (timeFormat === '24h') {
    return `${hour}:00`;
  }
  return hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
};
```

#### 4. **Improved Event Editing UI**
**What**: Better event editing dialogs/forms
**Why**: Current editing might be basic; full-calendar has polished UI
**How**:
- Extract event dialog components
- Adapt to BentoBox's encounter model
- Support template overrides
- Add validation

### Medium Priority (High Value, Medium Risk)

#### 5. **Enhanced Drag & Drop**
**What**: Improve current drag-and-drop with better visual feedback
**Why**: Current implementation works but could be more polished
**How**:
- Extract DnD context and utilities
- Add drop zones with visual feedback
- Improve drag preview
- Add snap-to-grid functionality

#### 6. **User/Staff Filtering**
**What**: Filter calendar by staff members
**Why**: Useful for viewing individual schedules
**How**:
- Add filter state to store
- Extract user filter component from full-calendar
- Filter `scheduledEncounters` by staff
- Add filter UI to header

**Implementation**:
```typescript
// In store.ts
interface BentoBoxState {
  // ... existing
  staffFilter: string[]; // Array of staff IDs
}

// Filter encounters
const filteredEncounters = scheduledEncounters.filter(encounter => {
  const template = getTemplateById(encounter.templateId);
  return template?.staff.some(s => staffFilter.includes(s.id));
});
```

#### 7. **Agenda View**
**What**: List view of all encounters in chronological order
**Why**: Great for seeing all encounters at a glance
**How**:
- Extract AgendaView component
- Sort encounters by start time
- Group by date
- Show encounter details in list format

### Low Priority (Nice to Have)

#### 8. **Year View**
**What**: Annual calendar view
**Why**: Long-term planning and overview
**How**:
- Extract YearView component
- Show encounter density per day
- Click to navigate to month/week view

#### 9. **Dark Mode Enhancements**
**What**: Improve dark mode support
**Why**: Full-calendar has comprehensive dark mode
**How**:
- Review dark mode implementation
- Ensure all BentoBox components support it
- Test color contrast

## Integration Strategy

### Phase 1: Foundation (Week 1-2)
1. **Add Time Format Toggle**
   - Low risk, high user value
   - Simple state addition
   - Quick win

2. **Extract View Components**
   - Study full-calendar's view implementations
   - Create adapter layer for BentoBox types
   - Test with existing data

### Phase 2: Core Features (Week 3-4)
3. **Implement Event Resizing**
   - Add resize handlers
   - Update store actions
   - Add visual feedback

4. **Add Agenda View**
   - Implement list view
   - Sort and group encounters
   - Add navigation

### Phase 3: Enhancements (Week 5-6)
5. **Add Month/Year Views**
   - Implement month view
   - Add year view
   - Improve navigation

6. **Staff Filtering**
   - Add filter state
   - Implement filter UI
   - Update view rendering

### Phase 4: Polish (Week 7-8)
7. **Improve Drag & Drop**
   - Enhance visual feedback
   - Add snap-to-grid
   - Improve drop zones

8. **Event Editing UI**
   - Improve dialogs
   - Add validation
   - Better UX

## Technical Considerations

### Data Model Compatibility

**Full Calendar Event Format**:
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: string;
  // ... other fields
}
```

**BentoBox ScheduledEncounter**:
```typescript
interface ScheduledEncounter extends CalendarEvent {
  templateId: string;
  templateVersion: number;
  isDuplicate: boolean;
  overrides?: {...};
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
}
```

**Compatibility**: ✅ `ScheduledEncounter` extends `CalendarEvent`, so it's compatible!

### State Management

**Full Calendar**: Uses React Context
**BentoBox**: Uses Zustand store

**Integration Approach**:
- Keep Zustand as primary store
- Use full-calendar components as presentational components
- Map Zustand state to component props
- Handle updates through Zustand actions

### Component Architecture

**Recommended Structure**:
```
client/src/components/bentobox-calendar/
├── views/
│   ├── DayView.tsx (from full-calendar)
│   ├── WeekView.tsx (current BentoBoxGanttView)
│   ├── MonthView.tsx (from full-calendar)
│   ├── YearView.tsx (from full-calendar)
│   └── AgendaView.tsx (from full-calendar)
├── adapters/
│   └── encounter-adapter.ts (maps ScheduledEncounter to CalendarEvent)
├── hooks/
│   └── useCalendarViews.ts (view switching logic)
└── BentoBoxGanttView.tsx (main view router)
```

## Risks and Mitigations

### Risk 1: Breaking Existing Functionality
**Mitigation**: 
- Create feature flags for new views
- Maintain backward compatibility
- Extensive testing of existing features

### Risk 2: Data Model Mismatches
**Mitigation**:
- Create adapter layer early
- Type-safe conversions
- Validate all data transformations

### Risk 3: Performance Issues
**Mitigation**:
- Lazy load view components
- Memoize expensive calculations
- Virtualize long lists in Agenda view

### Risk 4: UI/UX Inconsistencies
**Mitigation**:
- Maintain BentoBox design system
- Adapt full-calendar components to match
- Consistent color scheme

## Recommended Next Steps

1. **Clone and Study Full Calendar**
   ```bash
   git clone https://github.com/yassir-jeraidi/full-calendar.git
   cd full-calendar
   npm install
   npm run dev
   ```

2. **Identify Key Components to Extract**
   - Review view components
   - Identify reusable utilities
   - Note styling approach

3. **Create Integration Branch**
   ```bash
   git checkout -b feature/full-calendar-integration
   ```

4. **Start with Time Format Toggle** (Lowest risk, quick win)

5. **Gradually Add Views** (One at a time, test thoroughly)

## Conclusion

The full-calendar repository offers valuable features that would significantly enhance the BentoBox calendar:
- ✅ Multiple view options (Month, Year, Agenda)
- ✅ Event resizing capability
- ✅ Better drag-and-drop UX
- ✅ Time format preferences
- ✅ User filtering

The integration is **feasible** because:
- Data models are compatible (`ScheduledEncounter` extends `CalendarEvent`)
- Component-based architecture allows gradual integration
- Zustand store can work alongside full-calendar components
- BentoBox's unique features (templates, pool) remain intact

**Recommendation**: Proceed with phased integration, starting with low-risk, high-value features like time format toggle and additional views.




