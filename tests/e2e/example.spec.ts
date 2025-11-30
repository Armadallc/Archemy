import { test, expect } from '@playwright/test';

test.describe('HALCYON TMS E2E Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/HALCYON/i);
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  // Add more E2E tests here
  // Example: trip creation, driver assignment, etc.
});

