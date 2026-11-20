import { chromium, devices } from '@playwright/test';
const out = '/tmp/iatrome-r2';
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [];
const watch = (p, l) => { p.on('pageerror', (e) => errors.push(`${l}: ${e.message}`)); p.on('console', (m) => m.type() === 'error' && errors.push(`${l}: ${m.text()}`)); };
// host setup
const setup = await browser.newPage({ viewport: { width: 1440, height: 900 } }); watch(setup, 'setup');
await setup.goto('http://localhost:3000/host'); await setup.waitForTimeout(1200);
await setup.screenshot({ path: `${out}/host-setup.png`, fullPage: true });
const phoneSetup = await browser.newPage(devices['iPhone 13']); watch(phoneSetup, 'phone-setup');
await phoneSetup.goto('http://localhost:3000/host'); await phoneSetup.waitForTimeout(1200);
await phoneSetup.screenshot({ path: `${out}/host-setup-phone.png`, fullPage: true });
// didactics room with bots + 2 humans
const res = await fetch('http://localhost:8787/api/rooms', { method: 'POST', headers: { 'content-type': 'application/json', Origin: 'http://localhost:3000' }, body: JSON.stringify({ settings: { game: 'didactics', speed: 0.45 } }) });
const { code, hostToken } = await res.json();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(([c, t]) => localStorage.setItem(`iatrome:host:${c}`, t), [code, hostToken]);
const stage = await ctx.newPage(); watch(stage, 'stage');
await stage.goto(`http://localhost:3000/host/${code}`); await stage.waitForTimeout(1000);
const phones = [];
for (const name of ['Grandma', 'Ben']) {
  const p = await (await browser.newContext(devices['iPhone 13'])).newPage(); watch(p, name);
  await p.goto(`http://localhost:3000/${code}`); await p.getByLabel('Your name').fill(name); await p.getByRole('button', { name: 'Join game' }).click(); phones.push(p);
}
for (let i = 0; i < 10; i++) await stage.getByRole('button', { name: /Add a bot/ }).click();
await stage.waitForTimeout(800);
await stage.screenshot({ path: `${out}/lobby.png` });
await phones[0].screenshot({ path: `${out}/phone-lobby.png` });
await stage.getByRole('button', { name: /start/i }).click();
const seen = new Set(); let n = 0;
const end = Date.now() + 200000;
while (Date.now() < end && !(await stage.getByText('final results').count())) {
  const key = await stage.evaluate(() => document.querySelector('main')?.dataset.phase ?? '');
  if (!seen.has(key)) { seen.add(key); n++; await stage.screenshot({ path: `${out}/d-${n}-stage.png` }); await phones[0].screenshot({ path: `${out}/d-${n}-phone.png` }); }
  for (const p of phones) { const c = p.locator('[data-choice]:not([disabled])'); if (await c.count()) await c.first().click({ timeout: 500 }).catch(() => {}); }
  await stage.waitForTimeout(400);
}
await stage.waitForTimeout(3000);
await stage.screenshot({ path: `${out}/d-podium.png` }); await phones[0].screenshot({ path: `${out}/d-phone-end.png` });
console.log('errors', errors.slice(0, 10));
await browser.close();
