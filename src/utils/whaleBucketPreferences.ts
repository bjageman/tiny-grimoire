import type { PlayerPreferences, Role } from '../types';
import { isEligibleAutoAssignedDisplayRole } from './displayRoleEligibility';

const DEMON_SLOT_ROLE_IDS = new Set(['atheist', 'summoner']);

export function getWhaleBucketPreferenceTeam(role: Pick<Role, 'id' | 'team'>): Role['team'] {
  return DEMON_SLOT_ROLE_IDS.has(role.id) ? 'demon' : role.team;
}

export function getWhaleBucketPreferenceIds(
  preferences: PlayerPreferences | undefined,
  characterTeam: Role['team']
): string[] {
  const teamPreferences = preferences?.[characterTeam] ?? [];
  if (characterTeam === 'townsfolk') {
    return [...teamPreferences, ...(preferences?.demon ?? []).filter(id => id === 'atheist')];
  }
  if (characterTeam === 'minion') {
    return [...teamPreferences, ...(preferences?.demon ?? []).filter(id => id === 'summoner')];
  }
  if (characterTeam === 'demon') {
    return teamPreferences.filter(id => !DEMON_SLOT_ROLE_IDS.has(id));
  }
  return teamPreferences;
}

export function chooseLilMonstaMinion(
  preferences: PlayerPreferences | undefined,
  assignedMinionIds: Set<string>,
  roles: Role[],
  excludedRoleIds: string[]
): Role | undefined {
  const excludedIds = new Set(excludedRoleIds);
  const eligibleMinions = roles.filter(role =>
    role.team === 'minion' &&
    !excludedIds.has(role.id) &&
    isEligibleAutoAssignedDisplayRole('lilmonsta', role.id)
  );
  const preferredMinion = preferences?.minion
    .map(id => eligibleMinions.find(role => role.id === id))
    .find((role): role is Role => role !== undefined);
  if (preferredMinion) return preferredMinion;

  const unusedMinions = eligibleMinions.filter(role => !assignedMinionIds.has(role.id));
  const candidates = unusedMinions.length > 0 ? unusedMinions : eligibleMinions;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
