import type { Role } from '../types';
import rolesData from '../roles.json';
import officialRoles from '../official_roles.json';

/** Comparator ordering roles by their position in `baseRoles` (the active script), unrecognized roles last. */
export function compareByScriptOrder(baseRoles: { id: string }[]) {
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

export function generateGameCode(): string {
  return Array.from({ length: 4 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');
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

export function parseScriptFile(file: File): Promise<{ name: string; author: string; roles: Role[]; unknownRoles: { id: string; name: string }[] }> {
  const allRoles = rolesData as Role[];
  const official = officialRoles as { id: string; name: string; team: string }[];

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!Array.isArray(parsed)) {
          reject(new Error('Invalid script format. Expected a JSON array of roles.'));
          return;
        }

        const metaObj = parsed.find(
          (item: unknown): item is { id: string; name?: string; author?: string } =>
            !!item && typeof item === 'object' && 'id' in item &&
            (item as { id: unknown }).id === '_meta'
        ) as { id: string; name?: string; author?: string } | undefined;
        const name = metaObj?.name || file.name.replace('.json', '');
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

            // Custom/homebrew character not in our known role list — best-effort synthesize
            // it from whatever the script JSON itself provided, instead of silently forcing
            // it to Townsfolk (which used to corrupt the evil-team distribution whenever a
            // custom Minion/Demon/Outsider was uploaded).
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

            // Carry the character's own reminders and night order straight from the script JSON,
            // so a homebrew character offers its own tokens and slots into the night order.
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
          reject(new Error('No valid roles found in the uploaded script.'));
          return;
        }

        resolve({ name, author, roles: parsedRoles, unknownRoles });
      } catch {
        reject(new Error('Failed to parse JSON script file.'));
      }
    };
    reader.readAsText(file);
  });
}
