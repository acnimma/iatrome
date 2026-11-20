import { chromium, devices } from '@playwright/test';
const out = '/tmp/iatrome-shots';
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [];
const watch = (page, label) => {
  page.on('pageerror', (e) => errors.push(`${label}: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`${label}: ${m.text()}`));
};
const game = process.argv[2] ?? 'grand-rounds';
const res = await fetch('http://localhost:8787/api/rooms', { method: 'POST', headers: { 'content-type': 'application/json', Origin: 'http://localhost:3000' }, body: JSON.stringify({ settings: { game, speed: Number(process.argv[3] ?? 0.35) } }) });
const { code, hostToken } = await res.json();
console.log('room', code);

const stageCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await stageCtx.addInitScript(([c, t]) => localStorage.setItem(`iatrome:host:${c}`, t), [code, hostToken]);
const stage = await stageCtx.newPage(); watch(stage, 'stage');
await stage.goto(`http://localhost:3000/host/${code}`);
await stage.waitForTimeout(1500);
await stage.screenshot({ path: `${out}/${game}-01-lobby-empty.png` });

const names = ['Ana', 'Ben', 'Cy', 'Dee'];
const phones = [];
for (const [i, name] of names.entries()) {
  const ctx = await browser.newContext(i % 2 ? devices['Pixel 7'] : devices['iPhone 13']);
  const p = await ctx.newPage(); watch(p, name);
  await p.goto(`http://localhost:3000/${code}`);
  await p.getByLabel('Your name').fill(name);
  await p.getByRole('button', { name: 'Join game' }).click();
  phones.push(p);
}
await stage.waitForTimeout(1200);
await stage.screenshot({ path: `${out}/${game}-02-lobby-full.png` });
await phones[0].screenshot({ path: `${out}/${game}-02-phone-lobby.png` });
await stage.getByRole('button', { name: /start/i }).click();

let shot = 3;
const seen = new Set();
const deadline = Date.now() + 240_000;
while (Date.now() < deadline) {
  // capture each new phase once
  const key = await stage.evaluate(() => document.querySelector('main')?.dataset.phase ?? '');
  if (!seen.has(key) && seen.size < 40) {
    seen.add(key);
    await stage.screenshot({ path: `${out}/${game}-${String(shot).padStart(2, '0')}-stage.png` });
    await phones[1].screenshot({ path: `${out}/${game}-${String(shot).padStart(2, '0')}-phone.png` });
    shot++;
  }
  // phones act like players
  for (const [i, p] of phones.entries()) {
    try {
      const box = p.locator('textarea');
      if (await box.count()) { await box.fill(`${names[i]} says ${Math.random().toString(36).slice(2, 7)}`); await p.getByRole('button', { name: 'Lock it in' }).click({ timeout: 500 }); continue; }
      const inputs = p.locator('input[placeholder="First…"]');
      if (await inputs.count()) {
        const all = p.locator('form input');
        for (let k = 0; k < 3; k++) await all.nth(k).fill(`${names[i]} item ${k}`);
        await p.getByRole('button', { name: /Lock in my differential/ }).click({ timeout: 500 }); continue;
      }
      const canvas = p.getByLabel('Drawing canvas');
      if (await canvas.count()) {
        const b = await canvas.boundingBox();
        await p.mouse.move(b.x + 40, b.y + 40); await p.mouse.down();
        for (let s = 0; s < 12; s++) await p.mouse.move(b.x + 40 + s * 15, b.y + 40 + Math.sin(s) * 40 + s * 10);
        await p.mouse.up();
        const lock = p.getByRole('button', { name: /masterpiece/ });
        if (await lock.count()) await lock.click({ timeout: 500 });
        continue;
      }
      const choices = p.locator('[data-choice]:not([disabled])');
      const n = await choices.count();
      if (n) { await choices.nth(i % n).click({ timeout: 500 }); continue; }
      const guess = p.getByPlaceholder('Your guess…');
      if (await guess.count()) { await guess.fill('stethoscope'); await guess.press('Enter'); continue; }
      const defend = p.getByPlaceholder('Make your case…');
      if (await defend.count()) { await defend.fill('Hear me out: it builds character.'); await p.getByRole('button', { name: 'Rest my case' }).click({ timeout: 500 }); }
    } catch {}
  }
  if (await stage.getByText('final results').count()) break;
  await stage.waitForTimeout(400);
}
await stage.waitForTimeout(3500);
await stage.screenshot({ path: `${out}/${game}-99-podium.png` });
await phones[0].screenshot({ path: `${out}/${game}-99-phone-results.png` });
console.log('shots', shot, 'errors', errors.slice(0, 20));
await browser.close();
