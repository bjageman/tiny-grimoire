import type { Player } from '../types';

export function syncTrackerPlayers(incoming: Player[], current: Player[] = []): Player[] {
  return incoming.map(player => {
    const local = current.find(candidate => candidate.id === player.id)
      ?? current.find(candidate => candidate.name.trim().toLowerCase() === player.name.trim().toLowerCase());
    return {
      roleId: '',
      ...local,
      id: player.id,
      name: player.name,
      pronouns: player.pronouns,
      isDead: player.isDead,
      hasDeadVote: player.hasDeadVote,
    };
  });
}
