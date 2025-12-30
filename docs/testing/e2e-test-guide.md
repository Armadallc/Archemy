# E2E Testing Guide - Trip Order Workflow

**Date:** December 30, 2025  
**Status:** ✅ **E2E Tests Created**

---

## 🧪 E2E Test Suite

### Test File: `tests/e2e/trip-order-workflow.spec.ts`

Comprehensive end-to-end tests covering the complete trip order workflow from both user and driver perspectives.

---

## 📋 Test Scenarios

### 1. User Perspective Tests

#### ✅ Create Trip with Default Order Status
- Creates a new trip without driver assignment
- Verifies trip defaults to 'order' status
- Checks trip appears in list with orange/amber styling

#### ✅ Create Trip with Optional Driver Request
- Tests "Request Driver (Optional)" label
- Verifies helper text about super admin notification
- Tests creating trip without driver

#### ✅ Verify UI Labels
- Confirms "Request Driver (Optional)" label is displayed
- Checks helper text is visible

---

### 2. Driver Perspective Tests

#### ✅ View Assigned Trip Orders
- Driver logs in and navigates to trips
- Filters trips by 'order' status
- Expands trip details
- Verifies Confirm/Decline action buttons are visible

#### ✅ Confirm Trip Order
- Driver views order trip
- Clicks Confirm button
- Handles confirmation dialog (including recurring trip "Confirm All" prompt)
- Verifies status changes to 'scheduled'
- Checks success notification

#### ✅ Decline Trip Order with Reason
- Driver views order trip
- Clicks Decline button
- Selects decline reason from dropdown
- Submits decline
- Verifies trip remains in 'order' status
- Checks success notification

#### ✅ Update Trip Status
- Driver views scheduled trip
- Starts trip (with client aboard prompt)
- Verifies status changes to 'in_progress'
- Tests status update workflow

---

### 3. Notification Tests

#### ✅ Notification UI
- Verifies notification system is present
- Checks notification indicators

#### ✅ Order Status Display
- Verifies 'order' status appears in filter dropdown
- Checks orange/amber styling for order status
- Tests status filtering

---

### 4. Integration Tests

#### ✅ Complete Workflow
- User creates trip (order status)
- Driver views orders
- Driver confirms order
- Verifies status updates
- Tests end-to-end flow

---

## 🚀 Running E2E Tests

### Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Set test credentials** (optional, uses defaults if not set):
   ```bash
   export E2E_USER_EMAIL="admin@monarch.com"
   export E2E_USER_PASSWORD="admin123"
   export E2E_DRIVER_EMAIL="driver@monarch.com"
   export E2E_DRIVER_PASSWORD="driver123"
   ```

### Run Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/trip-order-workflow.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test
npx playwright test -g "should create trip with default order status"
```

---

## 🔧 Test Configuration

### Playwright Config (`playwright.config.ts`)

- **Base URL:** `http://localhost:5173`
- **Browsers:** Chromium, Firefox, WebKit
- **Screenshots:** On failure
- **Videos:** Retained on failure
- **Traces:** On first retry

### Test Helpers (`tests/e2e/helpers.ts`)

Reusable functions:
- `login()` - Authenticate user/driver
- `filterTripsByStatus()` - Filter trips by status
- `expandTripDetails()` - Expand trip in list
- `getTomorrowDate()` - Get tomorrow's date
- `getTimeString()` - Format time string

---

## 📝 Test Data

### Default Test Credentials

- **User:** `admin@monarch.com` / `admin123`
- **Driver:** `driver@monarch.com` / `driver123`

**Note:** Update these in `tests/e2e/helpers.ts` or set environment variables.

---

## 🎯 Test Coverage

### ✅ Covered Scenarios

1. **Trip Creation**
   - Default 'order' status
   - Optional driver assignment
   - UI labels and helper text

2. **Order Management**
   - Driver viewing orders
   - Order confirmation
   - Order decline with reasons
   - Recurring trip handling

3. **Status Updates**
   - Start trip workflow
   - Status transitions
   - Unified endpoint usage

4. **UI/UX**
   - Status filtering
   - Status styling (colors)
   - Action buttons
   - Dialogs and prompts

---

## 🔍 Debugging Tests

### View Test Results

```bash
# Generate HTML report
npx playwright show-report
```

### Debug Mode

```bash
# Run in debug mode
npx playwright test --debug

# Run specific test in debug
npx playwright test -g "should confirm trip order" --debug
```

### Screenshots & Videos

- Screenshots saved on failure: `test-results/`
- Videos saved on failure: `test-results/`
- Traces available for debugging

---

## 📋 Test Checklist

### User Tests
- [x] Create trip with order status
- [x] Create trip without driver
- [x] Verify UI labels

### Driver Tests
- [x] View assigned orders
- [x] Confirm order
- [x] Decline order with reason
- [x] Update trip status

### Integration Tests
- [x] Complete workflow test

---

## 🐛 Known Limitations

1. **Test Credentials:** Uses default test accounts - update for your environment
2. **Test Data:** Tests assume test data exists in database
3. **Timing:** Some tests may need timing adjustments based on network speed
4. **Selectors:** May need updates if UI changes significantly

---

## 🔄 Next Steps

1. **Add More Test Scenarios:**
   - Recurring trip confirmation flow
   - Wait time tracking for round trips
   - User tagging workflow
   - Notification preferences

2. **Improve Test Reliability:**
   - Add more specific selectors
   - Improve wait conditions
   - Add retry logic for flaky tests

3. **Add Visual Regression Tests:**
   - Screenshot comparisons
   - UI component testing

---

**Last Updated:** December 30, 2025  
**Status:** E2E Tests Ready for Execution

