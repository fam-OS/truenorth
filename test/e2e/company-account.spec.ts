import { test, expect } from '@playwright/test';

// Ensures a CompanyAccount exists (idempotent). Uses authenticated storageState.

test('ensure company account exists', async ({ page, request }) => {
  // Check existing accounts via API
  const res = await request.get('/api/company-account');
  expect(res.ok()).toBeTruthy();
  const accounts = await res.json();

  if (Array.isArray(accounts) && accounts.length > 0) {
    // Already exists
  } else {
    const createRes = await request.post('/api/company-account', {
      data: {
        name: 'Acme Corp',
        description: 'E2E created account',
        isPrivate: true,
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = await createRes.json();
    expect(created?.name).toBe('Acme Corp');
  }

  // Navigate to organizations page which shows account overview
  await page.goto('/organizations');
  await expect(page).toHaveURL(/organizations/);
});
