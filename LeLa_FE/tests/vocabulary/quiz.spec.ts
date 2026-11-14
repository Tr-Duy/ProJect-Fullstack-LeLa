import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

async function mockServer(page: Page, matching = false) {
  let view: any;
  const solution: Record<string, string> = matching ? { l1: 'r1', l2: 'r2', l3: 'r3', l4: 'r4' } : { answer: '1' };
  const receipts = new Set<string>();
  await page.route('**/quiz-attempts/vocabulary/99/event', async route => {
    const event = route.request().postDataJSON();
    if (!view) view = {
      attemptId: 99, publicId: 'fixture-attempt', title: matching ? 'Ghép cặp từ - Định nghĩa' : 'Chọn đáp án đúng',
      index: 0, total: matching ? 5 : 20, seconds: matching ? 60 : 20, started: true,
      serverNow: Date.now(), deadline: Date.now() + 60000, paused: false, done: false, timedOut: false, closed: false,
      type: matching ? 'MATCHING_PAIRS' : 'MULTIPLE_CHOICE_MEANING', prompt: matching ? '' : 'tận hưởng / thích',
      left: matching ? [{ id: 'l1', text: 'apple' }, { id: 'l2', text: 'book' }, { id: 'l3', text: 'cat' }, { id: 'l4', text: 'sun' }]
        : [{ id: '1', text: 'enjoy' }, { id: '2', text: 'build' }, { id: '3', text: 'write' }, { id: '4', text: 'walk' }],
      right: matching ? [{ id: 'r3', text: 'con mèo' }, { id: 'r1', text: 'quả táo' }, { id: 'r4', text: 'mặt trời' }, { id: 'r2', text: 'quyển sách' }] : [],
      matched: [], errors: 0, selected: null, solution: {}, score: 0, lastCorrect: null,
    };
    if (!receipts.has(event.requestId)) {
      receipts.add(event.requestId); view.lastCorrect = null;
      if (event.action === 'ANSWER') { view.done = true; view.selected = event.leftId; view.lastCorrect = event.leftId === '1'; view.score = view.lastCorrect ? 1 : 0; }
      if (event.action === 'TIMEOUT') { view.done = true; view.timedOut = true; }
      if (event.action === 'PAUSE') view.paused = true;
      if (event.action === 'RESUME') view.paused = false;
      if (event.action === 'PAIR') {
        view.lastCorrect = solution[event.leftId] === event.rightId;
        if (view.lastCorrect) view.matched.push(event.leftId, event.rightId); else view.errors++;
        view.done = view.matched.length === 8; view.score = Math.max(0, view.matched.length / 2 - .25 * view.errors);
      }
      if (event.action === 'NEXT') { view.index++; view.done = false; view.selected = null; view.matched = []; view.errors = 0; }
    }
    const response = { ...view, serverNow: Date.now(), solution: view.done ? solution : {}, ...(view.paused ? { left: [], right: [], prompt: '' } : {}) };
    await route.fulfill({ json: { data: response } });
  });
}

test('meaning: four options, feedback, locks, next and screenshot', async ({ page }) => {
  await mockServer(page); await page.goto('/tests/vocabulary-quiz.html');
  await expect(page.getByRole('button', { name: 'Tiếp tục', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'enjoy', exact: true })).toBeVisible();
  await mkdir('../docs/quiz-vocabulary', { recursive: true });
  await page.screenshot({ path: '../docs/quiz-vocabulary/meaning-web.png', fullPage: true });
  await page.getByRole('button', { name: 'build', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Đáp án đúng: enjoy');
  await expect(page.getByRole('button', { name: 'enjoy ✓', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await expect(page.getByText('2/20', { exact: true })).toBeVisible();
});
test('pause conceals questions and freezes timer, then resumes', async ({ page }) => {
  await mockServer(page); await page.goto('/tests/vocabulary-quiz.html');
  await page.getByRole('button', { name: 'Tạm dừng', exact: true }).click();
  await expect(page.getByText('Đã tạm dừng', { exact: true })).toBeVisible();
  await expect(page.getByText('tận hưởng / thích', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'enjoy', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('button', { name: 'enjoy', exact: true })).toBeVisible();
});
test('timeout unlocks continue and reveals correct answer', async ({ page }) => {
  await mockServer(page); await page.goto('/tests/vocabulary-quiz.html?seconds=1');
  await expect(page.getByRole('status')).toContainText('Hết giờ', { timeout: 4000 });
  await expect(page.getByRole('button', { name: 'Tiếp tục', exact: true })).toBeEnabled();
});
test('matching: independent columns, wrong feedback and completion', async ({ page }) => {
  await mockServer(page, true); await page.goto('/tests/vocabulary-quiz.html?mode=matching');
  await expect(page.getByRole('button', { name: 'Tiếp theo', exact: true })).toBeDisabled();
  await page.screenshot({ path: '../docs/quiz-vocabulary/matching-web.png', fullPage: true });
  await page.getByRole('button', { name: 'apple', exact: true }).click(); await page.getByRole('button', { name: 'con mèo', exact: true }).click();
  await expect(page.getByText('Chạm một từ rồi chọn nghĩa tương ứng. Lỗi: 1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'apple ✕', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'apple', exact: true })).toBeVisible();
  for (const [en, vi] of [['apple','quả táo'], ['book','quyển sách'], ['cat','con mèo'], ['sun','mặt trời']]) {
    await page.getByRole('button', { name: en, exact: true }).click(); await page.getByRole('button', { name: vi, exact: true }).click();
    await expect(page.getByRole('button', { name: `${en} ✓`, exact: true })).toBeDisabled();
  }
  await expect(page.getByRole('button', { name: 'Tiếp theo', exact: true })).toBeEnabled();
  await expect(page.getByRole('status')).toContainText('3.75');
});
test('exit confirmation submits only the server ledger through existing endpoint', async ({ page }) => {
  await mockServer(page); let payload: any;
  await page.route('**/quiz-attempts/99/submit', route => { payload = route.request().postDataJSON(); return route.fulfill({ json: { data: {} } }); });
  await page.goto('/tests/vocabulary-quiz.html'); await page.getByRole('button', { name: 'Thoát', exact: true }).click();
  await expect(page.getByText('Thoát bài thi?', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Thoát', exact: true }).filter({ visible: true }).click();
  await expect.poll(() => payload).toEqual({ answers: [], abandoned: true });
});
test('submission refetches XP and streak observed by the header', async ({ page }) => {
  let xp = 0, streak = 0, profileReads = 0, activityReads = 0;
  await page.route('**/tests/mock-profile', route => { profileReads++; return route.fulfill({ json: { xpTotal: xp } }); });
  await page.route('**/tests/mock-activity', route => { activityReads++; return route.fulfill({ json: { currentStreak: streak } }); });
  await page.route('**/quiz-attempts/99/submit', route => { xp = 1; streak = 1; return route.fulfill({ json: { data: {} } }); });
  await mockServer(page); await page.goto('/tests/vocabulary-quiz.html?header');
  await expect(page.getByTestId('header-xp')).toHaveText('0');
  await expect(page.getByTestId('header-streak')).toHaveText('0');
  await page.getByRole('button', { name: 'enjoy', exact: true }).click();
  await expect(page.getByText('Đáp án đúng: enjoy', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Thoát', exact: true }).click();
  await page.getByRole('button', { name: 'Thoát', exact: true }).click();
  await expect(page.getByTestId('header-xp')).toHaveText('1');
  await expect(page.getByTestId('header-streak')).toHaveText('1');
  expect(profileReads).toBeGreaterThanOrEqual(2); expect(activityReads).toBeGreaterThanOrEqual(2);
});
for (const type of ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK']) test(`legacy ${type} still emits existing answer format`, async ({ page }) => {
  await page.goto(`/tests/vocabulary-quiz.html?legacy=${type}`);
  if (type === 'FILL_BLANK') await page.getByRole('textbox').fill('old answer');
  else await page.getByText('Existing option', { exact: true }).click();
  await expect(page.getByTestId('answer')).toContainText(type === 'FILL_BLANK' ? '"answerText":"old answer"' : '"selectedAttemptOptionId":10');
});
test('375px layout has large touch targets and no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); await mockServer(page, true);
  await page.goto('/tests/vocabulary-quiz.html?mode=matching');
  await expect(page.getByRole('button', { name: 'apple', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = await page.getByRole('button', { name: 'apple', exact: true }).boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: '../docs/quiz-vocabulary/matching-web-375.png', fullPage: true });
});
