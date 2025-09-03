import { test, expect } from '@playwright/test';
import { setupTestUser, cleanupTestData } from '../helpers/auth';

test.describe('Initiatives CRUD Operations', () => {
  let testUserId: string;
  let companyAccountId: string;

  test.beforeEach(async ({ page }) => {
    const testUser = await setupTestUser();
    testUserId = testUser.id;
    companyAccountId = testUser.companyAccountId;
    
    // Login and navigate to initiatives page
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.goto('/initiatives');
  });

  test.afterEach(async () => {
    await cleanupTestData(testUserId);
  });

  test('should display initiatives list page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Initiatives');
    await expect(page.locator('[data-testid="initiatives-list"]')).toBeVisible();
  });

  test('should create a new initiative', async ({ page }) => {
    // Click create initiative button
    await page.click('[data-testid="create-initiative-btn"]');
    
    // Fill out the form
    await page.fill('input[name="name"]', 'Digital Transformation');
    await page.fill('textarea[name="description"]', 'Modernize legacy systems and processes');
    await page.fill('input[name="startDate"]', '2025-01-01');
    await page.fill('input[name="endDate"]', '2025-12-31');
    await page.selectOption('select[name="status"]', 'IN_PROGRESS');
    await page.fill('input[name="budget"]', '500000');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify initiative was created
    await expect(page.locator('[data-testid="initiative-item"]')).toContainText('Digital Transformation');
    await expect(page.locator('[data-testid="initiative-item"]')).toContainText('Modernize legacy systems');
    await expect(page.locator('[data-testid="initiative-item"]')).toContainText('IN_PROGRESS');
  });

  test('should view initiative details', async ({ page }) => {
    // Create an initiative first
    await page.click('[data-testid="create-initiative-btn"]');
    await page.fill('input[name="name"]', 'Customer Experience Initiative');
    await page.fill('textarea[name="description"]', 'Improve customer satisfaction scores');
    await page.fill('input[name="startDate"]', '2025-02-01');
    await page.fill('input[name="endDate"]', '2025-08-31');
    await page.click('button[type="submit"]');
    
    // Click on the initiative to view details
    await page.click('[data-testid="initiative-item"]:has-text("Customer Experience Initiative")');
    
    // Verify detail page elements
    await expect(page.locator('h1')).toContainText('Customer Experience Initiative');
    await expect(page.locator('[data-testid="initiative-description"]')).toContainText('Improve customer satisfaction scores');
    await expect(page.locator('[data-testid="initiative-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="impacted-goals-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="initiative-metrics"]')).toBeVisible();
  });

  test('should edit initiative', async ({ page }) => {
    // Create an initiative first
    await page.click('[data-testid="create-initiative-btn"]');
    await page.fill('input[name="name"]', 'Original Initiative');
    await page.fill('textarea[name="description"]', 'Original description');
    await page.fill('input[name="startDate"]', '2025-01-01');
    await page.fill('input[name="endDate"]', '2025-06-30');
    await page.click('button[type="submit"]');
    
    // Click on the initiative to view details
    await page.click('[data-testid="initiative-item"]:has-text("Original Initiative")');
    
    // Click edit button
    await page.click('[data-testid="edit-initiative-btn"]');
    
    // Update the form
    await page.fill('input[name="name"]', 'Updated Initiative');
    await page.fill('textarea[name="description"]', 'Updated description with new scope');
    await page.selectOption('select[name="status"]', 'COMPLETED');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify changes
    await expect(page.locator('h1')).toContainText('Updated Initiative');
    await expect(page.locator('[data-testid="initiative-description"]')).toContainText('Updated description with new scope');
    await expect(page.locator('[data-testid="initiative-status"]')).toContainText('COMPLETED');
  });

  test('should delete initiative', async ({ page }) => {
    // Create an initiative first
    await page.click('[data-testid="create-initiative-btn"]');
    await page.fill('input[name="name"]', 'Initiative to Delete');
    await page.fill('textarea[name="description"]', 'This initiative will be deleted');
    await page.fill('input[name="startDate"]', '2025-01-01');
    await page.fill('input[name="endDate"]', '2025-03-31');
    await page.click('button[type="submit"]');
    
    // Click on the initiative to view details
    await page.click('[data-testid="initiative-item"]:has-text("Initiative to Delete")');
    
    // Click delete button
    await page.click('[data-testid="delete-initiative-btn"]');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete-btn"]');
    
    // Verify initiative is removed
    await expect(page.locator('[data-testid="initiative-item"]:has-text("Initiative to Delete")')).not.toBeVisible();
  });

  test('should link initiative to business unit goals', async ({ page }) => {
    // Create an initiative first
    await page.click('[data-testid="create-initiative-btn"]');
    await page.fill('input[name="name"]', 'Goal-Linked Initiative');
    await page.fill('textarea[name="description"]', 'Initiative that impacts business unit goals');
    await page.fill('input[name="startDate"]', '2025-01-01');
    await page.fill('input[name="endDate"]', '2025-12-31');
    await page.click('button[type="submit"]');
    
    // Click on the initiative to view details
    await page.click('[data-testid="initiative-item"]:has-text("Goal-Linked Initiative")');
    
    // Link to business unit goals
    await page.click('[data-testid="link-goals-btn"]');
    await page.check('[data-testid="goal-checkbox"]:first-child');
    await page.click('button[type="submit"]');
    
    // Verify goals are linked
    await expect(page.locator('[data-testid="impacted-goals-section"]')).toContainText('Impacted Business Unit Goals');
    await expect(page.locator('[data-testid="linked-goal-item"]')).toBeVisible();
  });

  test('should handle validation errors', async ({ page }) => {
    // Click create initiative button
    await page.click('[data-testid="create-initiative-btn"]');
    
    // Try to submit without required fields
    await page.click('button[type="submit"]');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="name-error"]')).toContainText('Name is required');
    await expect(page.locator('[data-testid="startDate-error"]')).toContainText('Start date is required');
    await expect(page.locator('[data-testid="endDate-error"]')).toContainText('End date is required');
  });

  test('should filter initiatives by status', async ({ page }) => {
    // Create multiple initiatives with different statuses
    const initiatives = [
      { name: 'Planning Initiative', status: 'PLANNING' },
      { name: 'Active Initiative', status: 'IN_PROGRESS' },
      { name: 'Completed Initiative', status: 'COMPLETED' }
    ];
    
    for (const initiative of initiatives) {
      await page.click('[data-testid="create-initiative-btn"]');
      await page.fill('input[name="name"]', initiative.name);
      await page.fill('input[name="startDate"]', '2025-01-01');
      await page.fill('input[name="endDate"]', '2025-12-31');
      await page.selectOption('select[name="status"]', initiative.status);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // Filter by status
    await page.selectOption('[data-testid="status-filter"]', 'IN_PROGRESS');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="initiative-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="initiative-item"]')).toContainText('Active Initiative');
  });

  test('should search initiatives by name', async ({ page }) => {
    // Create multiple initiatives
    const initiatives = ['Marketing Campaign', 'Product Launch', 'Marketing Analytics'];
    
    for (const name of initiatives) {
      await page.click('[data-testid="create-initiative-btn"]');
      await page.fill('input[name="name"]', name);
      await page.fill('input[name="startDate"]', '2025-01-01');
      await page.fill('input[name="endDate"]', '2025-12-31');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // Search for initiatives
    await page.fill('[data-testid="search-input"]', 'Marketing');
    
    // Verify search results
    await expect(page.locator('[data-testid="initiative-item"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="initiative-item"]')).toContainText('Marketing Campaign');
    await expect(page.locator('[data-testid="initiative-item"]')).toContainText('Marketing Analytics');
  });
});
