import { describe, it, expect } from 'vitest';
import { getValidationSummary } from './validationSummary';
import type { Player, Role } from '../types';

describe('validationSummary utility', () => {
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

  describe('warnings vs failures split', () => {
    const basePlayers: Player[] = [
      { id: '1', name: 'Player 1', roleId: 'washerwoman', isDead: false },
      { id: '2', name: 'Player 2', roleId: 'librarian', isDead: false },
      { id: '3', name: 'Player 3', roleId: 'investigator', isDead: false },
      { id: '4', name: 'Player 4', roleId: 'chef', isDead: false },
      { id: '5', name: 'Player 5', roleId: 'poisoner', isDead: false },
      { id: '6', name: 'Player 6', roleId: 'imp', isDead: false },
    ];

    it('puts Huntsman/Damsel and Choirboy/King setup issues under failures, not warnings', () => {
      const players: Player[] = [...basePlayers, { id: '7', name: 'Gina', roleId: 'huntsman', isDead: false }];
      const summary = getValidationSummary(players);
      expect(summary).not.toBeNull();
      if (summary) {
        expect(summary.failures).toContain('Huntsman in play, but no Damsel assigned.');
        expect(summary.warnings).not.toContain('Huntsman in play, but no Damsel assigned.');
      }

      const players2: Player[] = [...basePlayers, { id: '7', name: 'Gina', roleId: 'choirboy', isDead: false }];
      const summary2 = getValidationSummary(players2);
      expect(summary2).not.toBeNull();
      if (summary2) {
        expect(summary2.failures).toContain('Choirboy in play, but no King assigned.');
        expect(summary2.warnings).not.toContain('Choirboy in play, but no King assigned.');
      }
    });

    it('puts Alchemist and custom roles under warnings, not failures', () => {
      const players: Player[] = [...basePlayers, { id: '7', name: 'Gina', roleId: 'alchemist', isDead: false }];
      const summary = getValidationSummary(players);
      expect(summary).not.toBeNull();
      if (summary) {
        expect(summary.warnings).toContain('Alchemist in play — ability may affect setup.');
        expect(summary.failures).not.toContain('Alchemist in play — ability may affect setup.');
      }
    });

    it('puts duplicate characters under failures, not warnings', () => {
      const players: Player[] = [...basePlayers, { id: '7', name: 'Gina', roleId: 'chef', isDead: false }];
      const summary = getValidationSummary(players);
      expect(summary).not.toBeNull();
      if (summary) {
        expect(summary.failures).toContain('Chef is assigned to 2 players.');
        expect(summary.warnings).not.toContain('Chef is assigned to 2 players.');
      }
    });

    it('puts Marionette placement issues under failures, not warnings', () => {
      const players: Player[] = [
        { id: '1', name: 'Player 1', roleId: 'washerwoman', isDead: false },
        { id: '2', name: 'Player 2', roleId: 'librarian', isDead: false, isTheMarionette: true },
        { id: '3', name: 'Player 3', roleId: 'investigator', isDead: false },
        { id: '4', name: 'Player 4', roleId: 'chef', isDead: false },
        { id: '5', name: 'Player 5', roleId: 'poisoner', isDead: false },
        { id: '6', name: 'Player 6', roleId: 'imp', isDead: false }, // Demon is far from Marionette (Player 2)
      ];
      const summary = getValidationSummary(players);
      expect(summary).not.toBeNull();
      if (summary) {
        expect(summary.failures).toContain('Marionette (Player 2) must be sitting next to the Demon.');
        expect(summary.warnings).not.toContain('Marionette (Player 2) must be sitting next to the Demon.');
      }
    });

    it('puts characters not on the script under failures', () => {
      const players: Player[] = [
        { id: '1', name: 'Player 1', roleId: 'washerwoman', isDead: false },
        { id: '2', name: 'Player 2', roleId: 'librarian', isDead: false },
        { id: '3', name: 'Player 3', roleId: 'investigator', isDead: false },
        { id: '4', name: 'Player 4', roleId: 'chef', isDead: false },
        { id: '5', name: 'Player 5', roleId: 'poisoner', isDead: false },
        { id: '6', name: 'Player 6', roleId: 'imp', isDead: false },
      ];
      // Script does not include 'chef'
      const scriptRoles: Role[] = [
        { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk', ability: '' },
        { id: 'librarian', name: 'Librarian', team: 'townsfolk', ability: '' },
        { id: 'investigator', name: 'Investigator', team: 'townsfolk', ability: '' },
        { id: 'poisoner', name: 'Poisoner', team: 'minion', ability: '' },
        { id: 'imp', name: 'Imp', team: 'demon', ability: '' },
      ];
      const summary = getValidationSummary(players, scriptRoles);
      expect(summary).not.toBeNull();
      if (summary) {
        expect(summary.failures).toContain('1 character is not on the script.');
      }

      // 2 missing characters (chef and poisoner are missing)
      const scriptRoles2: Role[] = [
        { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk', ability: '' },
        { id: 'librarian', name: 'Librarian', team: 'townsfolk', ability: '' },
        { id: 'investigator', name: 'Investigator', team: 'townsfolk', ability: '' },
        { id: 'imp', name: 'Imp', team: 'demon', ability: '' },
      ];
      const summary2 = getValidationSummary(players, scriptRoles2);
      expect(summary2).not.toBeNull();
      if (summary2) {
        expect(summary2.failures).toContain('2 characters are not on the script.');
      }
    });
  });

  describe('outsider and townsfolk failures', () => {
    it('should add failures when there are too few or too many outsiders', () => {
      const tooFewOutsiders: Player[] = [
        { id: '1', name: 'P1', roleId: 'washerwoman', isDead: false },
        { id: '2', name: 'P2', roleId: 'librarian', isDead: false },
        { id: '3', name: 'P3', roleId: 'investigator', isDead: false },
        { id: '4', name: 'P4', roleId: 'chef', isDead: false },
        { id: '5', name: 'P5', roleId: 'empath', isDead: false },
        { id: '6', name: 'P6', roleId: 'monk', isDead: false },
        { id: '7', name: 'P7', roleId: 'poisoner', isDead: false },
        { id: '8', name: 'P8', roleId: 'imp', isDead: false },
      ];
      const summary1 = getValidationSummary(tooFewOutsiders);
      expect(summary1?.failures).toContain('Too few Outsiders: expected 1, but got 0.');
      expect(summary1?.failures).toContain('Too many Townsfolk: expected 5, but got 6.');

      const tooManyOutsiders: Player[] = [
        { id: '1', name: 'P1', roleId: 'washerwoman', isDead: false },
        { id: '2', name: 'P2', roleId: 'librarian', isDead: false },
        { id: '3', name: 'P3', roleId: 'investigator', isDead: false },
        { id: '4', name: 'P4', roleId: 'chef', isDead: false },
        { id: '5', name: 'P5', roleId: 'butler', isDead: false },
        { id: '6', name: 'P6', roleId: 'recluse', isDead: false },
        { id: '7', name: 'P7', roleId: 'poisoner', isDead: false },
        { id: '8', name: 'P8', roleId: 'imp', isDead: false },
      ];
      const summary2 = getValidationSummary(tooManyOutsiders);
      expect(summary2?.failures).toContain('Too many Outsiders: expected 1, but got 2.');
      expect(summary2?.failures).toContain('Too few Townsfolk: expected 5, but got 4.');
    });

    it('should handle townsfolk combination mismatch when outsider count is valid but townsfolk is wrong', () => {
      const mismatchPlayers: Player[] = [
        { id: '1', name: 'P1', roleId: 'washerwoman', isDead: false },
        { id: '2', name: 'P2', roleId: 'librarian', isDead: false },
        { id: '3', name: 'P3', roleId: 'investigator', isDead: false },
        { id: '4', name: 'P4', roleId: 'chef', isDead: false },
        { id: '5', name: 'P5', roleId: 'balloonist', isDead: false },
        { id: '6', name: 'P6', roleId: 'butler', isDead: false },
        { id: '7', name: 'P7', roleId: 'recluse', isDead: false },
        { id: '8', name: 'P8', roleId: 'poisoner', isDead: false },
        { id: '9', name: 'P9', roleId: 'imp', isDead: false },
      ];
      const summary3 = getValidationSummary(mismatchPlayers.slice(0, 8));
      expect(summary3?.failures).toContain('Too many Townsfolk: expected 4 (with 2 Outsiders), but got 5.');
    });

    it('should add failures when there are too few or too many minions or demons', () => {
      const tooFewMinions: Player[] = [
        { id: '1', name: 'P1', roleId: 'washerwoman', isDead: false },
        { id: '2', name: 'P2', roleId: 'librarian', isDead: false },
        { id: '3', name: 'P3', roleId: 'investigator', isDead: false },
        { id: '4', name: 'P4', roleId: 'chef', isDead: false },
        { id: '5', name: 'P5', roleId: 'empath', isDead: false },
        { id: '6', name: 'P6', roleId: 'butler', isDead: false },
        { id: '7', name: 'P7', roleId: 'monk', isDead: false },
        { id: '8', name: 'P8', roleId: 'imp', isDead: false },
      ];
      const summary1 = getValidationSummary(tooFewMinions);
      expect(summary1?.failures).toContain('Too few Minions: expected 1, but got 0.');

      const tooManyMinions: Player[] = [
        { id: '1', name: 'P1', roleId: 'washerwoman', isDead: false },
        { id: '2', name: 'P2', roleId: 'librarian', isDead: false },
        { id: '3', name: 'P3', roleId: 'investigator', isDead: false },
        { id: '4', name: 'P4', roleId: 'chef', isDead: false },
        { id: '5', name: 'P5', roleId: 'butler', isDead: false },
        { id: '6', name: 'P6', roleId: 'poisoner', isDead: false },
        { id: '7', name: 'P7', roleId: 'baron', isDead: false },
        { id: '8', name: 'P8', roleId: 'imp', isDead: false },
      ];
      const summary2 = getValidationSummary(tooManyMinions);
      expect(summary2?.failures).toContain('Too many Minions: expected 1, but got 2.');

      const tooFewDemons: Player[] = [
        { id: '1', name: 'P1', roleId: 'washerwoman', isDead: false },
        { id: '2', name: 'P2', roleId: 'librarian', isDead: false },
        { id: '3', name: 'P3', roleId: 'investigator', isDead: false },
        { id: '4', name: 'P4', roleId: 'chef', isDead: false },
        { id: '5', name: 'P5', roleId: 'empath', isDead: false },
        { id: '6', name: 'P6', roleId: 'butler', isDead: false },
        { id: '7', name: 'P7', roleId: 'poisoner', isDead: false },
        { id: '8', name: 'P8', roleId: 'monk', isDead: false },
      ];
      const summary3 = getValidationSummary(tooFewDemons);
      expect(summary3?.failures).toContain('Too few Demons: expected 1, but got 0.');

      const tooManyDemons: Player[] = [
        { id: '1', name: 'P1', roleId: 'washerwoman', isDead: false },
        { id: '2', name: 'P2', roleId: 'librarian', isDead: false },
        { id: '3', name: 'P3', roleId: 'investigator', isDead: false },
        { id: '4', name: 'P4', roleId: 'chef', isDead: false },
        { id: '5', name: 'P5', roleId: 'butler', isDead: false },
        { id: '6', name: 'P6', roleId: 'poisoner', isDead: false },
        { id: '7', name: 'P7', roleId: 'imp', isDead: false },
        { id: '8', name: 'P8', roleId: 'zombuul', isDead: false },
      ];
      const summary4 = getValidationSummary(tooManyDemons);
      expect(summary4?.failures).toContain('Too many Demons: expected 1, but got 2.');
    });

    it('should correctly apply setup modifications when a setup-modifying role is a Drunk/Marionette fake identity', () => {
      const playersWith2Outsiders: Player[] = [
        { id: '1', name: 'P1', roleId: 'washerwoman', isDead: false },
        { id: '2', name: 'P2', roleId: 'librarian', isDead: false },
        { id: '3', name: 'P3', roleId: 'investigator', isDead: false },
        { id: '4', name: 'P4', roleId: 'chef', isDead: false },
        { id: '5', name: 'P5', roleId: 'balloonist', isDead: false, isTheMarionette: true },
        { id: '6', name: 'P6', roleId: 'butler', isDead: false },
        { id: '7', name: 'P7', roleId: 'recluse', isDead: false },
        { id: '8', name: 'P8', roleId: 'imp', isDead: false },
      ];
      const summary = getValidationSummary(playersWith2Outsiders);
      expect(summary?.isOutsiderValid).toBe(true);
      expect(summary?.failures.some(f => f.includes('Outsiders'))).toBe(false);
    });

    it('should correctly count traveler roles when they are not in the passed script/allRoles list', () => {
      const players: Player[] = [
        { id: '1', name: 'Player 1', roleId: 'washerwoman', isDead: false },
        { id: '2', name: 'Player 2', roleId: 'gunslinger', isDead: false },
      ];
      const customScript: Role[] = [
        { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk' },
      ];
      const summary = getValidationSummary(players, customScript);
      expect(summary).not.toBeNull();
      if (summary) {
        expect(summary.counts.traveler).toBe(1);
        expect(summary.counts.townsfolk).toBe(1);
      }
    });
  });

  describe('bag setup validation warnings', () => {
    const basePlayers: Player[] = [
      { id: '1', name: 'Alice', roleId: 'washerwoman', isDead: false },
      { id: '2', name: 'Bob', roleId: 'librarian', isDead: false },
      { id: '3', name: 'Charlie', roleId: 'investigator', isDead: false },
      { id: '4', name: 'David', roleId: 'chef', isDead: false },
      { id: '5', name: 'Eve', roleId: 'poisoner', isDead: false },
      { id: '6', name: 'Frank', roleId: 'imp', isDead: false },
    ];

    it('does not warn if selectedCharacterIds is empty or undefined', () => {
      const summary = getValidationSummary(basePlayers, undefined, new Set());
      expect(summary?.warnings.length).toBe(0);
    });

    it('warns if a player is assigned a role not in selectedCharacterIds', () => {
      const bag = new Set(['washerwoman', 'librarian', 'investigator', 'chef', 'poisoner', 'scarletwoman']); // imp is missing from bag, replaced by scarletwoman
      const summary = getValidationSummary(basePlayers, undefined, bag);
      expect(summary?.warnings).toContain('Imp is assigned to Frank, but is not in the bag setup.');
    });

    it('correctly checks true roles of disguised players (Drunk/Marionette/Lunatic)', () => {
      // Bob is the Drunk (disguised as Librarian).
      // True role is 'drunk'.
      const disguisedPlayers: Player[] = [
        ...basePlayers.filter(p => p.name !== 'Bob'),
        { id: '2', name: 'Bob', roleId: 'librarian', isDead: false, isTheDrunk: true },
      ];

      // Bag setup: 'washerwoman', 'drunk', 'investigator', 'chef', 'poisoner', 'imp'
      const bag = new Set(['washerwoman', 'drunk', 'investigator', 'chef', 'poisoner', 'imp']);
      const summary = getValidationSummary(disguisedPlayers, undefined, bag);
      // No warning, because Bob's true role (drunk) is in the bag, and Librarian is his fake role
      expect(summary?.warnings.filter(w => w.includes('not in the bag setup')).length).toBe(0);

      // If 'drunk' is missing from the bag setup:
      const bagNoDrunk = new Set(['washerwoman', 'butler', 'investigator', 'chef', 'poisoner', 'imp']);
      const summary2 = getValidationSummary(disguisedPlayers, undefined, bagNoDrunk);
      expect(summary2?.warnings).toContain('Drunk is assigned to Bob, but is not in the bag setup.');
    });

    it('ignores traveler roles when validating bag setup', () => {
      const playersWithTraveler: Player[] = [
        ...basePlayers,
        { id: '7', name: 'Grace', roleId: 'gunslinger', isDead: false }, // traveler
      ];
      const bag = new Set(['washerwoman', 'librarian', 'investigator', 'chef', 'poisoner', 'imp']);
      const summary = getValidationSummary(playersWithTraveler, undefined, bag);
      expect(summary?.warnings.filter(w => w.includes('not in the bag setup')).length).toBe(0);
    });
  });

  describe('large player counts (>15) validation', () => {
    it('caps baseCount at 15 and treats the rest as travelers', () => {
      // 17 players: 15 standard characters and 2 travelers
      const players: Player[] = [
        // 9 Townsfolk
        { id: '1', name: 'Player 1', roleId: 'washerwoman', isDead: false },
        { id: '2', name: 'Player 2', roleId: 'librarian', isDead: false },
        { id: '3', name: 'Player 3', roleId: 'investigator', isDead: false },
        { id: '4', name: 'Player 4', roleId: 'chef', isDead: false },
        { id: '5', name: 'Player 5', roleId: 'empath', isDead: false },
        { id: '6', name: 'Player 6', roleId: 'fortuneteller', isDead: false },
        { id: '7', name: 'Player 7', roleId: 'undertaker', isDead: false },
        { id: '8', name: 'Player 8', roleId: 'monk', isDead: false },
        { id: '9', name: 'Player 9', roleId: 'slayer', isDead: false },
        // 2 Outsiders
        { id: '10', name: 'Player 10', roleId: 'butler', isDead: false },
        { id: '11', name: 'Player 11', roleId: 'saint', isDead: false },
        // 3 Minions
        { id: '12', name: 'Player 12', roleId: 'poisoner', isDead: false },
        { id: '13', name: 'Player 13', roleId: 'spy', isDead: false },
        { id: '14', name: 'Player 14', roleId: 'scarletwoman', isDead: false },
        // 1 Demon
        { id: '15', name: 'Player 15', roleId: 'imp', isDead: false },
        // 2 Travelers
        { id: '16', name: 'Player 16', roleId: 'gunslinger', isDead: false },
        { id: '17', name: 'Player 17', roleId: 'beggar', isDead: false },
      ];

      const summary = getValidationSummary(players);
      expect(summary).not.toBeNull();
      if (summary) {
        expect(summary.base).toEqual({ townsfolk: 9, outsider: 2, minion: 3, demon: 1, traveler: 0 });
        expect(summary.expected).toEqual({ townsfolk: 9, outsider: 2, minion: 3, demon: 1, traveler: 2 });
        expect(summary.counts.townsfolk).toBe(9);
        expect(summary.counts.outsider).toBe(2);
        expect(summary.counts.minion).toBe(3);
        expect(summary.counts.demon).toBe(1);
        expect(summary.counts.traveler).toBe(2);
        expect(summary.isValid).toBe(true);
      }
    });

    it('caps baseCount at 15 even if travelers are not yet assigned in setup', () => {
      // 17 players, all assigned base characters
      const players: Player[] = Array.from({ length: 17 }, (_, i) => ({
        id: String(i + 1),
        name: `Player ${i + 1}`,
        roleId: i < 9 ? 'washerwoman' : i < 11 ? 'butler' : i < 14 ? 'poisoner' : i < 15 ? 'imp' : '',
        isDead: false,
      }));

      const summary = getValidationSummary(players);
      expect(summary).not.toBeNull();
      if (summary) {
        expect(summary.base).toEqual({ townsfolk: 9, outsider: 2, minion: 3, demon: 1, traveler: 0 });
        expect(summary.expected).toEqual({ townsfolk: 9, outsider: 2, minion: 3, demon: 1, traveler: 2 });
      }
    });
  });
});

