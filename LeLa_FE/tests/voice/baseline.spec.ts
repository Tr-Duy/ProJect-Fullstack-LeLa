import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
test('capture pre-change StrictMode lifecycle (speech adapters, not real microphone)', async ({ page }) => {
  test.skip(!process.env.VOICE_BASELINE, 'One-time baseline before implementation');
  const logs: string[] = [];
  page.on('console', event => logs.push(event.text()));
  await page.goto('/tests/voice-room.html' + (process.env.VOICE_NATIVE_TTS ? '?nativeTts=1' : ''));
  await page.getByRole('button', { name: 'Start fixture' }).click();
  await expect.poll(async () => (await page.locator('#trace').textContent())?.includes('mic-start')).toBeTruthy();
  await fs.mkdir('test-results', { recursive: true });
  const trace = JSON.parse((await page.locator('#trace').textContent())!);
  await fs.writeFile(`test-results/voice-baseline${process.env.VOICE_NATIVE_TTS ? '-native' : ''}.json`, JSON.stringify({ trace, logs }, null, 2));
  console.log(JSON.stringify(trace));
});
