import { test as setup, expect } from '@playwright/test';
import fs from 'fs';

const storagePath = '.auth/storageState.json';
const EMAIL = process.env.E2E_EMAIL || 'demo@example.com';
const PASSWORD = process.env.E2E_PASSWORD || 'demo123';
const FORCE_AUTH = process.env.FORCE_AUTH === '1' || !!process.env.CI;

setup('authenticate', async ({ page }) => {
  // Ensure auth dir exists
  fs.mkdirSync('.auth', { recursive: true });

  // If storage already exists, skip unless forced (CI or FORCE_AUTH=1)
  if (!FORCE_AUTH && fs.existsSync(storagePath)) {
    return;
  }

  await page.goto('/auth/signin');

  // Fill credentials form (ids from signin page)
  await page.fill('#email', EMAIL);
  await page.fill('#password', PASSWORD);
  // Click sign in and wait for network to settle
  // Prefer robust role-based selector; fallback to submit button if needed
  try {
    await page.getByRole('button', { name: /sign in/i }).click();
  } catch {
    await page.locator('button[type="submit"]').click();
  }

  // Verify authenticated session using same-origin fetch from the page context
  // (so cookies are included). Retry briefly to allow auth to complete.
  const status = await page.waitForFunction(async () => {
    try {
      const res = await fetch('/api/me', { credentials: 'same-origin' });
      return res.status;
    } catch {
      return 0;
    }
  }, undefined, { timeout: 5000 }).then(async h => h.jsonValue());

  expect(status).toBe(200);

  // Save storage state for other tests
  await page.context().storageState({ path: storagePath });
});
