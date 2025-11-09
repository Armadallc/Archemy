# TODO: Add New Location Feature

## Status: Not Implemented Yet

## Location
The "Add New Location" button in the QuickAddLocation component (`client/src/components/booking/quick-add-location.tsx`) opens a dialog but is not fully functional.

## Current State
- Button exists at: `#radix-\:rh9\: > div > div.py-6.text-center.text-sm > div > button`
- Dialog opens at: `#radix-\:rdq\:`
- Dialog component exists: `CreateLocationDialog` (lines 279-405 in `quick-add-location.tsx`)
- Form submission handler exists: `handleCreateLocation` (lines 147-153)
- Mutation exists: `createMutation` (lines 118-127)

## What Needs to be Done
1. Verify the dialog form is properly connected to the `handleCreateLocation` function
2. Ensure the form validation works correctly
3. Test the API endpoint `/api/frequent-locations` (POST) is working
4. Verify the location is created with correct `corporate_client_id` and `program_id`
5. Test that the new location appears in the frequent locations list after creation
6. Verify the address field is populated after location creation

## Priority
- **Low Priority** - Can be implemented later
- More important: Frequent locations loading is now fixed (route ordering issue resolved)

## Notes
- The CreateLocationDialog component appears to be complete but may need testing
- The mutation should invalidate the query cache after successful creation
- Need to ensure proper error handling and user feedback

---

*Created: November 4, 2025*
*Priority: Low - Can be addressed after core functionality is verified*

