import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { expect, test as setup } from '@playwright/test';

const authFile = fileURLToPath(new URL('../.auth/user.json', import.meta.url));

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/Tên đăng nhập hoặc Email/i).fill(process.env.PLAYWRIGHT_USERNAME || 'doantruongduy8');
  await page.getByLabel(/Mật khẩu/i).fill(process.env.PLAYWRIGHT_PASSWORD || '123456');
  await page.getByRole('button', { name: /Đăng Nhập/i }).click();
  await expect(page).toHaveURL(/dashboard|admin\/dashboard/);
  await page.context().storageState({ path: authFile });
});
