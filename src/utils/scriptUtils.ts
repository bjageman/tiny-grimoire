import type { Player, Role } from '../types';
import { ALL_ROLES, PLAYABLE_ROLES } from './roleData';

/** Comparator ordering roles by their position in `baseRoles` (the active script), unrecognized roles last. */
function compareByScriptOrder(baseRoles: { id: string }[]) {
  return (a: { id: string }, b: { id: string }): number => {
    const idxA = baseRoles.findIndex(r => r.id === a.id);
    const idxB = baseRoles.findIndex(r => r.id === b.id);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  };
}

/** Sorts `roles` by their position in `baseRoles` (the active script), unrecognized roles last. */
export function sortByScriptOrder<T extends { id: string }>(roles: T[], baseRoles: T[]): T[] {
  return [...roles].sort(compareByScriptOrder(baseRoles));
}

/** Ids of every character in play: each seated player's assigned role(s) plus any "believes they are" tag they carry, since a Drunk holds both their shown role and the Drunk token. */
export function inPlayRoleIds(players: Player[]): Set<string> {
  const ids = new Set<string>();
  players.forEach(p => {
    const assigned = p.roleIds && p.roleIds.length > 0 ? p.roleIds : (p.roleId ? [p.roleId] : []);
    assigned.forEach(id => { if (id) ids.add(id); });
    if (p.isTheDrunk) ids.add('drunk');
    if (p.isTheMarionette) ids.add('marionette');
    if (p.isTheLunatic) ids.add('lunatic');
    if (p.isTheLilMonsta) ids.add('lilmonsta');
  });
  return ids;
}

/** Returns baseRoles plus any traveler a seated player is assigned that the script itself omits, resolving unknown traveler definitions from the official role list so imported scripts (which rarely list travelers) still show them. */
export function withInPlayTravelers(baseRoles: Role[], players: Player[]): Role[] {
  const all = PLAYABLE_ROLES;
  const roles = [...baseRoles];
  players.forEach(p => {
    const ids = p.roleIds && p.roleIds.length > 0 ? p.roleIds : (p.roleId ? [p.roleId] : []);
    ids.forEach(roleId => {
      if (!roleId || roles.some(r => r.id === roleId)) return;
      const def = all.find(r => r.id === roleId);
      if (def?.team === 'traveler') roles.push(def);
    });
  });
  return roles;
}

const VALID_TEAMS = new Set(['townsfolk', 'outsider', 'minion', 'demon', 'traveler']);

/** Normalize a script field that may be a single string or an array of strings into a clean string[]. */
function toStringArray(value: unknown): string[] | undefined {
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  if (Array.isArray(value)) {
    const arr = value.filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
    return arr.length > 0 ? arr : undefined;
  }
  return undefined;
}

/** Read a numeric night-order field (Bloodstar uses integers; treat non-positive/absent as "does not act"). */
function toNightOrder(value: unknown): number | undefined {
  return typeof value === 'number' && value > 0 ? value : undefined;
}

/** Read an optional non-empty string field (e.g. a night reminder). */
function toOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export interface ParsedScript {
  name: string;
  author: string;
  roles: Role[];
  unknownRoles: { id: string; name: string }[];
}

/** Turn the contents of a script JSON into roles. Shared by uploads and the built-in preset scripts. */
export function parseScriptJson(parsed: unknown, fallbackName: string): ParsedScript {
  const allRoles = PLAYABLE_ROLES;
  const official = ALL_ROLES as { id: string; name: string; team: string }[];

  if (!Array.isArray(parsed)) {
    throw new Error('Invalid script format. Expected a JSON array of roles.');
  }

  const metaObj = parsed.find(
    (item: unknown): item is { id: string; name?: string; author?: string } =>
      !!item && typeof item === 'object' && 'id' in item &&
      (item as { id: unknown }).id === '_meta'
  ) as { id: string; name?: string; author?: string } | undefined;
  const name = metaObj?.name || fallbackName;
  const author = metaObj?.author || '';

  const unknownRoles: { id: string; name: string }[] = [];

  const parsedRoles = parsed
    .map((item: unknown) => {
      if (typeof item === 'string') {
        return { id: item.replace(/_/g, '') };
      }
      if (item && typeof item === 'object' && 'id' in item &&
          typeof (item as { id: unknown }).id === 'string') {
        return {
          ...(item as Record<string, unknown>),
          id: (item as { id: string }).id.replace(/_/g, ''),
        } as { id: string };
      }
      return null;
    })
    .filter((item: { id: string } | null): item is { id: string } => {
      if (!item || item.id === '_meta' || item.id === 'meta') return false;
      const officialMatch = official.find(
        r => r.id.toLowerCase() === item.id.toLowerCase()
      );
      if (officialMatch && (officialMatch.team === 'fabled' || officialMatch.team === 'loric')) {
        return false;
      }
      const itemObj = item as Record<string, unknown>;
      if (typeof itemObj.team === 'string' &&
          (itemObj.team.toLowerCase() === 'fabled' || itemObj.team.toLowerCase() === 'loric')) {
        return false;
      }
      return true;
    })
    .map((item: { id: string }) => {
      const matched = allRoles.find(
        r => r.id.toLowerCase() === item.id.toLowerCase()
      );
      if (matched) return matched;

      // Custom character not in our list — synthesize from the script JSON's own fields instead of forcing Townsfolk (which corrupted evil-team distribution).
      const itemObj = item as Record<string, unknown>;
      const rawTeam = typeof itemObj.team === 'string' ? itemObj.team.toLowerCase() : '';
      const normalizedTeam = rawTeam === 'traveller' ? 'traveler' : rawTeam;
      const team = (VALID_TEAMS.has(normalizedTeam) ? normalizedTeam : 'townsfolk') as Role['team'];

      const displayName = typeof itemObj.name === 'string' && itemObj.name.trim()
        ? itemObj.name
        : item.id
            .split('_')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

      const ability = typeof itemObj.ability === 'string' && itemObj.ability.trim()
        ? itemObj.ability
        : undefined;
      const rawImage = itemObj.image;
      const image = typeof rawImage === 'string' && rawImage.trim()
        ? [rawImage.trim()]
        : Array.isArray(rawImage) && rawImage.length > 0 && rawImage.every(u => typeof u === 'string')
          ? rawImage as string[]
          : undefined;

      // Carry the character's own reminders and night order straight from the script JSON.
      const reminders = toStringArray(itemObj.reminders);
      const remindersGlobal = toStringArray(itemObj.remindersGlobal);
      const firstNight = toNightOrder(itemObj.firstNight);
      const firstNightReminder = toOptionalString(itemObj.firstNightReminder);
      const otherNight = toNightOrder(itemObj.otherNight);
      const otherNightReminder = toOptionalString(itemObj.otherNightReminder);

      unknownRoles.push({ id: item.id, name: displayName });

      return {
        id: item.id.toLowerCase(),
        name: displayName,
        team,
        ...(ability && { ability }),
        ...(image && { image }),
        ...(reminders && { reminders }),
        ...(remindersGlobal && { remindersGlobal }),
        ...(firstNight !== undefined && { firstNight }),
        ...(firstNightReminder && { firstNightReminder }),
        ...(otherNight !== undefined && { otherNight }),
        ...(otherNightReminder && { otherNightReminder }),
      };
    });

  if (parsedRoles.length === 0) {
    throw new Error('No valid roles found in the uploaded script.');
  }

  return { name, author, roles: parsedRoles, unknownRoles };
}

export function parseScriptFile(file: File): Promise<ParsedScript> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        resolve(parseScriptJson(JSON.parse(event.target?.result as string), file.name.replace('.json', '')));
      } catch (err) {
        const message = (err as Error).message;
        reject(new Error(message.startsWith('Invalid script format') || message.startsWith('No valid roles')
          ? message
          : 'Failed to parse JSON script file.'));
      }
    };
    reader.readAsText(file);
  });
}
