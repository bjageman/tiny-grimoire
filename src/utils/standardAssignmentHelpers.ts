import type { Player, Role } from '../types';
import masterRoles from '../official_roles.json';

export const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

export function fillToCount(list: Role[], count: number, pools: Role[][], ...fallbacks: (Role | undefined)[]): void {
  while (list.length < count) {
    const inPlay = new Set(list.map(r => r.id));
    let unused: Role | undefined;
    for (const pool of pools) {
      unused = pool.find(r => !inPlay.has(r.id));
      if (unused) break;
    }
    if (unused) {
      list.push(unused);
    } else {
      const fallback = fallbacks.find(Boolean);
      if (fallback) list.push(fallback); else break;
    }
  }
}

function findUnusedRole(pools: Role[][], excludeIds: Set<string>): Role | null {
  for (const pool of pools) {
    const unused = pool.find(r => !excludeIds.has(r.id));
    if (unused) return unused;
  }
  return null;
}

export function getMasqueradeFakeRole(
  activePool: Role[],
  fallbackPool: Role[],
  masterPool: Role[],
  excludeIds: Set<string>,
  lastResortFilter?: (r: Role) => boolean
): Role | null {
  // 1. Try unused in active pool or fallback pool
  const unused = findUnusedRole([activePool, fallbackPool], excludeIds);
  if (unused) return unused;

  // 2. Try any role in active pool (even if in play)
  const activeFallback = lastResortFilter ? activePool.filter(lastResortFilter) : activePool;
  if (activeFallback.length > 0) {
    return activeFallback[Math.floor(Math.random() * activeFallback.length)];
  }

  // 3. Try any role in fallback pool (even if in play)
  const fallbackFallback = lastResortFilter ? fallbackPool.filter(lastResortFilter) : fallbackPool;
  if (fallbackFallback.length > 0) {
    return fallbackFallback[Math.floor(Math.random() * fallbackFallback.length)];
  }

  // 4. Try unused in master pool (outside script)
  const unusedMaster = findUnusedRole([masterPool], excludeIds);
  if (unusedMaster) return unusedMaster;

  // 5. Absolute last resort: first master role
  return masterPool[0] || null;
}

export function isTravelerRole(roleId: string | undefined, selectionRoles: Role[]): boolean {
  if (!roleId) return false;
  const role = selectionRoles.find(r => r.id === roleId) || (masterRoles as Role[]).find(r => r.id === roleId);
  return role?.team === 'traveler' || (role?.team as string) === 'traveller';
}

export function splitTravelers(
  players: Player[],
  travelerCount: number,
  manualTravelerIds: Set<string>
): { travelerIds: Set<string>; basePlayers: Player[] } {
  const travelerIds = new Set<string>();

  for (const id of manualTravelerIds) {
    if (travelerIds.size < travelerCount) {
      travelerIds.add(id);
    }
  }

  if (travelerIds.size < travelerCount) {
    const nonManualPlayers = players.filter(p => !manualTravelerIds.has(p.id));
    const shuffled = shuffle(nonManualPlayers);
    for (const p of shuffled) {
      if (travelerIds.size >= travelerCount) break;
      travelerIds.add(p.id);
    }
  }

  return { travelerIds, basePlayers: players.filter(p => !travelerIds.has(p.id)) };
}

export function applyChoirboyKing(tfs: Role[], selectedTownsfolk: Role[], exclude: string[]): Role[] {
  if (!selectedTownsfolk.some(t => t.id === 'choirboy') || selectedTownsfolk.some(t => t.id === 'king')) return selectedTownsfolk;
  const kingRole = tfs.find(t => t.id === 'king');
  if (!kingRole) return selectedTownsfolk;
  const excluded = new Set(['choirboy', ...exclude]);
  const swappable = selectedTownsfolk.filter(t => !excluded.has(t.id));
  if (swappable.length === 0) return selectedTownsfolk;
  const remove = swappable[Math.floor(Math.random() * swappable.length)];
  return [...selectedTownsfolk.filter(t => t.id !== remove.id), kingRole];
}

export function applyHuntsmanDamsel(
  outs: Role[],
  selectedTownsfolk: Role[],
  selectedOutsiders: Role[],
  tfExclude: string[]
): { tfs: Role[]; outs: Role[] } {
  if (!selectedTownsfolk.some(t => t.id === 'huntsman') || selectedOutsiders.some(o => o.id === 'damsel')) {
    return { tfs: selectedTownsfolk, outs: selectedOutsiders };
  }
  const damselRole = outs.find(o => o.id === 'damsel');
  if (!damselRole) return { tfs: selectedTownsfolk, outs: selectedOutsiders };

  const otherOutsiders = selectedOutsiders.filter(o => o.id !== 'damsel');
  if (otherOutsiders.length > 0) {
    const remove = otherOutsiders[Math.floor(Math.random() * otherOutsiders.length)];
    return { tfs: selectedTownsfolk, outs: [...selectedOutsiders.filter(o => o.id !== remove.id), damselRole] };
  }

  const excluded = new Set(['huntsman', ...tfExclude]);
  const swappable = selectedTownsfolk.filter(t => !excluded.has(t.id));
  const newTfs = swappable.length > 0
    ? selectedTownsfolk.filter(t => t.id !== swappable[Math.floor(Math.random() * swappable.length)].id)
    : selectedTownsfolk;
  return { tfs: newTfs, outs: [...selectedOutsiders, damselRole] };
}

export function assignSimpleRolesToPlayers(
  players: Player[],
  assignedRoles: Role[],
  travelerIds: Set<string>,
  basePlayers: Player[],
  selectionRoles: Role[],
  isEvilId?: string
): Player[] {
  const basePlayerIndex = new Map(basePlayers.map((p, i) => [p.id, i]));
  const travelerRoles = shuffle(
    selectionRoles.filter(r => r.team === 'traveler' || (r.team as string) === 'traveller')
  );
  if (travelerRoles.length === 0) {
    travelerRoles.push({ id: 'beggar', name: 'Beggar', team: 'traveler' } as Role);
  }

  let travelerIdx = 0;
  return players.map(p => {
    if (travelerIds.has(p.id)) {
      if (isTravelerRole(p.roleId, selectionRoles)) {
        return { ...p, isTheDrunk: false, isTheMarionette: false, isTheLunatic: false, isTheLilMonsta: false };
      }
      const assignedTraveler = travelerRoles[travelerIdx % travelerRoles.length];
      travelerIdx++;
      return { ...p, roleId: assignedTraveler.id, isTheDrunk: false, isTheMarionette: false, isTheLunatic: false, isTheLilMonsta: false };
    }
    const roleId = assignedRoles[basePlayerIndex.get(p.id) ?? 0]?.id;
    return {
      ...p,
      roleId,
      isTheDrunk: false,
      isTheMarionette: false,
      isTheLunatic: false,
      isTheLilMonsta: false,
      isEvil: (isEvilId && roleId === isEvilId) ? true : undefined,
    };
  });
}

// Seats the finalRolesList around K base seats, honoring Lord of Typhon (Demon flanked by Minions,
// Marionette adjacent) and the Demon+Marionette adjacency rule; otherwise a plain shuffle.
export function placeRolesAroundCircle(finalRolesList: Role[], K: number): Role[] {
  const assignedRoles: Role[] = new Array(K);
  const assignedIndices = new Set<number>();

  const demonRoleIndex = finalRolesList.findIndex(r => r.team === 'demon');
  const marionetteRoleIndex = finalRolesList.findIndex(r => r.id === 'marionette');
  const typhonRoleIndex = finalRolesList.findIndex(r => r.id === 'lordoftyphon');

  if (typhonRoleIndex !== -1) {
    const evilRoles = finalRolesList.filter(r => r.team === 'demon' || r.team === 'minion');
    const goodRoles = finalRolesList.filter(r => r.team !== 'demon' && r.team !== 'minion');
    const E = evilRoles.length;

    const start = Math.floor(Math.random() * K);
    let typhonRelativeIdx = 0;
    if (E >= 3) {
      typhonRelativeIdx = 1 + Math.floor(Math.random() * (E - 2));
    } else if (E === 2) {
      typhonRelativeIdx = Math.floor(Math.random() * 2);
    }

    const minionRoles = evilRoles.filter(r => r.id !== 'lordoftyphon');
    const hasMarionette = minionRoles.some(r => r.id === 'marionette');

    if (hasMarionette && E >= 3) {
      const adjacentOffsets = [-1, 1];
      const chosenOffset = adjacentOffsets[Math.floor(Math.random() * adjacentOffsets.length)];
      const marionetteRelativeIdx = typhonRelativeIdx + chosenOffset;

      const otherMinions = minionRoles.filter(m => m.id !== 'marionette');
      const shuffledOtherMinions = shuffle(otherMinions);

      let otherMinionCount = 0;
      for (let i = 0; i < E; i++) {
        const idx = (start + i) % K;
        if (i === typhonRelativeIdx) {
          assignedRoles[idx] = finalRolesList[typhonRoleIndex];
        } else if (i === marionetteRelativeIdx) {
          assignedRoles[idx] = minionRoles.find(m => m.id === 'marionette')!;
        } else {
          assignedRoles[idx] = shuffledOtherMinions[otherMinionCount++];
        }
        assignedIndices.add(idx);
      }
    } else {
      const shuffledMinions = shuffle(minionRoles);
      let minionCount = 0;
      for (let i = 0; i < E; i++) {
        const idx = (start + i) % K;
        if (i === typhonRelativeIdx) {
          assignedRoles[idx] = finalRolesList[typhonRoleIndex];
        } else {
          assignedRoles[idx] = shuffledMinions[minionCount++];
        }
        assignedIndices.add(idx);
      }
    }

    const shuffledGood = shuffle(goodRoles);
    let goodAssignCount = 0;
    for (let i = 0; i < K; i++) {
      if (!assignedIndices.has(i)) {
        assignedRoles[i] = shuffledGood[goodAssignCount++];
      }
    }
  } else if (demonRoleIndex !== -1 && marionetteRoleIndex !== -1 && K >= 3) {
    const d_idx = Math.floor(Math.random() * K);
    assignedRoles[d_idx] = finalRolesList[demonRoleIndex];
    assignedIndices.add(d_idx);

    const possibleNeighbors = [
      (d_idx - 1 + K) % K,
      (d_idx + 1) % K
    ];
    const m_idx = possibleNeighbors[Math.floor(Math.random() * possibleNeighbors.length)];
    assignedRoles[m_idx] = finalRolesList[marionetteRoleIndex];
    assignedIndices.add(m_idx);

    const remainingRoles = finalRolesList.filter((_, idx) => idx !== demonRoleIndex && idx !== marionetteRoleIndex);
    const shuffledRemainingRoles = shuffle(remainingRoles);

    let remIdx = 0;
    for (let i = 0; i < K; i++) {
      if (!assignedIndices.has(i)) {
        assignedRoles[i] = shuffledRemainingRoles[remIdx++];
      }
    }
  } else {
    const shuffledRoles = shuffle(finalRolesList);
    for (let i = 0; i < K; i++) {
      assignedRoles[i] = shuffledRoles[i];
    }
  }

  return assignedRoles;
}
