import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const storagePath = fileURLToPath(new URL('./.auth/user.json', import.meta.url));

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  globalSetup: './tests/globalSetup.ts',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: storagePath },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: storagePath },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: storagePath },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 0.0.0.0 --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
