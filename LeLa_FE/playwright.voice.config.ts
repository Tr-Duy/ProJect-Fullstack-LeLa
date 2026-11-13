import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/voice', workers: 1, retries: 0,
  reporter: 'list', use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173',
    channel: 'chrome', headless: true },
});
