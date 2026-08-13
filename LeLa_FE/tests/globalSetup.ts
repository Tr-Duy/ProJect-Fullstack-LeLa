import { mkdirSync } from 'node:fs';
import process from 'node:process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import type { FullConfig } from '@playwright/test';

const storagePath = fileURLToPath(new URL('../.auth/user.json', import.meta.url));

async function globalSetup(config: FullConfig) {
  mkdirSync(dirname(storagePath), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const baseURL = config.projects[0]?.use?.baseURL;
  const loginUrl = typeof baseURL === 'string'
    ? new URL('/login', baseURL).toString()
    : 'http://localhost:5173/login';

  await page.goto(loginUrl);
  await page.getByLabel(/Tên đăng nhập hoặc Email/i).fill(process.env.PLAYWRIGHT_USERNAME || 'doantruongduy8');
  await page.getByLabel(/Mật khẩu/i).fill(process.env.PLAYWRIGHT_PASSWORD || '123456');
  await page.getByRole('button', { name: /Đăng Nhập/i }).click();
  await page.waitForURL(/dashboard|admin\/dashboard/, { timeout: 15000 });
  await context.storageState({ path: storagePath });
  await browser.close();
}

export default globalSetup;
