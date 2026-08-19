import { parseScriptJson } from './scriptUtils';
import type { Role } from '../types';
import troubleBrewing from '../scripts/trouble-brewing.json';
import badMoonRising from '../scripts/bad-moon-rising.json';
import sectsAndViolets from '../scripts/sects-and-violets.json';

export interface PresetScript {
  id: string;
  name: string;
  author: string;
  roles: Role[];
}

// Built-in scripts are ordinary script files, parsed through the same path as an upload.
const BUNDLED = [
  { id: 'tb', file: troubleBrewing },
  { id: 'bmr', file: badMoonRising },
  { id: 'snv', file: sectsAndViolets },
];

export const PRESET_SCRIPTS: PresetScript[] = BUNDLED.map(({ id, file }) => {
  const { name, author, roles } = parseScriptJson(file, id);
  return { id, name, author, roles };
});
