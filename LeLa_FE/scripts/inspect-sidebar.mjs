import { chromium } from '@playwright/test';

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function parseRgb(colorStr) {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 850 } });
  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'mock-token');
    localStorage.setItem('refreshToken', 'mock-refresh');
    localStorage.removeItem('lela.sidebar'); // expanded by default
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
        }
      })
    });
  });

  await page.route('**/api/notifications/unread*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { totalElements: 0, content: [] } }) }));
  await page.route('**/api/voice/status*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { remainingQuota: 2, maxSessionsPerDay: 3 } }) }));
  await page.route('**/api/decks*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { content: [], totalElements: 0 } }) }));
  await page.route('**/api/srs-reviews/statistics', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { dueTodayCount: 5, dueCount: 5 } }) }));

  await page.goto('http://localhost:5173/decks', { waitUntil: 'networkidle' });

  const audit = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    if (!aside) return { error: 'No aside' };

    const items = [];
    const all = aside.querySelectorAll('*');
    for (const el of all) {
      const text = el.textContent ? el.textContent.trim() : '';
      const comp = window.getComputedStyle(el);
      const color = comp.color;
      const bg = comp.backgroundColor;

      items.push({
        tag: el.tagName,
        text: text.slice(0, 30),
        className: el.className ? String(el.className).slice(0, 50) : '',
        color,
        bg,
      });
    }

    return {
      asideWidth: aside.offsetWidth,
      asideHeight: aside.offsetHeight,
      items,
    };
  });

  // Check blue hues (190 to 260) with saturation > 15%
  const blueViolations = [];
  for (const item of audit.items) {
    const rgb = parseRgb(item.color);
    if (rgb) {
      const [h, s, l] = rgbToHsl(...rgb);
      // If saturation > 15% and hue between 190 and 260 (except teal ~175-185 which is AI only)
      if (s > 15 && h >= 190 && h <= 260) {
        blueViolations.push({ ...item, hsl: [h, s, l] });
      }
    }
  }

  console.log('Sidebar width:', audit.asideWidth, 'height:', audit.asideHeight);
  console.log('Total elements inspected in sidebar:', audit.items.length);
  console.log('Blue violations (hue 190-260, sat > 15%):', blueViolations.length);
  if (blueViolations.length > 0) {
    console.log('Violations:', JSON.stringify(blueViolations, null, 2));
  } else {
    console.log('ZERO BLUE VIOLATIONS IN SIDEBAR!');
  }

  // Print sample item computed colors:
  const samples = audit.items.filter(i => 
    i.text.includes('LeLa') || 
    i.text.includes('Khám phá') || 
    i.text.includes('Hôm nay') || 
    i.text.includes('Bộ thẻ') ||
    i.text.includes('Ôn ngay')
  );
  console.log('Sample key elements:', JSON.stringify(samples, null, 2));

  await browser.close();
}

main().catch(console.error);
