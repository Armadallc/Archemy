# Hierarchical Menu Architecture Reference

**Date:** 2025-01-27  
**Status:** Implementation Guide  
**Version:** 1.0

---

## Executive Summary

This document defines the hierarchical menu structure for the HALCYON NMT Transportation System. The menu system provides role-based navigation through the organizational hierarchy: Corporate Clients → Programs → Locations.

---

## Organizational Hierarchy

```
Corporate Clients
    ↓
Programs
    ↓
Locations
    ↓
Clients/Users/Resources
```

---

## Role-Based Menu Structures

### 1. Super Admin Menu

**Access Level:** Full system access to all corporate clients, programs, and locations.

**Menu Structure:**
```
[Toggle Button: "CORPORATE" or "Monarch > Competency" (breadcrumb path)]
  └─ Corporate Dashboard (if not at corporate level - click to return)
  └─ Corporate Clients (always visible when at corporate level)
      ├─ Monarch (hover → shows programs inline)
      │   ├─ Competency (hover → shows locations inline)
      │   ├─ Mental Health (hover → shows locations inline)
      │   ├─ Sober Living (hover → shows locations inline)
      │   └─ Launch (hover → shows locations inline)
      └─ Halcyon (hover → shows programs inline)
          └─ [Programs...]
```

**Behavior:**
- Toggle button shows current breadcrumb path (e.g., "CORPORATE", "Monarch", "Monarch > Competency")
- Always shows all corporate clients when at corporate level
- Hover-to-expand for programs and locations (inline expansion)
- Clicking corporate client navigates to client level
- Clicking program navigates to program level
- Clicking location navigates to location level
- Back button appears when not at corporate level

**Default Dashboard:** Corporate-level overview (all corporate clients stats, operations, etc.)

**URL Format:**
- Corporate Level: `/` or `/dashboard`
- Client Level: `/corporate-client/:corporateClientId`
- Program Level: `/corporate-client/:corporateClientId/program/:programId`
- Location Level: `/corporate-client/:corporateClientId/program/:programId/location/:locationId`

---

### 2. Corporate Admin Menu

**Access Level:** Access to all programs within their corporate client, and all locations within those programs.

**Menu Structure:**
```
[Toggle Button: "All Programs" or "Competency" (selected program)]
  └─ All Programs (if not at program level - click to return to program overview)
  └─ Programs (always visible - their corporate client's programs)
      ├─ Competency (hover → shows locations inline)
      ├─ Mental Health (hover → shows locations inline)
      ├─ Sober Living (hover → shows locations inline)
      └─ Launch (hover → shows locations inline)
```

**Behavior:**
- Toggle button shows "All Programs" (program overview) or selected program name
- Always shows all programs in their corporate client
- Hover-to-expand for locations (inline expansion)
- Clicking program navigates to program level
- Clicking location navigates to location level
- Back button appears when not at program overview level
- No corporate client level (they only have one)

**Default Dashboard:** Program-level overview (all programs stats, operations, etc.)

**URL Format:**
- Program Overview: `/corporate-client/:corporateClientId`
- Program Level: `/corporate-client/:corporateClientId/program/:programId`
- Location Level: `/corporate-client/:corporateClientId/program/:programId/location/:locationId`

---

### 3. Program Admin Menu

**Access Level:** Access to single program and all locations within that program.

**Menu Structure:**
```
[Toggle Button: "All Locations" or "Location Name"]
  └─ All Locations (if not at location level - click to return to program view)
  └─ Locations (always visible - all locations in program)
      ├─ Location 1 (clickable - navigate to location)
      ├─ Location 2 (clickable - navigate to location)
      └─ Location 3 (clickable - navigate to location)
```

**Behavior:**
- Toggle button shows "All Locations" (program level) or selected location name
- Always shows all locations in their program
- Clicking location navigates to location level
- "All Locations" option appears when at location level (to return to program view)
- No program switching (restricted to single program)
- No program header needed (already at program level)

**Default Dashboard:** Program-level overview (all locations stats, users, clients census)

**URL Format:**
- Program Level: `/corporate-client/:corporateClientId/program/:programId`
- Location Level: `/corporate-client/:corporateClientId/program/:programId/location/:locationId`

**Permissions:**
- Can access all locations within their program
- Can create program users
- Can administrate within allowable permissions across all program locations
- Administrative level staff, subordinate to corporate admins

---

### 4. Program User Menu

**Access Level:** Access to single program and permitted locations within that program.

**Menu Structure:**
```
[Toggle Button: "All Locations" or "Location Name"]
  └─ All Locations (if not at location level - click to return to program view)
  └─ Locations (always visible - permitted locations only)
      ├─ Location 1 (clickable - navigate if permitted)
      ├─ Location 2 (clickable - navigate if permitted)
      └─ [Location 3 hidden if no permission]
```

**Behavior:**
- Toggle button shows "All Locations" (program level) or selected location name
- Shows only permitted locations (filtered by permissions)
- Clicking location navigates to location level (if permitted)
- "All Locations" option appears when at location level (to return to program view)
- No program switching (restricted to single program)
- No program header needed (already at program level)

**Default Dashboard:** Program-level overview (permitted locations stats, clients, etc.)

**URL Format:**
- Program Level: `/corporate-client/:corporateClientId/program/:programId`
- Location Level: `/corporate-client/:corporateClientId/program/:programId/location/:locationId`

**Permissions:**
- Can access permitted locations within their program (at least 1)
- Cannot create users
- Cannot edit program accounts
- Cannot access billing
- Has restricted viewing permissions
- Can create trips, clients, client groups
- Can receive trip status updates
- Employee level staff, subordinate to program admins

---

### 5. Driver Menu

**Access Level:** No hierarchy navigation. Full-featured sidebar for web app tasks.

**Menu Structure:**
```
[NO DRILLDOWN MENU - Comprehensive Sidebar Navigation]
  └─ Dashboard (My Trips)
  └─ Profile
  └─ Schedule (Working Days/Hours)
  └─ Analytics (Hours, Trips, Miles with filtering)
  └─ Documents (Upload: License, Insurance, MVR, Certifications)
  └─ Onboarding
  └─ Notes (Trip Notes with Priority Flags) [Feature Flag]
  └─ Settings
```

**Behavior:**
- No hierarchy navigation menu (DrillDownDropdown not rendered)
- Simple sidebar navigation with all driver features
- Web app provides everything mobile app provides (fallback if mobile app has issues)
- Plus additional robust features for profile management, scheduling, analytics

**Default Dashboard:** My Trips (assigned trips view)

**URL Format:**
- Flat URLs (no hierarchy): `/dashboard`, `/profile`, `/schedule`, etc.

**Features:**
- **Trip Management:** Same as mobile app (view trips, update status, location tracking)
- **Profile Management:** Update driver profile and availability
- **Scheduling:** Working days/hours management
- **Analytics:** Hours worked per pay period, total trips, miles per pay period with filtering (all time, by month, by year)
- **Document Uploads:** License, Insurance, MVR, Certifications (AED, CPR, BLS, Narcan administration)
- **Onboarding:** Onboarding module accessible via web app
- **Trip Notes:** Community whiteboard feature with priority flags (low/medium/high/general)
  - Notes accessible to Program Admins, Corporate Admins, Drivers
  - Permission-based access (read/write/edit)
  - Feature flag: `TRIP_NOTES`

**Permissions:**
- View trips (assigned only)
- Update trip status
- Location tracking
- Mobile app access
- View notifications
- View calendar

---

## Implementation Details

### Component: `DrillDownDropdown`

**Location:** `client/src/components/DrillDownDropdown.tsx`

**Role-Based Rendering:**
```typescript
// Super Admin: Always show corporate clients
if (user?.role === 'super_admin') {
  // Show corporate clients → programs → locations
}
// Corporate Admin: Always show programs
else if (user?.role === 'corporate_admin') {
  // Show programs → locations
}
// Program Admin: Show single program → all locations
else if (user?.role === 'program_admin') {
  // Show program → all locations (no program switching)
}
// Program User: Show single program → permitted locations
else if (user?.role === 'program_user') {
  // Show program → permitted locations only (filtered by permissions)
}
// Driver: Don't render DrillDownDropdown at all
```

### Sidebar Integration

**Location:** `client/src/components/layout/sidebar.tsx`

**Unified Menu Implementation:**
- **Single Menu Element:** The `DrillDownDropdown` is the only hierarchical navigation menu in the sidebar
- **No Duplicate Components:** Removed the separate `Select` component that was duplicating functionality
- **Consolidated Navigation:** All hierarchy navigation is handled through the single `DrillDownDropdown` component

**Conditional Rendering:**
```typescript
{/* Hierarchical Navigation Menu - Single unified menu for all roles except driver */}
{!isCollapsed && (user?.role === 'super_admin' || 
  user?.role === 'corporate_admin' || 
  user?.role === 'program_admin' || 
  user?.role === 'program_user') && (
  <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--gray-7)', backgroundColor: 'var(--gray-1)' }}>
    <DrillDownDropdown />
  </div>
)}
```

**Menu Consolidation:**
- Previously, there were two separate clickable elements:
  1. `DrillDownDropdown` - Hierarchical navigation menu
  2. `Select` component - Program selector dropdown
- These have been merged into a single unified `DrillDownDropdown` menu
- The `Select` component and related code (`programOptions`, `handleProgramChange`, etc.) have been removed
- The single-program display section has also been removed, as `DrillDownDropdown` handles all cases

### Data Fetching

**Super Admin:**
- Fetch all corporate clients with programs attached
- Fetch programs for each corporate client on hover
- Fetch locations for each program on hover

**Corporate Admin:**
- Fetch all programs in their corporate client
- Fetch locations for each program on hover

**Program Admin:**
- Fetch their primary program (single program only)
- Fetch all locations in that program

**Program User:**
- Fetch their primary program (single program only)
- Fetch permitted locations (filtered by permissions)

**Driver:**
- No hierarchy data fetching needed

### Navigation Behavior

**Super Admin:**
- Clicking corporate client → Navigate to client level
- Clicking program → Navigate to program level
- Clicking location → Navigate to location level

**Corporate Admin:**
- Clicking program → Navigate to program level
- Clicking location → Navigate to location level

**Program Admin:**
- Clicking "All Locations" → Return to program level
- Clicking location → Navigate to location level

**Program User:**
- Clicking "All Locations" → Return to program level
- Clicking location → Navigate to location level (if permitted)

**Driver:**
- No hierarchy navigation

### Breadcrumb Paths

**Super Admin:**
- Corporate Level: "CORPORATE"
- Client Level: "Monarch"
- Program Level: "Monarch > Competency"
- Location Level: "Monarch > Competency > Location Name"

**Corporate Admin:**
- Program Overview: "All Programs"
- Program Level: "Competency"
- Location Level: "Competency > Location Name"

**Program Admin:**
- Program Level: "All Locations"
- Location Level: "Location Name"

**Program User:**
- Program Level: "All Locations"
- Location Level: "Location Name"

**Driver:**
- No breadcrumbs (no hierarchy)

---

## Key Design Principles

1. **Single Unified Menu:** One menu component (`DrillDownDropdown`) handles all hierarchical navigation - no duplicate or conflicting menu elements
2. **Always Show Full Hierarchy:** Menus always show the full accessible hierarchy, not conditional on current level
3. **Inline Expansion:** Use hover-to-expand for submenus (programs, locations)
4. **Role-Based Access:** Menu content adapts based on user role and permissions
5. **Single Program Restriction:** Program Admin/User cannot switch programs (restricted to single program)
6. **Permission Filtering:** Program User menu shows only permitted locations
7. **No Hierarchy for Drivers:** Drivers use simple sidebar navigation, no hierarchy menu

---

## Future Enhancements

### Driver Features (To Be Implemented)

1. **Trip Notes Feature** (Feature Flag: `TRIP_NOTES`)
   - Priority flags: low/medium/high/general (default)
   - Community whiteboard model
   - Permission-based access (read/write/edit)
   - Accessible to Program Admins, Corporate Admins, Drivers

2. **Analytics Dashboard**
   - Hours worked per pay period
   - Total trips
   - Miles per pay period
   - Filtering: all time, by month, by year

3. **Document Management**
   - Upload: License, Insurance, MVR, Certifications
   - Document status tracking
   - Expiration reminders

4. **Scheduling**
   - Working days/hours management
   - Availability calendar

---

## Testing Checklist

### Super Admin
- [ ] Menu shows all corporate clients
- [ ] Hover expands programs inline
- [ ] Hover expands locations inline
- [ ] Clicking corporate client navigates correctly
- [ ] Clicking program navigates correctly
- [ ] Clicking location navigates correctly
- [ ] URL updates correctly at each level
- [ ] Back button appears when not at corporate level

### Corporate Admin
- [ ] Menu shows all programs in their corporate client
- [ ] Hover expands locations inline
- [ ] Clicking program navigates correctly
- [ ] Clicking location navigates correctly
- [ ] URL updates correctly at each level
- [ ] Back button appears when not at program overview

### Program Admin
- [ ] Menu shows "All Locations" when at program level
- [ ] Menu shows location name when at location level
- [ ] Menu shows all locations in their program
- [ ] Clicking location navigates correctly
- [ ] Clicking "All Locations" returns to program view
- [ ] URL updates correctly
- [ ] No program switching available

### Program User
- [ ] Menu shows "All Locations" when at program level
- [ ] Menu shows location name when at location level
- [ ] Menu shows only permitted locations
- [ ] Hidden locations don't appear
- [ ] Clicking permitted location navigates correctly
- [ ] Clicking "All Locations" returns to program view
- [ ] URL updates correctly
- [ ] No program switching available

### Driver
- [ ] DrillDownDropdown is not rendered
- [ ] Sidebar shows all driver navigation items
- [ ] No hierarchy navigation available
- [ ] Flat URLs work correctly

---

---

## Implementation History

### Version 1.1 (2025-01-27)
- **Menu Consolidation:** Merged duplicate `Select` component into `DrillDownDropdown`
- **Removed Redundancy:** Eliminated two separate clickable menu elements that were causing user confusion
- **Unified Navigation:** Single `DrillDownDropdown` component now handles all hierarchical navigation
- **Code Cleanup:** Removed unused `Select` imports, `programOptions` state, and `handleProgramChange` function

### Version 1.0 (2025-01-27)
- Initial implementation with role-based menu structures
- Support for all roles: super_admin, corporate_admin, program_admin, program_user, driver
- Always-visible hierarchy display
- Inline hover-to-expand functionality

---

**Last Updated:** 2025-01-27  
**Version:** 1.1

