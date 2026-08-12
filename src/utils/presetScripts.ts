import type { Role } from '../types';
import rolesData from '../roles.json';
import officialRoles from '../official_roles.json';

export interface PresetScript {
  id: string;
  name: string;
  author: string;
  blurb: string;
  roles: Role[];
}

const EDITIONS = [
  { id: 'tb', name: 'Trouble Brewing', blurb: 'The introductory script. Straightforward information, few surprises.' },
  { id: 'bmr', name: 'Bad Moon Rising', blurb: 'Deaths every night. Protection, resurrection, and hard choices.' },
  { id: 'snv', name: 'Sects & Violets', blurb: 'Madness and misinformation. Almost nothing can be trusted.' },
] as const;

const byId = new Map((rolesData as Role[]).map(r => [r.id, r]));

/** The three official base scripts, resolved from the edition tags on the official role list. */
export const PRESET_SCRIPTS: PresetScript[] = EDITIONS.map(({ id, name, blurb }) => ({
  id,
  name,
  author: 'The Pandemonium Institute',
  blurb,
  // official_roles.json already lists each edition in script order (townsfolk → outsider → minion → demon → traveler).
  roles: (officialRoles as { id: string; edition: string }[])
    .filter(r => r.edition === id)
    .map(r => byId.get(r.id))
    .filter((r): r is Role => r !== undefined),
}));

/** Counts per team for a preset, used to summarise it in the picker. */
export function presetTeamCounts(preset: PresetScript): Record<Role['team'], number> {
  const counts = { townsfolk: 0, outsider: 0, minion: 0, demon: 0, traveler: 0 };
  preset.roles.forEach(r => { counts[r.team] += 1; });
  return counts;
}
