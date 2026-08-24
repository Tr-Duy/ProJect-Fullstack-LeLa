import { test, expect } from '@playwright/test';

import { LoginPage } from '../page-objects/login.page';
import { LandingPage } from '../page-objects/landing.page';

test.describe('Authentication flows', () => {
  test.use({ storageState: { cookies: [], origins: [] } });


  test('landing page renders and login page is reachable', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.open();
    await landing.expectHeroVisible();
    await landing.goToLogin();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Đăng Nhập', exact: true })).toBeVisible();

  });

  test('login with valid credentials redirects learner dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login(process.env.PLAYWRIGHT_USERNAME || 'learner1', process.env.PLAYWRIGHT_PASSWORD || '123456');
    await expect(page).toHaveURL(/\/dashboard|\/admin\/dashboard|\/onboarding/);
  });


  test('login with invalid credentials stays on the login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login('wrong-user', 'wrong-pass');
    await expect(page).toHaveURL(/\/login/);
  });
});
