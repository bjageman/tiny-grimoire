import { test, expect } from '@playwright/test';

test('day/night badge holds a constant width when toggled', async ({ page }) => {
  const seedState = {
    players: [
      { id: 'p1', name: 'Alice', isDead: false },
      { id: 'p2', name: 'Bob', isDead: false },
    ],
    phase: 'game',
    timeOfDay: 'night',
    dayNumber: 1,
  };

  await page.addInitScript((state) => {
    localStorage.setItem('standard-botc-game', JSON.stringify(state));
  }, seedState);

  await page.goto('/#/standard');
  const badge = page.locator('#grimoire-time-badge');
  await expect(badge).toBeVisible();

  const nightBox = await badge.boundingBox();
  await badge.click();
  const dayBox = await badge.boundingBox();

  expect(nightBox).not.toBeNull();
  expect(dayBox).not.toBeNull();
  expect(dayBox!.width).toBe(nightBox!.width);
});

test('mobile day/night badge holds a constant width when toggled', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  const seedState = {
    players: [
      { id: 'p1', name: 'Alice', isDead: false },
      { id: 'p2', name: 'Bob', isDead: false },
    ],
    phase: 'game',
    timeOfDay: 'night',
    dayNumber: 1,
  };

  await page.addInitScript((state) => {
    localStorage.setItem('standard-botc-game', JSON.stringify(state));
  }, seedState);

  await page.goto('/#/standard');
  const badge = page.locator('#grimoire-info-row');
  await expect(badge).toBeVisible();

  const nightBox = await badge.boundingBox();
  await badge.click();
  const dayBox = await badge.boundingBox();

  expect(nightBox).not.toBeNull();
  expect(dayBox).not.toBeNull();
  expect(dayBox!.width).toBe(nightBox!.width);
});
