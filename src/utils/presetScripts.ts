import { parseScriptJson } from './scriptUtils';
import { TEAM_ORDER, type LoreRole, type Role } from '../types';
import troubleBrewing from '../scripts/trouble-brewing.json';
import badMoonRising from '../scripts/bad-moon-rising.json';
import sectsAndViolets from '../scripts/sects-and-violets.json';

export interface PresetScript {
  id: string;
  name: string;
  author: string;
  roles: Role[];
  loreRoles?: LoreRole[];
}

// Built-in scripts are ordinary script files, parsed through the same path as an upload.
const BUNDLED = [
  { id: 'tb', file: troubleBrewing },
  { id: 'bmr', file: badMoonRising },
  { id: 'snv', file: sectsAndViolets },
];

const baseScripts: PresetScript[] = BUNDLED.map(({ id, file }) => {
  const { name, author, roles, loreRoles } = parseScriptJson(file, id);
  return { id, name, author, roles, loreRoles };
});

const base3Roles = new Map<string, Role>();
baseScripts.forEach(script => script.roles.forEach(role => base3Roles.set(role.id, role)));

export const PRESET_SCRIPTS: PresetScript[] = [
  ...baseScripts,
  {
    id: 'base-3-roster',
    name: 'The Base 3 Roster',
    author: 'The Pandemonium Institute',
    roles: [...base3Roles.values()].sort((a, b) => {
      const teamOrder = (TEAM_ORDER[a.team] ?? 99) - (TEAM_ORDER[b.team] ?? 99);
      return teamOrder || a.name.localeCompare(b.name);
    }),
  },
];
