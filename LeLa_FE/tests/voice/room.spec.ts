import { test, expect } from '@playwright/test';
import { voiceRoomReducer, initialRoomState } from '../../src/features/voice-conversation/hooks/voiceRoomMachine';
import fs from 'node:fs/promises';
const artifacts = '../tests/experiments/private-results';
test.beforeAll(async () => { await fs.mkdir(artifacts, { recursive: true }); });

const result = { turnNumber: 1, aiReply: 'Would you like it hot or iced?', validTurnCount: 1,
  updatedTargetWords: [], sessionEnded: false, feedbackLine: 'Bạn đã gọi món rõ ràng.',
  intendedUtterance: 'I would like a hot coffee please',
  evaluation: { score: 90, status: 'EXCELLENT', grammarCheck: 'Ngữ pháp đúng', phoneticTip: 'Luyện âm cuối', suggestedImprovement: '' },
  suggestions: [{ difficulty: 'EASY', text: 'Hot, please.' }, { difficulty: 'MEDIUM', text: 'I would like it hot, please.' },
    { difficulty: 'CHALLENGE', text: 'Could you make it hot with a little milk, please?' }] };

test('reducer locks mic and requests, ignores stale speech and waits for final speech', () => {
  let state = voiceRoomReducer(initialRoomState('Hello'), { type: 'GREET' });
  expect(voiceRoomReducer(state, { type: 'RECORD' })).toEqual(state);
  state = voiceRoomReducer(state, { type: 'SPEECH_DONE', id: 0 });
  state = voiceRoomReducer(state, { type: 'RECORD' });
  state = voiceRoomReducer(state, { type: 'SEND', text: 'Hello' });
  expect(voiceRoomReducer(state, { type: 'SEND', text: 'Duplicate' })).toEqual(state);
  state = voiceRoomReducer(state, { type: 'RECEIVED', turn: { ...result, sessionEnded: true } as any, latencyMs: 20 });
  expect(state.phase).toBe('aiSpeaking');
  expect(voiceRoomReducer(state, { type: 'SPEECH_DONE', id: 0 })).toEqual(state);
  expect(voiceRoomReducer(state, { type: 'SPEECH_DONE', id: 1 }).phase).toBe('finished');
});

test('StrictMode greeting once; manual submit once; no silence submit; cancel, chips, details, skip and finish', async ({ page }) => {
  let requests = 0;
  await page.route('**/voice-conversations/sessions/test-session/turns', async route => {
    requests++;
    await route.fulfill({ json: { ...result, turnNumber: requests, sessionEnded: requests === 2 } });
  });
  await page.goto('/tests/voice-room.html');
  await page.getByRole('button', { name: 'Start fixture' }).click();
  await expect(page.getByTestId('voice-phase')).toHaveText('AI đang nói');
  await expect(page.getByRole('button', { name: 'Bấm để nói' })).toBeDisabled();
  await expect(page.getByTestId('voice-phase')).toHaveText('Sẵn sàng');
  const trace = async () => JSON.parse((await page.locator('#trace').textContent())!);
  expect((await trace()).filter((x: any) => x.event === 'tts-speak')).toHaveLength(1);
  expect((await trace()).filter((x: any) => x.event === 'mic-start')).toHaveLength(0);
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  await page.getByRole('button', { name: 'Bấm để nói' }).click();
  await page.getByRole('button', { name: 'Deliver final speech' }).click();
  // Wait beyond both legacy silence windows to verify default never autocommits.
  await page.waitForTimeout(2200);
  expect(requests).toBe(0);
  await page.getByRole('button', { name: 'Dừng và gửi' }).dblclick();
  await expect(page.getByRole('button', { name: result.feedbackLine })).toBeVisible();
  await expect(page.getByTestId('voice-phase')).toHaveText('Sẵn sàng');
  expect(requests).toBe(1);
  expect((await trace()).filter((x: any) => x.event === 'mic-start')).toHaveLength(1);
  expect((await trace()).filter((x: any) => x.event === 'tts-speak')).toHaveLength(2);
  await expect(page.getByText('Câu AI hiểu', { exact: true })).not.toBeVisible();
  await page.getByRole('button', { name: result.feedbackLine }).click();
  await expect(page.getByText('Câu AI hiểu', { exact: true })).toBeVisible();
  for (const name of ['Dễ', 'Vừa', 'Thử thách']) await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Dễ', exact: true }).click();
  await expect(page.getByText('Hot, please.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Nghe câu mẫu' }).click();
  await page.getByRole('button', { name: 'Bỏ qua giọng AI' }).click();
  await expect(page.getByTestId('voice-phase')).toHaveText('Sẵn sàng');
  await page.getByRole('button', { name: 'Bấm để nói' }).click();
  await page.getByRole('button', { name: 'Deliver final speech' }).click();
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  expect(requests).toBe(1);
  await page.getByRole('button', { name: 'Bấm để nói' }).click();
  await page.getByRole('button', { name: 'Deliver final speech' }).click();
  await page.getByRole('button', { name: 'Dừng và gửi' }).click();
  await expect(page.getByTestId('finished')).toHaveText('1');
  expect(requests).toBe(2);
  await fs.writeFile(`${artifacts}/phase1a-voice-after.json`, JSON.stringify(await trace(), null, 2));
});

test('native Chrome TTS logs greeting once and never opens mic automatically', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', event => { if (event.text().includes('[VOICE')) logs.push(event.text()); });
  await page.goto('/tests/voice-room.html?nativeTts=1');
  await page.getByRole('button', { name: 'Start fixture' }).click();
  await expect(page.getByTestId('voice-phase')).toHaveText('Sẵn sàng', { timeout: 15000 });
  expect(logs.filter(x => x.includes('TTS SPEAK'))).toHaveLength(1);
  expect(logs.filter(x => x.includes('MIC START'))).toHaveLength(0);
  await fs.writeFile(`${artifacts}/phase1a-voice-after-native.json`, JSON.stringify(logs, null, 2));
});

test('optional auto-send uses configured silence, then stays ready without reopening mic', async ({ page }) => {
  let requests = 0;
  await page.route('**/voice-conversations/sessions/test-session/turns', async route => {
    requests++; await route.fulfill({ json: result });
  });
  await page.goto('/tests/voice-room.html');
  await page.getByRole('button', { name: 'Start fixture' }).click();
  await expect(page.getByTestId('voice-phase')).toHaveText('Sẵn sàng');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Bấm để nói' }).click();
  await page.getByRole('button', { name: 'Deliver final speech' }).click();
  await expect(page.getByRole('button', { name: result.feedbackLine })).toBeVisible();
  await expect(page.getByTestId('voice-phase')).toHaveText('Sẵn sàng');
  expect(requests).toBe(1);
  const trace = JSON.parse((await page.locator('#trace').textContent())!);
  expect(trace.filter((x: any) => x.event === 'mic-start')).toHaveLength(1);
});
