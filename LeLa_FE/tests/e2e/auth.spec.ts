import { test, expect } from '../fixtures/auth';
import { LoginPage } from '../page-objects/login.page';
import { LandingPage } from '../page-objects/landing.page';

test.describe('Authentication flows', () => {
  test('landing page renders and login page is reachable', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.open();
    await landing.expectHeroVisible();
    await landing.goToLogin();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: /Đăng Nhập/i })).toBeVisible();
  });

  test('login with valid credentials redirects learner dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login('doantruongduy8', '123456');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('login with invalid credentials stays on the login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login('wrong-user', 'wrong-pass');
    await expect(page).toHaveURL(/\/login/);
  });
});
