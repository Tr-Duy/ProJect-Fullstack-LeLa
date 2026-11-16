import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/tutor', workers: 1, retries: 0, reporter: 'list', timeout: 45_000,
  use: { ...devices['Desktop Chrome'], baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev -- --host 0.0.0.0 --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
