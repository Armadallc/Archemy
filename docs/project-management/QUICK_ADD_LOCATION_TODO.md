# TODO: Quick Add Location - Program Selection Requirement

## Status: Not Yet Implemented

## Issue Summary

**Current Behavior:**
- User can click "Quick Add" button before selecting a program/corporate client
- Console shows: `selectedProgram: null, selectedCorporateClient: null`
- Query is correctly disabled (`enabled: !!(selectedProgram || selectedCorporateClient)`)
- No frequent locations load (expected behavior, but UX is poor)

**Expected Behavior:**
- Quick Add button should be **disabled** until a program is selected
- User should see a helpful message when clicking Quick Add without program selection
- Frequent locations are isolated by **both** corporate client AND program
- Each program has its own unique set of frequent locations, regardless of how many residential program locations it has

## Root Cause Analysis

1. **Form Flow Issue:**
   - `QuickAddLocation` component is rendered in the form before program selection section
   - The component doesn't check if program is selected before allowing Quick Add interaction
   - Button is clickable but query won't run (correct), but user gets no feedback

2. **Hierarchy Context:**
   - `QuickAddLocation` uses `useHierarchy()` hook to get `selectedProgram` and `selectedCorporateClient`
   - For super admins, program selection happens via local state (`selectedProgramLocal`)
   - The hierarchy hook may not have the program until it's selected in the form

3. **Data Isolation:**
   - Frequent locations are **scoped to programs** (not just corporate clients)
   - Each program has unique frequent locations
   - Corporate client isolation is secondary (programs belong to corporate clients)

## Required Changes

### 1. Disable Quick Add Button Until Program Selected
- Check if `effectiveProgram` (from `SimpleBookingForm`) is available
- Disable Quick Add button when no program is selected
- Show tooltip/message: "Please select a program first"

### 2. Pass Program Context to QuickAddLocation
- `SimpleBookingForm` should pass `effectiveProgram` as a prop to `QuickAddLocation`
- Or ensure `useHierarchy()` correctly reflects the locally selected program

### 3. Improve UX
- Show loading state when program is selected but locations are loading
- Show helpful message: "Select a program to view frequent locations"
- Disable button with visual feedback (grayed out, cursor: not-allowed)

### 4. Form Flow Enforcement
- Ensure program selection is the first step in trip creation
- Consider moving program selection to the top of the form
- Add validation to prevent trip creation without program selection

## Implementation Notes

**File to Modify:**
- `client/src/components/booking/simple-booking-form.tsx` - Pass program context
- `client/src/components/booking/quick-add-location.tsx` - Add disabled state and prop

**Key Variables:**
- `effectiveProgram = selectedProgram || selectedProgramLocal` (from SimpleBookingForm line 46)
- `selectedProgram` and `selectedCorporateClient` from `useHierarchy()` hook

**Query Logic:**
- Current query correctly disables when no program/client: `enabled: !!(selectedProgram || selectedCorporateClient)`
- This is correct - we just need to disable the UI button and provide feedback

## Testing Checklist

- [ ] Quick Add button disabled when no program selected
- [ ] Tooltip/message shown when hovering/clicking disabled button
- [ ] Quick Add enabled after program selection
- [ ] Frequent locations load correctly for selected program
- [ ] Locations are isolated between programs (test with two programs)
- [ ] Locations are isolated between corporate clients (test with two clients)
- [ ] Works for super admin (local state selection)
- [ ] Works for corporate admin (hierarchy context)
- [ ] Works for program admin (hierarchy context)

## Priority

- **Medium Priority** - UX improvement, not blocking functionality
- Can be implemented after manual walkthrough testing is complete

---

*Created: November 5, 2025*
*Status: Deferred - Continue with manual walkthrough testing*






