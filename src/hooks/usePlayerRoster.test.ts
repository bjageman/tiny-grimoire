import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePlayerRoster } from './usePlayerRoster';
import type { Player, Role } from '../types';

const ROLES: Record<string, Role> = {
  imp: { id: 'imp', name: 'Imp', team: 'demon' },
  chef: { id: 'chef', name: 'Chef', team: 'townsfolk' },
  choirboy: { id: 'choirboy', name: 'Choirboy', team: 'townsfolk' },
  king: { id: 'king', name: 'King', team: 'townsfolk' },
  huntsman: { id: 'huntsman', name: 'Huntsman', team: 'townsfolk' },
  damsel: { id: 'damsel', name: 'Damsel', team: 'outsider' },
};
const findRole = (id?: string) => (id ? ROLES[id] : undefined);

function make(players: Player[], opts: Partial<Parameters<typeof usePlayerRoster>[0]> = {}) {
  const setPlayers = vi.fn();
  const onLilMonstaEnabled = vi.fn();
  const { result: hook } = renderHook(() => usePlayerRoster({
    players, setPlayers, findRole, phase: 'setup', onLog: () => {}, onLilMonstaEnabled, ...opts,
  }));
  const result = () => {
    const arg = setPlayers.mock.calls.at(-1)![0];
    return (typeof arg === 'function' ? arg(players) : arg) as Player[];
  };
  return { roster: hook.current, setPlayers, onLilMonstaEnabled, result };
}

const seat = (id: string, extra: Partial<Player> = {}): Player => ({ id, name: id, isDead: false, ...extra });

describe('usePlayerRoster.updatePlayerRole', () => {
  it('seeds a King on an empty seat when a Choirboy is assigned', () => {
    const { roster, result } = make([seat('p1'), seat('p2')]);
    roster.updatePlayerRole('p1', 'choirboy');
    const out = result();
    expect(out.find(p => p.id === 'p1')!.roleId).toBe('choirboy');
    expect(out.find(p => p.id === 'p2')!.roleId).toBe('king');
  });

  it('seeds a Damsel when a Huntsman is assigned', () => {
    const { roster, result } = make([seat('p1'), seat('p2')]);
    roster.updatePlayerRole('p1', 'huntsman');
    expect(result().find(p => p.id === 'p2')!.roleId).toBe('damsel');
  });

  it('does not seed a King when one already exists', () => {
    const { roster, result } = make([seat('p1'), seat('p2', { roleId: 'king' })]);
    roster.updatePlayerRole('p1', 'choirboy');
    expect(result().filter(p => p.roleId === 'king')).toHaveLength(1);
  });

  it('clears the drunk/marionette/lunatic/lilmonsta tokens on the assigned seat', () => {
    const { roster, result } = make([seat('p1', { isTheDrunk: true, isTheMarionette: true })]);
    roster.updatePlayerRole('p1', 'chef');
    const p1 = result()[0];
    expect(p1.isTheDrunk).toBe(false);
    expect(p1.isTheMarionette).toBe(false);
  });

  it('clears alignment in setup but preserves it in game', () => {
    const setup = make([seat('p1', { roleId: 'imp', isEvil: true })]);
    setup.roster.updatePlayerRole('p1', 'chef');
    expect(setup.result()[0].isEvil).toBeUndefined();

    const game = make([seat('p1', { roleId: 'imp', isEvil: true })], { phase: 'game' });
    game.roster.updatePlayerRole('p1', 'chef');
    expect(game.result()[0].isEvil).toBe(true);
  });

  it('sets assignedFromPref only when a resolver is supplied', () => {
    const withResolver = make([seat('p1')], { resolveAssignedFromPref: () => true });
    withResolver.roster.updatePlayerRole('p1', 'chef');
    expect(withResolver.result()[0].assignedFromPref).toBe(true);

    const without = make([seat('p1')]);
    without.roster.updatePlayerRole('p1', 'chef');
    expect(without.result()[0].assignedFromPref).toBeUndefined();
  });
});

describe('usePlayerRoster toggles', () => {
  it('togglePlayerEvil flips a townsfolk to evil and a demon to good using the role list', () => {
    const good = make([seat('p1', { roleId: 'chef' })]);
    good.roster.togglePlayerEvil('p1');
    expect(good.result()[0].isEvil).toBe(true);

    const demon = make([seat('p1', { roleId: 'imp' })]);
    demon.roster.togglePlayerEvil('p1');
    expect(demon.result()[0].isEvil).toBe(false);
  });

  it('togglePlayerDead grants a ghost vote on death and drops it on revive', () => {
    const dying = make([seat('p1')]);
    dying.roster.togglePlayerDead('p1');
    expect(dying.result()[0]).toMatchObject({ isDead: true, hasDeadVote: true });

    const reviving = make([seat('p1', { isDead: true, hasDeadVote: true })]);
    reviving.roster.togglePlayerDead('p1');
    expect(reviving.result()[0].isDead).toBe(false);
  });

  it('togglePlayerTheDrunk clears the other exclusive tokens', () => {
    const { roster, result } = make([seat('p1', { isTheMarionette: true })]);
    roster.togglePlayerTheDrunk('p1');
    const p1 = result()[0];
    expect(p1.isTheDrunk).toBe(true);
    expect(p1.isTheMarionette).toBe(false);
  });

  it('togglePlayerTheLilMonsta flags the game when turned on', () => {
    const { roster, onLilMonstaEnabled } = make([seat('p1')]);
    roster.togglePlayerTheLilMonsta('p1');
    expect(onLilMonstaEnabled).toHaveBeenCalledOnce();
  });
});
