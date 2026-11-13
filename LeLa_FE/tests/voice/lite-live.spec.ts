import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { performance } from 'node:perf_hooks';

test('full-prompt lite: ten real backend turns, retain retry/fallback/degraded timing', async ({ page, request }) => {
  test.skip(process.env.VOICE_LITE_LIVE !== '1', 'Opt-in: consumes Gemini quota, local isolated test user');
  test.setTimeout(300000);
  const directory = '../tests/experiments/private-results';
  const cases = JSON.parse(await fs.readFile('../tests/experiments/voice_lite_cases.json', 'utf8'));
  const { accessToken } = JSON.parse(await fs.readFile(`${directory}/voice-lite-auth.json`, 'utf8'));
  const headers = { Authorization: `Bearer ${accessToken}` };
  const base = 'http://localhost:8080/api/v1/voice-conversations';
  const scenariosResponse = await request.get(`${base}/scenarios`, { headers });
  expect(scenariosResponse.ok()).toBeTruthy();
  const scenarios = await scenariosResponse.json();
  const coffee = scenarios.find((s: any) => /coffee/.test(s.slug));
  const rows: any[] = [];
  let requests = 0;
  await page.route('**/voice-conversations/sessions/*/turns', route => {
    requests++;
    return route.continue({ headers: { ...route.request().headers(), ...headers } });
  });
  for (const sample of cases) {
    const start = await request.post(`${base}/sessions/start`, { headers, data: { scenarioSlug: coffee.slug } });
    expect(start.ok()).toBeTruthy();
    const session = await start.json();
    try {
      await page.goto('/tests/voice-room.html?' + new URLSearchParams({ sessionId: session.publicId, opening: session.openingLine }));
      await page.getByRole('button', { name: 'Start fixture' }).click();
      await expect(page.getByTestId('voice-phase')).toHaveText('Đang nghe');
      await page.getByRole('button', { name: 'Tùy chọn cuộc gọi' }).click();
      await page.getByRole('menuitem', { name: 'Bấm để nói', exact: true }).click();
      await page.getByRole('button', { name: 'Đến lượt bạn', exact: true }).click();
      // Test-only STT adapter: deliver a fixed final result through the real hook.
      await page.evaluate((input: any) => {
        const engine = (window as any)._activeRecognitionInstance;
        engine.onresult({ resultIndex: 0, results: [Object.assign([
          { transcript: input.text, confidence: input.confidence },
          ...input.alternatives.map((text: string) => ({ transcript: text, confidence: .25 })),
        ], { isFinal: true })] });
      }, sample);
      const responsePromise = page.waitForResponse(r => r.url().endsWith('/turns') && r.request().method() === 'POST', { timeout: 20000 });
      const at = performance.now();
      await page.getByRole('button', { name: 'Dừng và gửi' }).click();
      const response = await responsePromise;
      const httpMs = performance.now() - at;
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      await expect(page.getByTestId('voice-ai-sentence')).toHaveText(body.aiReply);
      const visibleMs = performance.now() - at;
      rows.push({ case: sample.id, status: response.status(), level: session.currentLevel,
        httpMs, visibleMs, response: body });
      await fs.writeFile(`${directory}/voice-lite-backend-ten.json`, JSON.stringify({ measuredAt: new Date().toISOString(), requests, rows }, null, 2));
      console.log(JSON.stringify({ case: sample.id, visibleMs: Math.round(visibleMs), attempts: body.aiAttempts,
        retries: body.aiRetries, model: body.modelUsed, degraded: body.degraded, completed: body.isCompleted }));
      if (sample.id === 7 && !body.degraded) {
        expect(body.evaluation.grammarCheck).toBe(''); expect(body.evaluation.suggestedImprovement).toBe('');
      }
      if (sample.id === 10 && !body.degraded) expect(body.isCompleted).toBe(true);
      if (sample.id === 4) {
        // Also exercise strong-model summary AFTER the score transaction commits.
        const finish = await request.post(`${base}/sessions/${session.publicId}/finish`, { headers, data: {} });
        expect(finish.ok()).toBeTruthy();
        const report = await finish.json();
        await fs.writeFile(`${directory}/voice-lite-summary-check.json`, JSON.stringify(report, null, 2));
      }
    } finally {
      if (sample.id !== 4) await request.post(`${base}/sessions/${session.publicId}/abandon`, { headers });
    }
    if (sample.id < 10) await page.waitForTimeout(4500);
  }
  expect(rows).toHaveLength(10); expect(requests).toBe(10);
});
