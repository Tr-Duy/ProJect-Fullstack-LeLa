import { mkdirSync } from 'node:fs';
import process from 'node:process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import type { FullConfig } from '@playwright/test';

const storagePath = fileURLToPath(new URL('../.auth/user.json', import.meta.url));

async function globalSetup(config: FullConfig) {
  const username = process.env.PLAYWRIGHT_USERNAME;
  const password = process.env.PLAYWRIGHT_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'Missing PLAYWRIGHT_USERNAME or PLAYWRIGHT_PASSWORD environment variables for Playwright global setup.'
    );
  }

  mkdirSync(dirname(storagePath), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const baseURL = config.projects[0]?.use?.baseURL;
  const loginUrl = typeof baseURL === 'string'
    ? new URL('/login', baseURL).toString()
    : 'http://localhost:5173/login';

  await page.goto(loginUrl);
  console.log(`[globalSetup] Navigated to login URL: ${page.url()}`);

  await page.getByLabel(/Tên đăng nhập hoặc Email/i).fill(username);
  await page.getByLabel(/Mật khẩu/i).fill(password);

  console.log(`[globalSetup] Submitting login form for user: '${username}'`);

  const loginResponsePromise = page.waitForResponse(
    (res) => res.url().includes('/auth/login'),
    { timeout: 15000 }
  ).catch(() => null);

  await page.getByRole('button', { name: 'Đăng Nhập', exact: true }).click();

  const response = await loginResponsePromise;
  if (response) {
    console.log(`[globalSetup] Login API Response Status: ${response.status()}`);
    if (!response.ok()) {
      const errorText = await response.text().catch(() => '');
      console.error(`[globalSetup] Login API error response: ${errorText}`);
    }
  } else {
    console.error(
      '[globalSetup] No response received from Backend API (/auth/login). Ensure the Spring Boot backend server is running on http://localhost:8080.'
    );
  }

  console.log(`[globalSetup] Current URL after submit: ${page.url()}`);

  try {
    await page.waitForURL(/dashboard|admin\/dashboard|onboarding/, { timeout: 15000 });
    console.log(`[globalSetup] Successfully redirected to authenticated URL: ${page.url()}`);
  } catch (err: any) {
    const pageText = await page.innerText('body').catch(() => '');
    console.error(`[globalSetup] Navigation failed. Current URL: ${page.url()}. Page content snippet: ${pageText.slice(0, 300)}`);
    throw err;
  }

  await context.storageState({ path: storagePath });
  await browser.close();
}

export default globalSetup;
