import type { PlayerPreferences, Role } from '../types';

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
