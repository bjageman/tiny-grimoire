import { test, expect } from '@playwright/test';

const rules = [
  'At the beginning of each Night, the storyteller breaks one of the Seven Seals giving two players an additional ability that night/day. If this ability is given to a dead player, it functions as if they were alive. A poisoned or drunk player loses this ability.',
  'Night 1 Wrath and Patience - Harpy and Poppy Grower',
  'Night 2 Envy and Kindness - Philosopher and Steward',
  'Night 3 Pride and Humility - Vizier (this ability does not work if there is only one vote) and Farmer',
  "Night 4 Gluttony and Temperance - Cannibal and Devil's Advocate",
  'Night 5 Sloth and Diligence - Organ Grinder and Flowergirl',
  'Night 6 Lust and Chastity - Scarlet Woman and Virgin',
  'Night 7 Greed and Generosity - Politician and Alsaahir',
];

for (const { name, viewport } of [
  { name: 'desktop', viewport: { width: 1280, height: 900 } },
  { name: 'mobile', viewport: { width: 390, height: 844 } },
  { name: 'landscape', viewport: { width: 844, height: 390 } },
]) {
  test(`long Bootlegger rules fit and scroll on ${name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => localStorage.setItem('botc-script-show-fabled-lorics', 'true'));
    await page.goto('/#/standard');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'seven-seals.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify([
        { id: '_meta', name: 'Breaking the Seven Seals', author: 'Alex G', bootlegger: rules },
        'noble', 'clockmaker', 'pixie', 'highpriestess', 'balloonist', 'towncrier',
        'lycanthrope', 'seamstress', 'fisherman', 'juggler', 'cannibal', 'ravenkeeper',
        'atheist', 'drunk', 'plaguedoctor', 'barber', 'snitch', 'poisoner', 'cerenovus',
        'xaan', 'marionette', 'nodashii', 'ojo', 'kazali', 'fanggu', 'bootlegger',
      ])),
    });
    await page.getByRole('button', { name: 'View Script', exact: true }).click();
    await page.getByText('Bootlegger', { exact: true }).click();

    const modal = page.locator('#script-character-details-modal');
    const region = page.getByRole('region', { name: 'Bootlegger rules' });
    await expect(region).toBeVisible();
    for (const rule of rules) await expect(region).toContainText(rule);
    const box = await modal.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    expect(box!.width).toBeLessThanOrEqual(viewport.width);
    if (name === 'desktop') expect(box!.width).toBeGreaterThan(384);
    else {
      expect(await region.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
      await region.focus();
      await region.press('Control+End');
      await expect.poll(() => region.evaluate(element => element.scrollHeight - element.clientHeight - element.scrollTop)).toBeLessThan(2);
    }
    await expect(modal.getByRole('button', { name: 'Close Details', exact: true })).toBeInViewport();
    await modal.getByRole('button', { name: 'Close Details', exact: true }).click();
    await page.getByPlaceholder('Search by name or type').fill('noble');
    await page.getByText('Noble', { exact: true }).click();
    const normalBox = await modal.boundingBox();
    expect(normalBox!.width).toBeLessThanOrEqual(384);
    await expect(page.getByRole('region', { name: 'Bootlegger rules' })).toHaveCount(0);
  });
}
