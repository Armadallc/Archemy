# TODO: Drivers Loading Fix

## Status: Deferred

## Issue Summary

**Current Behavior:**
- Drivers dropdown not loading for corporate admins when creating trips
- Console shows: `Drivers count: 0`, `Available drivers count: 0`
- Trip creation works without driver selection (driver can be assigned later)

**Expected Behavior:**
- Drivers should load for the selected program
- Drivers dropdown should populate with available drivers
- Driver logic should be flexible to allow trips without drivers (unassigned)

## Root Cause Analysis

1. **Query Enablement:**
   - Drivers query depends on `effectiveProgram` being set
   - Query is: `enabled: !!(effectiveProgram || effectiveCorporateClient)`
   - May need to check if query is running and what endpoint it's calling

2. **Driver Logic Flexibility:**
   - Current system allows unassigned drivers (good)
   - May need to make driver assignment more flexible
   - Consider allowing driver assignment after trip creation

## Required Changes

### 1. Investigate Drivers Query
- Check if drivers endpoint is correct for corporate admins
- Verify drivers query is enabled when program is selected
- Check if drivers exist for Halcyon program in database

### 2. Driver Assignment Flexibility
- Ensure trips can be created without drivers
- Allow driver assignment after trip creation
- Consider bulk driver assignment for multiple trips

### 3. UI Improvements
- Show "No drivers available" message when query returns empty
- Allow driver assignment from trip detail/edit page
- Consider driver assignment workflow improvements

## Implementation Notes

**Files to Review:**
- `client/src/components/booking/simple-booking-form.tsx` - Drivers query logic
- `server/routes/drivers.ts` - Drivers API endpoint
- `server/minimal-supabase.ts` - Drivers storage methods

**Key Variables:**
- `effectiveProgram` - Must be set for drivers to load
- `drivers` query at line 132-151 in simple-booking-form.tsx
- Endpoint: `/api/drivers/program/${effectiveProgram}`

## Testing Checklist

- [ ] Verify drivers query is enabled when program is selected
- [ ] Check if drivers endpoint returns data for Halcyon program
- [ ] Test trip creation without driver (should work)
- [ ] Test driver assignment after trip creation
- [ ] Verify drivers load for different programs
- [ ] Test driver assignment workflow

## Priority

- **Low Priority** - Trip creation works without drivers
- Can be implemented after core trip creation flow is verified
- Driver assignment can happen post-creation

---

*Created: November 5, 2025*
*Status: Deferred - Trip creation works without drivers*






