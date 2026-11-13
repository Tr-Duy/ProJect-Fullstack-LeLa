import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { performance } from 'node:perf_hooks';

test('10 real backend/Gemini turns: click-to-feedback, with test STT/TTS adapters', async ({ page, request }) => {
  test.skip(process.env.VOICE_LIVE !== '1', 'Explicit opt-in: consumes Gemini quota and creates local test sessions');
  test.setTimeout(360000);
  const dir = '../tests/experiments/private-results';
  const { accessToken } = JSON.parse(await fs.readFile(`${dir}/phase1a-auth.json`, 'utf8'));
  const headers = { Authorization: `Bearer ${accessToken}` };
  const base = 'http://localhost:8080/api/v1/voice-conversations';
  const rows: any[] = [];
  let postRequests = 0;
  let renderedMs: number | null = null;
  page.on('console', event => {
    const match = /\[VOICE FEEDBACK\].*elapsedMs=([0-9.]+)/.exec(event.text());
    if (match) renderedMs = Number(match[1]);
  });
  await page.route('**/voice-conversations/sessions/*/turns', async route => {
    if (route.request().method() === 'POST') postRequests++;
    await route.continue({ headers: { ...route.request().headers(), ...headers } });
  });
  const scenariosResponse = await request.get(`${base}/scenarios`, { headers });
  expect(scenariosResponse.ok()).toBeTruthy();
  const scenarios = await scenariosResponse.json();
  const coffee = scenarios.find((s: any) => /coffee/i.test(s.title)) || scenarios[0];
  for (let i = 1; i <= 10; i++) {
    const start = await request.post(`${base}/sessions/start`, { headers, data: { scenarioSlug: coffee.slug } });
    expect(start.ok()).toBeTruthy();
    const session = await start.json();
    try {
      renderedMs = null;
      await page.goto(`http://localhost:5173/tests/voice-room.html?sessionId=${session.publicId}&opening=${encodeURIComponent(session.openingLine)}`);
      await page.getByRole('button', { name: 'Start fixture' }).click();
      await expect(page.getByTestId('voice-phase')).toHaveText('Sẵn sàng');
      await page.getByRole('button', { name: 'Bấm để nói' }).click();
      await page.getByRole('button', { name: 'Deliver final speech' }).click();
      const responsePromise = page.waitForResponse(r => r.url().endsWith('/turns') && r.request().method() === 'POST');
      const at = performance.now();
      await page.getByRole('button', { name: 'Dừng và gửi' }).click();
      const response = await responsePromise;
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      await expect(page.getByRole('button', { name: data.feedbackLine, exact: true })).toBeVisible({ timeout: 40000 });
      const observedMs = performance.now() - at;
      rows.push({ turn: i, status: response.status(), degraded: data.degraded, errorCode: data.errorCode,
        clickToVisibleMs: Math.round(observedMs), renderedMs, suggestions: data.suggestions,
        feedbackLine: data.feedbackLine, evaluation: data.evaluation });
      await fs.writeFile(`${dir}/phase1a-live-latency.json`, JSON.stringify({ rows, postRequests }, null, 2));
      console.log(JSON.stringify({ turn: i, clickToVisibleMs: Math.round(observedMs), renderedMs, degraded: data.degraded }));
      // Respect the observed fallback free tier 15 RPM rather than sending a burst.
      if (i < 10) await page.waitForTimeout(4500);
    } finally {
      await request.post(`${base}/sessions/${session.publicId}/abandon`, { headers });
    }
  }
  expect(postRequests).toBe(10);
});
