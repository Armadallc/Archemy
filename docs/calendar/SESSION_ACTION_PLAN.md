# Calendar Integration - Session Action Plan

**Date:** 2025-01-27  
**Focus:** Priority 1 - Available Drivers Section

---

## 🎯 Session Goal

Add "Available Drivers" section to the calendar sidebar that shows drivers available for the currently displayed date, with real-time updates.

---

## 📋 Step-by-Step Action Plan

### Phase 1: Backend API (15-20 min)
1. **Review existing driver availability infrastructure**
   - ✅ `driver_schedules` table exists
   - ✅ `driverSchedulesStorage` exists
   - ✅ `/api/drivers/schedules` endpoints exist
   - ⚠️ Need to check if there's a "get available drivers by date" endpoint

2. **Create/Verify API endpoint**
   - Check `server/routes/drivers.ts` for availability endpoints
   - If missing, create: `GET /api/drivers/available?date=YYYY-MM-DD`
   - Query should check driver schedules and availability blocks for the date
   - Return: `{ driver_id, first_name, availability_start, availability_end }`

### Phase 2: Frontend Hook (10-15 min)
3. **Create `useAvailableDrivers` hook**
   - Location: `client/src/hooks/useAvailableDrivers.tsx`
   - Accepts: `date: Date`
   - Returns: `{ drivers, isLoading, error }`
   - Uses React Query with background refresh (30s interval)
   - Filters by current calendar date

### Phase 3: UI Component (20-30 min)
4. **Add Available Drivers section to CalendarSidebar**
   - Location: `client/src/components/event-calendar/CalendarSidebar.tsx`
   - Add collapsible section below mini calendar
   - Show driver count: "3 Available Drivers"
   - List driver first names with green circle indicators
   - Use `useAvailableDrivers(currentDate)` hook
   - Add hover states (placeholder for Contact/Request buttons)

5. **Styling**
   - Match existing sidebar dark theme (`bg-gray-900`)
   - Green circles: `bg-green-500` or `bg-emerald-500`
   - Collapsible header with chevron icon
   - Empty state: "No drivers available"

### Phase 4: Testing (10 min)
6. **Verify functionality**
   - Test with different dates
   - Verify background refresh works
   - Test collapsed/expanded sidebar states
   - Check empty states

---

## 🔍 Key Files to Modify

1. **Backend:**
   - `server/routes/drivers.ts` - Add availability endpoint (if needed)
   - `server/driver-schedules-storage.ts` - Add availability query method (if needed)

2. **Frontend:**
   - `client/src/hooks/useAvailableDrivers.tsx` - **NEW FILE**
   - `client/src/components/event-calendar/CalendarSidebar.tsx` - Add section

---

## 📝 Implementation Notes

### Available Drivers Section Structure
```tsx
{!isCollapsed && (
  <div className="p-4 border-b border-gray-700">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-medium text-gray-300">AVAILABLE DRIVERS</h3>
      <Button variant="ghost" size="icon" onClick={toggleDrivers}>
        <ChevronDown className={isExpanded ? 'rotate-180' : ''} />
      </Button>
    </div>
    {isExpanded && (
      <>
        <div className="text-xs text-gray-400 mb-2">
          {drivers.length} Available Driver{drivers.length !== 1 ? 's' : ''}
        </div>
        {drivers.length === 0 ? (
          <div className="text-xs text-gray-500">No drivers available</div>
        ) : (
          <div className="space-y-2">
            {drivers.map(driver => (
              <div key={driver.id} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-300">{driver.first_name}</span>
              </div>
            ))}
          </div>
        )}
      </>
    )}
  </div>
)}
```

### API Response Format
```typescript
interface AvailableDriver {
  driver_id: string;
  first_name: string;
  last_name: string;
  availability_start?: string; // Time range start
  availability_end?: string;    // Time range end
}
```

---

## ✅ Success Criteria

- [ ] Available Drivers section appears in calendar sidebar
- [ ] Shows correct driver count for selected date
- [ ] Displays driver first names with green indicators
- [ ] Updates automatically when calendar date changes
- [ ] Background refresh works (30s interval)
- [ ] Collapsible functionality works
- [ ] Empty state displays correctly
- [ ] Styling matches sidebar theme

---

## 🚀 Next Steps After This

Once Available Drivers section is complete:
1. Add hover actions (Contact/Request buttons)
2. Filter driver dropdown in trip creation form
3. Implement driver availability management UI

---

**Estimated Time:** 45-60 minutes  
**Priority:** High (Foundation for trip scheduling features)

