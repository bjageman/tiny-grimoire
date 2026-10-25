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
    await expect(page.getByRole('button', { name: 'Enter fullscreen grimoire' })).toBeFocused();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
    await page.getByRole('button', { name: 'Enter fullscreen grimoire' }).click();
    await page.keyboard.press('Escape');
    await expect(fullscreen).toHaveCount(0);
    await expect(page).toHaveURL(/#\/tracker$/);
  });
}
