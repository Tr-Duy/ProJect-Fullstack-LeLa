import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const screenshotDir = path.resolve('../docs/screenshots/topic-tests');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const password = process.env.PLAYWRIGHT_PASSWORD || '123456';

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
  await page.fill('input#usernameOrEmail, input[name="usernameOrEmail"], input[type="text"]', 'real_pass_user_01');
  await page.fill('input#password, input[name="password"], input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for navigation after login
  await page.waitForURL('http://localhost:5173/**', { timeout: 15000 });
  await page.waitForTimeout(2000);
  console.log('2. Logged in successfully, current URL:', page.url());

  // 1. Screenshot of Result Page
  console.log('3. Navigating to Quiz Result Page...');
  await page.goto('http://localhost:5173/quiz-attempts/3b34cf36-1ccb-40e8-a639-0a826fb3f7bb/result');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  const resultPath = path.join(screenshotDir, '08_passed_quiz_result_page.png');
  await page.screenshot({ path: resultPath, fullPage: true });
  console.log('   Saved result screenshot to:', resultPath);

  // 2. Screenshot of Deck Detail Page
  console.log('4. Navigating to Deck Detail Page (/decks/18)...');
  await page.goto('http://localhost:5173/decks/18');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  const deckPath = path.join(screenshotDir, '09_deck_detail_passed.png');
  await page.screenshot({ path: deckPath, fullPage: true });
  console.log('   Saved deck detail screenshot to:', deckPath);

  // 3. Screenshot of Assessment Center Page (Tab Bài thi theo chủ đề)
  console.log('5. Navigating to Assessment Center (/final-level-tests)...');
  await page.goto('http://localhost:5173/final-level-tests');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  // Dismiss any modal if open (e.g. Achievement modal)
  try {
    const closeBtn = page.locator('.ant-modal-close, button:has-text("Đóng"), button:has-text("Tuyệt vời"), button:has-text("OK")');
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click({ force: true });
      await page.waitForTimeout(1000);
    }
  } catch (e) {}
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Click on "BÀI THI THEO CHỦ ĐỀ" tab
  const topicTab = page.locator('button:has-text("BÀI THI THEO CHỦ ĐỀ")');
  if (await topicTab.count() > 0) {
    await topicTab.first().click({ force: true });
    await page.waitForTimeout(2000);
  }
  const assessPath = path.join(screenshotDir, '10_assessment_center_passed.png');
  await page.screenshot({ path: assessPath, fullPage: true });
  console.log('   Saved assessment center screenshot to:', assessPath);

  await browser.close();
  console.log('All screenshots captured successfully!');
}

main().catch(err => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});
