import { test, expect } from '@playwright/test';

for (const viewport of [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
]) {
  test(`fullscreen Game Notes fits ${viewport.width}x${viewport.height} and exits cleanly`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      localStorage.setItem('player-tracker-botc-game', JSON.stringify({
        phase: 'game', timeOfDay: 'day', dayNumber: 3,
        players: Array.from({ length: 20 }, (_, index) => ({
          id: `p${index}`, name: `Player ${index + 1}`, isDead: index === 0, hasDeadVote: index === 0,
        })),
      }));
    });
    await page.goto('/#/tracker');
    await page.getByRole('button', { name: 'Enter fullscreen grimoire' }).click();
    const fullscreen = page.getByRole('dialog', { name: 'Fullscreen grimoire' });
    await expect(fullscreen).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.fullscreenElement === document.documentElement)).toBe(true);
    await expect(fullscreen).toHaveCSS('position', 'fixed');
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    await expect(fullscreen.getByRole('img', { name: 'Vote Token Active' })).toBeVisible();
    await expect(fullscreen.locator('[id^="grimoire-player-"]')).toHaveCount(20);
    await expect.poll(async () => fullscreen.locator('[id^="grimoire-player-"]').evaluateAll(buttons => buttons.every(button => {
      const rect = button.getBoundingClientRect();
      return rect.width > 0 && rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight;
    }))).toBe(true);
    const bounds = await fullscreen.boundingBox();
    expect(bounds).toMatchObject({ x: 0, y: 0, width: viewport.width, height: viewport.height });
    const exit = fullscreen.getByRole('button', { name: 'Exit fullscreen grimoire' });
    await expect(exit).toBeFocused();
    await fullscreen.locator('#grimoire-reset-time-button').focus();
    await page.keyboard.press('Shift+Tab');
    await expect(fullscreen.locator('#grimoire-player-p19')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(fullscreen.locator('#grimoire-reset-time-button')).toBeFocused();
    await fullscreen.locator('#grimoire-player-p0').click();
    await expect(page.locator('#detail-vote-token-toggle')).toBeVisible();
    await page.locator('#detail-vote-token-toggle').click();
    await page.keyboard.press('Escape');
    await expect(fullscreen).toBeVisible();
    await expect(fullscreen.getByRole('img', { name: 'Vote Token Active' })).toHaveCount(0);
    await exit.click();
    await expect(fullscreen).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true);
    await expect(page.getByRole('button', { name: 'Enter fullscreen grimoire' })).toBeFocused();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
    await page.getByRole('button', { name: 'Enter fullscreen grimoire' }).click();
    await page.keyboard.press('Escape');
    await expect(fullscreen).toHaveCount(0);
    await expect(page).toHaveURL(/#\/tracker$/);
  });
}

test('browser fullscreen exit restores Game Notes', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('player-tracker-botc-game', JSON.stringify({
      phase: 'game', players: [{ id: 'alice', name: 'Alice' }],
    }));
  });
  await page.goto('/#/tracker');
  const enter = page.getByRole('button', { name: 'Enter fullscreen grimoire' });
  await enter.click();
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  await page.evaluate(() => document.exitFullscreen());
  await expect(page.getByRole('dialog', { name: 'Fullscreen grimoire' })).toHaveCount(0);
  await expect(enter).toBeFocused();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

for (const support of ['unavailable', 'denied']) {
  test(`same fullscreen button still works when browser fullscreen is ${support}`, async ({ page }) => {
    await page.addInitScript(support => {
      Object.defineProperty(Element.prototype, 'requestFullscreen', {
        value: support === 'unavailable' ? undefined : () => Promise.reject(new Error('Denied')),
      });
      localStorage.setItem('player-tracker-botc-game', JSON.stringify({
        phase: 'game', players: [{ id: 'alice', name: 'Alice' }],
      }));
    }, support);
    await page.goto('/#/tracker');
    await page.getByRole('button', { name: 'Enter fullscreen grimoire' }).click();
    await expect(page.getByRole('dialog', { name: 'Fullscreen grimoire' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true);
    await page.getByRole('button', { name: 'Exit fullscreen grimoire' }).click();
    await expect(page.getByRole('dialog', { name: 'Fullscreen grimoire' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Enter fullscreen grimoire' })).toBeFocused();
  });
}

for (const viewport of [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
]) {
  test(`fullscreen join QR fits ${viewport.width}x${viewport.height} alongside rotation`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      localStorage.setItem('player-tracker-botc-game', JSON.stringify({
        phase: 'game', code: 'JOIN', timeOfDay: 'day', dayNumber: 3,
        players: Array.from({ length: 20 }, (_, index) => ({ id: `p${index}`, name: `Player ${index + 1}` })),
      }));
    });
    await page.goto('/#/tracker');
    await expect(page.getByRole('button', { name: 'Show join code' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Enter fullscreen grimoire' }).click();
    const fullscreen = page.getByRole('dialog', { name: 'Fullscreen grimoire' });
    const toggle = fullscreen.getByRole('button', { name: 'Show join code' });
    const boardBounds = await fullscreen.locator('#grimoire-circle-board').boundingBox();
    const toggleBounds = await toggle.boundingBox();
    expect(toggleBounds!.x - boardBounds!.x).toBeLessThan(20);
    expect(boardBounds!.y + boardBounds!.height - toggleBounds!.y - toggleBounds!.height).toBeLessThan(20);
    const rotate = fullscreen.getByTitle('Rotate clockwise', { exact: true });
    const initialRotateY = (await rotate.boundingBox())!.y;
    await toggle.click();
    const region = fullscreen.getByRole('region', { name: 'Join this game' });
    await expect(region).toContainText('JOIN');
    const qr = region.getByRole('img', { name: 'Join game JOIN' });
    await expect(qr).toBeVisible();
    const qrBounds = (await qr.boundingBox())!;
    const pageUrl = new URL(page.url());
    const joinUrl = region.getByText(`${pageUrl.origin}${pageUrl.pathname}#/join?code=JOIN`, { exact: true });
    await expect(joinUrl).toBeVisible();
    expect((await joinUrl.boundingBox())!.y).toBeGreaterThanOrEqual(qrBounds.y + qrBounds.height);
    expect(qrBounds.width).toBeGreaterThan(50);
    expect(qrBounds.x).toBeGreaterThanOrEqual(0);
    expect(qrBounds.y).toBeGreaterThanOrEqual(0);
    expect(qrBounds.x + qrBounds.width).toBeLessThanOrEqual(viewport.width);
    expect(qrBounds.y + qrBounds.height).toBeLessThanOrEqual(viewport.height);
    await expect.poll(async () => (await rotate.boundingBox())!.y).toBeGreaterThan(initialRotateY);
    await expect.poll(() => fullscreen.evaluate(root => {
      const joinElements = root.querySelectorAll('[aria-label="Join this game"] p, [aria-label="Join this game"] svg');
      const players = Array.from(root.querySelectorAll('[id^="grimoire-player-"]'));
      return Array.from(joinElements).every(element => {
        const bounds = element.getBoundingClientRect();
        return players.every(player => {
          const rect = player.getBoundingClientRect();
          return rect.right <= bounds.left || rect.left >= bounds.right || rect.bottom <= bounds.top || rect.top >= bounds.bottom;
        });
      });
    })).toBe(true);
    const seat = () => fullscreen.locator('#grimoire-player-p0').evaluate(button => button.closest('[style*="left"]')!.getAttribute('style'));
    const initialSeat = await seat();
    await rotate.click();
    await expect.poll(seat).not.toBe(initialSeat);
    await expect(region).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(region).toHaveCount(0);
    await expect(fullscreen).toBeVisible();
    await fullscreen.getByRole('button', { name: 'Show join code' }).click();
    await fullscreen.getByRole('button', { name: 'Hide join code' }).click();
    await expect(region).toHaveCount(0);
    await fullscreen.getByRole('button', { name: 'Show join code' }).click();
    await fullscreen.getByRole('button', { name: 'Exit fullscreen grimoire' }).click();
    await page.getByRole('button', { name: 'Enter fullscreen grimoire' }).click();
    await expect(page.getByRole('region', { name: 'Join this game' })).toHaveCount(0);
  });
}
