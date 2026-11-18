import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const screenshotDir = path.resolve('../docs/screenshots/topic-tests');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const username = process.env.TEST_USERNAME || process.env.TEST_USER || 'learner1';
const password = process.env.TEST_PASSWORD || process.env.PLAYWRIGHT_PASSWORD || '123456';

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
  await page.fill('input#usernameOrEmail, input[name="usernameOrEmail"], input[type="text"]', username);
  await page.fill('input#password, input[name="password"], input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for navigation after login
  await page.waitForURL('http://localhost:5173/**', { timeout: 15000 });
  await page.waitForTimeout(2000);
  console.log('2. Logged in successfully, current URL:', page.url());

  // 1. Deck 1002 (Lô 2, eligible / unlocked)
  console.log('3. Navigating to Deck 1002 (/decks/1002)...');
  await page.goto('http://localhost:5173/decks/1002');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  try {
    const closeBtn = page.locator('.ant-modal-close, button:has-text("Đóng"), button:has-text("Tuyệt vời"), button:has-text("OK")');
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click({ force: true });
      await page.waitForTimeout(1000);
    }
  } catch (e) {}
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  const deck1002Path = path.join(screenshotDir, '12_deck_1002_batch2_eligible.png');
  await page.screenshot({ path: deck1002Path, fullPage: true });
  console.log('   Saved deck 1002 screenshot to:', deck1002Path);

  // 2. Deck 1004 (Insufficient cards / locked)
  console.log('4. Navigating to Deck 1004 (/decks/1004)...');
  await page.goto('http://localhost:5173/decks/1004');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  try {
    const closeBtn = page.locator('.ant-modal-close, button:has-text("Đóng"), button:has-text("Tuyệt vời"), button:has-text("OK")');
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click({ force: true });
      await page.waitForTimeout(1000);
    }
  } catch (e) {}
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  const deck1004Path = path.join(screenshotDir, '13_deck_1004_insufficient_cards_locked.png');
  await page.screenshot({ path: deck1004Path, fullPage: true });
  console.log('   Saved deck 1004 screenshot to:', deck1004Path);

  await browser.close();
  console.log('Done capturing all screenshots!');
}

main().catch(err => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});
