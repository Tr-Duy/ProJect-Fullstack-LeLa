import { test, expect } from '@playwright/test';

test('dashboard survives reloads and learner navigation without runtime errors', async ({ page }) => {
  // Covers ten document loads plus seven return navigations on a live backend.
  test.setTimeout(120_000);
  // New learners may get the delayed daily-goal dialog on any learner route.
  await page.addLocatorHandler(
    page.getByRole('dialog').getByRole('button', { name: 'Bỏ qua', exact: true }),
    async button => { await button.click(); },
  );
  const errors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text().replace(/access_token=[^\s&]+/g, 'access_token=[redacted]'));
    if (message.type() === 'error' && /invalid hook|useContext|UI error:|dispatcher|hooks can only|React error #/i.test(message.text())) {
      errors.push(message.text());
    }
  });

  const expectDashboard = async () => {
    await expect(page).toHaveURL(/\/dashboard$/);
    for (const title of ['Chặng hôm nay', 'Bộ thẻ đang học', 'Phòng luyện kỹ năng', 'Lộ trình tăng Level', 'Bảng xếp hạng tuần']) {
      await expect(page.getByText(title, { exact: true })).toBeVisible();
    }
    await expect(page.getByText('Trang này gặp sự cố', { exact: true })).toHaveCount(0);
    if (process.env.DASHBOARD_EXPECT_XP) {
      await expect(page.locator('header:visible')).toContainText(`${process.env.DASHBOARD_EXPECT_XP} XP`);
    }
    expect(errors, errors.join('\n')).toEqual([]);
  };

  await page.goto('/dashboard');
  await expectDashboard();
  for (let reload = 0; reload < 2; reload++) {
    await page.reload();
    await expectDashboard();
  }

  for (const [path, heading] of [
    ['/voice-conversation', /Hội Thoại Giọng Nói Tương Tác Với AI/],
    ['/quizzes', /Danh sách Bài kiểm tra/],
    ['/decks', /Khám phá bộ thẻ/],
    ['/my-decks', /Bộ thẻ của tôi/],
    ['/typing-game', /LUYỆN GÕ TỪ VỰNG/],
    ['/ai-chat', null],
    ['/final-level-tests', /BÀI THI KẾT THÚC LEVEL/],
  ] as const) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.locator('main')).toBeVisible();
    if (heading) await expect(page.locator('main').getByRole('heading', { name: heading })).toBeVisible();
    else await expect(page.locator('main').getByRole('textbox')).toBeVisible();
    await expect(page.getByText('Trang này gặp sự cố', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Tổng quan', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Tổng quan', exact: true }).click();
    await expectDashboard();
  }
  // Catch effects/animations that fail after the last route has rendered.
  await expect(page.locator('main').getByText('Mục tiêu hôm nay', { exact: true })).toBeVisible();
  expect(errors, errors.join('\n')).toEqual([]);
  await test.info().attach('console-errors', { body: JSON.stringify(consoleErrors, null, 2), contentType: 'application/json' });
  await test.info().attach('dashboard', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  expect(errors, errors.join('\n')).toEqual([]);
});
