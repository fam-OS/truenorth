import { test, expect } from '@playwright/test';
import { setupTestUser, cleanupTestData } from '../helpers/auth';

test.describe('Business Units CRUD Operations', () => {
  let testUserId: string;
  let companyAccountId: string;

  test.beforeEach(async ({ page }) => {
    const testUser = await setupTestUser();
    testUserId = testUser.id;
    companyAccountId = testUser.companyAccountId;
    
    // Login and navigate to business units page
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.goto('/business-units');
  });

  test.afterEach(async () => {
    await cleanupTestData(testUserId);
  });

  test('should display business units list page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Business Units');
    await expect(page.locator('[data-testid="business-units-list"]')).toBeVisible();
  });

  test('should create a new business unit', async ({ page }) => {
    // Click create business unit button
    await page.click('[data-testid="create-business-unit-btn"]');
    
    // Fill out the form
    await page.fill('input[name="name"]', 'Test Business Unit');
    await page.fill('textarea[name="description"]', 'A test business unit for automated testing');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify business unit was created
    await expect(page.locator('[data-testid="business-unit-item"]')).toContainText('Test Business Unit');
    await expect(page.locator('[data-testid="business-unit-item"]')).toContainText('A test business unit for automated testing');
  });

  test('should view business unit details', async ({ page }) => {
    // Create a business unit first
    await page.click('[data-testid="create-business-unit-btn"]');
    await page.fill('input[name="name"]', 'Detail Test Unit');
    await page.fill('textarea[name="description"]', 'Unit for testing detail view');
    await page.click('button[type="submit"]');
    
    // Click on the business unit to view details
    await page.click('[data-testid="business-unit-item"]:has-text("Detail Test Unit")');
    
    // Verify detail page elements
    await expect(page.locator('h2')).toContainText('Detail Test Unit');
    await expect(page.locator('[data-testid="business-unit-description"]')).toContainText('Unit for testing detail view');
    await expect(page.locator('[data-testid="stakeholders-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="goals-section"]')).toBeVisible();
  });

  test('should edit business unit', async ({ page }) => {
    // Create a business unit first
    await page.click('[data-testid="create-business-unit-btn"]');
    await page.fill('input[name="name"]', 'Edit Test Unit');
    await page.fill('textarea[name="description"]', 'Original description');
    await page.click('button[type="submit"]');
    
    // Click on the business unit to view details
    await page.click('[data-testid="business-unit-item"]:has-text("Edit Test Unit")');
    
    // Click edit button
    await page.click('[data-testid="edit-business-unit-btn"]');
    
    // Update the form
    await page.fill('input[name="name"]', 'Updated Test Unit');
    await page.fill('textarea[name="description"]', 'Updated description');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify changes
    await expect(page.locator('h2')).toContainText('Updated Test Unit');
    await expect(page.locator('[data-testid="business-unit-description"]')).toContainText('Updated description');
  });

  test('should delete business unit', async ({ page }) => {
    // Create a business unit first
    await page.click('[data-testid="create-business-unit-btn"]');
    await page.fill('input[name="name"]', 'Delete Test Unit');
    await page.fill('textarea[name="description"]', 'Unit to be deleted');
    await page.click('button[type="submit"]');
    
    // Click on the business unit to view details
    await page.click('[data-testid="business-unit-item"]:has-text("Delete Test Unit")');
    
    // Click delete button
    await page.click('[data-testid="delete-business-unit-btn"]');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete-btn"]');
    
    // Verify business unit is removed
    await expect(page.locator('[data-testid="business-unit-item"]:has-text("Delete Test Unit")')).not.toBeVisible();
  });

  test('should handle validation errors', async ({ page }) => {
    // Click create business unit button
    await page.click('[data-testid="create-business-unit-btn"]');
    
    // Try to submit without required fields
    await page.click('button[type="submit"]');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="name-error"]')).toContainText('Name is required');
  });

  test('should filter business units', async ({ page }) => {
    // Create multiple business units
    const units = ['Engineering Unit', 'Marketing Unit', 'Sales Unit'];
    
    for (const unit of units) {
      await page.click('[data-testid="create-business-unit-btn"]');
      await page.fill('input[name="name"]', unit);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500); // Small delay between creations
    }
    
    // Use search filter
    await page.fill('[data-testid="search-input"]', 'Engineering');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="business-unit-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="business-unit-item"]')).toContainText('Engineering Unit');
  });
});
