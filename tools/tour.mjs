// Visual tour: plays a game with a stage + three phones and screenshots every new screen.
// node tools/tour.mjs <game> <outDir> [speed]
import { chromium, devices } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [game = 'survive', out = '.', speed = '0.5'] = process.argv.slice(2);
// STAGE_SIZES=1280x720,1920x1080 also captures the stage at each of those sizes.
const sizes = (process.env.STAGE_SIZES ?? '').split(',').filter(Boolean).map((s) => s.split('x').map(Number));
const WEB = 'http://localhost:3000';
const REALTIME = 'http://localhost:8787';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const res = await fetch(`${REALTIME}/api/rooms`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', Origin: WEB },
  body: JSON.stringify({ settings: { game, speed: Number(speed) } }),
});
const { code, hostToken } = await res.json();
const sctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await sctx.addInitScript(([c, t]) => localStorage.setItem(`iatrome:host:${c}`, t), [code, hostToken]);
const stage = await sctx.newPage();
await stage.goto(`${WEB}/host/${code}`);

const names = game === 'didactics' ? ['Ana', 'Ben', 'Cy', 'Dee'] : ['Ana', 'Ben', 'Cy'];
const phones = [];
for (const [i, name] of names.entries()) {
  const ctx = await browser.newContext(devices['iPhone 13']);
  const p = await ctx.newPage();
  await p.goto(`${WEB}/${code}`);
  await p.getByLabel('Your name').fill(name);
  await p.getByRole('button', { name: 'Join game' }).click();
  await p.getByText(/You’re in/).waitFor();
  phones.push(p);
}
let n = 0;
const seen = new Set();
async function snap(tag) {
  for (const [who, page] of [['stage', stage], ['phone', phones[0]]]) {
    const text = (await page.locator('body').innerText().catch(() => '')).replace(/\d+/g, '#').slice(0, 400);
    const key = who + text;
    if (seen.has(key)) continue;
    seen.add(key);
    await page.screenshot({ path: `${out}/${String(++n).padStart(3, '0')}-${who}-${tag}.png` });
    if (who === 'stage')
      for (const [width, height] of sizes) {
        await page.setViewportSize({ width, height });
        await page.waitForTimeout(250);
        await page.screenshot({ path: `${out}/${String(n).padStart(3, '0')}-size${width}x${height}-${tag}.png` });
      }
    if (who === 'stage' && sizes.length) await page.setViewportSize({ width: 1440, height: 900 });
  }
}
await snap('lobby');
await stage.getByRole('button', { name: /Everybody’s in/ }).click();

async function act(phone, i) {
  const tryClick = async (l) => { if (await l.count()) await l.first().click({ timeout: 800 }).catch(() => {}); };
  const box = phone.locator('textarea');
  if (await box.count()) { await box.fill(`answer from ${i}`); await tryClick(phone.getByRole('button', { name: /Lock it in|Rest my case/ })); return; }
  if (await phone.getByPlaceholder('First…').count()) {
    const inputs = phone.locator('form input');
    for (let k = 0; k < 3; k++) await inputs.nth(k).fill(`item ${i}-${k}`);
    await tryClick(phone.getByRole('button', { name: /differential/ })); return;
  }
  const canvas = phone.getByLabel('Drawing canvas');
  if (await canvas.count()) {
    const b = await canvas.boundingBox({ timeout: 500 }).catch(() => null); if (!b) return;
    await phone.mouse.move(b.x + 40, b.y + 60); await phone.mouse.down();
    for (let s = 1; s < 12; s++) await phone.mouse.move(b.x + 40 + s * 16, b.y + 60 + Math.sin(s) * 40);
    await phone.mouse.up();
    await tryClick(phone.getByRole('button', { name: /masterpiece/ })); return;
  }
  const guess = phone.getByPlaceholder('Your guess…');
  if (await guess.count()) { await guess.fill('stethoscope'); await guess.press('Enter'); return; }
  const choices = phone.locator('[data-choice]:not([disabled])');
  const c = await choices.count();
  if (c) await choices.nth(i % c).click({ timeout: 800 }).catch(() => {});
}
const end = Date.now() + 240_000;
let t = 0;
while (Date.now() < end && !(await stage.getByText('final results').count())) {
  await snap(`t${t++}`);
  await Promise.all(phones.map((p, i) => (i === 0 && t % 2 ? null : act(p, i))));
  await stage.waitForTimeout(600);
}
await stage.waitForTimeout(1500);
await snap('end');
await browser.close();
console.log(`${n} shots in ${out}`);
