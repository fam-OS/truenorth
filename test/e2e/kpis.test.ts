import { test, expect } from '@playwright/test';
import { setupTestUser, cleanupTestData } from '../helpers/auth';

test.describe('KPIs CRUD Operations', () => {
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
    
    // Create a business unit for KPI tests
    await page.click('[data-testid="create-business-unit-btn"]');
    await page.fill('input[name="name"]', 'Test Business Unit');
    await page.fill('textarea[name="description"]', 'Unit for KPI testing');
    await page.click('button[type="submit"]');
    
    // Navigate to business unit detail
    await page.click('[data-testid="business-unit-item"]:has-text("Test Business Unit")');
  });

  test.afterEach(async () => {
    await cleanupTestData(testUserId);
  });

  test('should display metrics/KPIs section', async ({ page }) => {
    await expect(page.locator('[data-testid="metrics-section"]')).toBeVisible();
    await expect(page.locator('h3')).toContainText('Metrics');
  });

  test('should create a new KPI', async ({ page }) => {
    // Click add metric button
    await page.click('[data-testid="add-metric-btn"]');
    
    // Fill out the form
    await page.fill('input[name="name"]', 'Customer Satisfaction Score');
    await page.fill('textarea[name="description"]', 'Average customer satisfaction rating');
    await page.fill('input[name="target"]', '4.5');
    await page.fill('input[name="current"]', '4.2');
    await page.fill('input[name="unit"]', 'rating');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify KPI was created
    await expect(page.locator('[data-testid="metric-item"]')).toContainText('Customer Satisfaction Score');
    await expect(page.locator('[data-testid="metric-item"]')).toContainText('4.2 / 4.5');
    await expect(page.locator('[data-testid="metric-item"]')).toContainText('rating');
  });

  test('should view KPI details', async ({ page }) => {
    // Create a KPI first
    await page.click('[data-testid="add-metric-btn"]');
    await page.fill('input[name="name"]', 'Revenue Growth');
    await page.fill('textarea[name="description"]', 'Monthly revenue growth percentage');
    await page.fill('input[name="target"]', '15');
    await page.fill('input[name="current"]', '12');
    await page.fill('input[name="unit"]', '%');
    await page.click('button[type="submit"]');
    
    // Click on the KPI to view details
    await page.click('[data-testid="metric-item"]:has-text("Revenue Growth")');
    
    // Verify detail page elements
    await expect(page.locator('h1')).toContainText('Revenue Growth');
    await expect(page.locator('[data-testid="metric-description"]')).toContainText('Monthly revenue growth percentage');
    await expect(page.locator('[data-testid="metric-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-history"]')).toBeVisible();
  });

  test('should edit KPI', async ({ page }) => {
    // Create a KPI first
    await page.click('[data-testid="add-metric-btn"]');
    await page.fill('input[name="name"]', 'Original Metric');
    await page.fill('textarea[name="description"]', 'Original description');
    await page.fill('input[name="target"]', '100');
    await page.fill('input[name="current"]', '80');
    await page.fill('input[name="unit"]', 'units');
    await page.click('button[type="submit"]');
    
    // Click edit button
    await page.click('[data-testid="edit-metric-btn"]');
    
    // Update the form
    await page.fill('input[name="name"]', 'Updated Metric');
    await page.fill('textarea[name="description"]', 'Updated description with new target');
    await page.fill('input[name="target"]', '120');
    await page.fill('input[name="current"]', '95');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify changes
    await expect(page.locator('[data-testid="metric-item"]')).toContainText('Updated Metric');
    await expect(page.locator('[data-testid="metric-item"]')).toContainText('95 / 120');
  });

  test('should delete KPI', async ({ page }) => {
    // Create a KPI first
    await page.click('[data-testid="add-metric-btn"]');
    await page.fill('input[name="name"]', 'Metric to Delete');
    await page.fill('textarea[name="description"]', 'This metric will be deleted');
    await page.fill('input[name="target"]', '50');
    await page.fill('input[name="current"]', '30');
    await page.fill('input[name="unit"]', 'count');
    await page.click('button[type="submit"]');
    
    // Click delete button
    await page.click('[data-testid="delete-metric-btn"]');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete-btn"]');
    
    // Verify KPI is removed
    await expect(page.locator('[data-testid="metric-item"]:has-text("Metric to Delete")')).not.toBeVisible();
  });

  test('should update KPI current value', async ({ page }) => {
    // Create a KPI first
    await page.click('[data-testid="add-metric-btn"]');
    await page.fill('input[name="name"]', 'Updatable Metric');
    await page.fill('input[name="target"]', '100');
    await page.fill('input[name="current"]', '75');
    await page.fill('input[name="unit"]', 'points');
    await page.click('button[type="submit"]');
    
    // Click on the KPI to view details
    await page.click('[data-testid="metric-item"]:has-text("Updatable Metric")');
    
    // Update current value
    await page.click('[data-testid="update-value-btn"]');
    await page.fill('input[name="current"]', '85');
    await page.fill('textarea[name="notes"]', 'Improved performance this month');
    await page.click('button[type="submit"]');
    
    // Verify value was updated
    await expect(page.locator('[data-testid="metric-current"]')).toContainText('85');
    await expect(page.locator('[data-testid="update-notes"]')).toContainText('Improved performance this month');
  });

  test('should handle validation errors', async ({ page }) => {
    // Click add metric button
    await page.click('[data-testid="add-metric-btn"]');
    
    // Try to submit without required fields
    await page.click('button[type="submit"]');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="name-error"]')).toContainText('Name is required');
    await expect(page.locator('[data-testid="target-error"]')).toContainText('Target is required');
  });

  test('should display KPI progress indicators', async ({ page }) => {
    // Create KPIs with different progress levels
    const metrics = [
      { name: 'High Performance', target: '100', current: '95', expectedColor: 'green' },
      { name: 'Medium Performance', target: '100', current: '70', expectedColor: 'yellow' },
      { name: 'Low Performance', target: '100', current: '40', expectedColor: 'red' }
    ];
    
    for (const metric of metrics) {
      await page.click('[data-testid="add-metric-btn"]');
      await page.fill('input[name="name"]', metric.name);
      await page.fill('input[name="target"]', metric.target);
      await page.fill('input[name="current"]', metric.current);
      await page.fill('input[name="unit"]', '%');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // Verify progress indicators
    await expect(page.locator('[data-testid="metric-item"]:has-text("High Performance") [data-testid="progress-indicator"]')).toHaveClass(/green/);
    await expect(page.locator('[data-testid="metric-item"]:has-text("Medium Performance") [data-testid="progress-indicator"]')).toHaveClass(/yellow/);
    await expect(page.locator('[data-testid="metric-item"]:has-text("Low Performance") [data-testid="progress-indicator"]')).toHaveClass(/red/);
  });

  test('should filter KPIs by performance', async ({ page }) => {
    // Create multiple KPIs
    const metrics = [
      { name: 'Above Target', target: '100', current: '110' },
      { name: 'On Target', target: '100', current: '100' },
      { name: 'Below Target', target: '100', current: '80' }
    ];
    
    for (const metric of metrics) {
      await page.click('[data-testid="add-metric-btn"]');
      await page.fill('input[name="name"]', metric.name);
      await page.fill('input[name="target"]', metric.target);
      await page.fill('input[name="current"]', metric.current);
      await page.fill('input[name="unit"]', 'units');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // Filter by performance
    await page.selectOption('[data-testid="performance-filter"]', 'above-target');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="metric-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="metric-item"]')).toContainText('Above Target');
  });
});
