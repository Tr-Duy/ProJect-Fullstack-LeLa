import { defineConfig, devices } from '@playwright/test';

// Use E2E credentials, or an existing state via PLAYWRIGHT_STORAGE_STATE.
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'dashboard-runtime.spec.ts',
  workers: 1,
  retries: 0,
  reporter: 'list',
  globalSetup: process.env.PLAYWRIGHT_USERNAME && process.env.PLAYWRIGHT_PASSWORD
    ? './tests/globalSetup.ts'
    : undefined,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    storageState: process.env.PLAYWRIGHT_STORAGE_STATE || '.auth/user.json',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium' },
    { name: 'chrome', use: { channel: 'chrome' } },
  ],
});
