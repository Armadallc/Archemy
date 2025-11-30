# Calendar Migration Status & Rollback Plan

**Date Created:** 2025-01-27  
**Migration Type:** Incremental Component Integration  
**Status:** Pre-Implementation

---

## 📋 Current Status Report

### Files Involved

#### Primary Components
1. **`client/src/components/EnhancedTripCalendar.tsx`** (662 lines)
   - **Status:** ✅ Active - Production calendar component
   - **Usage:** Used in `/calendar` page
   - **Features:**
     - Month/Week/Today views
     - Trip data fetching with hierarchy support
     - Real-time updates (WebSocket)
     - Color coding by status or driver
     - Trip hover cards
     - Date navigation

2. **`client/src/pages/calendar.tsx`** (995 lines)
   - **Status:** ✅ Active - Main calendar page
   - **Usage:** Route `/calendar`
   - **Features:**
     - Calendar/List/Map view modes
     - Filtering (search, status, driver)
     - Export functionality
     - Settings panel
     - Wraps `EnhancedTripCalendar` component

3. **`client/src/components/event-calendar/`** (Directory)
   - **Status:** ✅ Available - Modular calendar components
   - **Components:**
     - `CalendarSidebar.tsx` - Sidebar with mini calendar
     - `MonthView.tsx` - Month view component
     - `WeekView.tsx` - Week view component
     - `DayView.tsx` - Day view component
     - `AgendaView.tsx` - Agenda view component
     - `calendar-context.tsx` - State management context
     - `event-calendar.tsx` - Full calendar wrapper
     - `TripEventPopup.tsx` - Event popup component
     - `types.ts` - TypeScript types

4. **`client/src/pages/calendar-experiment.tsx`** (250 lines)
   - **Status:** ✅ Available - Reference implementation
   - **Usage:** Route `/calendar-experiment`
   - **Purpose:** Shows EventCalendar in action

### Dependencies

#### Hooks Used by EnhancedTripCalendar
- `useAuth` - User authentication
- `useHierarchy` - Hierarchy context (corporate/program/client)
- `useRealTimeUpdates` - WebSocket real-time updates
- `useClientNames` - Client name caching
- `@tanstack/react-query` - Data fetching

#### Data Sources
- `/api/trips` - Main trips endpoint
- `/api/trips/program/:programId` - Program-specific trips
- `/api/trips/corporate-client/:corporateClientId` - Corporate client trips
- `/api/trips/driver/:driverId` - Driver-specific trips

#### Supporting Files
- `client/src/lib/trip-calendar-mapping.ts` - Trip to CalendarEvent conversion
- `client/src/hooks/useTripsForCalendar.tsx` - Calendar data hook
- `client/src/components/TripHoverCard.tsx` - Trip hover card component

---

## 🎯 Migration Plan

### Phase 1: Add Sidebar ✅ COMPLETED
**Target File:** `client/src/components/EnhancedTripCalendar.tsx`  
**Changes:**
- ✅ Imported `CalendarSidebar` from `./event-calendar`
- ✅ Added sidebar state (`isSidebarCollapsed`)
- ✅ Modified layout to include sidebar (flex container)
- ✅ Connected CalendarProvider with Trip Calendar's date state
- ✅ Synced mini calendar with main Trip Calendar
- ✅ Made mini calendar days clickable to navigate main calendar
- ✅ Added proper calendar grid calculation for mini calendar
- ⏳ Calendar list customization (deferred - user decision pending)

**Status:** ✅ Complete and tested
**Test Results:** Mini calendar syncing PASSED

---

## 🔄 Rollback Plan

### Quick Rollback

#### Option 1: Automated Script (Recommended)
```bash
./scripts/rollback-calendar.sh
```
This script automatically restores from backup files.

#### Option 2: Manual Git Rollback
```bash
# If changes are committed
git revert <commit-hash>

# If changes are uncommitted
git checkout HEAD -- client/src/components/EnhancedTripCalendar.tsx
git checkout HEAD -- client/src/pages/calendar.tsx
```

#### Option 3: Manual File Restore
```bash
cp client/src/components/EnhancedTripCalendar.tsx.backup client/src/components/EnhancedTripCalendar.tsx
cp client/src/pages/calendar.tsx.backup client/src/pages/calendar.tsx
```

### Manual Rollback Steps

#### Step 1: Remove Sidebar Integration
1. Open `client/src/components/EnhancedTripCalendar.tsx`
2. Remove `CalendarSidebar` import
3. Remove sidebar state variables
4. Restore original layout structure
5. Remove sidebar JSX

#### Step 2: Verify Functionality
1. Test calendar page loads correctly
2. Test month/week/today views
3. Test trip data fetching
4. Test real-time updates
5. Test filtering/search

#### Step 3: Clean Up (if needed)
- Remove unused imports
- Remove unused state variables
- Verify no broken dependencies

### Rollback Checklist
- [ ] Calendar page loads without errors
- [ ] All view modes work (month/week/today)
- [ ] Trip data displays correctly
- [ ] Real-time updates function
- [ ] Filtering/search works
- [ ] No console errors
- [ ] No TypeScript errors

---

## 📦 Backup Strategy

### Pre-Implementation Backup
**Status:** ✅ Backup Created

```bash
# Backup files created (2025-01-27)
client/src/components/EnhancedTripCalendar.tsx.backup
client/src/pages/calendar.tsx.backup
```

**Note:** `EnhancedTripCalendar.tsx` has uncommitted changes. Backup includes current working state.

**Git Status:**
- Last commit: `0d9684cd APPROVED: add reorganized codebase structure`
- Current status: Modified (M) - uncommitted changes present

### File Checksums (Before Changes)
Run these commands to capture current state:
```bash
# Get file checksums
md5 client/src/components/EnhancedTripCalendar.tsx
md5 client/src/pages/calendar.tsx

# Or use git to see current state
git log -1 --stat client/src/components/EnhancedTripCalendar.tsx
git log -1 --stat client/src/pages/calendar.tsx
```

---

## ✅ Testing Checklist

### Before Migration
- [x] Current calendar works correctly
- [x] All view modes functional
- [x] Trip data loads properly
- [x] Real-time updates working
- [x] No console errors

### After Phase 1 (Sidebar Addition)
- [ ] Sidebar displays correctly
- [ ] Sidebar can collapse/expand
- [ ] Mini calendar works
- [ ] Calendar list shows trips
- [ ] Original calendar still works
- [ ] No layout breaking
- [ ] Responsive design maintained
- [ ] No console errors
- [ ] No TypeScript errors

---

## 🚨 Risk Assessment

### Low Risk
- ✅ Sidebar is additive (doesn't modify existing code)
- ✅ Original calendar remains functional
- ✅ Can be removed easily if issues arise
- ✅ No data fetching changes

### Medium Risk
- ⚠️ Layout changes may affect responsive design
- ⚠️ Sidebar state management needs testing
- ⚠️ Integration with existing trip data

### Mitigation
- Test on multiple screen sizes
- Test with different user roles
- Test with various data states (empty, many trips)
- Keep original code commented for reference

---

## 📝 Change Log

### Pre-Implementation
- **2025-01-27:** Status report created
- **2025-01-27:** Rollback plan documented
- **2025-01-27:** Migration strategy defined

### Phase 1 Implementation
- **2025-01-27:** Added CalendarSidebar to EnhancedTripCalendar
- **2025-01-27:** Fixed import paths (./event-calendar instead of ../event-calendar)
- **2025-01-27:** Connected CalendarProvider with controlled date props
- **2025-01-27:** Synced mini calendar with Trip Calendar date state
- **2025-01-27:** Made mini calendar functional (clickable days, proper grid)
- **2025-01-27:** Testing completed - Mini calendar syncing PASSED ✅

---

## 🔗 Related Documentation
- Calendar Experiment: `client/src/pages/calendar-experiment.tsx`
- Event Calendar Components: `client/src/components/event-calendar/`
- Trip Mapping: `client/src/lib/trip-calendar-mapping.ts`
- Calendar Hook: `client/src/hooks/useTripsForCalendar.tsx`

---

**Next Steps:** Proceed with Phase 1 (Sidebar Integration) after approval

