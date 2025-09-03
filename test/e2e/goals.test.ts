import { test, expect } from '@playwright/test';
import { setupTestUser, cleanupTestData } from '../helpers/auth';

test.describe('Goals CRUD Operations', () => {
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
    
    // Create a business unit and stakeholder for goal tests
    await page.click('[data-testid="create-business-unit-btn"]');
    await page.fill('input[name="name"]', 'Test Business Unit');
    await page.fill('textarea[name="description"]', 'Unit for goal testing');
    await page.click('button[type="submit"]');
    
    // Navigate to business unit detail
    await page.click('[data-testid="business-unit-item"]:has-text("Test Business Unit")');
    
    // Create a stakeholder for goal assignment
    await page.click('[data-testid="add-stakeholder-btn"]');
    await page.fill('input[name="name"]', 'Goal Owner');
    await page.fill('input[name="email"]', 'owner@example.com');
    await page.fill('input[name="role"]', 'Manager');
    await page.click('button[type="submit"]');
  });

  test.afterEach(async () => {
    await cleanupTestData(testUserId);
  });

  test('should display goals section', async ({ page }) => {
    await expect(page.locator('[data-testid="goals-section"]')).toBeVisible();
    await expect(page.locator('h3')).toContainText('Goals');
  });

  test('should create a new goal', async ({ page }) => {
    // Click add goal button
    await page.click('[data-testid="add-goal-btn"]');
    
    // Fill out the form
    await page.fill('input[name="title"]', 'Increase Revenue');
    await page.fill('textarea[name="description"]', 'Increase quarterly revenue by 20%');
    await page.selectOption('select[name="quarter"]', 'Q1');
    await page.fill('input[name="year"]', '2025');
    await page.selectOption('select[name="stakeholderId"]', { label: 'Goal Owner' });
    await page.selectOption('select[name="status"]', 'IN_PROGRESS');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify goal was created
    await expect(page.locator('[data-testid="goal-item"]')).toContainText('Increase Revenue');
    await expect(page.locator('[data-testid="goal-item"]')).toContainText('Q1 2025');
    await expect(page.locator('[data-testid="goal-item"]')).toContainText('IN_PROGRESS');
  });

  test('should view goal details', async ({ page }) => {
    // Create a goal first
    await page.click('[data-testid="add-goal-btn"]');
    await page.fill('input[name="title"]', 'Improve Efficiency');
    await page.fill('textarea[name="description"]', 'Reduce processing time by 30%');
    await page.selectOption('select[name="quarter"]', 'Q2');
    await page.fill('input[name="year"]', '2025');
    await page.click('button[type="submit"]');
    
    // Click on the goal to view details
    await page.click('[data-testid="goal-item"]:has-text("Improve Efficiency")');
    
    // Verify detail page elements
    await expect(page.locator('h1')).toContainText('Improve Efficiency');
    await expect(page.locator('[data-testid="goal-description"]')).toContainText('Reduce processing time by 30%');
    await expect(page.locator('[data-testid="goal-quarter"]')).toContainText('Q2 2025');
    await expect(page.locator('[data-testid="goal-progress"]')).toBeVisible();
  });

  test('should edit goal', async ({ page }) => {
    // Create a goal first
    await page.click('[data-testid="add-goal-btn"]');
    await page.fill('input[name="title"]', 'Original Goal');
    await page.fill('textarea[name="description"]', 'Original description');
    await page.selectOption('select[name="quarter"]', 'Q1');
    await page.fill('input[name="year"]', '2025');
    await page.click('button[type="submit"]');
    
    // Click edit button
    await page.click('[data-testid="edit-goal-btn"]');
    
    // Update the form
    await page.fill('input[name="title"]', 'Updated Goal');
    await page.fill('textarea[name="description"]', 'Updated description');
    await page.selectOption('select[name="status"]', 'COMPLETED');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify changes
    await expect(page.locator('[data-testid="goal-item"]')).toContainText('Updated Goal');
    await expect(page.locator('[data-testid="goal-item"]')).toContainText('COMPLETED');
  });

  test('should delete goal', async ({ page }) => {
    // Create a goal first
    await page.click('[data-testid="add-goal-btn"]');
    await page.fill('input[name="title"]', 'Goal to Delete');
    await page.fill('textarea[name="description"]', 'This goal will be deleted');
    await page.selectOption('select[name="quarter"]', 'Q3');
    await page.fill('input[name="year"]', '2025');
    await page.click('button[type="submit"]');
    
    // Click delete button
    await page.click('[data-testid="delete-goal-btn"]');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete-btn"]');
    
    // Verify goal is removed
    await expect(page.locator('[data-testid="goal-item"]:has-text("Goal to Delete")')).not.toBeVisible();
  });

  test('should update goal progress', async ({ page }) => {
    // Create a goal first
    await page.click('[data-testid="add-goal-btn"]');
    await page.fill('input[name="title"]', 'Progress Goal');
    await page.selectOption('select[name="quarter"]', 'Q1');
    await page.fill('input[name="year"]', '2025');
    await page.click('button[type="submit"]');
    
    // Click on the goal to view details
    await page.click('[data-testid="goal-item"]:has-text("Progress Goal")');
    
    // Add progress notes
    await page.click('[data-testid="add-progress-btn"]');
    await page.fill('textarea[name="progressNotes"]', 'Made significant progress this week');
    await page.click('button[type="submit"]');
    
    // Verify progress was added
    await expect(page.locator('[data-testid="progress-notes"]')).toContainText('Made significant progress this week');
  });

  test('should handle validation errors', async ({ page }) => {
    // Click add goal button
    await page.click('[data-testid="add-goal-btn"]');
    
    // Try to submit without required fields
    await page.click('button[type="submit"]');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="title-error"]')).toContainText('Title is required');
    await expect(page.locator('[data-testid="quarter-error"]')).toContainText('Quarter is required');
    await expect(page.locator('[data-testid="year-error"]')).toContainText('Year is required');
  });

  test('should filter goals by status', async ({ page }) => {
    // Create multiple goals with different statuses
    const goals = [
      { title: 'Not Started Goal', status: 'NOT_STARTED' },
      { title: 'In Progress Goal', status: 'IN_PROGRESS' },
      { title: 'Completed Goal', status: 'COMPLETED' }
    ];
    
    for (const goal of goals) {
      await page.click('[data-testid="add-goal-btn"]');
      await page.fill('input[name="title"]', goal.title);
      await page.selectOption('select[name="quarter"]', 'Q1');
      await page.fill('input[name="year"]', '2025');
      await page.selectOption('select[name="status"]', goal.status);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // Filter by status
    await page.selectOption('[data-testid="status-filter"]', 'IN_PROGRESS');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="goal-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="goal-item"]')).toContainText('In Progress Goal');
  });

  test('should filter goals by quarter', async ({ page }) => {
    // Create goals for different quarters
    const goals = [
      { title: 'Q1 Goal', quarter: 'Q1' },
      { title: 'Q2 Goal', quarter: 'Q2' },
      { title: 'Q3 Goal', quarter: 'Q3' }
    ];
    
    for (const goal of goals) {
      await page.click('[data-testid="add-goal-btn"]');
      await page.fill('input[name="title"]', goal.title);
      await page.selectOption('select[name="quarter"]', goal.quarter);
      await page.fill('input[name="year"]', '2025');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // Filter by quarter
    await page.selectOption('[data-testid="quarter-filter"]', 'Q2');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="goal-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="goal-item"]')).toContainText('Q2 Goal');
  });
});
