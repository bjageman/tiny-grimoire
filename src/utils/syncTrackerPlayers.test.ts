import { describe, expect, it } from 'vitest';
import { syncTrackerPlayers } from './syncTrackerPlayers';
import type { Player, Role } from '../types';

const player: Player = { id: 'alice', name: 'Alice', isDead: false };

describe('syncTrackerPlayers', () => {
  it('syncs public Traveler characters without storyteller secrets', () => {
    const [synced] = syncTrackerPlayers([{
      ...player, roleId: 'beggar', roleIds: ['imp'], isEvil: true, isDrunkOrPoisoned: true,
      notes: 'storyteller secret', isDead: true, hasDeadVote: true,
    }]);
    expect(synced).toEqual({ ...player, roleId: 'beggar', roleIds: ['beggar'], isDead: true, hasDeadVote: true });
  });

  it('updates public Travelers and clears them when the seat stops being a Traveler', () => {
    const current = [{ ...player, roleId: 'chef', roleIds: ['chef', 'imp'], notes: 'local notes', isEvil: true }];
    const first = syncTrackerPlayers([{ ...player, roleId: 'beggar' }], current);
    const changed = syncTrackerPlayers([{ ...player, roleId: 'gunslinger' }], first);
    expect(changed[0]).toMatchObject({ roleId: 'gunslinger', roleIds: ['gunslinger'], notes: 'local notes', isEvil: true });
    const cleared = syncTrackerPlayers([{ ...player, roleId: 'imp' }], changed);
    expect(cleared[0]).toMatchObject({ roleId: '', roleIds: [], notes: 'local notes', isEvil: true });
  });

  it('keeps personal guesses for hidden characters and recognizes homebrew Travelers', () => {
    const roles: Role[] = [{ id: 'homebrew-traveler', name: 'Wanderer', team: 'traveler' }];
    const current = [{ ...player, roleId: 'chef', roleIds: ['chef', 'imp'], notes: 'local notes' }];
    const hidden = syncTrackerPlayers([{ ...player, roleId: 'imp' }], current, roles);
    expect(hidden[0]).toMatchObject({ roleId: 'chef', roleIds: ['chef', 'imp'], notes: 'local notes' });
    const publicPlayers = syncTrackerPlayers([{ ...player, id: 'claimed-seat', roleId: 'homebrew-traveler' }], current, roles);
    expect(publicPlayers[0]).toMatchObject({ id: 'claimed-seat', roleId: 'homebrew-traveler', roleIds: ['homebrew-traveler'], notes: 'local notes' });
  });
});
