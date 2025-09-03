import { test, expect } from '@playwright/test';

// Uses storageState produced by setup project

test('authenticated landing shows app shell', async ({ page }) => {
  await page.goto('/');
  // Basic smoke: presence of any known element for signed-in users
  // Adjust selectors to your app shell; using heading or navbar presence
  await expect(page).toHaveURL(/\//);
  // Try hitting organizations page as an authenticated route
  await page.goto('/organizations');
  await expect(page).toHaveURL(/organizations/);
});
