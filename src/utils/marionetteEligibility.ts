import type { Player, Role } from '../types';

type RoleLookup = (roleId?: string) => Role | undefined;
type DemonIdentity = Pick<Player, 'roleId' | 'isTheLunatic' | 'isTheLilMonsta'>;

export function isActualDemon(player: DemonIdentity, findRole: RoleLookup): boolean {
  if (player.isTheLunatic) return false;
  if (player.isTheLilMonsta || player.roleId === 'lilmonsta') return true;
  return findRole(player.roleId)?.team === 'demon';
}

export function hasActualDemonNeighbor(players: Player[], playerId: string, findRole: RoleLookup): boolean {
  const playerIndex = players.findIndex(player => player.id === playerId);
  if (playerIndex === -1 || players.length < 2) return false;
  return [-1, 1].some(offset => {
    const neighbor = players[(playerIndex + offset + players.length) % players.length];
    return neighbor.id !== playerId && isActualDemon(neighbor, findRole);
  });
}

export function isMarionetteEligible(players: Player[], playerId: string, roleId: string | undefined, findRole: RoleLookup): boolean {
  const team = findRole(roleId)?.team;
  const isGood = team === 'townsfolk' || team === 'outsider';
  return isGood && hasActualDemonNeighbor(players, playerId, findRole);
}
