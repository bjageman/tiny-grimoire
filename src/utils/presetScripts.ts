import type { Role } from '../types';
import rolesData from '../roles.json';
import officialRoles from '../official_roles.json';

export interface PresetScript {
  id: string;
  name: string;
  author: string;
  roles: Role[];
}

const EDITIONS = [
  { id: 'tb', name: 'Trouble Brewing' },
  { id: 'bmr', name: 'Bad Moon Rising' },
  { id: 'snv', name: 'Sects & Violets' },
] as const;

const byId = new Map((rolesData as Role[]).map(r => [r.id, r]));

/** The three official base scripts, resolved from the edition tags on the official role list. */
export const PRESET_SCRIPTS: PresetScript[] = EDITIONS.map(({ id, name }) => ({
  id,
  name,
  author: 'The Pandemonium Institute',
  // official_roles.json already lists each edition in script order (townsfolk → outsider → minion → demon → traveler).
  roles: (officialRoles as { id: string; edition: string }[])
    .filter(r => r.edition === id)
    .map(r => byId.get(r.id))
    .filter((r): r is Role => r !== undefined),
}));
