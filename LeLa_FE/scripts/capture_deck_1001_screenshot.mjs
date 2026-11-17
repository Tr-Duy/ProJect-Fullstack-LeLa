import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const screenshotDir = path.resolve('../docs/screenshots/topic-tests');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('1. Navigating to login page...');
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // Fill credentials
  await page.fill('input#usernameOrEmail, input[name="usernameOrEmail"], input[type="text"]', 'test_batch1_user');
  await page.fill('input#password, input[name="password"], input[type="password"]', '123456');
  await page.click('button[type="submit"]');

  // Wait for navigation after login
  await page.waitForURL('http://localhost:5173/**', { timeout: 15000 });
  await page.waitForTimeout(2000);
  console.log('2. Logged in successfully, current URL:', page.url());

  // Navigate to Deck 1001
  console.log('3. Navigating to Deck 1001 Detail Page (/decks/1001)...');
  await page.goto('http://localhost:5173/decks/1001');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  // Dismiss any modal if open
  try {
    const closeBtn = page.locator('.ant-modal-close, button:has-text("Đóng"), button:has-text("Tuyệt vời"), button:has-text("OK")');
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click({ force: true });
      await page.waitForTimeout(1000);
    }
  } catch (e) {}
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  const deckPath = path.join(screenshotDir, '11_deck_1001_eligible_test.png');
  await page.screenshot({ path: deckPath, fullPage: true });
  console.log('   Saved deck 1001 detail screenshot to:', deckPath);

  await browser.close();
  console.log('Done capturing screenshot!');
}

main().catch(err => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});
