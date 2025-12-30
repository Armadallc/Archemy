import { Page, expect } from '@playwright/test';

/**
 * E2E Test Helpers
 * 
 * Reusable functions for E2E tests
 */

export const TEST_CREDENTIALS = {
  user: {
    email: process.env.E2E_USER_EMAIL || 'admin@monarch.com',
    password: process.env.E2E_USER_PASSWORD || 'admin123',
  },
  driver: {
    email: process.env.E2E_DRIVER_EMAIL || 'driver@monarch.com',
    password: process.env.E2E_DRIVER_PASSWORD || 'driver123',
  },
};

/**
 * Login helper function
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/');
  
  // Wait for login form
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  // Fill in credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation away from login page
  await page.waitForURL(/\/(?!login)/, { timeout: 15000 });
  
  // Wait for dashboard/app to load
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for trip to appear in list
 */
export async function waitForTripInList(page: Page, tripIdentifier: string, timeout = 10000) {
  // Try multiple selectors to find the trip
  const selectors = [
    `text=${tripIdentifier}`,
    `[data-trip-id="${tripIdentifier}"]`,
    `text=/${tripIdentifier}/i`,
  ];
  
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 2000 });
      return true;
    } catch {
      continue;
    }
  }
  
  return false;
}

/**
 * Filter trips by status
 */
export async function filterTripsByStatus(page: Page, status: string) {
  const statusFilter = page.locator('select, [role="combobox"]').filter({ hasText: /status/i });
  
  if (await statusFilter.isVisible()) {
    await statusFilter.selectOption(status);
    await page.waitForTimeout(1000); // Wait for filter to apply
    return true;
  }
  
  return false;
}

/**
 * Expand trip details in list
 */
export async function expandTripDetails(page: Page, tripText: string) {
  const trip = page.locator(`text=/${tripText}/i`).first();
  
  if (await trip.isVisible()) {
    await trip.click();
    await page.waitForTimeout(500);
    return true;
  }
  
  return false;
}

/**
 * Get tomorrow's date in YYYY-MM-DD format
 */
export function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

/**
 * Get time in HH:MM format
 */
export function getTimeString(hours: number, minutes: number = 0): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

