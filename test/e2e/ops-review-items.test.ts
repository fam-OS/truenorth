import { test, expect } from '@playwright/test';
import { setupTestUser, cleanupTestData } from '../helpers/auth';

test.describe('Ops Review Items CRUD Operations', () => {
  let testUserId: string;
  let companyAccountId: string;

  test.beforeEach(async ({ page }) => {
    const testUser = await setupTestUser();
    testUserId = testUser.id;
    companyAccountId = testUser.companyAccountId;
    
    // Login and navigate to ops reviews page
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.goto('/ops-reviews');
    
    // Create an ops review for testing review items
    await page.click('[data-testid="create-ops-review-btn"]');
    await page.fill('input[name="title"]', 'Test Ops Review');
    await page.fill('textarea[name="description"]', 'Review for testing items');
    await page.selectOption('select[name="quarter"]', 'Q1');
    await page.fill('input[name="year"]', '2025');
    await page.click('button[type="submit"]');
    
    // Navigate to ops review detail
    await page.click('[data-testid="ops-review-item"]:has-text("Test Ops Review")');
  });

  test.afterEach(async () => {
    await cleanupTestData(testUserId);
  });

  test('should display review items section', async ({ page }) => {
    await expect(page.locator('[data-testid="review-items-section"]')).toBeVisible();
    await expect(page.locator('h3')).toContainText('Review Items');
  });

  test('should create a new review item', async ({ page }) => {
    // Click add review item button
    await page.click('[data-testid="add-review-item-btn"]');
    
    // Fill out the form
    await page.fill('input[name="title"]', 'System Performance Analysis');
    await page.fill('textarea[name="description"]', 'Analyze system performance metrics and identify bottlenecks');
    await page.selectOption('select[name="category"]', 'PERFORMANCE');
    await page.selectOption('select[name="priority"]', 'HIGH');
    await page.selectOption('select[name="status"]', 'IN_PROGRESS');
    await page.fill('textarea[name="findings"]', 'Initial analysis shows CPU utilization spikes during peak hours');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify review item was created
    await expect(page.locator('[data-testid="review-item"]')).toContainText('System Performance Analysis');
    await expect(page.locator('[data-testid="review-item"]')).toContainText('PERFORMANCE');
    await expect(page.locator('[data-testid="review-item"]')).toContainText('HIGH');
    await expect(page.locator('[data-testid="review-item"]')).toContainText('IN_PROGRESS');
  });

  test('should view review item details', async ({ page }) => {
    // Create a review item first
    await page.click('[data-testid="add-review-item-btn"]');
    await page.fill('input[name="title"]', 'Security Audit Results');
    await page.fill('textarea[name="description"]', 'Review security audit findings and recommendations');
    await page.selectOption('select[name="category"]', 'SECURITY');
    await page.selectOption('select[name="priority"]', 'CRITICAL');
    await page.fill('textarea[name="findings"]', 'Found 3 critical vulnerabilities that need immediate attention');
    await page.click('button[type="submit"]');
    
    // Click on the review item to view details
    await page.click('[data-testid="review-item"]:has-text("Security Audit Results")');
    
    // Verify detail page elements
    await expect(page.locator('h2')).toContainText('Security Audit Results');
    await expect(page.locator('[data-testid="item-description"]')).toContainText('Review security audit findings');
    await expect(page.locator('[data-testid="item-category"]')).toContainText('SECURITY');
    await expect(page.locator('[data-testid="item-findings"]')).toContainText('Found 3 critical vulnerabilities');
    await expect(page.locator('[data-testid="action-items-section"]')).toBeVisible();
  });

  test('should edit review item', async ({ page }) => {
    // Create a review item first
    await page.click('[data-testid="add-review-item-btn"]');
    await page.fill('input[name="title"]', 'Original Item');
    await page.fill('textarea[name="description"]', 'Original description');
    await page.selectOption('select[name="category"]', 'PROCESS');
    await page.selectOption('select[name="priority"]', 'MEDIUM');
    await page.click('button[type="submit"]');
    
    // Click edit button
    await page.click('[data-testid="edit-review-item-btn"]');
    
    // Update the form
    await page.fill('input[name="title"]', 'Updated Review Item');
    await page.fill('textarea[name="description"]', 'Updated description with new scope');
    await page.selectOption('select[name="priority"]', 'HIGH');
    await page.selectOption('select[name="status"]', 'COMPLETED');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify changes
    await expect(page.locator('[data-testid="review-item"]')).toContainText('Updated Review Item');
    await expect(page.locator('[data-testid="review-item"]')).toContainText('HIGH');
    await expect(page.locator('[data-testid="review-item"]')).toContainText('COMPLETED');
  });

  test('should delete review item', async ({ page }) => {
    // Create a review item first
    await page.click('[data-testid="add-review-item-btn"]');
    await page.fill('input[name="title"]', 'Item to Delete');
    await page.fill('textarea[name="description"]', 'This item will be deleted');
    await page.selectOption('select[name="category"]', 'OTHER');
    await page.selectOption('select[name="priority"]', 'LOW');
    await page.click('button[type="submit"]');
    
    // Click delete button
    await page.click('[data-testid="delete-review-item-btn"]');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete-btn"]');
    
    // Verify review item is removed
    await expect(page.locator('[data-testid="review-item"]:has-text("Item to Delete")')).not.toBeVisible();
  });

  test('should add action items to review item', async ({ page }) => {
    // Create a review item first
    await page.click('[data-testid="add-review-item-btn"]');
    await page.fill('input[name="title"]', 'Item with Actions');
    await page.fill('textarea[name="description"]', 'Review item that needs follow-up actions');
    await page.selectOption('select[name="category"]', 'PROCESS');
    await page.click('button[type="submit"]');
    
    // Click on the review item to view details
    await page.click('[data-testid="review-item"]:has-text("Item with Actions")');
    
    // Add action item
    await page.click('[data-testid="add-action-item-btn"]');
    await page.fill('input[name="actionTitle"]', 'Update documentation');
    await page.fill('textarea[name="actionDescription"]', 'Update process documentation based on findings');
    await page.fill('input[name="dueDate"]', '2025-03-15');
    await page.selectOption('select[name="assigneeId"]', { label: 'Team Lead' });
    await page.click('button[type="submit"]');
    
    // Verify action item was added
    await expect(page.locator('[data-testid="action-item"]')).toContainText('Update documentation');
    await expect(page.locator('[data-testid="action-item"]')).toContainText('2025-03-15');
  });

  test('should handle validation errors', async ({ page }) => {
    // Click add review item button
    await page.click('[data-testid="add-review-item-btn"]');
    
    // Try to submit without required fields
    await page.click('button[type="submit"]');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="title-error"]')).toContainText('Title is required');
    await expect(page.locator('[data-testid="category-error"]')).toContainText('Category is required');
    await expect(page.locator('[data-testid="priority-error"]')).toContainText('Priority is required');
  });

  test('should filter review items by category', async ({ page }) => {
    // Create multiple review items with different categories
    const items = [
      { title: 'Performance Item', category: 'PERFORMANCE' },
      { title: 'Security Item', category: 'SECURITY' },
      { title: 'Process Item', category: 'PROCESS' }
    ];
    
    for (const item of items) {
      await page.click('[data-testid="add-review-item-btn"]');
      await page.fill('input[name="title"]', item.title);
      await page.selectOption('select[name="category"]', item.category);
      await page.selectOption('select[name="priority"]', 'MEDIUM');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // Filter by category
    await page.selectOption('[data-testid="category-filter"]', 'SECURITY');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="review-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="review-item"]')).toContainText('Security Item');
  });

  test('should filter review items by priority', async ({ page }) => {
    // Create multiple review items with different priorities
    const items = [
      { title: 'Critical Item', priority: 'CRITICAL' },
      { title: 'High Item', priority: 'HIGH' },
      { title: 'Low Item', priority: 'LOW' }
    ];
    
    for (const item of items) {
      await page.click('[data-testid="add-review-item-btn"]');
      await page.fill('input[name="title"]', item.title);
      await page.selectOption('select[name="category"]', 'OTHER');
      await page.selectOption('select[name="priority"]', item.priority);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // Filter by priority
    await page.selectOption('[data-testid="priority-filter"]', 'CRITICAL');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="review-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="review-item"]')).toContainText('Critical Item');
  });

  test('should filter review items by status', async ({ page }) => {
    // Create multiple review items with different statuses
    const items = [
      { title: 'Pending Item', status: 'PENDING' },
      { title: 'Active Item', status: 'IN_PROGRESS' },
      { title: 'Done Item', status: 'COMPLETED' }
    ];
    
    for (const item of items) {
      await page.click('[data-testid="add-review-item-btn"]');
      await page.fill('input[name="title"]', item.title);
      await page.selectOption('select[name="category"]', 'OTHER');
      await page.selectOption('select[name="priority"]', 'MEDIUM');
      await page.selectOption('select[name="status"]', item.status);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // Filter by status
    await page.selectOption('[data-testid="status-filter"]', 'IN_PROGRESS');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="review-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="review-item"]')).toContainText('Active Item');
  });

  test('should update review item status', async ({ page }) => {
    // Create a review item first
    await page.click('[data-testid="add-review-item-btn"]');
    await page.fill('input[name="title"]', 'Status Update Item');
    await page.selectOption('select[name="category"]', 'PROCESS');
    await page.selectOption('select[name="priority"]', 'MEDIUM');
    await page.selectOption('select[name="status"]', 'PENDING');
    await page.click('button[type="submit"]');
    
    // Update status
    await page.click('[data-testid="update-status-btn"]');
    await page.selectOption('select[name="status"]', 'COMPLETED');
    await page.fill('textarea[name="statusNotes"]', 'All issues have been resolved');
    await page.click('button[type="submit"]');
    
    // Verify status was updated
    await expect(page.locator('[data-testid="review-item"]')).toContainText('COMPLETED');
    await expect(page.locator('[data-testid="status-notes"]')).toContainText('All issues have been resolved');
  });
});
