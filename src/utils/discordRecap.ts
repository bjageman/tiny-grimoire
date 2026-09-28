import type { Player, Role } from '../types';
import { seatIsEvil } from './playerSeat';

export const DISCORD_MESSAGE_LIMIT = 2000;
const MARKER_LEGEND = '**Legend (good/evil):** 💙/❤️ Townsfolk · 🔵/🔴 Outsider · 🟦/🟥 Minion · 🔷/♦️ Demon · 📘/📕 Traveler';

const TEAM_MARKERS: Record<Role['team'], { good: string; evil: string }> = {
  townsfolk: { good: '💙', evil: '❤️' },
  outsider: { good: '🔵', evil: '🔴' },
  minion: { good: '🟦', evil: '🟥' },
  demon: { good: '🔷', evil: '♦️' },
  traveler: { good: '📘', evil: '📕' },
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
    const primaryRole = roles[0];
    const markerTeam = p.isTheMarionette ? 'minion' : p.isTheLunatic ? 'outsider' : primaryRole?.team;
    const alignment = seatIsEvil(p, primaryRole) ? 'evil' : 'good';
    const emoji = markerTeam ? TEAM_MARKERS[markerTeam][alignment] : '⚪';
    const perceivedRoleNames = roles.length > 0 ? roles.map(r => r.name).join(' / ') : 'No role';
    const roleNames = p.isTheMarionette
      ? perceivedRoleNames === 'Marionette' ? 'Marionette' : `Marionette (${perceivedRoleNames})`
      : p.isTheLunatic
        ? perceivedRoleNames === 'Lunatic' ? 'Lunatic' : `Lunatic (${perceivedRoleNames})`
        : perceivedRoleNames;
    const tags: string[] = [];
    if (p.isTheDrunk) tags.push('Drunk');
    if (p.isTheLilMonsta) tags.push("Lil' Monsta");
    const suffix = tags.length > 0 ? ` _(${tags.join(', ')})_` : '';
    const isDemon = markerTeam === 'demon';
    const name = isDemon ? `***${p.name}***` : `**${p.name}**`;
    const role = isDemon ? `_${roleNames}_` : roleNames;
    const body = p.isDead ? `~~${name} — ${role}~~` : `${name} — ${role}`;
    return `${emoji} ${body}${suffix}`;
  });
}

export function buildDiscordPost(opts: RecapOptions): { text: string; truncated: boolean } {
  const { players, rolesData, gameLog, scriptName, dayNumber, timeOfDay, date = new Date() } = opts;

  const winner = deriveWinner(gameLog);
  const outcome = winner === 'good' ? '🌟 Good Wins' : winner === 'evil' ? '😈 Evil Wins' : 'In progress';
  const when = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const phase = `${timeOfDay === 'night' ? 'Night' : 'Day'} ${dayNumber}`;
  const alive = players.filter(p => !p.isDead).length;

  const head = [
    `## ${scriptName} — ${outcome}`,
    `**${players.length} players · ${alive} alive · ended ${phase} · ${when}**`,
    '',
    '**Final Grimoire**',
    ...finalRoster(players, rolesData),
    '',
    MARKER_LEGEND,
  ].join('\n');

  return clamp(head);
}

function clamp(text: string): { text: string; truncated: boolean } {
  if (text.length <= DISCORD_MESSAGE_LIMIT) return { text, truncated: false };

  let end = DISCORD_MESSAGE_LIMIT - 1;
  const code = text.charCodeAt(end - 1);
  if (code >= 0xd800 && code <= 0xdbff) end -= 1;
  return { text: text.slice(0, end) + '…', truncated: true };
}

export function recapImageFilename(scriptName: string, playerCount: number, date = new Date()): string {
  const slug = scriptName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'grimoire';
  const stamp = date.toISOString().slice(0, 10);
  return `${slug}-${playerCount}p-${stamp}.png`;
}
