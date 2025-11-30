# Manual Testing Protocol

**Last Updated:** 2025-01-19  
**Status:** Active

---

## 🎯 DAILY SMOKE TESTS

### Authentication
- [ ] Super Admin can login
- [ ] Corporate Admin can login  
- [ ] Program Admin can login
- [ ] Program User can login
- [ ] Driver can login via mobile app
- [ ] Role-based redirects work correctly
- [ ] Session persists on refresh
- [ ] Logout works correctly
- [ ] Cannot access protected routes when logged out

### Trip Management
- [ ] Create new trip with required fields
- [ ] Create trip with optional fields
- [ ] Edit existing trip
- [ ] Assign driver to trip
- [ ] View trip in calendar
- [ ] View trip in trips list
- [ ] Update trip status (scheduled → in_progress → completed)
- [ ] Cancel trip
- [ ] Delete trip (with confirmation)
- [ ] Delete recurring trip (single vs all future)

### Driver Workflow
- [ ] Driver receives trip assignment
- [ ] Driver can view assigned trips
- [ ] Driver can start trip (GPS tracking)
- [ ] Driver can start trip (manual entry)
- [ ] Driver can complete trip
- [ ] Driver can add trip notes
- [ ] Real-time status updates propagate
- [ ] Mobile app syncs correctly

### Data Validation
- [ ] Required field validation works
- [ ] Invalid data is rejected
- [ ] Timezone handling (MDT UTC-6)
- [ ] Date/time formatting is correct
- [ ] Permission checks enforce access control
- [ ] Cross-tenant data isolation works

---

## 📋 WEEKLY COMPREHENSIVE TESTS

### Navigation & Routing
- [ ] All main pages load correctly
- [ ] Hierarchical navigation works
- [ ] Breadcrumbs display correctly
- [ ] Back button works
- [ ] Deep linking works

### Forms & Inputs
- [ ] All form fields are accessible
- [ ] Validation messages display correctly
- [ ] Form submission works
- [ ] Form reset works
- [ ] Auto-save works (where applicable)

### Calendar & Scheduling
- [ ] Calendar displays trips correctly
- [ ] Date navigation works
- [ ] View switching (day/week/month) works
- [ ] Trip hover cards display
- [ ] Create trip from calendar
- [ ] Filter trips by status/driver

### Client Management
- [ ] View clients list
- [ ] Create new client
- [ ] Edit existing client
- [ ] Delete client (with confirmation)
- [ ] Client search/filter works
- [ ] Client groups work correctly

### Driver Management
- [ ] View drivers list
- [ ] Create new driver
- [ ] Edit driver profile
- [ ] Assign driver to trip
- [ ] View driver schedule
- [ ] Driver availability works

### Location Management
- [ ] View frequent locations
- [ ] Add new location
- [ ] Edit location
- [ ] Delete location
- [ ] Quick Add location in forms
- [ ] Location autocomplete works

### Notifications
- [ ] Notifications appear correctly
- [ ] Notification types work (trip assigned, status change, etc.)
- [ ] Notification center displays correctly
- [ ] Mark as read works
- [ ] Clear all works

### WebSocket & Real-Time
- [ ] WebSocket connects on login
- [ ] Real-time trip updates work
- [ ] Real-time status changes propagate
- [ ] Connection recovery works
- [ ] Multiple tabs sync correctly

---

## 🚨 CRITICAL PATH TESTING

### Before Every Release

1. **Authentication Flow** (5 min)
   - Login with each role
   - Verify redirects
   - Test session persistence

2. **Trip Creation** (10 min)
   - Create trip as each role
   - Verify data saves correctly
   - Verify real-time updates

3. **Trip Status Updates** (10 min)
   - Start trip (driver)
   - Complete trip (driver)
   - Cancel trip (admin)
   - Verify status propagation

4. **Data Isolation** (10 min)
   - Create trip in Program A
   - Verify Program B cannot see it
   - Verify Corporate Admin can see all

5. **Mobile App Sync** (10 min)
   - Login on mobile
   - View trips
   - Start/complete trip
   - Verify web app updates

---

## 🐛 ISSUE REPORTING

When reporting issues, include:

1. **Environment**
   - Browser/Device
   - User Role
   - URL/Page

2. **Steps to Reproduce**
   - Step-by-step instructions
   - Expected vs Actual behavior

3. **Console Errors**
   - Screenshot of console
   - Network tab errors

4. **Screenshots**
   - Visual evidence
   - Error messages

---

## ✅ TEST EXECUTION CHECKLIST

### Pre-Testing
- [ ] Backend server running (`http://localhost:8081`)
- [ ] Frontend server running (`http://localhost:5173`)
- [ ] Database accessible
- [ ] Test users available
- [ ] Test data exists

### During Testing
- [ ] Document all issues
- [ ] Take screenshots of errors
- [ ] Note console errors
- [ ] Test in multiple browsers (if time permits)

### Post-Testing
- [ ] Review all findings
- [ ] Prioritize issues
- [ ] Create tickets for blockers
- [ ] Update test results document

---

**Tested By:** _________________  
**Date:** _________________  
**Results:** _________________

