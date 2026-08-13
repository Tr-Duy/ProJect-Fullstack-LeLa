import { test, expect } from '../fixtures/auth';

// The shared auth fixture is seeded with the learner storage state in .auth/user.json.
// These tests verify admin routes remain protected for non-admin users.

test.describe('Admin route protections for learner users', () => {
  test('admin dashboard redirects to unauthorized for learner users', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/unauthorized/);
    await expect(page.getByText(/Unauthorized/i)).toBeVisible();
  });

  test('admin decks route redirects to unauthorized for learner users', async ({ page }) => {
    await page.goto('/admin/decks');
    await expect(page).toHaveURL(/\/unauthorized/);
    await expect(page.getByText(/Unauthorized/i)).toBeVisible();
  });

  test('admin quizzes route redirects to unauthorized for learner users', async ({ page }) => {
    await page.goto('/admin/quizzes');
    await expect(page).toHaveURL(/\/unauthorized/);
    await expect(page.getByText(/Unauthorized/i)).toBeVisible();
  });
});
