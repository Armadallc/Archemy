# Driver Time Blocking - MVP Approach Summary

**Date:** 2025-01-27  
**Approach:** Self-Service Driver Time Blocking (No Admin Approval)

---

## 📋 Summary of Understanding

### Core Concept
- **Drivers** block their own time via mobile app (no approval needed)
- **Program Users** see blocked time when scheduling trips
- **System** automatically excludes blocked drivers from availability
- **Calendar Sidebar** "Available Drivers" section is **deferred** for now

### Workflow
1. Driver opens mobile app → Calendar/Schedule section
2. Driver selects date(s) or time window → Marks as "Blocked"
3. Blocked time syncs to backend immediately
4. Program User schedules trip → Sees which drivers are available (not blocked)
5. System filters out blocked drivers automatically

### Key Benefits
- ✅ Driver autonomy (no micromanagement)
- ✅ No admin intervention needed
- ✅ Real-time visibility for program users
- ✅ Simpler than approval workflow
- ✅ Works with existing infrastructure

---

## 🎯 Implementation Approach

### Phase 1: Database Schema (New Table)
**Create `driver_time_blocks` table:**
```sql
CREATE TABLE driver_time_blocks (
    id VARCHAR(50) PRIMARY KEY,
    driver_id VARCHAR(50) NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    program_id VARCHAR(50) NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,  -- Optional: NULL = all day block
    end_time TIME,    -- Optional: NULL = all day block
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern VARCHAR(20), -- 'weekly', 'daily', etc.
    recurring_end_date DATE,        -- When recurring pattern ends
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Why separate table?**
- Keeps `driver_schedules` for recurring weekly patterns (set by admin)
- `driver_time_blocks` for date-specific blocks (set by drivers)
- Clean separation of concerns
- Easy to query: "Is driver blocked on this date?"

### Phase 2: Backend API
**New endpoints in `server/routes/drivers.ts`:**
- `POST /api/drivers/time-blocks` - Create time block (driver only)
- `GET /api/drivers/time-blocks` - Get driver's time blocks
- `GET /api/drivers/time-blocks/:id` - Get specific block
- `PATCH /api/drivers/time-blocks/:id` - Update block
- `DELETE /api/drivers/time-blocks/:id` - Delete block
- `GET /api/drivers/available?date=YYYY-MM-DD&programId=xxx` - Get available drivers (excludes blocked)

**Storage methods in `server/driver-schedules-storage.ts`:**
- `createTimeBlock()` - Create new block
- `getTimeBlocksByDriver()` - Get driver's blocks
- `isDriverBlocked()` - Check if driver is blocked on specific date/time
- `getAvailableDriversByDate()` - Get available drivers (checks schedules + blocks)

### Phase 3: Mobile App (Future)
**New screen in mobile app:**
- Calendar view showing blocked dates
- "+ Block Time" button
- Date/time picker for blocking
- Recurring block option (every Sunday, etc.)
- List of existing blocks with ability to delete

### Phase 4: Web App Integration
**Trip scheduling form enhancement:**
- When Program User selects trip date → Filter driver dropdown
- Exclude drivers who have time blocks for that date
- Show visual indicator: "Driver unavailable on [date]"
- Real-time sync (no page refresh needed)

---

## 💡 Suggestions & Optimizations

### Suggestion 1: Hybrid Query Approach
**For calculating availability, check BOTH:**
1. `driver_schedules` - Recurring weekly pattern (day_of_week)
2. `driver_time_blocks` - Date-specific blocks

**Logic:**
```typescript
// Driver is available if:
// 1. Has recurring schedule for that day_of_week AND
// 2. No time block exists for that date
const isAvailable = hasRecurringSchedule && !hasTimeBlock;
```

### Suggestion 2: Use Existing `is_available` Flag
**Alternative approach (simpler):**
- Instead of new table, add date-specific fields to `driver_schedules`:
  - `specific_date DATE` (NULL = recurring, DATE = one-time)
  - `block_type VARCHAR(20)` ('available', 'block')

**Pros:**
- Single table, simpler queries
- Less schema changes

**Cons:**
- Mixes recurring and one-time in same table
- Less clear separation

**Recommendation:** New table is cleaner for long-term maintenance.

### Suggestion 3: MVP Scope Reduction
**For this session, focus on:**
1. ✅ Create `driver_time_blocks` table
2. ✅ Backend API endpoints
3. ✅ Storage methods
4. ✅ Update trip scheduling form to filter blocked drivers
5. ⏸️ Mobile app UI (defer to next session)
6. ⏸️ Calendar sidebar "Available Drivers" (defer as requested)

**Why this order?**
- Backend infrastructure first
- Web app integration provides immediate value
- Mobile app can be built later (drivers can use web app temporarily)

### Suggestion 4: Recurring Blocks Implementation
**For recurring blocks (every Sunday, etc.):**
- Store pattern in `recurring_pattern` field
- When querying, expand pattern to check all dates
- Example: `recurring_pattern = 'weekly'` + `start_date = '2025-11-10'` → blocks every Sunday from Nov 10 onward

**Alternative:** Store individual block records for each occurrence (simpler queries, more records)

---

## 🚀 Recommended Implementation Plan

### Step 1: Database Migration
- Create `driver_time_blocks` table
- Add indexes for performance

### Step 2: Backend Storage
- Add time block methods to `driver-schedules-storage.ts`
- Implement `getAvailableDriversByDate()` that checks both schedules and blocks

### Step 3: API Routes
- Add time block endpoints to `server/routes/drivers.ts`
- Add availability endpoint: `GET /api/drivers/available`

### Step 4: Trip Form Enhancement
- Update trip creation form to filter drivers by availability
- Show visual indicators for unavailable drivers

### Step 5: Testing
- Test time block creation
- Test availability calculation
- Test trip form filtering

---

## ❓ Questions for Clarification

1. **Recurring Blocks:**
   - Should recurring blocks be implemented in MVP, or just single-date blocks?

2. **Time Windows:**
   - Should blocks support time ranges (e.g., "Blocked 2 PM - 4 PM on Nov 10"), or just full-day blocks for MVP?

3. **Mobile App Priority:**
   - Should we build mobile app UI this session, or focus on backend + web app integration first?

4. **Calendar Sidebar:**
   - You mentioned bypassing it "for now" - should we remove it from the todo list, or just defer it?

---

## ✅ Next Steps

Once you confirm:
1. Proceed with database migration
2. Build backend API
3. Integrate with trip scheduling form
4. Test end-to-end workflow

**Estimated Time:** 2-3 hours for backend + web integration

