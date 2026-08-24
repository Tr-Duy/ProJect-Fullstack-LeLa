import { test, expect } from '../fixtures/auth';

// The shared auth fixture is seeded with the learner storage state in .auth/user.json.
// These tests verify admin routes remain protected for non-admin users.

test.describe('Admin route protections for learner users', () => {
  test('admin dashboard redirects to unauthorized or learner dashboard for non-admin users', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/unauthorized|\/dashboard/);
  });

  test('admin decks route redirects to unauthorized or learner dashboard for non-admin users', async ({ page }) => {
    await page.goto('/admin/decks', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/unauthorized|\/dashboard/);
  });

  test('admin quizzes route redirects to unauthorized or learner dashboard for non-admin users', async ({ page }) => {
    await page.goto('/admin/quizzes', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/unauthorized|\/dashboard/);
  });
});


