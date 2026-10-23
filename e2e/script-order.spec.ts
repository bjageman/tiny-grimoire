import { test, expect } from '@playwright/test';

for (const grouped of [true, false]) {
  test(`script reads down each column with grouping ${grouped ? 'on' : 'off'}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.addInitScript((groupByType) => {
      localStorage.setItem('botc-script-group-by-type', String(groupByType));
      localStorage.setItem('standard-botc-game', JSON.stringify({
        phase: 'setup',
        players: [],
        scriptName: 'Ordering Test',
        customScriptRoles: [
          { id: 'mayor', name: 'Mayor', team: 'townsfolk' },
          { id: 'monk', name: 'Monk', team: 'townsfolk' },
          { id: 'chef', name: 'Chef', team: 'townsfolk' },
          { id: 'empath', name: 'Empath', team: 'townsfolk' },
        ],
      }));
    }, grouped);
    await page.goto('/#/standard');
    await page.locator('#game-script-button').click();

    const positions = async () => Promise.all(['Mayor', 'Monk', 'Chef', 'Empath'].map(async name => {
      const box = await page.getByRole('button').filter({ has: page.getByText(name, { exact: true }) }).boundingBox();
      expect(box).not.toBeNull();
      return box!;
    }));

    await expect(async () => {
      const [first, second, third, fourth] = await positions();
      expect(second.x).toBe(first.x);
      expect(second.y).toBeGreaterThan(first.y);
      expect(third.x).toBeGreaterThan(first.x);
      expect(third.y).toBe(first.y);
      expect(fourth.x).toBe(third.x);
      expect(fourth.y).toBeGreaterThan(third.y);
    }).toPass();

    await page.getByLabel('View settings').click();
    await page.getByText('2 Columns', { exact: true }).click();
    await expect(page.getByRole('checkbox', { name: '2 Columns', exact: true })).not.toBeChecked();
    await page.getByLabel('View settings').click();
    await expect(async () => {
      const boxes = await positions();
      boxes.slice(1).forEach((box, index) => {
        expect(box.x).toBe(boxes[0].x);
        expect(box.y).toBeGreaterThan(boxes[index].y);
      });
    }).toPass();
  });
}
