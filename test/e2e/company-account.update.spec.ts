import { test, expect } from '@playwright/test';

// UI creation and update flow from onboarding checklist

test('update company account via UI', async ({ page }) => {
  // Start at home after auth; navigate via Getting Started checklist
  await page.goto('/');

  // Find the checklist row for "Create organization" and click its action (View or Start)
  const createOrgHeading = page.getByRole('heading', { name: 'Create organization' });
  await expect(createOrgHeading).toBeVisible();
  const createOrgRow = createOrgHeading.locator('..').locator('..');
  // The action is a Link-wrapped Button; click either "View" or "Start"
  await createOrgRow.getByRole('link', { name: /(view|start)/i }).click();

  // Enter edit mode
  await page.getByRole('button', { name: 'Edit' }).click();

  // Update fields
  const newName = `Acme Corp ${Date.now()}`;
  await page.getByPlaceholder('Enter company name').fill(newName);
  await page.getByPlaceholder('Enter company description').fill('Updated by Playwright test');
  await page.getByPlaceholder('e.g., San Francisco, CA').fill('Austin, TX');

  // Toggle company type: switch to Public, then back to Private to ensure control works
  await page.getByRole('button', { name: 'Public' }).click();
  // If tradedAs appears, fill it to exercise conditional field
  const tradedAs = page.getByPlaceholder('e.g., NASDAQ: AAPL');
  if (await tradedAs.isVisible().catch(() => false)) {
    await tradedAs.fill('NASDAQ: ACME');
  }
  await page.getByRole('button', { name: 'Private' }).click();

  // Save
  await Promise.all([
    page.waitForLoadState('load'), // AccountProfile triggers window.location.reload()
    page.getByRole('button', { name: 'Save' }).click(),
  ]);

  // Verify persistence after reload
  await expect(page).toHaveURL(/\/organizations/);
  await expect(page.getByRole('heading', { level: 2, name: newName })).toBeVisible();
  await expect(page.getByText('Updated by Playwright test')).toBeVisible();
});
