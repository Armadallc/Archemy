# Calendar Integration - Next Session Todo List

**Date Created:** 2025-01-27  
**Session Status:** Paused - Ready to resume

---

## ✅ Completed Today

1. **Calendar Sidebar Integration** - Added CalendarSidebar to Trip Calendar
2. **Mini Calendar Syncing** - Synced mini calendar with main calendar date navigation
3. **Week View Time Column** - Added time column (6 AM - 10 PM) to Week view
4. **Day View Time Column** - Added time column to Day/Today view
5. **Header Modernization** - Updated calendar header to match EventCalendar styling

---

## 🎯 Priority 1: Available Drivers Section (Next Session)

### Immediate Tasks
1. **Add Available Drivers Section to Sidebar**
   - Collapsible section in CalendarSidebar
   - Show driver count (e.g., "3 Available Drivers")
   - Display driver first names only
   - Green circle indicators
   - Filter by currently displayed date
   - Background refresh functionality

2. **Hover Actions (Placeholder)**
   - Add "Contact" button (phone contact)
   - Add "Request" button (trip request - placeholder initially)
   - Implement hover interactions

3. **API Integration**
   - Create/find API endpoints for driver availability
   - Fetch available drivers by date
   - Real-time availability updates

---

## 🎯 Priority 2: Trip Creation Integration

4. **Filter Driver Dropdown**
   - Filter driver dropdown in trip creation form
   - Show only drivers available for selected trip date
   - Update when trip date changes

5. **Staged Trip Status**
   - Implement "staged" status for trips without driver
   - Await admin/driver confirmation
   - Update trip status workflow

---

## 🎯 Priority 3: Calendar Filtering System

### Core Filters
6. **Trip Status Filters**
   - Replace generic calendar list with Trip Status filters
   - Scheduled, In Progress, Completed, Cancelled, Confirmed
   - Color-coded checkboxes with visibility toggle

7. **Trip Type Filters**
   - One Way, Round Trip, Group Trips
   - Add to sidebar filter list

8. **Recurring Filter**
   - Recurring vs One-time trips
   - Toggle filter

9. **Frequent Locations Filter**
   - Service Location, Legal, Healthcare, DMV, Grocery, Other
   - Checkbox list with color indicators

### Role-Based Filters
10. **Super Admin Filters**
    - Organization, Program, Location, Trip Type, Trip Status, Client, Client Group, Recurring, Frequent Locations, Driver

11. **Corporate Admin Filters**
    - Program, Location, Trip Type, Trip Status, Client, Client Group, Recurring, Frequent Locations, Driver

12. **Program User Filters (Default)**
    - Location, Trip Type, Trip Status, Client, Client Group, Recurring, Frequent Locations, Driver
    - Customizable by Corporate Admin

13. **Driver Filters**
    - Organization, Program, Location, Trip Type, Trip Status, Client, Client Group, Recurring, Frequent Locations

### Date Filtering
14. **Date Range Filter**
    - Single date picker
    - Date range picker
    - Quick presets (Today, This Week, This Month, etc.)

---

## 🎯 Priority 4: Driver Availability Management (Future)

15. **Availability UI**
    - Calendar-based interface
    - "+ Add" button
    - Available/Block options
    - Time range selection
    - Repeat functionality
    - **Reference Images:** 
      - Calendar view showing availability blocks (green bars with "Available" and time ranges)
      - "Add Event" modal with Available/Block toggle, FROM/TO date/time pickers, Repeat checkbox
      - Month navigation with back/forward arrows and MONTH dropdown

16. **Repeat Logic**
    - Everyday (includes weekends)
    - Weekly (with end date or number of weeks)
    - Alternative: Week checkbox UI with "Copy to next" option

---

## 🎯 Priority 5: Broadcast System (Future)

17. **Broadcast Trip Requests**
    - Send to all available drivers
    - Urgency levels (High/Medium/Low)
    - Timeout with snooze (15-30 min intervals)
    - First-come-first-served acceptance
    - Status updates (staged → accepted)

---

## 🎯 Priority 6: Enhanced Features (Future MVP)

18. **Trip Status Workflow**
    - Requested/Staged → Scheduled/Confirmed → In Progress → Completed
    - Future: Pickup confirmation status
    - Cancelled and No-show statuses

19. **Month View Modernization**
    - Consider replacing with EventCalendar MonthView component
    - For consistency with Week/Day views

---

## 📸 Reference Images

### Driver Availability UI References
**Note:** These are reference images for driver availability screens - implementation doesn't need to match exactly, but should capture the key concepts.

1. **Calendar View with Availability:**
   - Month calendar grid showing dates
   - Green availability blocks spanning date ranges
   - Shows "Available" text with time ranges (e.g., "8:20 AM - 10:00 PM")
   - Single date availability (e.g., "Available 8:20 AM" on Nov 8)
   - Multi-day availability bar (Nov 9-15)
   - Selected date highlighted with blue circle
   - Header with "Back" button, "Add +" button, month/year display
   - Navigation arrows and MONTH dropdown

2. **Add Event Modal:**
   - Modal dialog titled "Add Event"
   - Event type selection: "Available" (blue border, green checkmark) vs "Block" (gray border, red X)
   - FROM section: Date picker and time picker
   - TO section: Date picker and time picker
   - "Repeat" checkbox option
   - Cancel and Add buttons at bottom

**Key Concepts to Capture:**
- Visual availability blocks on calendar
- Easy "+ Add" workflow
- Available vs Block distinction
- Date range selection (FROM/TO)
- Time range selection
- Repeat functionality

---

## 📝 Notes for Next Session

### Key Decisions Made
- **Naming Convention:** Trip Calendar (EnhancedTripCalendar) vs Event Calendar (EventCalendar components)
- **Approach:** Incremental integration of Event Calendar components into Trip Calendar
- **Filter Strategy:** Role-based filters with collapsible sections in sidebar

### Technical Considerations
- Background refresh for driver availability (user doesn't need to manually refresh)
- Real-time updates via WebSocket or polling
- First-come-first-served for broadcast requests (even 1ms difference matters)
- Driver availability editable by driver and super admin only

### Business Logic
- Drivers proactively set availability (no traditional shifts)
- Same-day trips not guaranteed - status visibility critical
- Broadcast timeout/urgency system with snooze functionality
- "Accepted" = "Scheduled/Confirmed" status

---

## 🔗 Related Documentation
- Calendar Migration Status: `docs/calendar/CALENDAR_MIGRATION_STATUS.md`
- Rollback Plan: `docs/calendar/ROLLBACK_QUICK_REFERENCE.md`
- Backup Files: `client/src/components/EnhancedTripCalendar.tsx.backup`

---

**Next Session Start:** Begin with Priority 1 - Available Drivers Section

