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

  it('should assign Riot to all demons and minions in a Riot setup', () => {
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

    // Check count of Riot
    const riotAssignments = result.filter(r => r.role.id === 'riot');
    // 5 players = 1 demon + 1 minion = 2 Riot
    expect(riotAssignments.length).toBe(2);
  });

  it('should respect Townsfolk preference over Riot assignment if possible', () => {
    const roles: Role[] = [
      { id: 'chef', name: 'Chef', team: 'townsfolk' },
      { id: 'empath', name: 'Empath', team: 'townsfolk' },
      { id: 'fortune_teller', name: 'Fortune Teller', team: 'townsfolk' },
      { id: 'riot', name: 'Riot', team: 'demon' },
      { id: 'poisoner', name: 'Poisoner', team: 'minion' },
    ];

    // Bob wants chef (townsfolk). If Charlie wants Riot, Charlie should be Riot.
    // In a 5-player game, 2 players are Riot. Even if Bob is randomly selected first,
    // his preference for Townsfolk should protect him from being assigned Riot,
    // leaving Riot to neutral/Riot-preferring players (Alice, Charlie, David, Eve).
    for (let run = 0; run < 20; run++) {
      const players: Player[] = [
        { id: '1', name: 'Alice', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
        { id: '2', name: 'Bob', isDead: false, preferences: { townsfolk: ['chef'], outsider: [], minion: [], demon: [], traveler: [] } },
        { id: '3', name: 'Charlie', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: ['riot'], traveler: [] } },
        { id: '4', name: 'David', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
        { id: '5', name: 'Eve', isDead: false, preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] } },
      ];

      const result = assignCharacters(players, roles);
      expect(result).not.toBeNull();
      if (!result) return;

      const bobAssignment = result.find(r => r.player.id === '2');
      expect(bobAssignment?.role.id).not.toBe('riot');
    }
  });
});
