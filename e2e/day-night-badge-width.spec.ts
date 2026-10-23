import { test, expect } from '@playwright/test';

for (const { name, viewport, selector } of [
  { name: 'desktop', viewport: { width: 1280, height: 900 }, selector: '#grimoire-time-badge' },
  { name: 'mobile', viewport: { width: 390, height: 844 }, selector: '#grimoire-info-row' },
]) {
  test(`${name} day/night badge holds its width after Dawn`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      localStorage.setItem('standard-botc-game', JSON.stringify({
        players: [
          { id: 'p1', name: 'Alice', isDead: false },
          { id: 'p2', name: 'Bob', isDead: false },
        ],
        phase: 'game',
        timeOfDay: 'night',
        dayNumber: 1,
      }));
    });

    await page.goto('/#/standard');
    const badge = page.locator(selector);
    await expect(badge).toContainText('Night 1');
    const nightBox = await badge.boundingBox();

    await page.getByText('Dawn', { exact: true }).click();
    await expect(badge).toContainText('Day 1');
    const dayBox = await badge.boundingBox();

    expect(nightBox).not.toBeNull();
    expect(dayBox).not.toBeNull();
    expect(dayBox!.width).toBe(nightBox!.width);
  });
}
