import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 850 } });
  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'mock-token');
    localStorage.setItem('refreshToken', 'mock-refresh');
    localStorage.removeItem('lela.sidebar');
  });

  await page.route('**/api/users/me', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 1,
          username: 'lela_learner',
          email: 'learner@lela.com',
          fullName: 'Lela Learner',
          roles: ['LEARNER'],
          xpTotal: 420,
        }
      })
    });
  });

  await page.route('**/api/notifications/unread*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { totalElements: 2, content: [] } }) }));
  await page.route('**/api/voice/status*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { remainingQuota: 2, maxSessionsPerDay: 3 } }) }));
  await page.route('**/api/decks*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { content: [], totalElements: 0 } }) }));
  await page.route('**/api/srs-reviews/statistics', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { dueTodayCount: 5, dueCount: 5 } }) }));

  await page.goto('http://localhost:5173/decks', { waitUntil: 'networkidle' });

  // Capture expanded sidebar
  await page.screenshot({
    path: 'C:/Users/doant/.gemini/antigravity-ide/brain/fe9a679d-173f-4fe2-9ed2-f2261f2a9d70/sidebar_expanded.png',
    fullPage: false,
  });
  console.log('Saved sidebar_expanded.png');

  // Toggle collapsed
  await page.click('button[aria-label="Thu gọn thanh bên"]');
  await page.waitForTimeout(300);

  // Capture collapsed sidebar
  await page.screenshot({
    path: 'C:/Users/doant/.gemini/antigravity-ide/brain/fe9a679d-173f-4fe2-9ed2-f2261f2a9d70/sidebar_collapsed.png',
    fullPage: false,
  });
  console.log('Saved sidebar_collapsed.png');

  await browser.close();
}

main().catch(console.error);
