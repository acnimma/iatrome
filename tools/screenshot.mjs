// Quick visual check: node tools/screenshot.mjs <url> <outDir> [waitMs]
// Captures phone + laptop screenshots using the system Chrome.
import { chromium, devices } from '@playwright/test';

const [url = 'http://localhost:3000', out = '.', wait = '2500'] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome' });
const shots = [
  ['phone', devices['iPhone 13']],
  ['laptop', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
];
for (const [name, opts] of shots) {
  const page = await browser.newPage(opts);
  await page.goto(url);
  await page.waitForTimeout(Number(wait));
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: process.env.FULL === '1' });
  await page.close();
}
await browser.close();
