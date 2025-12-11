# Program Admin Routes - Testing Checklist

## Overview
This document verifies that all routes are properly configured for program admin users.

## Expected Routes for Program Admins

Program admins should have access to routes in the format:
`/corporate-client/:corporateClientId/program/:programId/[page]`

### Required Routes

1. **Settings**
   - Route: `/corporate-client/:corporateClientId/program/:programId/settings`
   - Status: ✅ Added
   - Test: Navigate to settings page from program context

2. **Dashboard**
   - Route: `/corporate-client/:corporateClientId/program/:programId`
   - Status: ✅ Exists
   - Test: Navigate to program dashboard

3. **Trips**
   - Route: `/corporate-client/:corporateClientId/program/:programId/trips`
   - Status: ✅ Exists
   - Test: Navigate to trips page

4. **Clients**
   - Route: `/corporate-client/:corporateClientId/program/:programId/clients`
   - Status: ✅ Exists
   - Test: Navigate to clients page

5. **Frequent Locations**
   - Route: `/corporate-client/:corporateClientId/program/:programId/frequent-locations`
   - Status: ✅ Exists
   - Test: Navigate to frequent locations page

6. **Drivers**
   - Route: `/corporate-client/:corporateClientId/program/:programId/drivers`
   - Status: ✅ Exists
   - Test: Navigate to drivers page

7. **Vehicles**
   - Route: `/corporate-client/:corporateClientId/program/:programId/vehicles`
   - Status: ✅ Exists
   - Test: Navigate to vehicles page

8. **Calendar**
   - Route: `/corporate-client/:corporateClientId/program/:programId/calendar`
   - Status: ✅ Exists
   - Test: Navigate to calendar page

## Route Testing Checklist

### Test User Setup
- [ ] Create or identify a program admin user
- [ ] Verify user has `role: 'program_admin'`
- [ ] Verify user has `primary_program_id` set
- [ ] Verify user has `corporate_client_id` set (via program relationship)
- [ ] Note the corporate client ID and program ID for testing

### Route Access Tests

#### Settings Route
- [ ] Navigate to `/corporate-client/{corporateClientId}/program/{programId}/settings`
- [ ] Page loads without 404 error
- [ ] Settings page displays correctly
- [ ] Only appropriate tabs are visible (Users, Contacts, Notifications)
- [ ] Cannot access Corporate Client or System tabs

#### Dashboard Route
- [ ] Navigate to `/corporate-client/{corporateClientId}/program/{programId}`
- [ ] Dashboard loads correctly
- [ ] Data is scoped to the program
- [ ] No 404 errors

#### Trips Route
- [ ] Navigate to `/corporate-client/{corporateClientId}/program/{programId}/trips`
- [ ] Trips page loads correctly
- [ ] Only trips for the program are displayed
- [ ] No 404 errors

#### Clients Route
- [ ] Navigate to `/corporate-client/{corporateClientId}/program/{programId}/clients`
- [ ] Clients page loads correctly
- [ ] Only clients for the program are displayed
- [ ] No 404 errors

#### Frequent Locations Route
- [ ] Navigate to `/corporate-client/{corporateClientId}/program/{programId}/frequent-locations`
- [ ] Frequent locations page loads correctly
- [ ] Only locations for the program are displayed
- [ ] No 404 errors

#### Drivers Route
- [ ] Navigate to `/corporate-client/{corporateClientId}/program/{programId}/drivers`
- [ ] Drivers page loads correctly
- [ ] Only drivers for the program are displayed
- [ ] No 404 errors

#### Vehicles Route
- [ ] Navigate to `/corporate-client/{corporateClientId}/program/{programId}/vehicles`
- [ ] Vehicles page loads correctly
- [ ] Only vehicles for the program are displayed
- [ ] No 404 errors

#### Calendar Route
- [ ] Navigate to `/corporate-client/{corporateClientId}/program/{programId}/calendar`
- [ ] Calendar page loads correctly
- [ ] Calendar data is scoped to the program
- [ ] No 404 errors

## Navigation Tests

### Sidebar Navigation
- [ ] All program admin navigation items work correctly
- [ ] Clicking navigation items navigates to correct hierarchical URLs
- [ ] URLs include both corporate client and program IDs
- [ ] No flat routes are used (unless super admin)

### URL Building
- [ ] `buildHierarchicalUrl` function works correctly for program admins
- [ ] URLs are built with format: `/corporate-client/{id}/program/{id}/...`
- [ ] Navigation from sidebar uses hierarchical URLs

### Hierarchy Context
- [ ] `useHierarchy` hook correctly identifies program admin
- [ ] `selectedCorporateClient` is set correctly
- [ ] `selectedProgram` is set correctly
- [ ] `level` is set to 'program'

## Data Scoping Tests

### API Endpoints
- [ ] All API calls include `program_id` parameter
- [ ] Data is filtered to the program
- [ ] Cannot access data from other programs
- [ ] Cannot access data from other corporate clients

### Database Queries
- [ ] Backend filters data by `program_id`
- [ ] RLS policies (if applicable) restrict access correctly
- [ ] No data leakage between programs

## Edge Cases

### Missing Program ID
- [ ] What happens if program admin has no `primary_program_id`?
- [ ] Appropriate error message or redirect?

### Multiple Programs
- [ ] Can program admin switch between programs (if `authorized_programs` is set)?
- [ ] URL updates correctly when switching programs?

### Invalid Program ID
- [ ] What happens if program ID in URL doesn't exist?
- [ ] What happens if program ID doesn't belong to corporate client?
- [ ] Appropriate error handling?

## Route Order

Routes must be defined in this order (most specific first):
1. `/corporate-client/:corporateClientId/program/:programId/settings` (most specific)
2. `/corporate-client/:corporateClientId/program/:programId/trips`
3. `/corporate-client/:corporateClientId/program/:programId/clients`
4. `/corporate-client/:corporateClientId/program/:programId/frequent-locations`
5. `/corporate-client/:corporateClientId/program/:programId/drivers`
6. `/corporate-client/:corporateClientId/program/:programId/vehicles`
7. `/corporate-client/:corporateClientId/program/:programId/calendar`
8. `/corporate-client/:corporateClientId/program/:programId` (dashboard - least specific)

This ensures that more specific routes are matched before less specific ones.

## Success Criteria

All program admin routes should:
- ✅ Load without 404 errors
- ✅ Display data scoped to the program
- ✅ Use hierarchical URL structure
- ✅ Respect role-based permissions
- ✅ Work with navigation from sidebar
- ✅ Handle edge cases gracefully

## Notes

- Program admins should NOT be able to access corporate-client-only routes (without program ID)
- Program admins should NOT be able to access flat routes (unless they're also super admin)
- All navigation should use hierarchical URLs
- Settings page should show only program-admin-appropriate tabs



