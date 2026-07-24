import { TEAM_ORDER, type Player, type Role } from '../types';

interface PlayerDetailsNav {
  modalPlayer: Player | null;
  modalRoleObj: Role | undefined;
  filteredModalRoles: Role[];
  prevPlayerId: string | null;
  nextPlayerId: string | null;
}

// The details-modal wiring shared by every container: which player is open, the role it resolves to
// (respecting the Drunk/Marionette/Lunatic token), the searched/sorted role list, and prev/next seats.
export function usePlayerDetailsNav(
  players: Player[],
  selectedPlayerId: string | null,
  roles: Role[],
  roleSearch: string,
  // Within a team, order by position in `roles` (script order) rather than alphabetically.
  sortByScriptOrder = false,
): PlayerDetailsNav {
  const modalPlayer = selectedPlayerId ? players.find(p => p.id === selectedPlayerId) ?? null : null;

  const modalRoleObj = modalPlayer
    ? roles.find(r => r.id === (
        modalPlayer.isTheDrunk
          ? 'drunk'
          : modalPlayer.isTheMarionette
            ? (modalPlayer.roleId || 'marionette')
            : modalPlayer.isTheLunatic
              ? (modalPlayer.roleId || 'lunatic')
              : modalPlayer.roleId
      ))
    : undefined;

  const term = roleSearch.toLowerCase();
  const filteredModalRoles = roles
    .filter(r => r.name.toLowerCase().includes(term) || r.team.toLowerCase().includes(term))
    .sort((a, b) => {
      const isCurrentA = a.id === modalPlayer?.roleId;
      const isCurrentB = b.id === modalPlayer?.roleId;
      if (isCurrentA && !isCurrentB) return -1;
      if (!isCurrentA && isCurrentB) return 1;
      const orderA = TEAM_ORDER[a.team] ?? 99;
      const orderB = TEAM_ORDER[b.team] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      if (sortByScriptOrder) {
        const indexA = roles.findIndex(r => r.id === a.id);
        const indexB = roles.findIndex(r => r.id === b.id);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      }
      return a.name.localeCompare(b.name);
    });

  const currentIndex = selectedPlayerId ? players.findIndex(p => p.id === selectedPlayerId) : -1;
  const prevPlayerId = currentIndex !== -1 ? players[(currentIndex - 1 + players.length) % players.length].id : null;
  const nextPlayerId = currentIndex !== -1 ? players[(currentIndex + 1) % players.length].id : null;

  return { modalPlayer, modalRoleObj, filteredModalRoles, prevPlayerId, nextPlayerId };
}
