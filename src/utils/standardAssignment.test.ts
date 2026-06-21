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

      // Verify the Marionette player is adjacent to the Demon player in the seating circle
      const N = players.length;
      const leftNeighborIdx = (demonIdx - 1 + N) % N;
      const rightNeighborIdx = (demonIdx + 1) % N;

      expect([leftNeighborIdx, rightNeighborIdx]).toContain(marionetteIdx);
    }
  });
});
