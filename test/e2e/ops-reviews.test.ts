import { test, expect } from '@playwright/test';
import { setupTestUser, cleanupTestData } from '../helpers/auth';

test.describe('Ops Reviews CRUD Operations', () => {
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
  });

  test.afterEach(async () => {
    await cleanupTestData(testUserId);
  });

  test('should display ops reviews list page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Ops Reviews');
    await expect(page.locator('[data-testid="ops-reviews-list"]')).toBeVisible();
  });

  test('should create a new ops review', async ({ page }) => {
    // Click create ops review button
    await page.click('[data-testid="create-ops-review-btn"]');
    
    // Fill out the form
    await page.fill('input[name="title"]', 'Q1 2025 Operations Review');
    await page.fill('textarea[name="description"]', 'Quarterly review of operational performance');
    await page.selectOption('select[name="quarter"]', 'Q1');
    await page.fill('input[name="year"]', '2025');
    await page.selectOption('select[name="month"]', '3');
    await page.selectOption('select[name="status"]', 'IN_PROGRESS');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify ops review was created
    await expect(page.locator('[data-testid="ops-review-item"]')).toContainText('Q1 2025 Operations Review');
    await expect(page.locator('[data-testid="ops-review-item"]')).toContainText('Q1 2025');
    await expect(page.locator('[data-testid="ops-review-item"]')).toContainText('IN_PROGRESS');
  });

  test('should view ops review details', async ({ page }) => {
    // Create an ops review first
    await page.click('[data-testid="create-ops-review-btn"]');
    await page.fill('input[name="title"]', 'Engineering Operations Review');
    await page.fill('textarea[name="description"]', 'Review of engineering team operations');
    await page.selectOption('select[name="quarter"]', 'Q2');
    await page.fill('input[name="year"]', '2025');
    await page.click('button[type="submit"]');
    
    // Click on the ops review to view details
    await page.click('[data-testid="ops-review-item"]:has-text("Engineering Operations Review")');
    
    // Verify detail page elements
    await expect(page.locator('h1')).toContainText('Engineering Operations Review');
    await expect(page.locator('[data-testid="ops-review-description"]')).toContainText('Review of engineering team operations');
    await expect(page.locator('[data-testid="ops-review-quarter"]')).toContainText('Q2 2025');
    await expect(page.locator('[data-testid="review-items-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-summary"]')).toBeVisible();
  });

  test('should edit ops review', async ({ page }) => {
    // Create an ops review first
    await page.click('[data-testid="create-ops-review-btn"]');
    await page.fill('input[name="title"]', 'Original Review');
    await page.fill('textarea[name="description"]', 'Original description');
    await page.selectOption('select[name="quarter"]', 'Q1');
    await page.fill('input[name="year"]', '2025');
    await page.click('button[type="submit"]');
    
    // Click on the ops review to view details
    await page.click('[data-testid="ops-review-item"]:has-text("Original Review")');
    
    // Click edit button
    await page.click('[data-testid="edit-ops-review-btn"]');
    
    // Update the form
    await page.fill('input[name="title"]', 'Updated Operations Review');
    await page.fill('textarea[name="description"]', 'Updated description with new scope');
    await page.selectOption('select[name="status"]', 'COMPLETED');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify changes
    await expect(page.locator('h1')).toContainText('Updated Operations Review');
    await expect(page.locator('[data-testid="ops-review-description"]')).toContainText('Updated description with new scope');
    await expect(page.locator('[data-testid="ops-review-status"]')).toContainText('COMPLETED');
  });

  test('should delete ops review', async ({ page }) => {
    // Create an ops review first
    await page.click('[data-testid="create-ops-review-btn"]');
    await page.fill('input[name="title"]', 'Review to Delete');
    await page.fill('textarea[name="description"]', 'This review will be deleted');
    await page.selectOption('select[name="quarter"]', 'Q3');
    await page.fill('input[name="year"]', '2025');
    await page.click('button[type="submit"]');
    
    // Click on the ops review to view details
    await page.click('[data-testid="ops-review-item"]:has-text("Review to Delete")');
    
    // Click delete button
    await page.click('[data-testid="delete-ops-review-btn"]');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete-btn"]');
    
    // Verify ops review is removed
    await expect(page.locator('[data-testid="ops-review-item"]:has-text("Review to Delete")')).not.toBeVisible();
  });

  test('should handle validation errors', async ({ page }) => {
    // Click create ops review button
    await page.click('[data-testid="create-ops-review-btn"]');
    
    // Try to submit without required fields
    await page.click('button[type="submit"]');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="title-error"]')).toContainText('Title is required');
    await expect(page.locator('[data-testid="quarter-error"]')).toContainText('Quarter is required');
    await expect(page.locator('[data-testid="year-error"]')).toContainText('Year is required');
  });

  test('should filter ops reviews by quarter', async ({ page }) => {
    // Create multiple ops reviews for different quarters
    const reviews = [
      { title: 'Q1 Review', quarter: 'Q1' },
      { title: 'Q2 Review', quarter: 'Q2' },
      { title: 'Q3 Review', quarter: 'Q3' }
    ];
    
    for (const review of reviews) {
      await page.click('[data-testid="create-ops-review-btn"]');
      await page.fill('input[name="title"]', review.title);
      await page.selectOption('select[name="quarter"]', review.quarter);
      await page.fill('input[name="year"]', '2025');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // Filter by quarter
    await page.selectOption('[data-testid="quarter-filter"]', 'Q2');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="ops-review-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="ops-review-item"]')).toContainText('Q2 Review');
  });

  test('should filter ops reviews by status', async ({ page }) => {
    // Create multiple ops reviews with different statuses
    const reviews = [
      { title: 'Draft Review', status: 'DRAFT' },
      { title: 'Active Review', status: 'IN_PROGRESS' },
      { title: 'Final Review', status: 'COMPLETED' }
    ];
    
    for (const review of reviews) {
      await page.click('[data-testid="create-ops-review-btn"]');
      await page.fill('input[name="title"]', review.title);
      await page.selectOption('select[name="quarter"]', 'Q1');
      await page.fill('input[name="year"]', '2025');
      await page.selectOption('select[name="status"]', review.status);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // Filter by status
    await page.selectOption('[data-testid="status-filter"]', 'IN_PROGRESS');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="ops-review-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="ops-review-item"]')).toContainText('Active Review');
  });

  test('should search ops reviews by title', async ({ page }) => {
    // Create multiple ops reviews
    const titles = ['Engineering Review', 'Marketing Review', 'Engineering Analysis'];
    
    for (const title of titles) {
      await page.click('[data-testid="create-ops-review-btn"]');
      await page.fill('input[name="title"]', title);
      await page.selectOption('select[name="quarter"]', 'Q1');
      await page.fill('input[name="year"]', '2025');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // Search for reviews
    await page.fill('[data-testid="search-input"]', 'Engineering');
    
    // Verify search results
    await expect(page.locator('[data-testid="ops-review-item"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="ops-review-item"]')).toContainText('Engineering Review');
    await expect(page.locator('[data-testid="ops-review-item"]')).toContainText('Engineering Analysis');
  });

  test('should assign team to ops review', async ({ page }) => {
    // Create an ops review first
    await page.click('[data-testid="create-ops-review-btn"]');
    await page.fill('input[name="title"]', 'Team-Assigned Review');
    await page.selectOption('select[name="quarter"]', 'Q1');
    await page.fill('input[name="year"]', '2025');
    await page.click('button[type="submit"]');
    
    // Click on the ops review to view details
    await page.click('[data-testid="ops-review-item"]:has-text("Team-Assigned Review")');
    
    // Assign team
    await page.click('[data-testid="assign-team-btn"]');
    await page.selectOption('select[name="teamId"]', { label: 'Engineering Team' });
    await page.click('button[type="submit"]');
    
    // Verify team assignment
    await expect(page.locator('[data-testid="assigned-team"]')).toContainText('Engineering Team');
  });
});
