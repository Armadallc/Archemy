# Driver Availability Analysis & Implementation Plan

**Date:** 2025-01-27  
**Purpose:** Review `driver_schedules` table structure and determine implementation approach

---

## 📊 Current Database Structure

### `driver_schedules` Table
```sql
CREATE TABLE driver_schedules (
    id VARCHAR(50) PRIMARY KEY,
    driver_id VARCHAR(50) NOT NULL REFERENCES drivers(id),
    program_id VARCHAR(50) NOT NULL REFERENCES programs(id),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
    start_time TIME NOT NULL,  -- HH:MM format
    end_time TIME NOT NULL,     -- HH:MM format
    is_available BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### `driver_duty_status` Table (Real-time Status)
```sql
CREATE TABLE driver_duty_status (
    id VARCHAR(50) PRIMARY KEY,
    driver_id VARCHAR(50) NOT NULL REFERENCES drivers(id),
    program_id VARCHAR(50) NOT NULL REFERENCES programs(id),
    status VARCHAR(20) CHECK (status IN ('off_duty', 'on_duty', 'on_trip', 'break', 'unavailable')),
    location JSONB,
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

---

## 🔍 Current Capabilities

### ✅ What We Have
1. **Recurring Weekly Schedules**
   - Drivers can set availability by day of week (Sunday=0, Monday=1, etc.)
   - Time ranges per day (start_time, end_time)
   - `is_available` flag to mark blocks as available/unavailable

2. **Existing Method**
   - `getAvailableDrivers(programId, date, startTime, endTime)` exists
   - Checks `day_of_week` for the given date
   - Requires specific time slot (startTime, endTime)
   - Returns drivers with matching schedules

3. **Real-time Status**
   - `driver_duty_status` table tracks current driver status
   - Can filter out drivers who are currently `unavailable` or `off_duty`

### ⚠️ Limitations
1. **No Date-Specific Availability**
   - Current structure only supports recurring weekly patterns
   - Cannot handle one-off availability changes (e.g., "Available Nov 10, but not Nov 17")
   - Cannot handle date ranges (e.g., "Available Nov 10-15")

2. **Time Slot Required**
   - Existing `getAvailableDrivers` requires specific start/end times
   - For calendar sidebar, we just need "available on this date" (any time)

3. **No "Block" Functionality**
   - Cannot mark specific dates as blocked
   - Only has `is_available` boolean per schedule entry

---

## 🎯 What We Can Do NOW (MVP Approach)

### Option 1: Use Existing Structure (Recommended for MVP)
**Approach:** Query by day of week for the selected calendar date

**Implementation:**
1. **New API Endpoint:** `GET /api/drivers/available?date=YYYY-MM-DD&programId=xxx`
   - Extract day of week from date (0-6)
   - Query `driver_schedules` where:
     - `day_of_week` = extracted day
     - `is_available` = true
     - `program_id` matches (or all programs if super admin)
   - Join with `drivers` and `users` to get first names
   - Optionally filter by `driver_duty_status` to exclude currently unavailable drivers

2. **Query Logic:**
   ```typescript
   // Get day of week for selected date
   const targetDate = new Date(date);
   const dayOfWeek = targetDate.getDay(); // 0=Sunday, 1=Monday, etc.
   
   // Query schedules
   const schedules = await supabase
     .from('driver_schedules')
     .select(`
       *,
       drivers:driver_id (
         id,
         users:user_id (
           user_name,
           email
         )
       )
     `)
     .eq('day_of_week', dayOfWeek)
     .eq('is_available', true)
     .eq('program_id', programId); // Or filter by hierarchy
   
   // Get unique drivers
   const availableDrivers = schedules
     .map(s => s.drivers)
     .filter((driver, index, self) => 
       index === self.findIndex(d => d.id === driver.id)
     );
   ```

3. **Pros:**
   - ✅ Uses existing infrastructure
   - ✅ No schema changes needed
   - ✅ Quick to implement
   - ✅ Works for recurring weekly patterns

4. **Cons:**
   - ❌ Cannot handle date-specific availability
   - ❌ Cannot handle one-off blocks
   - ❌ Shows all drivers with recurring schedule, even if they blocked that specific date

---

## 🚀 Future Enhancements (Post-MVP)

### Option 2: Date-Specific Availability Table
**New Table:** `driver_availability_blocks`
```sql
CREATE TABLE driver_availability_blocks (
    id VARCHAR(50) PRIMARY KEY,
    driver_id VARCHAR(50) NOT NULL REFERENCES drivers(id),
    program_id VARCHAR(50) NOT NULL REFERENCES programs(id),
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    type VARCHAR(20) CHECK (type IN ('available', 'block')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

**Benefits:**
- ✅ Date-specific availability
- ✅ Can override recurring schedules
- ✅ Supports "Available" and "Block" types
- ✅ Date ranges possible (multiple rows)

**Query Logic:**
1. Check `driver_availability_blocks` for specific date
2. If found, use those (override recurring)
3. If not found, fall back to `driver_schedules` by day of week

---

## 📋 Recommended Implementation Plan

### Phase 1: MVP (This Session)
**Use Option 1 - Existing Structure**

1. **Create New Storage Method:**
   ```typescript
   // In driver-schedules-storage.ts
   async getAvailableDriversByDate(programId: string, date: string) {
     const targetDate = new Date(date);
     const dayOfWeek = targetDate.getDay();
     
     // Query schedules for that day of week
     // Join with drivers and users
     // Return unique drivers with first names
   }
   ```

2. **Create API Endpoint:**
   ```typescript
   // In server/routes/drivers.ts
   router.get("/available", async (req, res) => {
     const { date, programId } = req.query;
     const drivers = await driverSchedulesStorage.getAvailableDriversByDate(
       programId, 
       date
     );
     res.json(drivers);
   });
   ```

3. **Frontend Hook:**
   ```typescript
   // client/src/hooks/useAvailableDrivers.tsx
   export function useAvailableDrivers(date: Date, programId?: string) {
     return useQuery({
       queryKey: ['available-drivers', date.toISOString().split('T')[0], programId],
       queryFn: async () => {
         const response = await apiRequest('GET', 
           `/api/drivers/available?date=${format(date, 'yyyy-MM-dd')}&programId=${programId}`
         );
         return response.json();
       },
       refetchInterval: 30000, // 30s background refresh
     });
   }
   ```

4. **UI Component:**
   - Add "Available Drivers" section to CalendarSidebar
   - Use `useAvailableDrivers(currentDate, selectedProgram)`
   - Display driver count and first names
   - Green circle indicators

### Phase 2: Future Enhancement
**Add Date-Specific Availability Table**
- Create migration for `driver_availability_blocks`
- Update query logic to check blocks first, then fall back to schedules
- Build UI for drivers to set date-specific availability (reference images)

---

## ✅ Summary: What We Can Do

### Immediate (MVP):
- ✅ Show drivers with recurring weekly schedules for selected date
- ✅ Filter by day of week
- ✅ Display in calendar sidebar
- ✅ Background refresh
- ✅ Works with existing infrastructure

### Limitations (Acceptable for MVP):
- ⚠️ Shows all drivers with recurring schedule (even if they blocked that specific date)
- ⚠️ Cannot handle one-off availability changes
- ⚠️ Cannot handle date ranges

### Future:
- 🔮 Date-specific availability table
- 🔮 "Block" functionality for specific dates
- 🔮 Override recurring schedules
- 🔮 Date range availability

---

## 🎯 Decision

**Recommendation:** Proceed with **Option 1 (MVP)** for this session.

**Rationale:**
1. Uses existing infrastructure
2. Quick to implement (45-60 min)
3. Provides immediate value
4. Can enhance later with date-specific table
5. Most drivers will have recurring schedules anyway

**Next Steps:**
1. Implement `getAvailableDriversByDate()` method
2. Create `/api/drivers/available` endpoint
3. Build frontend hook and UI component
4. Test and iterate

---

**Ready to proceed with MVP implementation?** ✅

