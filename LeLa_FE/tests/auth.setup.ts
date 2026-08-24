import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { expect, test as setup } from '@playwright/test';

const authFile = fileURLToPath(new URL('../.auth/user.json', import.meta.url));

setup('authenticate', async ({ page }) => {
  const username = process.env.PLAYWRIGHT_USERNAME;
  const password = process.env.PLAYWRIGHT_PASSWORD;
  if (!username || !password) {
    throw new Error('PLAYWRIGHT_USERNAME and PLAYWRIGHT_PASSWORD environment variables are required');
  }
  await page.goto('/login');
  await page.getByLabel(/Tên đăng nhập hoặc Email/i).fill(username);
  await page.getByLabel(/Mật khẩu/i).fill(password);
  await page.getByRole('button', { name: 'Đăng Nhập', exact: true }).click();
  await expect(page).toHaveURL(/dashboard|admin\/dashboard|onboarding/);
  await page.context().storageState({ path: authFile });
});
