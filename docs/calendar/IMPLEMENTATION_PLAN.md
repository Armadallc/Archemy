# Driver Time Blocking & Calendar Sidebar - Implementation Plan

**Date:** 2025-01-27  
**Priority:** Calendar Sidebar First (with full understanding of availability system)

---

## 🎯 Overview

**Goal:** Implement driver time blocking system and calendar sidebar "Available Drivers" section.

**Approach:**
1. **Phase 1:** Build driver time blocking foundation (database + backend)
2. **Phase 2:** Implement calendar sidebar "Available Drivers" section (uses Phase 1)
3. **Phase 3:** Integrate availability filtering into trip scheduling form

**Key Requirements:**
- Recurring blocks (same day off each week)
- Time ranges with 30/60 minute increments
- Real-time availability calculation
- Background refresh (30s interval)

---

## 📋 Phase 1: Driver Time Blocking System (Foundation)

### Step 1.1: Database Migration
**File:** `migrations/0028_create_driver_time_blocks.sql`

**Schema:**
```sql
CREATE TABLE driver_time_blocks (
    id VARCHAR(50) PRIMARY KEY,
    driver_id VARCHAR(50) NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    program_id VARCHAR(50) NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,  -- NULL = all day block, otherwise specific time
    end_time TIME,    -- NULL = all day block, otherwise specific time
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern VARCHAR(20), -- 'weekly', 'daily'
    recurring_end_date DATE,        -- When recurring pattern ends
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_driver_time_blocks_driver_id ON driver_time_blocks(driver_id);
CREATE INDEX idx_driver_time_blocks_program_id ON driver_time_blocks(program_id);
CREATE INDEX idx_driver_time_blocks_dates ON driver_time_blocks(start_date, end_date);
CREATE INDEX idx_driver_time_blocks_recurring ON driver_time_blocks(is_recurring, recurring_pattern);
```

**Notes:**
- `start_time`/`end_time` NULL = full day block
- `is_recurring = true` + `recurring_pattern = 'weekly'` = same day each week
- `recurring_end_date` = when pattern stops

### Step 1.2: Storage Methods
**File:** `server/driver-schedules-storage.ts`

**Add interfaces:**
```typescript
export interface DriverTimeBlock {
  id: string;
  driver_id: string;
  program_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  start_time?: string; // HH:MM or null
  end_time?: string;   // HH:MM or null
  is_recurring: boolean;
  recurring_pattern?: 'weekly' | 'daily';
  recurring_end_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

**Add methods:**
1. `createTimeBlock(data: Omit<DriverTimeBlock, 'id' | 'created_at' | 'updated_at'>)`
2. `getTimeBlocksByDriver(driverId: string)`
3. `getTimeBlocksByDateRange(startDate: string, endDate: string, programId?: string)`
4. `isDriverBlocked(driverId: string, date: string, startTime?: string, endTime?: string)`
   - Checks if driver has block for specific date/time
   - Handles recurring patterns (expands weekly pattern)
   - Handles time ranges (checks overlap)
5. `getAvailableDriversByDate(date: string, programId?: string, startTime?: string, endTime?: string)`
   - Gets drivers with recurring schedule for that day_of_week
   - Excludes drivers with time blocks for that date
   - Returns: `{ driver_id, first_name, last_name, availability_start, availability_end }`

**Recurring Pattern Logic:**
```typescript
// For weekly recurring blocks:
// If is_recurring = true and recurring_pattern = 'weekly'
// Check if target date matches the day of week from start_date
// And target date is before recurring_end_date (if set)
const startDateDayOfWeek = new Date(block.start_date).getDay();
const targetDayOfWeek = new Date(targetDate).getDay();
const isRecurringMatch = startDateDayOfWeek === targetDayOfWeek;
const isBeforeEnd = !block.recurring_end_date || targetDate <= block.recurring_end_date;
```

**Time Range Overlap Logic:**
```typescript
// Check if requested time overlaps with blocked time
// If block has no time (full day), always blocked
// If block has time range, check overlap
const hasTimeOverlap = (blockStart, blockEnd, requestStart, requestEnd) => {
  if (!blockStart || !blockEnd) return true; // Full day block
  return (requestStart < blockEnd && requestEnd > blockStart);
};
```

### Step 1.3: API Endpoints
**File:** `server/routes/drivers.ts`

**Add routes:**
1. `POST /api/drivers/time-blocks`
   - Create time block (driver only - check role)
   - Body: `{ driver_id, program_id, start_date, end_date, start_time?, end_time?, is_recurring?, recurring_pattern?, recurring_end_date?, notes? }`
   - Validate: 30/60 minute increments for time ranges

2. `GET /api/drivers/time-blocks`
   - Get driver's time blocks (filtered by authenticated driver)
   - Query params: `?driverId=xxx` (optional, for admins)

3. `GET /api/drivers/time-blocks/:id`
   - Get specific time block

4. `PATCH /api/drivers/time-blocks/:id`
   - Update time block (driver only)

5. `DELETE /api/drivers/time-blocks/:id`
   - Delete time block (driver only)

6. `GET /api/drivers/available`
   - Get available drivers for date
   - Query params: `?date=YYYY-MM-DD&programId=xxx&startTime=HH:MM&endTime=HH:MM`
   - Returns: Array of available drivers with first names

**Time Validation:**
```typescript
// Validate 30/60 minute increments
const validateTimeIncrement = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return minutes === 0 || minutes === 30 || minutes === 60;
};
```

---

## 📋 Phase 2: Calendar Sidebar - Available Drivers Section

### Step 2.1: Create Hook
**File:** `client/src/hooks/useAvailableDrivers.tsx` (NEW)

```typescript
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { apiRequest } from '../lib/queryClient';
import { useHierarchy } from './useHierarchy';

export interface AvailableDriver {
  driver_id: string;
  first_name: string;
  last_name: string;
  availability_start?: string; // Time range start
  availability_end?: string;   // Time range end
}

export function useAvailableDrivers(date: Date, programId?: string) {
  const { selectedProgram } = useHierarchy();
  const effectiveProgramId = programId || selectedProgram;

  return useQuery({
    queryKey: ['available-drivers', format(date, 'yyyy-MM-dd'), effectiveProgramId],
    queryFn: async () => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const endpoint = `/api/drivers/available?date=${dateStr}${effectiveProgramId ? `&programId=${effectiveProgramId}` : ''}`;
      
      const response = await apiRequest('GET', endpoint);
      const data = await response.json();
      
      return data as AvailableDriver[];
    },
    enabled: !!date, // Only fetch if date is provided
    refetchInterval: 30000, // 30s background refresh
    staleTime: 25000, // Consider stale after 25s
  });
}
```

### Step 2.2: Update CalendarSidebar Component
**File:** `client/src/components/event-calendar/CalendarSidebar.tsx`

**Add imports:**
```typescript
import { ChevronDown, Users } from "lucide-react";
import { useAvailableDrivers } from "../../hooks/useAvailableDrivers";
```

**Add state:**
```typescript
const [isDriversExpanded, setIsDriversExpanded] = useState(true);
```

**Add hook:**
```typescript
const { data: availableDrivers = [], isLoading: driversLoading } = useAvailableDrivers(currentDate);
```

**Add section (after mini calendar, before calendars list):**
```typescript
{!isCollapsed && (
  <div className="p-4 border-b border-gray-700">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-medium text-gray-300">AVAILABLE DRIVERS</h3>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsDriversExpanded(!isDriversExpanded)}
        className="h-6 w-6 text-gray-400 hover:text-white"
      >
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${isDriversExpanded ? 'rotate-180' : ''}`} 
        />
      </Button>
    </div>
    
    {isDriversExpanded && (
      <>
        {driversLoading ? (
          <div className="text-xs text-gray-500">Loading...</div>
        ) : availableDrivers.length === 0 ? (
          <div className="text-xs text-gray-500">No drivers available</div>
        ) : (
          <>
            <div className="text-xs text-gray-400 mb-2">
              {availableDrivers.length} Available Driver{availableDrivers.length !== 1 ? 's' : ''}
            </div>
            <div className="space-y-2">
              {availableDrivers.map((driver) => (
                <div key={driver.driver_id} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                  <span className="text-sm text-gray-300 truncate">
                    {driver.first_name}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </>
    )}
  </div>
)}
```

**Styling notes:**
- Match existing sidebar dark theme (`bg-gray-900`, `text-gray-300`)
- Green circles: `bg-green-500` or `bg-emerald-500`
- Collapsible with smooth animation
- Truncate long names

---

## 📋 Phase 3: Trip Form Integration

### Step 3.1: Update Trip Form
**File:** `client/src/components/booking/simple-booking-form.tsx`

**Add import:**
```typescript
import { useAvailableDrivers } from "../../hooks/useAvailableDrivers";
```

**Add hook (after driver query):**
```typescript
// Get available drivers for selected trip date
const tripDate = formData.scheduledDate ? new Date(formData.scheduledDate) : null;
const { data: availableDriversForDate = [] } = useAvailableDrivers(
  tripDate || new Date(),
  effectiveProgram
);

// Filter drivers to only show available ones
const filteredDrivers = tripDate && formData.scheduledTime
  ? availableDriversForDate.map(d => d.driver_id)
  : null;

const displayDrivers = filteredDrivers
  ? drivers.filter((d: any) => filteredDrivers.includes(d.id))
  : drivers;
```

**Update driver Select (around line 779):**
```typescript
<Select 
  value={formData.driverId} 
  onValueChange={(value) => setFormData({ ...formData, driverId: value })}
>
  <SelectTrigger className="bg-white text-gray-900">
    <SelectValue placeholder="Select a driver or leave unassigned" />
  </SelectTrigger>
  <SelectContent className="bg-white text-gray-900 max-h-60 z-50">
    <SelectItem value="unassigned" className="text-gray-900 hover:bg-gray-100">
      No driver assigned
    </SelectItem>
    {displayDrivers.map((driver: any) => {
      const isAvailable = tripDate 
        ? availableDriversForDate.some(d => d.driver_id === driver.id)
        : true;
      
      return (
        <SelectItem 
          key={driver.id} 
          value={driver.id}
          className={`text-gray-900 hover:bg-gray-100 ${!isAvailable ? 'opacity-50' : ''}`}
          disabled={!isAvailable}
        >
          {driver.users?.user_name || 'Unknown'}
          {!isAvailable && tripDate && (
            <span className="text-xs text-gray-500 ml-2">(Unavailable)</span>
          )}
        </SelectItem>
      );
    })}
  </SelectContent>
</Select>
```

**Add helper text:**
```typescript
{tripDate && availableDriversForDate.length === 0 && (
  <p className="text-xs text-gray-500 mt-1">
    No drivers available on {format(tripDate, 'MMM d, yyyy')}
  </p>
)}
```

---

## 🧪 Testing Checklist

### Phase 1 Testing
- [ ] Create time block via API
- [ ] Get time blocks for driver
- [ ] Test recurring weekly pattern
- [ ] Test time range blocks (30/60 min increments)
- [ ] Test full-day blocks
- [ ] Verify `isDriverBlocked()` logic
- [ ] Verify `getAvailableDriversByDate()` excludes blocked drivers

### Phase 2 Testing
- [ ] Available Drivers section appears in sidebar
- [ ] Shows correct driver count for selected date
- [ ] Displays driver first names with green circles
- [ ] Updates when calendar date changes
- [ ] Background refresh works (30s interval)
- [ ] Collapsible functionality works
- [ ] Empty state displays correctly
- [ ] Loading state displays correctly

### Phase 3 Testing
- [ ] Trip form filters drivers by availability
- [ ] Unavailable drivers are disabled in dropdown
- [ ] Visual indicators show "(Unavailable)" text
- [ ] Works with date changes
- [ ] Works with time changes (if time filtering implemented)

---

## 📝 Implementation Order

**Recommended Sequence:**
1. **Database migration** (Step 1.1) - Foundation
2. **Storage methods** (Step 1.2) - Core logic
3. **API endpoints** (Step 1.3) - Backend complete
4. **Calendar sidebar** (Step 2.1 + 2.2) - User-facing feature
5. **Trip form integration** (Step 3.1) - Enhanced scheduling

**Why this order?**
- Backend first ensures availability calculation works
- Sidebar provides immediate value
- Trip form enhancement completes the workflow

---

## ⏱️ Estimated Time

- **Phase 1:** 1.5-2 hours (database + backend)
- **Phase 2:** 45-60 minutes (sidebar)
- **Phase 3:** 30-45 minutes (trip form)
- **Total:** 3-3.5 hours

---

## 🔄 Future Enhancements

- Mobile app UI for time blocking
- Admin schedule management page
- Time block notifications
- Calendar sidebar hover actions (Contact/Request)
- Advanced filtering (by time range, program, etc.)

---

**Ready to begin implementation?** Start with Phase 1, Step 1.1 (Database Migration).

