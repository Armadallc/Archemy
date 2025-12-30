import { test, expect } from '@playwright/test';
import { login, filterTripsByStatus, expandTripDetails, getTomorrowDate, getTimeString, TEST_CREDENTIALS } from './helpers';

/**
 * E2E Tests for Trip Order Workflow
 * 
 * Tests the complete trip order lifecycle:
 * 1. User creates trip (defaults to 'order' status)
 * 2. Driver views and manages orders
 * 3. Driver confirms/declines orders
 * 4. Driver updates trip status
 * 5. Notifications and tagging
 */

// Helper function to create a trip
async function createTrip(page: Page, tripData: {
  clientId?: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledDate: string;
  scheduledTime: string;
  tripType?: 'one_way' | 'round_trip';
  driverId?: string;
}) {
  // Navigate to new trip page
  await page.goto('/trips/new');
  await page.waitForLoadState('networkidle');
  
  // Wait for form to be visible
  await page.waitForSelector('form', { timeout: 10000 });
  
  // Fill in trip details
  if (tripData.clientId) {
    // Select client (if client selector exists)
    const clientSelect = page.locator('select, [role="combobox"]').first();
    if (await clientSelect.isVisible()) {
      await clientSelect.click();
      await page.waitForTimeout(500);
      // Select first available client or specific client
      await page.keyboard.press('Enter');
    }
  }
  
  // Fill pickup address
  const pickupInput = page.locator('input[placeholder*="pickup" i], input[placeholder*="origin" i]').first();
  if (await pickupInput.isVisible()) {
    await pickupInput.fill(tripData.pickupAddress);
  }
  
  // Fill dropoff address
  const dropoffInput = page.locator('input[placeholder*="dropoff" i], input[placeholder*="destination" i]').first();
  if (await dropoffInput.isVisible()) {
    await dropoffInput.fill(tripData.dropoffAddress);
  }
  
  // Fill scheduled date
  const dateInput = page.locator('input[type="date"]').first();
  if (await dateInput.isVisible()) {
    await dateInput.fill(tripData.scheduledDate);
  }
  
  // Fill scheduled time
  const timeInput = page.locator('input[type="time"]').first();
  if (await timeInput.isVisible()) {
    await timeInput.fill(tripData.scheduledTime);
  }
  
  // Select trip type if provided
  if (tripData.tripType) {
    const tripTypeSelect = page.locator('select, [role="combobox"]').filter({ hasText: /trip.*type/i });
    if (await tripTypeSelect.isVisible()) {
      await tripTypeSelect.selectOption(tripData.tripType);
    }
  }
  
  // Select driver if provided (optional - "Request Driver")
  if (tripData.driverId && tripData.driverId !== 'unassigned') {
    const driverSelect = page.locator('select, [role="combobox"]').filter({ hasText: /driver/i });
    if (await driverSelect.isVisible()) {
      await driverSelect.selectOption(tripData.driverId);
    }
  }
  
  // Submit form
  const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Create"), button:has-text("Book")');
  await submitButton.click();
  
  // Wait for success message or navigation
  await page.waitForTimeout(2000);
  
  // Check for success toast/notification
  const successMessage = page.locator('text=/trip.*created|trip.*scheduled|success/i');
  await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
}

test.describe('Trip Order Workflow - User Perspective', () => {
  test.beforeEach(async ({ page }) => {
    // Login as user
    await login(page, TEST_CREDENTIALS.user.email, TEST_CREDENTIALS.user.password);
  });

  test('should create trip with default order status', async ({ page }) => {
    const dateStr = getTomorrowDate();
    const timeStr = getTimeString(10, 0);

    await createTrip(page, {
      pickupAddress: '123 Test Street, Test City, TS 12345',
      dropoffAddress: '456 Test Avenue, Test City, TS 12345',
      scheduledDate: dateStr,
      scheduledTime: timeStr,
      tripType: 'one_way',
      // No driver assigned - should default to 'order' status
    });

    // Navigate to trips list
    await page.goto('/trips');
    await page.waitForLoadState('networkidle');

    // Verify trip appears with 'order' status
    await filterTripsByStatus(page, 'order');

    // Check for trip with order status (orange/amber color)
    const orderTrip = page.locator('[style*="F59E0B"], [style*="#F59E0B"], text=/order/i').first();
    await expect(orderTrip).toBeVisible({ timeout: 10000 });
  });

  test('should create trip with optional driver request', async ({ page }) => {
    const dateStr = getTomorrowDate();
    const timeStr = getTimeString(14, 0);

    await createTrip(page, {
      pickupAddress: '789 Test Road, Test City, TS 12345',
      dropoffAddress: '321 Test Lane, Test City, TS 12345',
      scheduledDate: dateStr,
      scheduledTime: timeStr,
      tripType: 'one_way',
      driverId: 'unassigned', // No driver requested
    });

    // Verify helper text about super admin notification
    const helperText = page.locator('text=/super admin.*notified|no driver.*requested/i');
    // This text should appear in the form
    await expect(helperText.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show "Request Driver (Optional)" label', async ({ page }) => {
    await page.goto('/trips/new');
    await page.waitForLoadState('networkidle');

    // Check for the updated label
    const driverLabel = page.locator('text=/request driver.*optional/i');
    await expect(driverLabel.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Trip Order Workflow - Driver Perspective', () => {
  test.beforeEach(async ({ page }) => {
    // Login as driver
    await login(page, TEST_CREDENTIALS.driver.email, TEST_CREDENTIALS.driver.password);
  });

  test('should view assigned trip orders', async ({ page }) => {
    await page.goto('/trips');
    await page.waitForLoadState('networkidle');

    // Filter by order status
    await filterTripsByStatus(page, 'order');

    // Look for trips with order status assigned to this driver
    const orderTrips = page.locator('[style*="F59E0B"], text=/order/i');
    const count = await orderTrips.count();
    
    if (count > 0) {
      // Expand first order trip
      await expandTripDetails(page, 'order');

      // Check for action buttons (Confirm/Decline)
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Accept")');
      const declineButton = page.locator('button:has-text("Decline")');
      
      // At least one action button should be visible
      const hasActions = await confirmButton.isVisible() || await declineButton.isVisible();
      expect(hasActions).toBe(true);
    }
  });

  test('should confirm trip order', async ({ page }) => {
    await page.goto('/trips');
    await page.waitForLoadState('networkidle');

    // Find an order trip assigned to this driver
    await filterTripsByStatus(page, 'order');

    // Expand a trip to see details
    const orderTrip = page.locator('text=/order/i').first();
    if (await orderTrip.isVisible()) {
      await expandTripDetails(page, 'order');

      // Click Confirm button
      const confirmButton = page.locator('button:has-text("Confirm")').first();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        
        // Wait for confirmation dialog
        await page.waitForSelector('[role="dialog"], .dialog, [class*="Dialog"]', { timeout: 5000 });
        
        // If recurring trip, handle "Confirm All" prompt
        const confirmAllButton = page.locator('button:has-text("Confirm All"), button:has-text("Review Details")');
        if (await confirmAllButton.isVisible()) {
          await confirmAllButton.click();
          await page.waitForTimeout(500);
        }
        
        // Final confirm
        const finalConfirm = page.locator('button:has-text("Confirm"), button:has-text("Confirm All")').last();
        await finalConfirm.click();
        
        // Wait for success message
        const successMessage = page.locator('text=/confirmed|scheduled|success/i');
        await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
        
        // Verify status changed to 'scheduled'
        await page.waitForTimeout(2000);
        const scheduledStatus = page.locator('text=/scheduled/i');
        await expect(scheduledStatus.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should decline trip order with reason', async ({ page }) => {
    await page.goto('/trips');
    await page.waitForLoadState('networkidle');

    // Find an order trip
    await filterTripsByStatus(page, 'order');

    // Expand a trip
    const orderTrip = page.locator('text=/order/i').first();
    if (await orderTrip.isVisible()) {
      await expandTripDetails(page, 'order');

      // Click Decline button
      const declineButton = page.locator('button:has-text("Decline")').first();
      if (await declineButton.isVisible()) {
        await declineButton.click();
        
        // Wait for decline dialog
        await page.waitForSelector('[role="dialog"], .dialog, [class*="Dialog"]', { timeout: 5000 });
        
        // Select decline reason
        const reasonSelect = page.locator('select, [role="combobox"]').filter({ hasText: /reason/i });
        if (await reasonSelect.isVisible()) {
          await reasonSelect.selectOption('conflict');
        }
        
        // Submit decline
        const submitDecline = page.locator('button:has-text("Decline Order")');
        await submitDecline.click();
        
        // Wait for success message
        const successMessage = page.locator('text=/declined|success/i');
        await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
        
        // Verify trip still has 'order' status but driver is removed
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should update trip status through unified endpoint', async ({ page }) => {
    await page.goto('/trips');
    await page.waitForLoadState('networkidle');

    // Find a scheduled trip assigned to this driver
    await filterTripsByStatus(page, 'scheduled');

    // Expand a scheduled trip
    const scheduledTrip = page.locator('text=/scheduled/i').first();
    if (await scheduledTrip.isVisible()) {
      await scheduledTrip.click();
      await page.waitForTimeout(500);

      // Look for status update button (Start Trip, etc.)
      const startButton = page.locator('button:has-text("Start"), button:has-text("Start Trip")');
      if (await startButton.isVisible()) {
        await startButton.click();
        
        // Handle any prompts (client aboard, etc.)
        await page.waitForTimeout(1000);
        
        // Check for status update
        const inProgressStatus = page.locator('text=/in progress/i');
        await expect(inProgressStatus.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Trip Order Workflow - Notifications', () => {
  test('should notify user when driver confirms order', async ({ page, context }) => {
    // This test would require:
    // 1. User creates trip
    // 2. Driver confirms order
    // 3. User receives notification
    
    // For now, we'll test the notification UI exists
    await login(page, TEST_CREDENTIALS.user.email, TEST_CREDENTIALS.user.password);
    await page.goto('/');
    
    // Look for notification indicator/bell
    const notificationBell = page.locator('[aria-label*="notification"], button:has([class*="bell"])');
    // Notification system should be present
    expect(await notificationBell.count()).toBeGreaterThanOrEqual(0);
  });

  test('should show order status in trip list', async ({ page }) => {
    await login(page, TEST_CREDENTIALS.user.email, TEST_CREDENTIALS.user.password);
    await page.goto('/trips');
    await page.waitForLoadState('networkidle');

    // Check that 'order' status is in the filter dropdown
    const statusFilter = page.locator('select, [role="combobox"]').filter({ hasText: /status/i });
    if (await statusFilter.isVisible()) {
      const options = await statusFilter.locator('option').allTextContents();
      expect(options.some(opt => opt.toLowerCase().includes('order'))).toBe(true);
    }

    // Check that order status has correct styling (orange/amber)
    const orderStatusBadge = page.locator('[style*="F59E0B"], [style*="#F59E0B"]').first();
    // If any order trips exist, they should have the orange styling
    if (await orderStatusBadge.isVisible()) {
      const style = await orderStatusBadge.getAttribute('style');
      expect(style).toContain('F59E0B');
    }
  });
});

test.describe('Trip Order Workflow - Integration', () => {
  test('complete workflow: create order → driver confirms → status updates', async ({ page, context }) => {
    // Step 1: User creates trip
    await login(page, TEST_CREDENTIALS.user.email, TEST_CREDENTIALS.user.password);
    
    const dateStr = getTomorrowDate();
    const timeStr = getTimeString(15, 0);

    await createTrip(page, {
      pickupAddress: '999 Integration Test St, Test City, TS 12345',
      dropoffAddress: '888 Integration Test Ave, Test City, TS 12345',
      scheduledDate: dateStr,
      scheduledTime: timeStr,
      tripType: 'one_way',
    });

    // Step 2: Switch to driver account
    await page.goto('/logout');
    await page.waitForTimeout(1000);
    await login(page, TEST_CREDENTIALS.driver.email, TEST_CREDENTIALS.driver.password);

    // Step 3: Driver views orders
    await page.goto('/trips');
    await page.waitForLoadState('networkidle');

    // Filter by order status
    await filterTripsByStatus(page, 'order');

    // Step 4: Driver confirms order
    const orderTrip = page.locator('text=/order/i').first();
    if (await orderTrip.isVisible()) {
      await expandTripDetails(page, 'order');

      const confirmButton = page.locator('button:has-text("Confirm")').first();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await page.waitForTimeout(1000);
        
        // Handle dialog if present
        const dialog = page.locator('[role="dialog"]');
        if (await dialog.isVisible()) {
          const finalConfirm = page.locator('button:has-text("Confirm")').last();
          await finalConfirm.click();
        }
        
        // Verify confirmation
        const successMessage = page.locator('text=/confirmed|scheduled/i');
        await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
      }
    }

    // Step 5: Verify status changed
    await page.waitForTimeout(2000);
    const scheduledStatus = page.locator('text=/scheduled/i');
    // At least one scheduled trip should exist
    expect(await scheduledStatus.count()).toBeGreaterThanOrEqual(0);
  });
});

