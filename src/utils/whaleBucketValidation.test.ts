import { describe, it, expect } from 'vitest';
import { getValidationSummary } from './whaleBucketValidation';
import type { Player } from '../types';

describe('whaleBucketValidation utility', () => {
  it('should return null for empty player list', () => {
    expect(getValidationSummary([])).toBeNull();
  });

  it('should correctly validate a standard 8-player distribution', () => {
    // 8 players: standard distribution is 5 Townsfolk, 1 Outsider, 1 Minion, 1 Demon
    const players: Player[] = [
      { id: '1', name: 'Player 1', roleId: 'washerwoman', isDead: false }, // townsfolk
      { id: '2', name: 'Player 2', roleId: 'librarian', isDead: false }, // townsfolk
      { id: '3', name: 'Player 3', roleId: 'investigator', isDead: false }, // townsfolk
      { id: '4', name: 'Player 4', roleId: 'chef', isDead: false }, // townsfolk
      { id: '5', name: 'Player 5', roleId: 'empath', isDead: false }, // townsfolk
      { id: '6', name: 'Player 6', roleId: 'monk', isDead: false, isTheDrunk: true }, // outsider (Drunk, displayed as a fake Monk)
      { id: '7', name: 'Player 7', roleId: 'poisoner', isDead: false }, // minion
      { id: '8', name: 'Player 8', roleId: 'imp', isDead: false }, // demon
    ];

    const summary = getValidationSummary(players);
    expect(summary).not.toBeNull();
    if (summary) {
      expect(summary.base).toEqual({ townsfolk: 5, outsider: 1, minion: 1, demon: 1, traveler: 0 });
      expect(summary.expected).toEqual({ townsfolk: 5, outsider: 1, minion: 1, demon: 1, traveler: 0 });
      expect(summary.counts.townsfolk).toBe(5);
      expect(summary.counts.outsider).toBe(1);
      expect(summary.counts.minion).toBe(1);
      expect(summary.counts.demon).toBe(1);
      expect(summary.isValid).toBe(true);
    }
  });

  it('should apply Lil\' Monsta modifications correctly', () => {
    // 8 players with Lil' Monsta (+1 Minion, -1 Demon)
    const players: Player[] = [
      { id: '1', name: 'Player 1', roleId: 'washerwoman', isDead: false },
      { id: '2', name: 'Player 2', roleId: 'librarian', isDead: false },
      { id: '3', name: 'Player 3', roleId: 'investigator', isDead: false },
      { id: '4', name: 'Player 4', roleId: 'chef', isDead: false },
      { id: '5', name: 'Player 5', roleId: 'empath', isDead: false },
      { id: '6', name: 'Player 6', roleId: 'drunk', isDead: false },
      { id: '7', name: 'Player 7', roleId: 'poisoner', isDead: false },
      { id: '8', name: 'Player 8', roleId: 'baron', isDead: false }, // Second minion instead of demon
      { id: '9', name: 'Lil Monsta', roleId: 'lilmonsta', isDead: false, isTheLilMonsta: true },
    ];

    const summary = getValidationSummary(players);
    expect(summary).not.toBeNull();
    if (summary) {
      // Lil Monsta counts as a player, making it 9 players total.
      // Standard 9 players: 5 townsfolk, 2 outsiders, 1 minion, 1 demon
      // With Lil Monsta modification: +1 minion, -1 demon => 2 minions, 0 demons
      expect(summary.expected.minion).toBe(2);
      expect(summary.expected.demon).toBe(0);
      expect(summary.modifications).toContain("Lil' Monsta (+1 Minion, -1 Demon)");
    }
  });

  it('should handle Atheist setups correctly', () => {
    // Atheist setup with no evil players
    const players: Player[] = [
      { id: '1', name: 'Player 1', roleId: 'washerwoman', isDead: false },
      { id: '2', name: 'Player 2', roleId: 'librarian', isDead: false },
      { id: '3', name: 'Player 3', roleId: 'investigator', isDead: false },
      { id: '4', name: 'Player 4', roleId: 'chef', isDead: false },
      { id: '5', name: 'Player 5', roleId: 'empath', isDead: false },
      { id: '6', name: 'Player 6', roleId: 'drunk', isDead: false },
      { id: '7', name: 'Player 7', roleId: 'butler', isDead: false },
      { id: '8', name: 'Player 8', roleId: 'atheist', isDead: false },
    ];

    const summary = getValidationSummary(players);
    expect(summary).not.toBeNull();
    if (summary) {
      expect(summary.expected.demon).toBe(0);
      expect(summary.expected.minion).toBe(0);
      expect(summary.modifications).toContain("Atheist (No Evil players)");
    }
  });

  it('allows 0 or +1 Outsider when Balloonist is assigned', () => {
    // 8-player base: 5 TF / 1 Out / 1 Minion / 1 Demon. Balloonist is a Townsfolk.
    const players: Player[] = [
      { id: '1', name: 'Player 1', roleId: 'washerwoman', isDead: false },
      { id: '2', name: 'Player 2', roleId: 'librarian', isDead: false },
      { id: '3', name: 'Player 3', roleId: 'investigator', isDead: false },
      { id: '4', name: 'Player 4', roleId: 'chef', isDead: false },
      { id: '5', name: 'Player 5', roleId: 'balloonist', isDead: false },
      { id: '6', name: 'Player 6', roleId: 'drunk', isDead: false },
      { id: '7', name: 'Player 7', roleId: 'poisoner', isDead: false },
      { id: '8', name: 'Player 8', roleId: 'imp', isDead: false },
    ];

    const summary = getValidationSummary(players);
    expect(summary).not.toBeNull();
    if (summary) {
      expect(summary.modifications).toContain("Balloonist (0 or +1 Outsider)");
      expect(summary.expectedOutsiderLabel).toBe('1 or 2');
      expect(summary.isOutsiderValid).toBe(true);
    }
  });

  it('allows 0 or +1 Outsider when Huntsman is assigned, and warns if no Damsel is assigned', () => {
    // 8-player base: 5 TF / 1 Out / 1 Minion / 1 Demon. Huntsman is a Townsfolk.
    const players: Player[] = [
      { id: '1', name: 'Player 1', roleId: 'washerwoman', isDead: false },
      { id: '2', name: 'Player 2', roleId: 'librarian', isDead: false },
      { id: '3', name: 'Player 3', roleId: 'investigator', isDead: false },
      { id: '4', name: 'Player 4', roleId: 'chef', isDead: false },
      { id: '5', name: 'Player 5', roleId: 'huntsman', isDead: false },
      { id: '6', name: 'Player 6', roleId: 'drunk', isDead: false },
      { id: '7', name: 'Player 7', roleId: 'poisoner', isDead: false },
      { id: '8', name: 'Player 8', roleId: 'imp', isDead: false },
    ];

    const summary = getValidationSummary(players);
    expect(summary).not.toBeNull();
    if (summary) {
      expect(summary.modifications).toContain("Huntsman (0 or +1 Outsider)");
      expect(summary.expectedOutsiderLabel).toBe('1 or 2');
      expect(summary.isOutsiderValid).toBe(true);
      expect(summary.jinxWarnings).toContain("Huntsman in play, but no Damsel assigned.");
      expect(summary.isValid).toBe(false);
    }
  });

  it('clears the Huntsman/Damsel jinx warning once a Damsel is assigned', () => {
    const players: Player[] = [
      { id: '1', name: 'Player 1', roleId: 'washerwoman', isDead: false },
      { id: '2', name: 'Player 2', roleId: 'librarian', isDead: false },
      { id: '3', name: 'Player 3', roleId: 'investigator', isDead: false },
      { id: '4', name: 'Player 4', roleId: 'chef', isDead: false },
      { id: '5', name: 'Player 5', roleId: 'huntsman', isDead: false },
      { id: '6', name: 'Player 6', roleId: 'damsel', isDead: false },
      { id: '7', name: 'Player 7', roleId: 'poisoner', isDead: false },
      { id: '8', name: 'Player 8', roleId: 'imp', isDead: false },
    ];

    const summary = getValidationSummary(players);
    expect(summary).not.toBeNull();
    if (summary) {
      expect(summary.jinxWarnings).not.toContain("Huntsman in play, but no Damsel assigned.");
      expect(summary.isValid).toBe(true);
    }
  });

  it('warns that the Alchemist ability may affect setup whenever it is assigned', () => {
    const players: Player[] = [
      { id: '1', name: 'Player 1', roleId: 'washerwoman', isDead: false },
      { id: '2', name: 'Player 2', roleId: 'librarian', isDead: false },
      { id: '3', name: 'Player 3', roleId: 'investigator', isDead: false },
      { id: '4', name: 'Player 4', roleId: 'chef', isDead: false },
      { id: '5', name: 'Player 5', roleId: 'alchemist', isDead: false },
      { id: '6', name: 'Player 6', roleId: 'drunk', isDead: false },
      { id: '7', name: 'Player 7', roleId: 'poisoner', isDead: false },
      { id: '8', name: 'Player 8', roleId: 'imp', isDead: false },
    ];

    const summary = getValidationSummary(players);
    expect(summary).not.toBeNull();
    if (summary) {
      expect(summary.jinxWarnings).toContain("Alchemist in play — ability may affect setup.");
    }
  });

  describe('Marionette', () => {
    it('shows a matching (valid) balance when the Marionette displays as a Townsfolk — no adjustment at all', () => {
      // 6-player base: 3 TF / 1 Out / 1 Min / 1 Dem. Marionette displaying as Townsfolk doesn't
      // change any expected count — its own seat is only tallied as the 1 Minion.
      const players: Player[] = [
        { id: '1', name: 'Player 1', roleId: 'damsel', isDead: false },
        { id: '2', name: 'Player 2', roleId: 'imp', isDead: false },
        { id: '3', name: 'Player 3', roleId: 'philosopher', isDead: false, isTheMarionette: true },
        { id: '4', name: 'Player 4', roleId: 'villageidiot', isDead: false },
        { id: '5', name: 'Player 5', roleId: 'steward', isDead: false },
        { id: '6', name: 'Player 6', roleId: 'chef', isDead: false },
      ];

      const summary = getValidationSummary(players);
      expect(summary).not.toBeNull();
      if (summary) {
        expect(summary.expected.townsfolk).toBe(3);
        expect(summary.expected.outsider).toBe(1);
        expect(summary.counts).toEqual(summary.expected);
        expect(summary.isValid).toBe(true);
        expect(summary.modifications.some(m => m.includes('Marionette'))).toBe(false);
      }
    });

    it('drops the expected Outsider count by 1 when the Marionette displays as an Outsider, with no Townsfolk compensation', () => {
      // 6-player base: 3 TF / 1 Out / 1 Min / 1 Dem. Marionette displaying as Outsider means no
      // OTHER real Outsider (expected Outsider drops to 0), and Townsfolk expected stays at the
      // base 3 — even though the game still needs a 4th real Townsfolk to fill all 6 seats, so
      // Townsfolk will legitimately show as unbalanced here.
      const players: Player[] = [
        { id: '1', name: 'Player 1', roleId: 'washerwoman', isDead: false },
        { id: '2', name: 'Player 2', roleId: 'imp', isDead: false },
        { id: '3', name: 'Player 3', roleId: 'recluse', isDead: false, isTheMarionette: true },
        { id: '4', name: 'Player 4', roleId: 'villageidiot', isDead: false },
        { id: '5', name: 'Player 5', roleId: 'steward', isDead: false },
        { id: '6', name: 'Player 6', roleId: 'chef', isDead: false },
      ];

      const summary = getValidationSummary(players);
      expect(summary).not.toBeNull();
      if (summary) {
        expect(summary.expected.outsider).toBe(0);
        expect(summary.expected.townsfolk).toBe(3);
        expect(summary.counts.outsider).toBe(0);
        expect(summary.counts.townsfolk).toBe(4);
        expect(summary.isOutsiderValid).toBe(true);
        expect(summary.isTownsfolkValid).toBe(false);
        expect(summary.modifications).toContain('Marionette displays as Outsider (-1 Outsider)');
      }
    });
  });

  describe('masquerade identity exposure', () => {
    const basePlayers: Player[] = [
      { id: '1', name: 'Player 1', roleId: 'washerwoman', isDead: false },
      { id: '2', name: 'Player 2', roleId: 'librarian', isDead: false },
      { id: '3', name: 'Player 3', roleId: 'investigator', isDead: false },
      { id: '4', name: 'Player 4', roleId: 'chef', isDead: false },
      { id: '5', name: 'Player 5', roleId: 'poisoner', isDead: false },
      { id: '6', name: 'Player 6', roleId: 'imp', isDead: false },
    ];

    it('warns when a player is displayed as the Drunk itself', () => {
      const players: Player[] = [...basePlayers.slice(0, 5), { id: '7', name: 'Gina', roleId: 'drunk', isDead: false, isTheDrunk: true }];
      const summary = getValidationSummary(players);
      expect(summary).not.toBeNull();
      if (summary) {
        expect(summary.jinxWarnings).toContain('Gina is displayed as Drunk itself, revealing their true identity.');
      }
    });

    it('warns when a player is displayed as the Marionette itself', () => {
      const players: Player[] = [...basePlayers.slice(0, 5), { id: '7', name: 'Gina', roleId: 'marionette', isDead: false, isTheMarionette: true }];
      const summary = getValidationSummary(players);
      expect(summary).not.toBeNull();
      if (summary) {
        expect(summary.jinxWarnings).toContain('Gina is displayed as Marionette itself, revealing their true identity.');
      }
    });

    it('warns when a player is displayed as the Lunatic itself', () => {
      const players: Player[] = [...basePlayers.slice(0, 5), { id: '7', name: 'Gina', roleId: 'lunatic', isDead: false, isTheLunatic: true }];
      const summary = getValidationSummary(players);
      expect(summary).not.toBeNull();
      if (summary) {
        expect(summary.jinxWarnings).toContain('Gina is displayed as Lunatic itself, revealing their true identity.');
      }
    });

    it('does not warn when the Drunk is properly disguised as a different Townsfolk', () => {
      const players: Player[] = [...basePlayers.slice(0, 5), { id: '7', name: 'Gina', roleId: 'monk', isDead: false, isTheDrunk: true }];
      const summary = getValidationSummary(players);
      expect(summary).not.toBeNull();
      if (summary) {
        expect(summary.jinxWarnings.some(w => w.includes('revealing their true identity'))).toBe(false);
      }
    });
  });
});
