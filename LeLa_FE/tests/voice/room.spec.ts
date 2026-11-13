import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { voiceRoomReducer, initialRoomState } from '../../src/features/voice-conversation/hooks/voiceRoomMachine';
import type { VoiceTurnResponse } from '../../src/features/voice-conversation/api/voice-conversation.api';
import fs from 'node:fs/promises';
const artifacts = '../tests/experiments/private-results';
test.beforeAll(async () => { await fs.mkdir(artifacts, { recursive: true }); });
const result: VoiceTurnResponse = { turnNumber: 1, aiReply: 'Of course! Would you like milk with your coffee?', validTurnCount: 1,
  updatedTargetWords: [], sessionEnded: false, feedbackLine: 'Bạn đã gọi món rõ ràng.',
  intendedUtterance: 'I would like a hot coffee please', intentConfidence: 'HIGH',
  evaluation: { score: 90, status: 'EXCELLENT', hasError: false, grammarCheck: 'Ngữ pháp đúng', phoneticTip: 'Luyện âm cuối', suggestedImprovement: '' },
  suggestions: [{ difficulty: 'EASY', text: 'Yes, please.' }, { difficulty: 'MEDIUM', text: 'A little milk, please.' },
    { difficulty: 'CHALLENGE', text: 'Could you add a little milk and no sugar, please?' }] };
const trace = async (page: Page) => JSON.parse((await page.locator('#trace').textContent()) || '[]') as { event: string; at: string; text?: string }[];
async function start(page: Page, query = '') {
  await page.goto('/tests/voice-room.html' + query);
  await page.getByRole('button', { name: 'Start fixture' }).click();
}
async function pushToTalk(page: Page) {
  await page.getByRole('button', { name: 'Tùy chọn cuộc gọi' }).click();
  await page.getByRole('menuitem', { name: 'Bấm để nói', exact: true }).click();
  await expect(page.getByTestId('voice-phase')).toHaveText('Đến lượt bạn');
}

test('reducer defaults hands-free; mic off and processing block recording; duplicate events are inert', () => {
  let state = initialRoomState('Hello');
  expect(state.mode).toBe('handsFree');
  state = voiceRoomReducer(state, { type: 'GREET' });
  expect(voiceRoomReducer(state, { type: 'RECORD' })).toEqual(state);
  state = voiceRoomReducer(state, { type: 'SPEECH_DONE', id: 0 });
  state = voiceRoomReducer(state, { type: 'MIC', enabled: false });
  expect(voiceRoomReducer(state, { type: 'RECORD' })).toEqual(state);
  state = voiceRoomReducer(state, { type: 'MIC', enabled: true });
  state = voiceRoomReducer(state, { type: 'RECORD' });
  state = voiceRoomReducer(state, { type: 'SEND', text: 'Hello' });
  expect(voiceRoomReducer(state, { type: 'SEND', text: 'Duplicate' })).toEqual(state);
  expect(voiceRoomReducer(state, { type: 'RECORD' })).toEqual(state);
  state = voiceRoomReducer(state, { type: 'RECEIVED', turn: { ...result, sessionEnded: true }, latencyMs: 20 });
  expect(state.reviews).toHaveLength(1);
  expect(voiceRoomReducer(state, { type: 'RECEIVED', turn: result, latencyMs: 20 })).toEqual(state);
  expect(voiceRoomReducer(state, { type: 'SPEECH_DONE', id: 0 })).toEqual(state);
  expect(voiceRoomReducer(state, { type: 'SPEECH_DONE', id: 1 }).phase).toBe('finished');
});

test('StrictMode complete speech sends once, duplicate final is not appended, AI speaks once then mic reopens after 400ms', async ({ page }) => {
  let requests = 0;
  await page.route('**/voice-conversations/sessions/test-session/turns', async route => {
    requests++;
    expect(route.request().postDataJSON().transcript).toBe('I would like a hot coffee please');
    await route.fulfill({ json: result });
  });
  await start(page);
  await expect(page.getByTestId('voice-phase')).toHaveText('Đang nghe');
  expect((await trace(page)).filter(x => x.event === 'tts-speak')).toHaveLength(1);
  await page.getByRole('button', { name: 'Deliver final speech' }).dblclick();
  await expect(page.getByTestId('voice-ai-sentence')).toHaveText(result.aiReply);
  await expect(page.getByTestId('voice-phase')).toHaveText('Đang nghe');
  await page.waitForTimeout(1500);
  expect(requests).toBe(1);
  const events = await trace(page);
  expect(events.filter(x => x.event === 'tts-speak')).toHaveLength(2);
  expect(events.filter(x => x.event === 'mic-start')).toHaveLength(2);
  for (const mic of events.filter(x => x.event === 'mic-start')) {
    const previousEnd = events.filter(x => x.event === 'tts-end' && x.at < mic.at).at(-1)!;
    expect(Date.parse(mic.at) - Date.parse(previousEnd.at)).toBeGreaterThanOrEqual(400);
  }
  await fs.writeFile(`${artifacts}/voice-hands-free-trace.json`, JSON.stringify(events, null, 2));
});

test('silence for 8 seconds, interim-only text and noise never submit or end the session', async ({ page }) => {
  let requests = 0;
  await page.route('**/voice-conversations/sessions/test-session/turns', route => { requests++; return route.fulfill({ json: result }); });
  await start(page);
  await expect(page.getByTestId('voice-phase')).toHaveText('Đang nghe');
  await expect(page.getByText('Cứ từ từ. Bấm Gợi ý nếu bạn cần câu mẫu.')).toBeVisible({ timeout: 10000 });
  expect(requests).toBe(0);
  await expect(page.getByTestId('finished')).toHaveText('0');
  await page.getByRole('button', { name: 'Deliver interim speech' }).click();
  await page.waitForTimeout(1400);
  expect(requests).toBe(0);
  await page.getByRole('button', { name: 'Deliver noise' }).click();
  await page.waitForTimeout(1400);
  expect(requests).toBe(0);
  await expect(page.getByTestId('voice-phase')).toHaveText('Đang nghe');
});

test('incomplete ending waits extra time; alternatives keep their confidence', async ({ page }) => {
  let requests = 0;
  await page.route('**/voice-conversations/sessions/test-session/turns', async route => {
    requests++;
    const payload = route.request().postDataJSON();
    expect(payload.sttConfidence).toBe(.3);
    expect(payload.alternativeDetails).toEqual([
      { transcript: 'I would like a coffee and', confidence: .3 },
      { transcript: 'I would like coffee and', confidence: .25 },
    ]);
    await route.fulfill({ json: result });
  });
  await start(page);
  await expect(page.getByTestId('voice-phase')).toHaveText('Đang nghe');
  await page.getByRole('button', { name: 'Deliver incomplete speech' }).click();
  await page.waitForTimeout(1450);
  expect(requests).toBe(0);
  await expect(page.getByTestId('voice-ai-sentence')).toHaveText(result.aiReply);
  expect(requests).toBe(1);
});

test('native pending flag delays opening mic; turning mic off prevents reopening', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: 'Hold native queue' }).click();
  await page.waitForTimeout(1000);
  expect((await trace(page)).filter(x => x.event === 'mic-start')).toHaveLength(0);
  await page.getByRole('button', { name: 'Release native queue' }).click();
  await expect(page.getByTestId('voice-phase')).toHaveText('Đang nghe');
  await page.getByRole('button', { name: 'Đang nghe', exact: true }).click();
  await expect(page.getByTestId('voice-phase')).toHaveText('Bật mic');
  await page.waitForTimeout(900);
  expect((await trace(page)).filter(x => x.event === 'mic-start')).toHaveLength(1);
  await page.getByRole('button', { name: 'Bật mic', exact: true }).click();
  await expect(page.getByTestId('voice-phase')).toHaveText('Đang nghe');
  expect((await trace(page)).filter(x => x.event === 'mic-start')).toHaveLength(2);
});

test('recognition engine restart preserves the first segment and sends whole-utterance alternatives once', async ({ page }) => {
  let requests = 0;
  await page.route('**/voice-conversations/sessions/test-session/turns', async route => {
    requests++;
    const payload = route.request().postDataJSON();
    expect(payload.transcript).toBe('I would like a coffee and hot coffee please');
    expect(payload.alternatives).toEqual(['I would like a coffee and hot coffee please', 'I would like a coffee and hot toffee please']);
    await route.fulfill({ json: result });
  });
  await start(page);
  await expect(page.getByTestId('voice-phase')).toHaveText('Đang nghe');
  await page.getByRole('button', { name: 'Deliver incomplete speech' }).click();
  await page.getByRole('button', { name: 'End recognition' }).click();
  await expect.poll(async () => (await trace(page)).filter(x => x.event === 'mic-start').length).toBe(2);
  await page.getByRole('button', { name: 'Deliver continuation' }).dblclick();
  await expect(page.getByTestId('voice-ai-sentence')).toHaveText(result.aiReply);
  expect(requests).toBe(1);
});

test('push-to-talk menu keeps manual send; hints are only in bottom sheet; finish once', async ({ page }) => {
  let requests = 0;
  await page.route('**/voice-conversations/sessions/test-session/turns', async route => {
    requests++; await route.fulfill({ json: { ...result, sessionEnded: true } });
  });
  await start(page);
  await expect(page.getByTestId('voice-phase')).toHaveText('Đang nghe');
  await pushToTalk(page);
  await page.getByRole('button', { name: 'Gợi ý', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.voice-hint-sheet p').filter({ hasText: 'Could you say that again, please?' })).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Đến lượt bạn', exact: true }).click();
  await page.getByRole('button', { name: 'Deliver final speech' }).click();
  await page.waitForTimeout(1500);
  expect(requests).toBe(0);
  await page.getByRole('button', { name: 'Dừng và gửi', exact: true }).dblclick();
  await expect(page.getByTestId('finished')).toHaveText('1');
  expect(requests).toBe(1);
  expect((await trace(page)).filter(x => x.event === 'tts-speak')).toHaveLength(2);
});

test('raw text stays dim while pending; only backend intended text gets the tick or retry label', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/voice-conversations/sessions/test-session/turns', async route => {
    await gate;
    await route.fulfill({ json: { ...result, intendedUtterance: 'I would like an iced latte',
      evaluation: { ...result.evaluation, hasError: true } } });
  });
  await start(page);
  await expect(page.getByTestId('voice-phase')).toHaveText('Đang nghe');
  await page.getByRole('button', { name: 'Deliver final speech' }).click();
  await expect(page.getByTestId('voice-phase')).toHaveText('Đang xử lý');
  await expect(page.getByTestId('voice-user-sentence')).toHaveClass(/voice-user-raw/);
  await expect(page.getByTestId('voice-user-sentence')).toContainText('I would like a hot coffee please');
  await expect(page.getByLabel('Đã ghi nhận')).not.toBeVisible();
  release();
  await expect(page.getByTestId('voice-user-sentence')).toContainText('I would like an iced latte');
  await expect(page.getByTestId('voice-user-sentence')).not.toHaveClass(/voice-user-raw/);
  await expect(page.getByText('Thử nói lại?', { exact: true })).toBeVisible();
  await expect(page.getByText(result.feedbackLine!, { exact: true })).not.toBeVisible();
});

test('native Chrome speech synthesis is called once in StrictMode', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', event => { if (event.text().includes('[VOICE')) logs.push(event.text()); });
  await start(page, '?nativeTts=1');
  await expect(page.getByTestId('voice-phase')).toHaveText('Đang nghe', { timeout: 15000 });
  expect(logs.filter(x => x.includes('TTS SPEAK'))).toHaveLength(1);
});

test('all feedback moves to report: natural sentence, three main errors, labelled tip, existing XP and difficulty', async ({ page }) => {
  await page.route('**/voice-conversations/sessions/test-session/turns', route => route.fulfill({ json: {
    ...result, sessionEnded: true, grammarErrors: ['Error one', 'Error two', 'Error three', 'Error four'],
    evaluation: { ...result.evaluation, hasError: true, suggestedImprovement: 'I would like a coffee, please.' },
  } }));
  await start(page, '?report=1');
  await expect(page.getByTestId('voice-phase')).toHaveText('Đang nghe');
  await page.getByRole('button', { name: 'Deliver final speech' }).click();
  const report = page.getByRole('dialog');
  await expect(report).toBeVisible();
  await expect(report.getByText('Lỗi chính', { exact: true })).toBeVisible();
  await expect(report.locator('li')).toHaveCount(3);
  await expect(report.getByText('Error four', { exact: true })).not.toBeVisible();
  await expect(report.getByText('"I would like a hot coffee please"', { exact: false })).toBeVisible();
  await expect(report.getByText('"I would like a coffee, please."', { exact: false })).toBeVisible();
  await expect(report.getByText('Mẹo:', { exact: true })).toBeVisible();
  await expect(report.getByText('Gợi ý chung từ văn bản, không phải đánh giá âm thanh.')).toBeVisible();
  await expect(report.getByText('+50 XP')).toBeVisible();
  await expect(report.getByRole('button', { name: 'Vừa sức (Giữ)' })).toBeVisible();
});

for (const width of [375, 1280]) {
  test(`room at ${width}px: readable text, no horizontal overflow, screenshot`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
    await page.route('**/voice-conversations/sessions/test-session/turns', route => route.fulfill({ json: result }));
    await start(page);
    await expect(page.getByTestId('voice-phase')).toHaveText('Đang nghe');
    await page.getByRole('button', { name: 'Deliver final speech' }).click();
    await expect(page.getByTestId('voice-ai-sentence')).toHaveText(result.aiReply);
    await expect(page.getByTestId('voice-phase')).toHaveText('Đang nghe');
    await expect(page.getByLabel('Đã ghi nhận')).toBeVisible();
    await page.getByRole('button', { name: 'Hide fixture controls' }).click();
    const metrics = await page.locator('.voice-room').evaluate(element => {
      const leaves = [...element.querySelectorAll<HTMLElement>('p, button, span')].filter(e => e.textContent?.trim() && e.childElementCount === 0);
      return { minFont: Math.min(...leaves.map(e => parseFloat(getComputedStyle(e).fontSize))),
        aiFont: parseFloat(getComputedStyle(element.querySelector('.voice-ai-sentence')!).fontSize),
        scrollWidth: document.documentElement.scrollWidth, width: window.innerWidth };
    });
    expect(metrics.minFont).toBeGreaterThanOrEqual(14);
    expect(metrics.aiFont).toBeGreaterThanOrEqual(24);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width);
    await page.screenshot({ path: `${artifacts}/voice-ui-after-${width}.png`, fullPage: true });
  });
}
