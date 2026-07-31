import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePlayerDetailsNav } from './usePlayerDetailsNav';
import type { Player, Role } from '../types';

describe('usePlayerDetailsNav', () => {
  const roles: Role[] = [
    { id: 'grandmother', name: 'Grandmother', team: 'townsfolk', ability: 'You start knowing a good player and their character.' },
    { id: 'drunk', name: 'Drunk', team: 'outsider', ability: 'You do not know you are the Drunk.' },
    { id: 'marionette', name: 'Marionette', team: 'minion', ability: 'You think you are a good character.' },
    { id: 'lunatic', name: 'Lunatic', team: 'outsider', ability: 'You think you are the Demon.' },
    { id: 'imp', name: 'Imp', team: 'demon', ability: 'Each night*, choose a player: they die.' },
  ];

  const seat = (over: Partial<Player>): Player => ({ id: 'p1', name: 'Alice', isDead: false, ...over });

  const nav = (players: Player[], selectedId = 'p1') =>
    renderHook(() => usePlayerDetailsNav(players, selectedId, roles, '')).result.current;

  it('resolves a drunk player to the character token they are holding', () => {
    const { modalRoleObj } = nav([seat({ roleId: 'grandmother', isTheDrunk: true })]);
    expect(modalRoleObj?.id).toBe('grandmother');
  });

  it('resolves a marionette and a lunatic to their character token too', () => {
    expect(nav([seat({ roleId: 'grandmother', isTheMarionette: true })]).modalRoleObj?.id).toBe('grandmother');
    expect(nav([seat({ roleId: 'imp', isTheLunatic: true })]).modalRoleObj?.id).toBe('imp');
  });

  it('falls back to the tag role when the seat has no character yet', () => {
    expect(nav([seat({ isTheDrunk: true })]).modalRoleObj?.id).toBe('drunk');
    expect(nav([seat({ isTheMarionette: true })]).modalRoleObj?.id).toBe('marionette');
    expect(nav([seat({ isTheLunatic: true })]).modalRoleObj?.id).toBe('lunatic');
  });

  it('resolves an untagged player to their own role', () => {
    expect(nav([seat({ roleId: 'imp' })]).modalRoleObj?.id).toBe('imp');
  });

  it('wraps prev/next around the seating circle', () => {
    const players = [seat({ id: 'p1' }), seat({ id: 'p2' }), seat({ id: 'p3' })];
    const { prevPlayerId, nextPlayerId } = nav(players, 'p1');
    expect(prevPlayerId).toBe('p3');
    expect(nextPlayerId).toBe('p2');
  });
});
