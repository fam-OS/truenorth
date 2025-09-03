import { test, expect } from '@playwright/test';
import { setupTestUser, cleanupTestData } from '../helpers/auth';

test.describe('Stakeholders CRUD Operations', () => {
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
    
    // Create a business unit first for stakeholder tests
    await page.click('[data-testid="create-business-unit-btn"]');
    await page.fill('input[name="name"]', 'Test Business Unit');
    await page.fill('textarea[name="description"]', 'Unit for stakeholder testing');
    await page.click('button[type="submit"]');
    
    // Navigate to business unit detail
    await page.click('[data-testid="business-unit-item"]:has-text("Test Business Unit")');
  });

  test.afterEach(async () => {
    await cleanupTestData(testUserId);
  });

  test('should display stakeholders section', async ({ page }) => {
    await expect(page.locator('[data-testid="stakeholders-section"]')).toBeVisible();
    await expect(page.locator('h3')).toContainText('Stakeholders');
  });

  test('should create a new stakeholder', async ({ page }) => {
    // Click add stakeholder button
    await page.click('[data-testid="add-stakeholder-btn"]');
    
    // Fill out the form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="role"]', 'Engineering Manager');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify stakeholder was created
    await expect(page.locator('[data-testid="stakeholder-item"]')).toContainText('John Doe');
    await expect(page.locator('[data-testid="stakeholder-item"]')).toContainText('Engineering Manager');
    await expect(page.locator('[data-testid="stakeholder-item"]')).toContainText('john.doe@example.com');
  });

  test('should view stakeholder details', async ({ page }) => {
    // Create a stakeholder first
    await page.click('[data-testid="add-stakeholder-btn"]');
    await page.fill('input[name="name"]', 'Jane Smith');
    await page.fill('input[name="email"]', 'jane.smith@example.com');
    await page.fill('input[name="role"]', 'Product Manager');
    await page.click('button[type="submit"]');
    
    // Click on the stakeholder to view details
    await page.click('[data-testid="stakeholder-item"]:has-text("Jane Smith")');
    
    // Verify detail page elements
    await expect(page.locator('h2')).toContainText('Jane Smith');
    await expect(page.locator('[data-testid="stakeholder-role"]')).toContainText('Product Manager');
    await expect(page.locator('[data-testid="stakeholder-email"]')).toContainText('jane.smith@example.com');
    await expect(page.locator('[data-testid="stakeholder-goals"]')).toBeVisible();
  });

  test('should edit stakeholder', async ({ page }) => {
    // Create a stakeholder first
    await page.click('[data-testid="add-stakeholder-btn"]');
    await page.fill('input[name="name"]', 'Bob Wilson');
    await page.fill('input[name="email"]', 'bob.wilson@example.com');
    await page.fill('input[name="role"]', 'Developer');
    await page.click('button[type="submit"]');
    
    // Click edit button
    await page.click('[data-testid="edit-stakeholder-btn"]');
    
    // Update the form
    await page.fill('input[name="name"]', 'Robert Wilson');
    await page.fill('input[name="role"]', 'Senior Developer');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify changes
    await expect(page.locator('[data-testid="stakeholder-item"]')).toContainText('Robert Wilson');
    await expect(page.locator('[data-testid="stakeholder-item"]')).toContainText('Senior Developer');
  });

  test('should delete stakeholder', async ({ page }) => {
    // Create a stakeholder first
    await page.click('[data-testid="add-stakeholder-btn"]');
    await page.fill('input[name="name"]', 'Alice Brown');
    await page.fill('input[name="email"]', 'alice.brown@example.com');
    await page.fill('input[name="role"]', 'Designer');
    await page.click('button[type="submit"]');
    
    // Click delete button
    await page.click('[data-testid="delete-stakeholder-btn"]');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete-btn"]');
    
    // Verify stakeholder is removed
    await expect(page.locator('[data-testid="stakeholder-item"]:has-text("Alice Brown")')).not.toBeVisible();
  });

  test('should handle validation errors', async ({ page }) => {
    // Click add stakeholder button
    await page.click('[data-testid="add-stakeholder-btn"]');
    
    // Try to submit without required fields
    await page.click('button[type="submit"]');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="name-error"]')).toContainText('Name is required');
    await expect(page.locator('[data-testid="role-error"]')).toContainText('Role is required');
  });

  test('should link existing stakeholder', async ({ page }) => {
    // First create an unassigned stakeholder via API or another business unit
    // This would typically be done through test setup
    
    // Click add stakeholder button
    await page.click('[data-testid="add-stakeholder-btn"]');
    
    // Switch to link existing tab
    await page.click('[data-testid="link-existing-tab"]');
    
    // Select existing stakeholder
    await page.selectOption('[data-testid="existing-stakeholder-select"]', { label: 'Existing User' });
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify stakeholder was linked
    await expect(page.locator('[data-testid="stakeholder-item"]')).toContainText('Existing User');
  });

  test('should filter stakeholders by role', async ({ page }) => {
    // Create multiple stakeholders with different roles
    const stakeholders = [
      { name: 'Manager One', role: 'Manager', email: 'manager1@example.com' },
      { name: 'Developer One', role: 'Developer', email: 'dev1@example.com' },
      { name: 'Manager Two', role: 'Manager', email: 'manager2@example.com' }
    ];
    
    for (const stakeholder of stakeholders) {
      await page.click('[data-testid="add-stakeholder-btn"]');
      await page.fill('input[name="name"]', stakeholder.name);
      await page.fill('input[name="email"]', stakeholder.email);
      await page.fill('input[name="role"]', stakeholder.role);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // Filter by role
    await page.selectOption('[data-testid="role-filter"]', 'Manager');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="stakeholder-item"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="stakeholder-item"]')).toContainText('Manager One');
    await expect(page.locator('[data-testid="stakeholder-item"]')).toContainText('Manager Two');
  });
});
