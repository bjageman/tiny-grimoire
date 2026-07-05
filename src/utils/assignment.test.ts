import { describe, it, expect } from 'vitest';
import { assignCharacters } from './assignment';
import type { Player, Role } from '../types';

describe('assignCharacters', () => {
  const mockRoles: Role[] = [
    { id: 'chef', name: 'Chef', team: 'townsfolk' },
    { id: 'empath', name: 'Empath', team: 'townsfolk' },
    { id: 'fortune_teller', name: 'Fortune Teller', team: 'townsfolk' },
    { id: 'legion', name: 'Legion', team: 'demon' },
  ];

  it('should assign Legion to majority but honor Townsfolk preference for good players', () => {
    const players: Player[] = [
      { id: '1', name: 'Alice', isDead: false, preferences: { townsfolk: ['chef'], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '2', name: 'Bob', isDead: false, preferences: { townsfolk: ['empath'], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '3', name: 'Charlie', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: ['legion'], traveler: [] } },
      { id: '4', name: 'David', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: ['legion'], traveler: [] } },
      { id: '5', name: 'Eve', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: ['legion'], traveler: [] } },
    ];

    const result = assignCharacters(players, mockRoles);
    expect(result).not.toBeNull();
    if (!result) return;

    // Check count of Legion
    const legionAssignments = result.filter(r => r.role.id === 'legion');
    // 5 players * 0.6 = 3 Legion
    expect(legionAssignments.length).toBe(3);

    // Verify good players still got their preferred roles
    const chefAssignment = result.find(r => r.role.id === 'chef');
    const empathAssignment = result.find(r => r.role.id === 'empath');

    expect(chefAssignment).toBeDefined();
    expect(empathAssignment).toBeDefined();

    expect(chefAssignment?.player.id).toBe('1'); // Alice preferred chef
    expect(empathAssignment?.player.id).toBe('2'); // Bob preferred empath
  });

  it('should assign Legion to majority even if nobody preferred it (random selection)', () => {
    // 6 players, none prefer Legion, but Legion is the only Demon in mockRoles
    const players: Player[] = [
      { id: '1', name: 'Alice', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '2', name: 'Bob', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '3', name: 'Charlie', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '4', name: 'David', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '5', name: 'Eve', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '6', name: 'Frank', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
    ];

    const result = assignCharacters(players, mockRoles);
    expect(result).not.toBeNull();
    if (!result) return;

    // Check that Legion was assigned to the majority (4 out of 6 players)
    const legionAssignments = result.filter(r => r.role.id === 'legion');
    expect(legionAssignments.length).toBe(4);
  });

  it('should assign a Damsel when a Huntsman is in play', () => {
    const roles: Role[] = [
      { id: 'huntsman', name: 'Huntsman', team: 'townsfolk' },
      { id: 'chef', name: 'Chef', team: 'townsfolk' },
      { id: 'damsel', name: 'Damsel', team: 'outsider' },
      { id: 'poisoner', name: 'Poisoner', team: 'minion' },
      { id: 'imp', name: 'Imp', team: 'demon' },
    ];

    const players: Player[] = [
      { id: '1', name: 'Alice', isDead: false, preferences: { townsfolk: ['huntsman'], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '2', name: 'Bob', isDead: false, preferences: { townsfolk: ['chef'], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '3', name: 'Charlie', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: ['imp'], traveler: [] } },
      { id: '4', name: 'David', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '5', name: 'Eve', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
    ];

    const result = assignCharacters(players, roles);
    expect(result).not.toBeNull();
    if (!result) return;

    const huntsmanAssignment = result.find(r => r.role.id === 'huntsman');
    const damselAssignment = result.find(r => r.role.id === 'damsel');

    expect(huntsmanAssignment).toBeDefined();
    expect(damselAssignment).toBeDefined();
    expect(damselAssignment?.player.id).not.toBe(huntsmanAssignment?.player.id);
  });

  it('should assign a King when a Choirboy is in play', () => {
    const roles: Role[] = [
      { id: 'choirboy', name: 'Choirboy', team: 'townsfolk' },
      { id: 'chef', name: 'Chef', team: 'townsfolk' },
      { id: 'king', name: 'King', team: 'townsfolk' },
      { id: 'poisoner', name: 'Poisoner', team: 'minion' },
      { id: 'imp', name: 'Imp', team: 'demon' },
    ];

    const players: Player[] = [
      { id: '1', name: 'Alice', isDead: false, preferences: { townsfolk: ['choirboy'], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '2', name: 'Bob', isDead: false, preferences: { townsfolk: ['chef'], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '3', name: 'Charlie', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: ['imp'], traveler: [] } },
      { id: '4', name: 'David', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '5', name: 'Eve', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
    ];

    const result = assignCharacters(players, roles);
    expect(result).not.toBeNull();
    if (!result) return;

    const choirboyAssignment = result.find(r => r.role.id === 'choirboy');
    const kingAssignment = result.find(r => r.role.id === 'king');

    expect(choirboyAssignment).toBeDefined();
    expect(kingAssignment).toBeDefined();
    expect(kingAssignment?.player.id).not.toBe(choirboyAssignment?.player.id);
  });

  it('should not override another player preference to assign King if a neutral candidate exists', () => {
    const roles: Role[] = [
      { id: 'choirboy', name: 'Choirboy', team: 'townsfolk' },
      { id: 'chef', name: 'Chef', team: 'townsfolk' },
      { id: 'king', name: 'King', team: 'townsfolk' },
      { id: 'poisoner', name: 'Poisoner', team: 'minion' },
      { id: 'imp', name: 'Imp', team: 'demon' },
    ];

    // Alice prefers choirboy. Bob prefers chef. Charlie has no preferences.
    // We expect Bob to get Chef, and Charlie to get King.
    const players: Player[] = [
      { id: '1', name: 'Alice', isDead: false, preferences: { townsfolk: ['choirboy'], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '2', name: 'Bob', isDead: false, preferences: { townsfolk: ['chef'], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '3', name: 'Charlie', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: ['imp'], traveler: [] } },
      { id: '4', name: 'David', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '5', name: 'Eve', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
    ];

    for (let trial = 0; trial < 50; trial++) {
      const result = assignCharacters(players, roles);
      expect(result).not.toBeNull();
      if (!result) return;

      const chefAssignment = result.find(r => r.role.id === 'chef');
      const kingAssignment = result.find(r => r.role.id === 'king');

      expect(kingAssignment).toBeDefined();

      const bobAssignment = result.find(r => r.player.id === '2');
      // If Bob was assigned a Townsfolk, it must be Chef (his preference), never King (which would override his preference)
      if (bobAssignment && bobAssignment.role.team === 'townsfolk') {
        expect(chefAssignment).toBeDefined();
        expect(bobAssignment.role.id).toBe('chef');
      }
      // King should be assigned to someone else (like Charlie, David or Eve), not Bob
      expect(kingAssignment?.player.id).not.toBe('2');
    }
  });

  it('treats Riot as a normal single Demon at setup — its "Minions become Riot" transformation happens on day 3 during play, not here', () => {
    const roles: Role[] = [
      { id: 'chef', name: 'Chef', team: 'townsfolk' },
      { id: 'empath', name: 'Empath', team: 'townsfolk' },
      { id: 'fortune_teller', name: 'Fortune Teller', team: 'townsfolk' },
      { id: 'riot', name: 'Riot', team: 'demon' },
      { id: 'poisoner', name: 'Poisoner', team: 'minion' },
    ];

    const players: Player[] = [
      { id: '1', name: 'Alice', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '2', name: 'Bob', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '3', name: 'Charlie', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: ['riot'], traveler: [] } },
      { id: '4', name: 'David', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '5', name: 'Eve', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
    ];

    const result = assignCharacters(players, roles);
    expect(result).not.toBeNull();
    if (!result) return;

    // 5-player base distribution: 3 Townsfolk / 1 Minion / 1 Demon — Riot fills the 1 Demon
    // seat exactly like any other Demon would, no distribution changes.
    const riotAssignments = result.filter(r => r.role.id === 'riot');
    expect(riotAssignments.length).toBe(1);

    const minionAssignments = result.filter(r => r.role.id === 'poisoner');
    expect(minionAssignments.length).toBe(1);
  });

  it('should place Lord of Typhon and minions in a contiguous line with Typhon in the middle', () => {
    const roles: Role[] = [
      { id: 'chef', name: 'Chef', team: 'townsfolk' },
      { id: 'empath', name: 'Empath', team: 'townsfolk' },
      { id: 'fortune_teller', name: 'Fortune Teller', team: 'townsfolk' },
      { id: 'lordoftyphon', name: 'Lord of Typhon', team: 'demon' },
      { id: 'poisoner', name: 'Poisoner', team: 'minion' },
      { id: 'spy', name: 'Spy', team: 'minion' },
    ];

    // With Lord of Typhon, E = 1 (demon) + (1 minion + 1 from Typhon) = 3 evil players
    // They must sit contiguously in a circle, with Lord of Typhon in the middle.
    for (let run = 0; run < 20; run++) {
      const players: Player[] = [
        { id: '1', name: 'Alice', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
        { id: '2', name: 'Bob', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
        { id: '3', name: 'Charlie', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: ['lordoftyphon'], traveler: [] } },
        { id: '4', name: 'David', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
        { id: '5', name: 'Eve', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
      ];

      const result = assignCharacters(players, roles);
      expect(result).not.toBeNull();
      if (!result) return;

      const evilPlayerIds = result
        .filter(r => r.role.team === 'demon' || r.role.team === 'minion')
        .map(r => r.player.id);

      const evilIndices = evilPlayerIds.map(id => players.findIndex(p => p.id === id));
      expect(evilIndices.length).toBe(3);

      // Check if indices are contiguous in a circle of size 5
      const sorted = [...evilIndices].sort((a, b) => a - b);
      const isContiguous = 
        (sorted[1] === sorted[0] + 1 && sorted[2] === sorted[1] + 1) || // e.g. 1, 2, 3
        (sorted[0] === 0 && sorted[1] === 1 && sorted[2] === 4) ||     // e.g. 0, 1, 4 (wrapping around)
        (sorted[0] === 0 && sorted[1] === 3 && sorted[2] === 4);       // e.g. 0, 3, 4 (wrapping around)

      expect(isContiguous).toBe(true);

      // Find the player index of Lord of Typhon in the original players circle
      const typhonAssignment = result.find(r => r.role.id === 'lordoftyphon')!;
      const typhonIdx = players.findIndex(p => p.id === typhonAssignment.player.id);

      // The neighbors of Lord of Typhon in the circle must both be evil (minions)
      const leftNeighbor = players[(typhonIdx - 1 + 5) % 5];
      const rightNeighbor = players[(typhonIdx + 1) % 5];

      const leftRole = result.find(r => r.player.id === leftNeighbor.id)!.role;
      const rightRole = result.find(r => r.player.id === rightNeighbor.id)!.role;

      expect(leftRole.team).toBe('minion');
      expect(rightRole.team).toBe('minion');
    }
  });

  it('should turn one Townsfolk player evil when Bounty Hunter is in play', () => {
    const roles: Role[] = [
      { id: 'bountyhunter', name: 'Bounty Hunter', team: 'townsfolk' },
      { id: 'chef', name: 'Chef', team: 'townsfolk' },
      { id: 'empath', name: 'Empath', team: 'townsfolk' },
      { id: 'poisoner', name: 'Poisoner', team: 'minion' },
      { id: 'imp', name: 'Imp', team: 'demon' },
    ];

    const players: Player[] = [
      { id: '1', name: 'Alice', isDead: false, preferences: { townsfolk: ['bountyhunter'], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '2', name: 'Bob', isDead: false, preferences: { townsfolk: ['chef'], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '3', name: 'Charlie', isDead: false, preferences: { townsfolk: ['empath'], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '4', name: 'David', isDead: false, preferences: { townsfolk: [], outsider: [], minion: ['poisoner'], demon: [], traveler: [] } },
      { id: '5', name: 'Eve', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: ['imp'], traveler: [] } },
    ];

    for (let trial = 0; trial < 10; trial++) {
      const result = assignCharacters(players, roles);
      expect(result).not.toBeNull();
      if (!result) return;

      const hasBountyHunter = result.some(r => r.role.id === 'bountyhunter');
      expect(hasBountyHunter).toBe(true);

      const evilTownsfolk = result.filter(r => r.role.team === 'townsfolk' && r.player.isEvil === true);
      expect(evilTownsfolk.length).toBe(1);
    }
  });

  it('should ensure there are no evil players in play when Atheist is in play', () => {
    const roles: Role[] = [
      { id: 'atheist', name: 'Atheist', team: 'townsfolk' },
      { id: 'bountyhunter', name: 'Bounty Hunter', team: 'townsfolk' },
      { id: 'chef', name: 'Chef', team: 'townsfolk' },
      { id: 'librarian', name: 'Librarian', team: 'townsfolk' },
      { id: 'investigator', name: 'Investigator', team: 'townsfolk' },
      { id: 'poisoner', name: 'Poisoner', team: 'minion' },
      { id: 'imp', name: 'Imp', team: 'demon' },
    ];

    const players: Player[] = [
      { id: '1', name: 'Alice', isDead: false, preferences: { townsfolk: ['atheist'], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '2', name: 'Bob', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '3', name: 'Charlie', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '4', name: 'David', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
      { id: '5', name: 'Eve', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
    ];

    for (let trial = 0; trial < 10; trial++) {
      const result = assignCharacters(players, roles);
      expect(result).not.toBeNull();
      if (!result) return;

      const hasAtheist = result.some(r => r.role.id === 'atheist' && !r.player.isTheDrunk && !r.player.isTheMarionette && !r.player.isTheLunatic);
      if (hasAtheist) {
        const evilPlayers = result.filter(r => r.player.isEvil === true);
        expect(evilPlayers.length).toBe(0);
      }
    }
  });
});
