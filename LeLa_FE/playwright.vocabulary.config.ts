import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/vocabulary', workers: 1, retries: 0, reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5173', channel: 'chrome', headless: true },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5173', url: 'http://127.0.0.1:5173', reuseExistingServer: true },
});
