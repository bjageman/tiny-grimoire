import type { Role } from '../types';
import rolesData from '../roles.json';
import officialRoles from '../official_roles.json';

export function generateGameCode(): string {
  return Array.from({ length: 4 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');
}

export function parseScriptFile(file: File): Promise<{ name: string; author: string; roles: Role[] }> {
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
            return {
              id: item.id.toLowerCase(),
              name: item.id
                .split('_')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' '),
              team: 'townsfolk' as const,
            };
          });

        if (parsedRoles.length === 0) {
          reject(new Error('No valid roles found in the uploaded script.'));
          return;
        }

        resolve({ name, author, roles: parsedRoles });
      } catch {
        reject(new Error('Failed to parse JSON script file.'));
      }
    };
    reader.readAsText(file);
  });
}
