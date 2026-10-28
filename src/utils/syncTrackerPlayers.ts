import type { Player, Role } from '../types';
import { PLAYABLE_ROLES } from './roleData';

export function syncTrackerPlayers(incoming: Player[], current: Player[] = [], scriptRoles: Role[] | null = null): Player[] {
  const roles = new Map([...PLAYABLE_ROLES, ...(scriptRoles ?? [])].map(role => [role.id, role]));
  return incoming.map(player => {
    const local = current.find(candidate => candidate.id === player.id)
      ?? current.find(candidate => candidate.name.trim().toLowerCase() === player.name.trim().toLowerCase());
    const travelerRoleId = roles.get(player.roleId ?? '')?.team === 'traveler' ? player.roleId : undefined;
    const wasTraveler = roles.get(local?.roleId ?? '')?.team === 'traveler';
    return {
      roleId: '',
      ...local,
      ...(travelerRoleId ? { roleId: travelerRoleId, roleIds: [travelerRoleId] } : wasTraveler ? { roleId: '', roleIds: [] } : {}),
      id: player.id,
      name: player.name,
      pronouns: player.pronouns,
      isDead: player.isDead,
      hasDeadVote: player.hasDeadVote,
    };
  });
}
