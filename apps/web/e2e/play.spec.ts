import { type Browser, type Page, devices, expect, test } from '@playwright/test';

const REALTIME = 'http://localhost:8787';

/** Open a room at test speed and return a stage page logged in as host. */
async function openRoom(browser: Browser, game: string) {
  const res = await fetch(`${REALTIME}/api/rooms`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Origin: 'http://localhost:3000' },
    body: JSON.stringify({ settings: { game, speed: 0.25 } }),
  });
  const { code, hostToken } = await res.json();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(([c, t]) => localStorage.setItem(`iatrome:host:${c}`, t), [code, hostToken]);
  const stage = await ctx.newPage();
  await stage.goto(`/host/${code}`);
  return { code, stage };
}

async function joinPhone(browser: Browser, code: string, name: string, i: number) {
  const ctx = await browser.newContext(i % 2 ? devices['Pixel 7'] : devices['iPhone 13']);
  const phone = await ctx.newPage();
  await phone.goto(`/${code}`); // short link → join screen
  await phone.getByLabel('Your name').fill(name);
  await phone.getByRole('button', { name: 'Join game' }).click();
  await expect(phone.getByText(/You’re in/)).toBeVisible();
  return phone;
}

/** Do whatever the phone is asking for, like a player would. */
async function act(phone: Page, i: number) {
  const tryClick = async (locator: ReturnType<Page['locator']>) => {
    if (await locator.count()) await locator.first().click({ timeout: 1000 }).catch(() => {});
  };
  const box = phone.locator('textarea');
  if (await box.count()) {
    await box.fill(`answer ${i} ${Math.random().toString(36).slice(2, 6)}`);
    await tryClick(phone.getByRole('button', { name: /Lock it in|Rest my case/ }));
    return;
  }
  const list = phone.getByPlaceholder('First…');
  if (await list.count()) {
    const inputs = phone.locator('form input');
    for (let k = 0; k < 3; k++) await inputs.nth(k).fill(`item ${i}-${k}`);
    await tryClick(phone.getByRole('button', { name: /differential/ }));
    return;
  }
  const canvas = phone.getByLabel('Drawing canvas');
  if (await canvas.count()) {
    // Real touch events, like a finger on a phone.
    const b = await canvas.boundingBox();
    if (!b) return; // the drawing phase just ended
    const cdp = await phone.context().newCDPSession(phone);
    const at = (s: number) => [{ x: b.x + 30 + s * 18, y: b.y + 40 + Math.sin(s / 2) * 40 + s * 10, id: 1 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(0) });
    for (let s = 1; s < 12; s++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(s) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach();
    await tryClick(phone.getByRole('button', { name: /masterpiece/ }));
    return;
  }
  const guess = phone.getByPlaceholder('Your guess…');
  if (await guess.count()) {
    await guess.fill('stethoscope');
    await guess.press('Enter');
    return;
  }
  const choices = phone.locator('[data-choice]:not([disabled])');
  const n = await choices.count();
  if (n) await choices.nth(i % n).click({ timeout: 1000 }).catch(() => {});
}

for (const game of ['grand-rounds', 'sketch', 'survive', 'poison', 'didactics']) {
  test(`${game}: a full game from lobby to podium`, async ({ browser }) => {
    const errors: string[] = [];
    const { code, stage } = await openRoom(browser, game);
    stage.on('pageerror', (e) => errors.push(`stage: ${e.message}`));
    await expect(stage.getByText('Grab your phone and go to')).toBeVisible();

    const phones = [];
    for (const [i, name] of (game === 'didactics' ? ['Ana', 'Ben', 'Cy', 'Dee'] : ['Ana', 'Ben', 'Cy']).entries()) {
      const phone = await joinPhone(browser, code, name, i);
      phone.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
      phones.push(phone);
    }
    await expect(stage.getByText('Ana')).toBeVisible();
    await stage.getByRole('button', { name: /Everybody’s in/ }).click();

    const end = Date.now() + 200_000;
    while (Date.now() < end && !(await stage.getByText('final results').count())) {
      await Promise.all(phones.map((p, i) => act(p, i)));
      await stage.waitForTimeout(250);
    }
    await expect(stage.getByText('final results')).toBeVisible();
    await expect(phones[0].getByText(/came \d|Game over/)).toBeVisible({ timeout: 10_000 });
    expect(errors).toEqual([]);
  });
}

test('moderation: password, kick and ban', async ({ browser }) => {
  const res = await fetch(`${REALTIME}/api/rooms`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Origin: 'http://localhost:3000' },
    body: JSON.stringify({ password: 'scrubs' }),
  });
  const { code, hostToken } = await res.json();
  const ctx = await browser.newContext();
  await ctx.addInitScript(([c, t]) => localStorage.setItem(`iatrome:host:${c}`, t), [code, hostToken]);
  const stage = await ctx.newPage();
  await stage.goto(`/host/${code}`);

  const phone = await (await browser.newContext(devices['iPhone 13'])).newPage();
  await phone.goto(`/play/${code}`);
  await phone.getByLabel('Your name').fill('Troll');
  await phone.getByRole('button', { name: 'Join game' }).click();
  await expect(phone.getByText('That password didn’t match')).toBeVisible();
  await phone.getByLabel('Room password').fill('scrubs');
  await phone.getByRole('button', { name: 'Join game' }).click();
  await expect(phone.getByText(/You’re in/)).toBeVisible();

  await stage.getByText('Troll').hover();
  await stage.getByRole('button', { name: 'Ban Troll' }).click();
  await expect(phone.getByText('You’ve been banned from this room')).toBeVisible();

  // Coming back with a new name, even with the right password, doesn't work: the device is banned.
  await phone.goto(`/play/${code}`);
  await phone.getByLabel('Your name').fill('Troll Again');
  await phone.getByRole('button', { name: 'Join game' }).click();
  await phone.getByLabel('Room password').fill('scrubs');
  await phone.getByRole('button', { name: 'Join game' }).click();
  await expect(phone.getByText('This device was banned from the room.')).toBeVisible();
});

test('phones only: host from a phone, play with no big screen', async ({ browser }) => {
  const host = await (await browser.newContext(devices['iPhone 13'])).newPage();
  const errors: string[] = [];
  host.on('pageerror', (e) => errors.push(e.message));
  await host.goto('/host');
  await expect(host.getByRole('radio', { name: /Just phones/ })).toHaveAttribute('aria-checked', 'true');
  await host.getByRole('radio', { name: /Survive the Shift/ }).click();
  await host.getByRole('button', { name: 'Create room' }).click();
  await host.waitForURL(/\/play\//);
  const code = host.url().split('/').pop()!;
  await host.getByLabel('Your name').fill('Ana');
  await host.getByRole('button', { name: 'Join game' }).click();
  await expect(host.getByText('Friends join with')).toBeVisible();

  const friend = await joinPhone(browser, code, 'Ben', 1);
  // The friend has no host controls; the creator does.
  await expect(friend.getByRole('button', { name: 'Host controls' })).toHaveCount(0);
  await host.getByRole('button', { name: 'Host controls' }).click();
  await host.getByRole('switch', { name: /Lock room/ }).click();
  await host.keyboard.press('Escape');

  await host.getByRole('button', { name: /Start/ }).click();
  await expect(host.getByText(/Question 1/)).toBeVisible();
  await host.locator('[data-choice]').first().click();
  await friend.locator('[data-choice]').nth(1).click();
  // No big screen, so the phones show the answer and the fact themselves.
  await expect(host.locator('[class*=fact]')).toBeVisible({ timeout: 30_000 });
  expect(errors).toEqual([]);
});
