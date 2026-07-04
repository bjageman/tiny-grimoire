import { describe, it, expect } from 'vitest';
import { performStandardAssignment } from './standardAssignment';
import type { Player, Role } from '../types';
import officialRoles from '../official_roles.json';

describe('performStandardAssignment', () => {
  const mockScriptRoles: Role[] = [
    { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk' },
    { id: 'librarian', name: 'Librarian', team: 'townsfolk' },
    { id: 'investigator', name: 'Investigator', team: 'townsfolk' },
    { id: 'chef', name: 'Chef', team: 'townsfolk' },
    { id: 'empath', name: 'Empath', team: 'townsfolk' },
    { id: 'fortuneteller', name: 'Fortune Teller', team: 'townsfolk' },
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

      // Verify the Marionette has been assigned a fake Townsfolk or Outsider role (thinks they
      // are good). The fake identity is drawn from the full official role list (not just this
      // script's roles) so it never collides with a real assigned character, so look it up there.
      const fakeRole = (officialRoles as Role[]).find(r => r.id === marionettePlayer.roleId);
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
    // Exclude Marionette — it can also compete for that single Outsider slot when it fakes as
    // an Outsider, which would make this single-trial assertion flaky.
    const scriptWithoutMarionette = mockScriptRoles.filter(r => r.id !== 'marionette');
    const result = performStandardAssignment(players, scriptWithoutMarionette, []);
    expect(result).not.toBeNull();
    if (!result) return;

    const drunkPlayer = result.find(p => p.isTheDrunk);
    expect(drunkPlayer).toBeDefined();
    if (!drunkPlayer) return;

    expect(drunkPlayer.isTheDrunk).toBe(true);
    // Drunk player must think they are a Townsfolk — the fake identity is drawn from the full
    // official role list (not just this script's roles), so look it up there.
    const fakeRole = (officialRoles as Role[]).find(r => r.id === drunkPlayer.roleId);
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

    // 6-player setup has 1 Outsider. We filter out 'drunk' so 'lunatic' is the only outsider,
    // and 'marionette' since it can also compete for that single Outsider slot when it fakes
    // as an Outsider, which would make this single-trial assertion flaky.
    const scriptWithLunaticOnlyOutsider = mockScriptWithLunatic.filter(r => r.id !== 'drunk' && r.id !== 'marionette');

    const result = performStandardAssignment(players, scriptWithLunaticOnlyOutsider, []);
    expect(result).not.toBeNull();
    if (!result) return;

    const lunaticPlayer = result.find(p => p.isTheLunatic);
    expect(lunaticPlayer).toBeDefined();
    if (!lunaticPlayer) return;

    expect(lunaticPlayer.isTheLunatic).toBe(true);
    // Lunatic player must think they are a Demon — the fake identity is drawn from the full
    // official role list (not just this script's roles), so look it up there.
    const fakeRole = (officialRoles as Role[]).find(r => r.id === lunaticPlayer.roleId);
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
      r.id !== 'fortuneteller' &&
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

  it('should assign Riot to demon + minion count players and Townsfolk to the rest in standard randomization', () => {
    const scriptWithRiot: Role[] = [
      { id: 'chef', name: 'Chef', team: 'townsfolk' },
      { id: 'empath', name: 'Empath', team: 'townsfolk' },
      { id: 'fortuneteller', name: 'Fortune Teller', team: 'townsfolk' },
      { id: 'riot', name: 'Riot', team: 'demon' },
      { id: 'poisoner', name: 'Poisoner', team: 'minion' },
    ];

    const players: Player[] = [
      { id: '1', name: 'Alice', isDead: false },
      { id: '2', name: 'Bob', isDead: false },
      { id: '3', name: 'Charlie', isDead: false },
      { id: '4', name: 'David', isDead: false },
      { id: '5', name: 'Eve', isDead: false },
    ];

    const result = performStandardAssignment(players, scriptWithRiot, []);
    expect(result).not.toBeNull();
    if (!result) return;

    const riotCount = result.filter(p => p.roleId === 'riot').length;
    // 5 players = 1 demon + 1 minion = 2 Riot
    expect(riotCount).toBe(2);

    const nonRiotCount = result.filter(p => p.roleId && p.roleId !== 'riot').length;
    expect(nonRiotCount).toBe(3);
  });

  it('should place Lord of Typhon contiguously with its minions in standard randomization', () => {
    const scriptWithTyphon: Role[] = [
      { id: 'chef', name: 'Chef', team: 'townsfolk' },
      { id: 'empath', name: 'Empath', team: 'townsfolk' },
      { id: 'fortuneteller', name: 'Fortune Teller', team: 'townsfolk' },
      { id: 'lordoftyphon', name: 'Lord of Typhon', team: 'demon' },
      { id: 'poisoner', name: 'Poisoner', team: 'minion' },
      { id: 'spy', name: 'Spy', team: 'minion' },
    ];

    const players: Player[] = [
      { id: '1', name: 'Alice', isDead: false },
      { id: '2', name: 'Bob', isDead: false },
      { id: '3', name: 'Charlie', isDead: false },
      { id: '4', name: 'David', isDead: false },
      { id: '5', name: 'Eve', isDead: false },
    ];

    // For Lord of Typhon: 5 players = 1 demon + 2 minions (1 base + 1 from Typhon) = 3 evil
    // Run multiple times to verify contiguous layout and Typhon positioning
    for (let run = 0; run < 20; run++) {
      const result = performStandardAssignment(players, scriptWithTyphon, []);
      expect(result).not.toBeNull();
      if (!result) return;

      const evilIndices = result
        .map((p, idx) => ({ roleId: p.roleId, idx }))
        .filter(x => x.roleId === 'lordoftyphon' || x.roleId === 'poisoner' || x.roleId === 'spy')
        .map(x => x.idx);

      expect(evilIndices.length).toBe(3);

      const sorted = [...evilIndices].sort((a, b) => a - b);
      const isContiguous = 
        (sorted[1] === sorted[0] + 1 && sorted[2] === sorted[1] + 1) ||
        (sorted[0] === 0 && sorted[1] === 1 && sorted[2] === 4) ||
        (sorted[0] === 0 && sorted[1] === 3 && sorted[2] === 4);

      expect(isContiguous).toBe(true);

      const typhonIdx = result.findIndex(p => p.roleId === 'lordoftyphon');
      const leftNeighborIdx = (typhonIdx - 1 + 5) % 5;
      const rightNeighborIdx = (typhonIdx + 1) % 5;

      const leftRole = result[leftNeighborIdx].roleId;
      const rightRole = result[rightNeighborIdx].roleId;

      expect(leftRole === 'poisoner' || leftRole === 'spy').toBe(true);
      expect(rightRole === 'poisoner' || rightRole === 'spy').toBe(true);
    }
  });

  it('should turn one townsfolk player evil when Bounty Hunter is in play', () => {
    const scriptWithBountyHunter: Role[] = [
      ...mockScriptRoles,
      { id: 'bountyhunter', name: 'Bounty Hunter', team: 'townsfolk' },
    ];
    
    for (let trial = 0; trial < 10; trial++) {
      const players: Player[] = [
        { id: '1', name: 'Alice', isDead: false },
        { id: '2', name: 'Bob', isDead: false },
        { id: '3', name: 'Charlie', isDead: false },
        { id: '4', name: 'David', isDead: false },
        { id: '5', name: 'Eve', isDead: false },
        { id: '6', name: 'Frank', isDead: false },
      ];

      const result = performStandardAssignment(players, scriptWithBountyHunter, []);
      expect(result).not.toBeNull();
      if (!result) return;

      const hasBountyHunter = result.some(p => p.roleId === 'bountyhunter' && !p.isTheDrunk && !p.isTheMarionette && !p.isTheLunatic);
      if (hasBountyHunter) {
        const evilTownsfolkCount = result.filter(p => {
          const role = scriptWithBountyHunter.find(r => r.id === p.roleId);
          return role && role.team === 'townsfolk' && p.isEvil && !p.isTheMarionette;
        }).length;

        expect(evilTownsfolkCount).toBe(1);
      }
    }
  });

  it('ensures the Marionette\'s fake identity is always on the script, even if it must duplicate a character in play', () => {
    // A tiny script (few Townsfolk/Outsider options) is the scenario that used to force the
    // old "unmatched" fallback into duplicating a real character's identity — e.g. a real
    // Huntsman assigned to one player AND the Marionette also displaying as "Huntsman".
    const script: Role[] = [
      { id: 'huntsman', name: 'Huntsman', team: 'townsfolk' },
      { id: 'damsel', name: 'Damsel', team: 'outsider' },
      { id: 'marionette', name: 'Marionette', team: 'minion' },
      { id: 'chef', name: 'Chef', team: 'townsfolk' },
      { id: 'empath', name: 'Empath', team: 'townsfolk' },
      { id: 'imp', name: 'Imp', team: 'demon' },
    ];

    const scriptIds = new Set(script.map(r => r.id));

    for (let trial = 0; trial < 200; trial++) {
      const players: Player[] = [
        { id: '1', name: 'Alice', isDead: false },
        { id: '2', name: 'Bob', isDead: false },
        { id: '3', name: 'Charlie', isDead: false },
        { id: '4', name: 'David', isDead: false },
        { id: '5', name: 'Eve', isDead: false },
        { id: '6', name: 'Frank', isDead: false },
      ];

      const result = performStandardAssignment(players, script, []);
      expect(result).not.toBeNull();
      if (!result) return;

      const marionettePlayer = result.find(p => p.isTheMarionette);
      expect(marionettePlayer).toBeDefined();
      if (!marionettePlayer) continue;

      // The Marionette's fake role must be on the script
      expect(scriptIds.has(marionettePlayer.roleId!)).toBe(true);
    }
  });

  it('should ensure there are no evil players in play when Atheist is in play', () => {
    const scriptWithAtheist: Role[] = [
      ...mockScriptRoles,
      { id: 'atheist', name: 'Atheist', team: 'townsfolk' },
      { id: 'bountyhunter', name: 'Bounty Hunter', team: 'townsfolk' },
    ];

    for (let trial = 0; trial < 20; trial++) {
      const players: Player[] = [
        { id: '1', name: 'Alice', isDead: false },
        { id: '2', name: 'Bob', isDead: false },
        { id: '3', name: 'Charlie', isDead: false },
        { id: '4', name: 'David', isDead: false },
        { id: '5', name: 'Eve', isDead: false },
        { id: '6', name: 'Frank', isDead: false },
      ];

      const result = performStandardAssignment(players, scriptWithAtheist, []);
      expect(result).not.toBeNull();
      if (!result) return;

      const hasAtheist = result.some(p => p.roleId === 'atheist' && !p.isTheDrunk && !p.isTheMarionette && !p.isTheLunatic);
      if (hasAtheist) {
        const evilPlayers = result.filter(p => p.isEvil === true);
        expect(evilPlayers.length).toBe(0);
        result.forEach(p => {
          const role = scriptWithAtheist.find(r => r.id === p.roleId);
          expect(role?.team).not.toBe('demon');
          expect(role?.team).not.toBe('minion');
        });
      }
    }
  });

  describe('masquerade roles (Drunk, Marionette, Lunatic, Lil\' Monsta) never duplicate a real identity', () => {
    const tfNames = ['washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortuneteller', 'undertaker', 'monk', 'ravenkeeper', 'virgin', 'slayer', 'soldier', 'mayor'];
    const baseTownsfolk = tfNames.map(id => ({ id, name: id, team: 'townsfolk' as const }));
    const recluse: Role = { id: 'recluse', name: 'Recluse', team: 'outsider' };
    const drunkRole: Role = { id: 'drunk', name: 'Drunk', team: 'outsider' };
    const lunaticRole: Role = { id: 'lunatic', name: 'Lunatic', team: 'outsider' };
    const marionetteRole: Role = { id: 'marionette', name: 'Marionette', team: 'minion' };
    const poisoner: Role = { id: 'poisoner', name: 'Poisoner', team: 'minion' };
    const imp: Role = { id: 'imp', name: 'Imp', team: 'demon' };
    const lilMonstaRole: Role = { id: 'lilmonsta', name: "Lil' Monsta", team: 'demon' };

    const scripts: Record<string, Role[]> = {
      marionetteOnly: [...baseTownsfolk, recluse, marionetteRole, imp],
      marionetteAndDrunk: [...baseTownsfolk, recluse, drunkRole, marionetteRole, poisoner, imp],
      lunaticOnly: [...baseTownsfolk, recluse, lunaticRole, poisoner, imp],
      lilMonstaOnly: [...baseTownsfolk, recluse, poisoner, marionetteRole, imp, lilMonstaRole],
      everything: [...baseTownsfolk, recluse, drunkRole, lunaticRole, marionetteRole, poisoner, imp, lilMonstaRole],
    };

    for (const [label, script] of Object.entries(scripts)) {
      it(`produces only script role IDs (${label})`, () => {
        const scriptIds = new Set(script.map(r => r.id));
        for (const n of [5, 6, 8, 12]) {
          for (let trial = 0; trial < 40; trial++) {
            const players: Player[] = Array.from({ length: n }, (_, i) => ({ id: String(i), name: `P${i}`, isDead: false }));
            const result = performStandardAssignment(players, script, []);
            if (!result) continue;
            expect(result.length).toBe(n);
            const roleIds = result.map(p => p.roleId);
            expect(roleIds.every(Boolean)).toBe(true);
            
            // All faked role IDs must be on the script
            expect(roleIds.every(id => scriptIds.has(id!))).toBe(true);
          }
        }
      });
    }

    it('always bluffs as a Townsfolk and leaves the real Outsider/Townsfolk counts untouched (6-player: 3TF/1OUT/1MIN/1DEM)', () => {
      const script = [...baseTownsfolk, recluse, marionetteRole, imp];
      const teamOf = (id?: string) => script.find(r => r.id === id)?.team;

      for (let trial = 0; trial < 100; trial++) {
        const players: Player[] = Array.from({ length: 6 }, (_, i) => ({ id: String(i), name: `P${i}`, isDead: false }));
        const result = performStandardAssignment(players, script, []);
        if (!result) continue;

        const marionettePlayer = result.find(p => p.isTheMarionette);
        expect(marionettePlayer).toBeDefined();
        if (!marionettePlayer) continue;

        // Townsfolk is available on this script, so the Marionette must always bluff as one.
        expect(teamOf(marionettePlayer.roleId)).toBe('townsfolk');

        // The Marionette doesn't alter the real bag composition: the standard 1 Outsider / 3
        // Townsfolk for 6 players stays intact alongside it.
        const realOutsiders = result.filter(p => !p.isTheMarionette && teamOf(p.roleId) === 'outsider');
        expect(realOutsiders).toHaveLength(1);

        const realTownsfolk = result.filter(p => !p.isTheMarionette && teamOf(p.roleId) === 'townsfolk');
        expect(realTownsfolk).toHaveLength(3);
      }
    });
  });
});

