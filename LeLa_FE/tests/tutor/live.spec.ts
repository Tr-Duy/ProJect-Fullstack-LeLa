import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

test.describe('Gemini live acceptance (opt in; consumes quota)', () => {
  test.skip(process.env.TUTOR_LIVE !== '1', 'Set TUTOR_LIVE=1 explicitly to spend Gemini quota.');
  test.use({ storageState: process.env.TUTOR_STORAGE_STATE || '.auth/tutor-learner.json' });
  test('six sequential real answers are complete across all modes', async ({ page }) => {
    test.setTimeout(600_000);
    const calls: { id: string; message: string }[] = [];
    const evidence: unknown[] = [];
    await page.addLocatorHandler(page.getByRole('dialog').getByRole('button', { name: 'Bỏ qua', exact: true }),
      async button => { await button.click(); });
    page.on('request', r => {
      if (r.url().endsWith('/ai/chat')) calls.push({ id: r.postDataJSON().clientMessageId, message: r.postDataJSON().message });
    });
    await page.goto('/ai-chat');
    const cases = [
      ['Trò chuyện', 'Tôi nên ôn gì hôm nay?'],
      ['Dịch', 'I would like to schedule an appointment tomorrow.'],
      ['Từ vựng', 'accommodate'],
      ['Sửa câu', 'She go to work by bus every days.'],
      ['Ngữ pháp', 'Giải thích cách dùng a, an và the với ví dụ tiếng Anh.'],
      ['Trò chuyện', 'Giải thích chi tiết sự khác nhau giữa hiện tại hoàn thành và quá khứ đơn: công thức, dấu hiệu, 8 ví dụ đối chiếu có dịch, 4 lỗi thường gặp và 3 câu bài tập kèm đáp án. Kết thúc bằng một lời khuyên ôn tập.'],
    ];
    for (let i = 0; i < cases.length; i++) {
      const [mode, question] = cases[i];
      await page.getByRole('radio', { name: mode, exact: true }).click();
      await page.getByRole('textbox', { name: 'Nội dung gửi cho AI Tutor' }).fill(question);
      const wait = page.waitForResponse(r => r.url().endsWith('/ai/chat'), { timeout: 180_000 });
      await page.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).click();
      const started = Date.now(); const response = await wait;
      const body = await response.json();
      evidence.push({ mode, question, clientMessageId: calls[i].id, requestMessage: calls[i].message,
        httpStatus: response.status(), milliseconds: Date.now() - started, ...body });
      await fs.mkdir('.auth', { recursive: true });
      await fs.writeFile('.auth/tutor-live-evidence.json', JSON.stringify(evidence, null, 2));
      console.log(JSON.stringify({ turn: i + 1, status: response.status(), finishReason: body.data?.finishReason,
        model: body.data?.model, usage: body.data?.usageMetadata, errorCode: body.data?.errorCode }));
      expect(response.status()).toBe(200);
      expect(body.data?.complete, 'Live provider must finish; quota errors do not count as a pass.').toBe(true);
      expect(body.data.finishReason).toBe('STOP');
      await expect(page.locator('[data-message-role="user"]')).toHaveCount(i + 1);
      await expect(page.locator('[data-message-role="ai"][data-message-status="complete"]')).toHaveCount(i + 1);
      await expect(page.locator('[data-message-status="pending"]')).toHaveCount(0);
      expect(calls).toHaveLength(i + 1);
      await expect(page.locator('[data-message-role="ai"]')).not.toContainText(['**']);
      if (i === 0) {
        const plain = body.data.content.replace(/[*_`#]/g, '');
        expect(plain).toMatch(/44\s*XP/i);
        expect(plain).toMatch(/6\s*(?:\/|trên(?: tổng số)?)\s*20/);
        expect(plain).toMatch(/2\s*(?:\/|trên(?: tổng số)?)\s*5/);
        expect(plain).toMatch(/4\s*(?:\/|trên(?: tổng số)?)\s*16/);
        expect(plain).toContain('Contracts');
        expect(plain).toContain('Cơ bản');
        expect(plain).not.toMatch(/cardsStudied|latestCorrectAnswers|dailyGoalCards/);
        await page.screenshot({ path: '.auth/tutor-live-personalized.png', fullPage: true });
        await page.reload();
        await expect(page.locator('[data-message-role="ai"][data-message-status="complete"]')).toHaveCount(1);
      }
      if (i < cases.length - 1) await page.waitForTimeout(4000); // Respect Free Tier request spacing.
    }
    expect(new Set(calls.map(c => c.id)).size).toBe(6);
    await page.screenshot({ path: '.auth/tutor-live-complete.png', fullPage: true });
  });
});
