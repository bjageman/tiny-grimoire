import type { Role } from '../types';
import jinxData from '../jinxes.json';

/** A jinx between two characters, resolved against the roles actually on the script. */
export interface ScriptJinx {
  roles: [Role, Role];
  reason: string;
}

const ALL_JINXES = jinxData as { a: string; b: string; reason: string }[];

/** Jinxes where both characters are on the script, ordered by the pair's first appearance in the script. */
export function scriptJinxes(roles: Role[]): ScriptJinx[] {
  const byId = new Map(roles.map(r => [r.id, r]));
  const found: { jinx: ScriptJinx; rank: number }[] = [];
  ALL_JINXES.forEach(({ a, b, reason }) => {
    const roleA = byId.get(a);
    const roleB = byId.get(b);
    if (!roleA || !roleB) return;
    const indexA = roles.indexOf(roleA);
    const indexB = roles.indexOf(roleB);
    // Show the earlier-listed character first so pairs read in script order.
    const pair: [Role, Role] = indexA <= indexB ? [roleA, roleB] : [roleB, roleA];
    found.push({ jinx: { roles: pair, reason }, rank: Math.min(indexA, indexB) * roles.length + Math.max(indexA, indexB) });
  });
  return found.sort((x, y) => x.rank - y.rank).map(f => f.jinx);
}

/** Narrows jinxes to those where both characters are in play. */
export function filterJinxesInPlay(jinxes: ScriptJinx[], inPlayIds: Set<string>): ScriptJinx[] {
  return jinxes.filter(j => inPlayIds.has(j.roles[0].id) && inPlayIds.has(j.roles[1].id));
}
