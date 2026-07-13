import type { Player, Role } from '../types';

export const DISCORD_MESSAGE_LIMIT = 2000;

const TEAM_EMOJI: Record<Role['team'], string> = {
  townsfolk: '🔵',
  outsider: '🟢',
  minion: '🔴',
  demon: '😈',
  traveler: '🟣',
};

export interface RecapOptions {
  players: Player[];
  rolesData: Role[];
  gameLog: string[];
  scriptName: string;
  dayNumber: number;
  timeOfDay: 'night' | 'day';
  date?: Date;
}

export function deriveWinner(gameLog: string[]): 'good' | 'evil' | null {
  for (let i = gameLog.length - 1; i >= 0; i--) {
    if (!gameLog[i].includes('Game over')) continue;
    if (/good wins/i.test(gameLog[i])) return 'good';
    if (/evil wins/i.test(gameLog[i])) return 'evil';
  }
  return null;
}

export function displayRoleIds(player: Player): (string | null)[] {
  if (player.roleIds && player.roleIds.length > 0) return player.roleIds;
  if (player.roleId) return [player.roleId];
  if (player.isTheDrunk) return ['drunk'];
  if (player.isTheMarionette) return ['marionette'];
  if (player.isTheLunatic) return ['lunatic'];
  if (player.isTheLilMonsta) return ['lilmonsta'];
  return [null];
}

function resolveRoles(player: Player, rolesData: Role[]): Role[] {
  return displayRoleIds(player)
    .map(id => (id ? rolesData.find(r => r.id === id) : undefined))
    .filter((r): r is Role => Boolean(r));
}

function finalRoster(players: Player[], rolesData: Role[]): string[] {
  return players.map(p => {
    const roles = resolveRoles(p, rolesData);
    const emoji = roles.length > 0 ? TEAM_EMOJI[roles[0].team] ?? '⚪' : '⚪';
    const roleNames = roles.length > 0 ? roles.map(r => r.name).join(' / ') : 'No role';
    const tags: string[] = [];
    if (p.isTheDrunk) tags.push('Drunk');
    if (p.isTheMarionette) tags.push('Marionette');
    if (p.isTheLunatic) tags.push('Lunatic');
    if (p.isTheLilMonsta) tags.push("Lil' Monsta");
    const suffix = tags.length > 0 ? ` _(${tags.join(', ')})_` : '';
    const status = p.isDead ? ' 💀' : '';
    return `${emoji} **${p.name}** — ${roleNames}${suffix}${status}`;
  });
}

export function buildDiscordPost(opts: RecapOptions): { text: string; truncated: boolean } {
  const { players, rolesData, gameLog, scriptName, dayNumber, timeOfDay, date = new Date() } = opts;

  const winner = deriveWinner(gameLog);
  const outcome = winner === 'good' ? '🌟 Good wins' : winner === 'evil' ? '😈 Evil wins' : 'In progress';
  const when = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const phase = `${timeOfDay === 'night' ? 'Night' : 'Day'} ${dayNumber}`;
  const alive = players.filter(p => !p.isDead).length;

  const head = [
    `## 🩸 ${scriptName} — ${outcome}`,
    `**${players.length} players · ${alive} alive · ended ${phase} · ${when}**`,
    '',
    '**Final Grimoire**',
    ...finalRoster(players, rolesData),
  ].join('\n');

  if (gameLog.length === 0) return { text: head, truncated: false };

  const fence = (lines: string[]) => ['', '**Game Log**', '```', ...lines, '```'].join('\n');
  const full = head + fence(gameLog);
  if (full.length <= DISCORD_MESSAGE_LIMIT) return { text: full, truncated: false };

  const notice = '… earlier entries trimmed — full log in the .txt';
  const kept: string[] = [];
  for (let i = gameLog.length - 1; i >= 0; i--) {
    const candidate = [notice, ...[gameLog[i], ...kept]];
    if ((head + fence(candidate)).length > DISCORD_MESSAGE_LIMIT) break;
    kept.unshift(gameLog[i]);
  }

  return { text: head + fence([notice, ...kept]), truncated: true };
}

export function recapImageFilename(scriptName: string, playerCount: number, date = new Date()): string {
  const slug = scriptName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'grimoire';
  const stamp = date.toISOString().slice(0, 10);
  return `SPOILER_${slug}-${playerCount}p-${stamp}.png`;
}
