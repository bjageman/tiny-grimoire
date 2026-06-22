import { describe, it, expect } from 'vitest';
import { performStandardAssignment } from './standardAssignment';
import type { Player, Role } from '../types';

describe('performStandardAssignment', () => {
  const mockScriptRoles: Role[] = [
    { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk' },
    { id: 'librarian', name: 'Librarian', team: 'townsfolk' },
    { id: 'investigator', name: 'Investigator', team: 'townsfolk' },
    { id: 'chef', name: 'Chef', team: 'townsfolk' },
    { id: 'empath', name: 'Empath', team: 'townsfolk' },
    { id: 'fortune_teller', name: 'Fortune Teller', team: 'townsfolk' },
    { id: 'undertaker', name: 'Undertaker', team: 'townsfolk' },
    { id: 'drunk', name: 'Drunk', team: 'outsider' },
    { id: 'marionette', name: 'Marionette', team: 'minion' },
    { id: 'poisoner', name: 'Poisoner', team: 'minion' },
    { id: 'imp', name: 'Imp', team: 'demon' },
  ];

  it('should return null if there are fewer than 5 players', () => {
    const players: Player[] = [
      { id: '1', name: 'Alice', isDead: false },
      { id: '2', name: 'Bob', isDead: false },
    ];
    const result = performStandardAssignment(players, mockScriptRoles, []);
    expect(result).toBeNull();
  });

  it('should assign a Marionette player who is a neighbor of the Demon player', () => {
    // Run multiple trials to ensure randomness doesn't hide issues
    for (let trial = 0; trial < 50; trial++) {
      const players: Player[] = [
        { id: '1', name: 'Alice', isDead: false },
        { id: '2', name: 'Bob', isDead: false },
        { id: '3', name: 'Charlie', isDead: false },
        { id: '4', name: 'David', isDead: false },
        { id: '5', name: 'Eve', isDead: false },
        { id: '6', name: 'Frank', isDead: false },
      ];

      // Ensure Marionette and Imp (demon) are selected by using a subset/selection that forces it
      // Standard setup for 6 players is 3 Townsfolk, 1 Outsider, 1 Minion, 1 Demon.
      // So if the only Minion in the script is Marionette, it will be assigned.
      const scriptWithOnlyMarionetteMinion = mockScriptRoles.filter(r => r.id !== 'poisoner');

      const result = performStandardAssignment(players, scriptWithOnlyMarionetteMinion, []);
      expect(result).not.toBeNull();
      if (!result) return;

      const demonIdx = result.findIndex(p => p.roleId === 'imp' || (p.roleId && mockScriptRoles.find(r => r.id === p.roleId)?.team === 'demon'));
      const marionetteIdx = result.findIndex(p => p.isTheMarionette);

      expect(demonIdx).not.toBe(-1);
      expect(marionetteIdx).not.toBe(-1);

      const marionettePlayer = result[marionetteIdx];
      expect(marionettePlayer.isTheMarionette).toBe(true);

      // Verify the Marionette has been assigned a fake Townsfolk or Outsider role (thinks they are good)
      const fakeRole = mockScriptRoles.find(r => r.id === marionettePlayer.roleId);
      expect(fakeRole).toBeDefined();
      expect(['townsfolk', 'outsider']).toContain(fakeRole?.team);
      expect(marionettePlayer.isEvil).toBe(true);

      // Verify the Marionette player is adjacent to the Demon player in the seating circle
      const N = players.length;
      const leftNeighborIdx = (demonIdx - 1 + N) % N;
      const rightNeighborIdx = (demonIdx + 1) % N;

      expect([leftNeighborIdx, rightNeighborIdx]).toContain(marionetteIdx);
    }
  });

  it('should correctly assign the Drunk role as a fake Townsfolk character', () => {
    const players: Player[] = [
      { id: '1', name: 'Alice', isDead: false },
      { id: '2', name: 'Bob', isDead: false },
      { id: '3', name: 'Charlie', isDead: false },
      { id: '4', name: 'David', isDead: false },
      { id: '5', name: 'Eve', isDead: false },
      { id: '6', name: 'Frank', isDead: false },
    ];

    // Standard 6-player setup has 1 Outsider. Drunk is the only Outsider in mockScriptRoles.
    const result = performStandardAssignment(players, mockScriptRoles, []);
    expect(result).not.toBeNull();
    if (!result) return;

    const drunkPlayer = result.find(p => p.isTheDrunk);
    expect(drunkPlayer).toBeDefined();
    if (!drunkPlayer) return;

    expect(drunkPlayer.isTheDrunk).toBe(true);
    // Drunk player must think they are a Townsfolk
    const fakeRole = mockScriptRoles.find(r => r.id === drunkPlayer.roleId);
    expect(fakeRole?.team).toBe('townsfolk');
  });

  it('should correctly assign the Lunatic role as a fake Demon character', () => {
    const mockScriptWithLunatic: Role[] = [
      ...mockScriptRoles,
      { id: 'lunatic', name: 'Lunatic', team: 'outsider' }
    ];

    const players: Player[] = [
      { id: '1', name: 'Alice', isDead: false },
      { id: '2', name: 'Bob', isDead: false },
      { id: '3', name: 'Charlie', isDead: false },
      { id: '4', name: 'David', isDead: false },
      { id: '5', name: 'Eve', isDead: false },
      { id: '6', name: 'Frank', isDead: false },
    ];

    // 6-player setup has 1 Outsider. We filter out 'drunk' so 'lunatic' is the only outsider.
    const scriptWithLunaticOnlyOutsider = mockScriptWithLunatic.filter(r => r.id !== 'drunk');

    const result = performStandardAssignment(players, scriptWithLunaticOnlyOutsider, []);
    expect(result).not.toBeNull();
    if (!result) return;

    const lunaticPlayer = result.find(p => p.isTheLunatic);
    expect(lunaticPlayer).toBeDefined();
    if (!lunaticPlayer) return;

    expect(lunaticPlayer.isTheLunatic).toBe(true);
    // Lunatic player must think they are a Demon
    const fakeRole = mockScriptWithLunatic.find(r => r.id === lunaticPlayer.roleId);
    expect(fakeRole?.team).toBe('demon');
  });

  it('should apply the Baron outsider modification (+2 outsiders)', () => {
    const mockScriptWithBaron: Role[] = [
      ...mockScriptRoles,
      { id: 'baron', name: 'Baron', team: 'minion' },
      { id: 'butler', name: 'Butler', team: 'outsider' },
      { id: 'saint', name: 'Saint', team: 'outsider' },
    ];

    const players: Player[] = [
      { id: '1', name: 'Alice', isDead: false },
      { id: '2', name: 'Bob', isDead: false },
      { id: '3', name: 'Charlie', isDead: false },
      { id: '4', name: 'David', isDead: false },
      { id: '5', name: 'Eve', isDead: false },
      { id: '6', name: 'Frank', isDead: false },
      { id: '7', name: 'Grace', isDead: false },
    ];

    // 7 players: standard distribution is 5 Townsfolk, 0 Outsider, 1 Minion, 1 Demon.
    // If Baron is the only minion, it adds 2 outsiders => 3 Townsfolk, 2 Outsiders, 1 Minion, 1 Demon.
    const scriptWithBaronOnlyMinion = mockScriptWithBaron.filter(r => r.id !== 'poisoner' && r.id !== 'marionette');

    const result = performStandardAssignment(players, scriptWithBaronOnlyMinion, []);
    expect(result).not.toBeNull();
    if (!result) return;

    // Count the actual assigned roles by their teams (Baron counts as Minion, Imp as Demon)
    const assignedRoles = result.map(p => {
      // Map back to original roles for counting teams
      if (p.isTheDrunk) return mockScriptWithBaron.find(r => r.id === 'drunk')!;
      return mockScriptWithBaron.find(r => r.id === p.roleId)!;
    });

    const outsiderCount = assignedRoles.filter(r => r?.team === 'outsider').length;
    expect(outsiderCount).toBe(2);
  });

  it('should handle Legion demon setup (approx. 60% Legion)', () => {
    const mockScriptWithLegion: Role[] = [
      ...mockScriptRoles,
      { id: 'legion', name: 'Legion', team: 'demon' }
    ];

    const players: Player[] = [
      { id: '1', name: 'Alice', isDead: false },
      { id: '2', name: 'Bob', isDead: false },
      { id: '3', name: 'Charlie', isDead: false },
      { id: '4', name: 'David', isDead: false },
      { id: '5', name: 'Eve', isDead: false },
      { id: '6', name: 'Frank', isDead: false },
      { id: '7', name: 'Grace', isDead: false },
      { id: '8', name: 'Heidi', isDead: false },
      { id: '9', name: 'Ivan', isDead: false },
      { id: '10', name: 'Judy', isDead: false },
    ];

    // Force Legion by filtering out other demons
    const scriptWithLegionOnlyDemon = mockScriptWithLegion.filter(r => r.id !== 'imp');

    const result = performStandardAssignment(players, scriptWithLegionOnlyDemon, []);
    expect(result).not.toBeNull();
    if (!result) return;

    const legionCount = result.filter(p => p.roleId === 'legion').length;
    // 10 players * 0.6 = 6 Legion demons
    expect(legionCount).toBe(6);
  });

  it('should assign a Damsel when a Huntsman is assigned, and a King when a Choirboy is assigned in standard randomization', () => {
    const mockScriptWithJinxes: Role[] = [
      ...mockScriptRoles,
      { id: 'huntsman', name: 'Huntsman', team: 'townsfolk' },
      { id: 'damsel', name: 'Damsel', team: 'outsider' },
      { id: 'choirboy', name: 'Choirboy', team: 'townsfolk' },
      { id: 'king', name: 'King', team: 'townsfolk' },
    ];

    const players: Player[] = [
      { id: '1', name: 'Alice', isDead: false },
      { id: '2', name: 'Bob', isDead: false },
      { id: '3', name: 'Charlie', isDead: false },
      { id: '4', name: 'David', isDead: false },
      { id: '5', name: 'Eve', isDead: false },
      { id: '6', name: 'Frank', isDead: false },
    ];

    // Filter to force Huntsman and Choirboy by removing other Townsfolk/Outsiders
    const forcedScript = mockScriptWithJinxes.filter(r => 
      r.id !== 'washerwoman' && 
      r.id !== 'librarian' && 
      r.id !== 'investigator' &&
      r.id !== 'chef' &&
      r.id !== 'empath' &&
      r.id !== 'fortune_teller' &&
      r.id !== 'undertaker' &&
      r.id !== 'drunk'
    );

    const result = performStandardAssignment(players, forcedScript, []);
    expect(result).not.toBeNull();
    if (!result) return;

    const hasHuntsman = result.some(p => p.roleId === 'huntsman');
    const hasDamsel = result.some(p => p.roleId === 'damsel');
    const hasChoirboy = result.some(p => p.roleId === 'choirboy');
    const hasKing = result.some(p => p.roleId === 'king');

    if (hasHuntsman) {
      expect(hasDamsel).toBe(true);
    }
    if (hasChoirboy) {
      expect(hasKing).toBe(true);
    }
  });
});

