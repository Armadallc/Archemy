# Frequent Locations Testing Checklist
## Hierarchy-Based Filtering & Quick Add Integration

This document provides a comprehensive testing checklist for the frequent locations hierarchy filtering system and Quick Add functionality in trip creation.

---

## 📋 TABLE OF CONTENTS

1. [Pre-Testing Setup](#pre-testing-setup)
2. [Phase 1: Hierarchy-Based Filtering](#phase-1-hierarchy-based-filtering)
3. [Phase 2: Quick Add in Trip Creation](#phase-2-quick-add-in-trip-creation)
4. [Cross-Feature Integration](#cross-feature-integration)
5. [Error Handling & Edge Cases](#error-handling--edge-cases)

---

## 🚀 PRE-TESTING SETUP

### Prerequisites Checklist

- [ ] Test users with different roles are created:
  - Super Admin
  - Corporate Admin (assigned to a corporate client)
  - Program Admin (assigned to one or more programs)
  - Program User (assigned to a location)
- [ ] Test data exists:
  - Multiple corporate clients
  - Multiple programs (some within same corporate client, some in different)
  - Multiple locations per program
  - Frequent locations assigned to different programs/locations
  - Frequent locations with different location types (service_location, legal, healthcare, dmv, grocery, other)
- [ ] API server is running and accessible
- [ ] Frontend development server is running

### Test Data Requirements

- **Corporate Clients**: At least 2 (e.g., "Monarch", "Halcyon")
- **Programs**: At least 3-4 programs across different corporate clients
- **Locations**: At least 2-3 locations per program
- **Frequent Locations**: 
  - At least 2-3 locations per location type
  - Locations assigned to different programs
  - Some locations with same name but different programs (to test isolation)
  - Mix of active and inactive locations

---

## 📍 PHASE 1: HIERARCHY-BASED FILTERING

### Super Admin Filtering

#### Corporate Client Filter
- [ ] **Corporate Client dropdown appears** for super admin
- [ ] **"All Corporate Clients" option** shows all locations when selected
- [ ] **Selecting a corporate client** filters locations to that corporate client only
- [ ] **Corporate client selection** enables Program dropdown
- [ ] **Changing corporate client** resets Program and Location filters

#### Program Filter
- [ ] **Program dropdown appears** after corporate client selection (or shows all programs if no corporate client selected)
- [ ] **"All Programs" option** shows all locations for selected corporate client
- [ ] **Selecting a program** filters locations to that program only
- [ ] **Program selection** enables Location dropdown
- [ ] **Changing program** resets Location filter

#### Location Filter
- [ ] **Location dropdown appears** after program selection (or shows all locations if no program selected)
- [ ] **"All Locations" option** shows all locations for selected program
- [ ] **Selecting a location** filters locations to that location only
- [ ] **Location filter works correctly** with other filters

#### Data Isolation
- [ ] **Locations from different corporate clients** are properly isolated
- [ ] **Locations from different programs** are properly isolated
- [ ] **Locations from different locations** are properly isolated
- [ ] **Search works across filtered results** only

### Corporate Admin Filtering

#### Auto-Scoping
- [ ] **Corporate Client filter is auto-set** to their corporate client (not visible/editable)
- [ ] **Cannot see locations** from other corporate clients
- [ ] **Program dropdown shows** only programs from their corporate client
- [ ] **Location dropdown shows** only locations from their corporate client's programs

#### Program Filter
- [ ] **Can filter by program** within their corporate client
- [ ] **"All Programs" option** shows all locations from their corporate client
- [ ] **Selecting a program** filters correctly

#### Location Filter
- [ ] **Can filter by location** within their corporate client
- [ ] **Location filter works** with program filter

### Program Admin Filtering

#### Auto-Scoping
- [ ] **Program filter is auto-set** to their authorized programs
- [ ] **Cannot see locations** from unauthorized programs
- [ ] **If multiple authorized programs**, can filter by specific program
- [ ] **Location dropdown shows** only locations from their authorized programs

#### Program Filter
- [ ] **Can filter by specific authorized program** (if multiple)
- [ ] **"All Programs" option** shows locations from all authorized programs
- [ ] **Cannot select unauthorized programs**

#### Location Filter
- [ ] **Can filter by location** within authorized programs
- [ ] **Location filter works** correctly

### Program User Filtering

#### Auto-Scoping
- [ ] **Location filter is auto-set** to their assigned location
- [ ] **Cannot see locations** from other locations
- [ ] **Corporate Client and Program filters** are not visible
- [ ] **Only sees locations** assigned to their location

### Location Type Filter

- [ ] **"Location Type" dropdown** appears for all roles
- [ ] **"All Location Types" option** shows all location types
- [ ] **Selecting a location type** filters correctly
- [ ] **Location type filter works** with hierarchy filters
- [ ] **Location type filter works** with search

### Search Functionality

- [ ] **Search input** is visible and functional
- [ ] **Search filters by name, address, description**
- [ ] **Search works** with all hierarchy filters
- [ ] **Search works** with location type filter
- [ ] **Search is debounced** (500ms delay)
- [ ] **Search clears** when filters change
- [ ] **Empty search results** show appropriate message

### Clear Filters

- [ ] **Clear button** resets all filters
- [ ] **After clearing**, shows all locations user has access to
- [ ] **Search term** is cleared
- [ ] **Location type** resets to "All Location Types"

### Display & Organization

- [ ] **Locations are organized by location type** (Service Location, Legal, Healthcare, DMV, Grocery, Other)
- [ ] **Each location type section** shows count badge
- [ ] **Location type headers** are visible and styled correctly
- [ ] **Locations within each type** are displayed correctly
- [ ] **Icons match location types** correctly
- [ ] **Location cards show** name, address, description (if available)
- [ ] **Active/Inactive status** is displayed correctly

---

## 🚗 PHASE 2: QUICK ADD IN TRIP CREATION

### Quick Add Button & Popover

#### Button Visibility
- [ ] **Quick Add button** appears next to pickup address input
- [ ] **Quick Add button** appears next to dropoff address input
- [ ] **Both buttons** use the same data source
- [ ] **Button is enabled** when hierarchy context is available

#### Popover Display
- [ ] **Clicking Quick Add** opens popover with frequent locations
- [ ] **Popover shows search input** at top
- [ ] **Locations are organized by location type** (same as frequent locations page)
- [ ] **Each location type section** shows icon, label, and count
- [ ] **Location items show** name and address
- [ ] **Popover is scrollable** (max-height: 500px)
- [ ] **Popover width** is appropriate (w-96)

### Hierarchy-Based Data Loading

#### Super Admin
- [ ] **Shows all locations** when no hierarchy context selected
- [ ] **Filters by selected corporate client** if selected
- [ ] **Filters by selected program** if selected
- [ ] **Filters by selected location** if selected

#### Corporate Admin
- [ ] **Auto-scoped to their corporate client**
- [ ] **Shows locations** from their corporate client's programs
- [ ] **Respects program selection** if available

#### Program Admin
- [ ] **Auto-scoped to their authorized programs**
- [ ] **Shows locations** from authorized programs only
- [ ] **Respects program selection** if filtering by specific program

#### Program User
- [ ] **Auto-scoped to their assigned location**
- [ ] **Shows only locations** assigned to their location

### Location Selection

- [ ] **Clicking a location** fills the address input
- [ ] **Popover closes** after selection
- [ ] **Search term clears** after selection
- [ ] **Usage count increments** when location is selected
- [ ] **Both pickup and dropoff** can use same location

### Search in Quick Add

- [ ] **Search input** filters locations in real-time
- [ ] **Search works across all location types**
- [ ] **Search filters by name, address, description**
- [ ] **Search is debounced** appropriately
- [ ] **Empty search results** show "Add New Location" option

### Create New Location (+ Button)

#### Button Functionality
- [ ] **"+" button** appears next to Quick Add button
- [ ] **Clicking "+"** opens create location dialog
- [ ] **Dialog is properly controlled** (opens/closes correctly)

#### Create Dialog Form
- [ ] **Name field** is required and visible
- [ ] **Location Type dropdown** shows all types
- [ ] **Description field** is optional
- [ ] **Street Address field** is required
- [ ] **City field** is required
- [ ] **State field** is required
- [ ] **ZIP Code field** is optional
- [ ] **Cancel button** closes dialog without saving
- [ ] **Add Location button** submits form

#### Address Pre-filling
- [ ] **If address is entered in input**, it attempts to parse and pre-fill form
- [ ] **Address parsing** handles common formats:
  - "123 Main St, City, State ZIP"
  - "123 Main St, City, State"
  - "123 Main St"
- [ ] **Pre-filled fields** can be edited

#### Hierarchy Auto-Assignment
- [ ] **Corporate Client ID** is auto-assigned from trip context
- [ ] **Program ID** is auto-assigned from trip context
- [ ] **Location ID** is auto-assigned for program users
- [ ] **New location** appears in Quick Add list after creation
- [ ] **New location** appears on frequent locations page after creation

#### Form Validation
- [ ] **Required fields** show validation errors if empty
- [ ] **Form submission** only works with valid data
- [ ] **Error messages** are displayed appropriately
- [ ] **Success toast** appears after creation

### API Integration

- [ ] **Uses `/api/locations/frequent/by-tag` endpoint**
- [ ] **Query parameters** include hierarchy filters correctly
- [ ] **Query is disabled** when no hierarchy context available
- [ ] **Loading state** is displayed while fetching
- [ ] **Error state** is handled gracefully
- [ ] **Query invalidates** after creating new location

---

## 🔗 CROSS-FEATURE INTEGRATION

### Consistency Between Pages

- [ ] **Same location types** appear in both frequent locations page and Quick Add
- [ ] **Same organization** (by location type) in both places
- [ ] **Same icons and styling** for location types
- [ ] **Same hierarchy filtering logic** in both places

### Data Synchronization

- [ ] **Creating location in Quick Add** appears on frequent locations page
- [ ] **Creating location on frequent locations page** appears in Quick Add
- [ ] **Editing location** updates in both places
- [ ] **Deleting/deactivating location** removes from both places
- [ ] **Usage count increments** are reflected in both places

### Hierarchy Context Sharing

- [ ] **Hierarchy selection in frequent locations page** doesn't affect trip creation
- [ ] **Hierarchy selection in trip creation** doesn't affect frequent locations page
- [ ] **Both use same role-based scoping logic**
- [ ] **Both respect user's role and assignments**

---

## ❌ ERROR HANDLING & EDGE CASES

### Network Errors

- [ ] **API failure** shows appropriate error message
- [ ] **Network timeout** is handled gracefully
- [ ] **Retry logic** works correctly (if implemented)

### Empty States

- [ ] **No locations available** shows helpful message
- [ ] **No locations match filters** shows appropriate message
- [ ] **No locations match search** shows "Add New Location" option

### Permission Errors

- [ ] **Unauthorized access attempt** shows appropriate error
- [ ] **403 errors** are handled gracefully
- [ ] **User sees only** locations they have access to

### Data Edge Cases

- [ ] **Location with missing fields** displays correctly
- [ ] **Very long location names** don't break layout
- [ ] **Very long addresses** are truncated appropriately
- [ ] **Special characters in names/addresses** are handled correctly
- [ ] **Locations with same name** in different programs are distinguished

### Form Edge Cases

- [ ] **Creating location with duplicate address** is handled (if validation exists)
- [ ] **Invalid address format** shows validation error
- [ ] **Missing required fields** prevents submission
- [ ] **Form state persists** if dialog is closed and reopened

### Filter Edge Cases

- [ ] **Rapid filter changes** don't cause race conditions
- [ ] **Filter combinations** that return no results show appropriate message
- [ ] **Clearing filters** when search is active works correctly
- [ ] **Changing hierarchy context** updates filters appropriately

---

## ✅ TESTING COMPLETION CHECKLIST

### Phase 1 Verification

- [ ] All hierarchy filters work for all user roles
- [ ] Data isolation is correct for all roles
- [ ] Search and location type filters work correctly
- [ ] Display organization is correct
- [ ] Clear filters works correctly

### Phase 2 Verification

- [ ] Quick Add popover displays correctly
- [ ] Location selection works for both pickup and dropoff
- [ ] Create location dialog works correctly
- [ ] Address pre-filling works
- [ ] Hierarchy auto-assignment works
- [ ] API integration is correct

### Integration Verification

- [ ] Both features work together correctly
- [ ] Data synchronization works
- [ ] No conflicts between features

### Error Handling Verification

- [ ] All error cases are handled
- [ ] User-friendly error messages are shown
- [ ] Edge cases don't break functionality

---

## 🎯 TESTING PRIORITIES

### High Priority (Must Test Before Production)

1. **Super Admin filtering** - Core functionality
2. **Role-based data isolation** - Security critical
3. **Quick Add location selection** - Core user workflow
4. **Create location from Quick Add** - Core user workflow
5. **Hierarchy auto-assignment** - Data integrity

### Medium Priority (Should Test Before Production)

1. **Search functionality** - User experience
2. **Location type organization** - User experience
3. **Filter combinations** - Edge cases
4. **Empty states** - User experience

### Low Priority (Can Test After Initial Release)

1. **Performance with large datasets**
2. **Rapid filter changes**
3. **Special character handling**
4. **Very long text handling**

---

## 📝 TESTING NOTES

### Test User Accounts

- **Super Admin**: `admin@monarch.com` (or similar)
- **Corporate Admin**: `corpadmin@monarch.com` (assigned to Monarch)
- **Program Admin**: `progadmin@monarch.com` (assigned to Monarch Competency)
- **Program User**: `proguser@monarch.com` (assigned to specific location)

### Test Data Setup

Ensure test data includes:
- Locations across multiple location types
- Locations in different programs
- Locations in different corporate clients
- Mix of active/inactive locations
- Locations with and without descriptions

### Common Issues to Watch For

1. **Query not enabled** - Check hierarchy context availability
2. **Empty results** - Verify user has access to data
3. **Filter not working** - Check API query parameters
4. **Location not appearing** - Check hierarchy assignment
5. **Permission errors** - Verify user role and assignments

---

## 🎉 CONCLUSION

This comprehensive testing checklist ensures that the frequent locations hierarchy filtering and Quick Add functionality work correctly for all user roles and edge cases.

**Remember**: Test thoroughly in development before deploying to production!

---

*Last Updated: December 9, 2025*
*Status: Ready for Testing*













