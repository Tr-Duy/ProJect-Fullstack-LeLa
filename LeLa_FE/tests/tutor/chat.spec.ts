import { test, expect, type Page } from '@playwright/test';

const user = { id: 901, username: 'tutorqa', fullName: 'Tutor QA', roles: ['LEARNER'], xpTotal: 44,
  streakCurrent: 0, dailyGoalCards: 20, currentLevel: { id: 1, name: 'Cơ bản (Dưới 500)' }, currentExamType: { id: 1 } };
const answer = { content: 'Chào bạn! **44 XP**, hôm nay **6/20 thẻ**.\n\n1. Ôn bộ **Contracts**, thành thạo **4/16**.\n2. Ôn lại bài quiz **2/5**.\n\nChúc bạn học tốt!',
  complete: true, finishReason: 'STOP', model: 'mock-provider', requestId: 'test-request' };
const envelope = (data: unknown) => ({ success: true, data });
const send = async (page: Page, text: string) => {
  await page.getByRole('textbox', { name: 'Nội dung gửi cho AI Tutor' }).fill(text);
  await page.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).click();
};
const bubble = (page: Page, role: string) => page.locator(`[data-testid="tutor-message"][data-message-role="${role}"]`);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('accessToken', 'test-access'); localStorage.setItem('refreshToken', 'test-refresh'); });
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url());
    let data: unknown = { content: [] };
    if (url.pathname.endsWith('/profile')) data = user;
    else if (url.pathname.endsWith('/health')) data = {};
    else if (url.pathname.endsWith('/daily-activities/today')) data = { cardsLearned: 1, reviewCount: 5, currentStreak: 1 };
    else if (url.pathname.endsWith('/daily-activities/history')) data = [];
    else if (url.pathname.endsWith('/daily-goal')) data = { shouldShow: false };
    else if (url.pathname.endsWith('/enrollments/my-list')) data = { content: [{ deckId: 1, deckTitle: 'Contracts', masteredCards: 4, deckTotalCards: 16 }] };
    else if (url.pathname.endsWith('/quiz-attempts/my')) data = { content: [{ correctAnswers: 2, totalQuestions: 5 }] };
    else if (url.pathname.endsWith('/ai/chat')) data = answer;
    await route.fulfill({ json: envelope(data) });
  });
});

test('full answer, safe markdown, five tabs, long answer and one request per turn', async ({ page }) => {
  const requests: unknown[] = [];
  await page.route('**/ai/chat', async route => { requests.push(route.request().postDataJSON()); await route.fulfill({ json: envelope(answer) }); });
  await page.goto('/ai-chat');
  await expect(page.locator('main aside').getByText('1 ngày liên tục', { exact: true })).toBeVisible();
  await send(page, 'Tôi nên ôn gì hôm nay?');
  await expect(bubble(page, 'ai')).toHaveAttribute('data-message-status', 'complete');
  await expect(bubble(page, 'ai').locator('strong')).toContainText(['44 XP', '6/20 thẻ', 'Contracts', '4/16', '2/5']);
  await expect(bubble(page, 'ai')).not.toContainText('**');
  const modes = ['Dịch', 'Từ vựng', 'Sửa câu', 'Ngữ pháp'];
  for (const mode of modes) {
    await page.getByRole('radio', { name: mode, exact: true }).click();
    await send(page, `Giải thích ${mode} với ví dụ tiếng Anh.`);
    await expect(page.locator('[data-message-status="pending"]')).toHaveCount(0);
  }
  await send(page, 'Giải thích thật chi tiết các thì hiện tại, cho nhiều ví dụ và bài tập.');
  await expect(bubble(page, 'user')).toHaveCount(6);
  await expect(page.locator('[data-message-role="ai"][data-message-status="complete"]')).toHaveCount(6);
  expect(requests).toHaveLength(6);
  await page.reload();
  await expect(bubble(page, 'user')).toHaveCount(6);
  await expect(page.locator('[data-message-role="ai"][data-message-status="complete"]')).toHaveCount(6);
});

test('same-frame duplicate sends are locked; failed retry reuses the turn', async ({ page }) => {
  const ids: string[] = [];
  await page.route('**/ai/chat', async route => {
    ids.push(route.request().postDataJSON().clientMessageId);
    await new Promise(resolve => setTimeout(resolve, 250));
    await route.fulfill({ json: envelope(ids.length === 1 ? { ...answer, content: '', complete: false, finishReason: 'ERROR', errorCode: 'AI_BUSY' } : answer) });
  });
  await page.goto('/ai-chat');
  await page.getByRole('textbox', { name: 'Nội dung gửi cho AI Tutor' }).fill('Tôi nên ôn gì hôm nay?');
  await page.locator('form').evaluate(form => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
  await expect(page.getByRole('alert')).toContainText('AI đang quá tải');
  await expect(bubble(page, 'user')).toHaveCount(1);
  expect(ids).toHaveLength(1);
  await page.getByRole('button', { name: 'Thử lại câu hỏi vừa rồi', exact: true }).click();
  await expect(bubble(page, 'ai')).toHaveAttribute('data-message-status', 'complete');
  await expect(bubble(page, 'user')).toHaveCount(1);
  expect(ids).toHaveLength(2); expect(ids[0]).toBe(ids[1]);
});

test('expired access token refreshes once and the same turn succeeds', async ({ page }) => {
  let calls = 0, refreshes = 0; const ids: string[] = [];
  await page.route('**/auth/refresh-token', async route => { refreshes++; await route.fulfill({ json: envelope({ accessToken: 'refreshed' }) }); });
  await page.route('**/ai/chat', async route => {
    calls++; ids.push(route.request().postDataJSON().clientMessageId);
    await route.fulfill(calls === 1 ? { status: 401, json: { message: 'Unauthorized' } } : { json: envelope(answer) });
  });
  await page.goto('/ai-chat'); await send(page, 'Ôn gì hôm nay?');
  await expect(bubble(page, 'ai')).toHaveAttribute('data-message-status', 'complete');
  expect(calls).toBe(2); expect(refreshes).toBe(1); expect(ids[0]).toBe(ids[1]);
  await expect(bubble(page, 'user')).toHaveCount(1);
});

test('failed refresh asks to sign in without raw 401 or a stuck spinner', async ({ page }) => {
  await page.route('**/auth/refresh-token', route => route.fulfill({ status: 401, json: {} }));
  await page.route('**/ai/chat', route => route.fulfill({ status: 401, json: {} }));
  await page.goto('/ai-chat'); await send(page, 'Ôn gì hôm nay?');
  await expect(page.getByRole('alert')).toContainText('đăng nhập lại');
  await expect(page.getByRole('log')).not.toContainText('API error: 401');
  await expect(page.locator('[data-message-status="pending"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Dừng tạo câu trả lời' })).toHaveCount(0);
});

test('MAX_TOKENS is explicitly incomplete and stays incomplete after reload', async ({ page }) => {
  await page.route('**/ai/chat', route => route.fulfill({ json: envelope({ ...answer, complete: false, finishReason: 'MAX_TOKENS' }) }));
  await page.goto('/ai-chat'); await send(page, 'Giải thích dài.');
  await expect(bubble(page, 'ai')).toHaveAttribute('data-message-status', 'incomplete');
  await page.reload();
  await expect(bubble(page, 'ai')).toHaveAttribute('data-message-status', 'incomplete');
  await expect(bubble(page, 'ai')).toContainText('Câu trả lời chưa hoàn chỉnh');
});

test('reload or Stop while waiting preserves the user and marks interruption', async ({ page }) => {
  await page.route('**/ai/chat', async route => { await new Promise(resolve => setTimeout(resolve, 3000)); await route.fulfill({ json: envelope(answer) }).catch(() => {}); });
  await page.goto('/ai-chat'); await send(page, 'Câu đang chờ');
  await expect(page.locator('[data-message-status="pending"]')).toHaveCount(1);
  await page.reload();
  await expect(bubble(page, 'user')).toHaveCount(1);
  await expect(bubble(page, 'ai')).toHaveAttribute('data-message-status', 'interrupted');
  await expect(page.getByRole('button', { name: 'Thử lại', exact: true })).toBeVisible();
  await send(page, 'Câu muốn dừng');
  await page.getByRole('button', { name: 'Dừng tạo câu trả lời' }).click();
  await expect(page.locator('[data-message-status="pending"]')).toHaveCount(0);
  await expect(page.locator('[data-message-status="interrupted"]')).toHaveCount(2);
});

test('HTTP 5xx or network timeout gives an actionable error and unlocks composer', async ({ page }) => {
  await page.route('**/ai/chat', route => route.abort('timedout'));
  await page.goto('/ai-chat'); await send(page, 'Câu lỗi mạng');
  await expect(page.getByRole('alert')).toContainText(/thử lại/i);
  await expect(page.getByRole('button', { name: 'Dừng tạo câu trả lời' })).toHaveCount(0);
  await page.route('**/ai/chat', route => route.fulfill({ status: 503, json: {} }));
  await page.getByRole('button', { name: 'Thử lại câu hỏi vừa rồi', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(/thử lại/i);
  await expect(bubble(page, 'user')).toHaveCount(1);
});

test('a long answer scrolls inside chat and keeps the composer in the viewport', async ({ page }) => {
  await page.route('**/ai/chat', route => route.fulfill({ json: envelope({ ...answer,
    content: '# Giải thích\n\n' + 'Một đoạn giải thích đầy đủ với ví dụ tiếng Anh.\n\n'.repeat(80) + 'Kết thúc.' }) }));
  await page.goto('/ai-chat'); await send(page, 'Giải thích dài');
  await expect(bubble(page, 'ai')).toHaveAttribute('data-message-status', 'complete');
  await expect(page.getByRole('textbox', { name: 'Nội dung gửi cho AI Tutor' })).toBeInViewport();
  expect(await page.getByRole('log').evaluate(log => log.scrollHeight > log.clientHeight)).toBe(true);
});
