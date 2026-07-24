import type { Player, Role } from '../types';

// Seat rendering shared by the interactive grimoire and the recap export, so the two can't drift.

/** Unit vector pointing from a seat (position in board %) toward the board's centre. */
export function inwardVector(leftPct: number, topPct: number): { x: number; y: number } {
  const dx = 50 - leftPct;
  const dy = 50 - topPct;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist > 0 ? { x: dx / dist, y: dy / dist } : { x: 0, y: 0 };
}

/** Distance (in % of the seat) from the seat centre out to the reminder anchor. */
const REMINDER_ANCHOR = 70;
/** Radius of the arc the older reminders fan along, centred on that anchor. */
const REMINDER_ARC_RADIUS = 30;

/** Offset for one of a seat's reminder tokens: the newest sits at the anchor, earlier ones arc around it. */
export function reminderArcOffset(
  index: number,
  count: number,
  inward: { x: number; y: number }
): { left: number; top: number } {
  const isLast = index === count - 1;
  const arcCount = count - 1;
  const totalAngle = Math.PI;
  const theta = -totalAngle / 2 + (arcCount > 1 ? (index / (arcCount - 1)) * totalAngle : 0);
  const rx = inward.x * Math.cos(theta) - inward.y * Math.sin(theta);
  const ry = inward.x * Math.sin(theta) + inward.y * Math.cos(theta);
  return {
    left: isLast ? inward.x * REMINDER_ANCHOR : inward.x * REMINDER_ANCHOR + rx * REMINDER_ARC_RADIUS,
    top: isLast ? inward.y * REMINDER_ANCHOR : inward.y * REMINDER_ANCHOR + ry * REMINDER_ARC_RADIUS,
  };
}

/** A seat's alignment: an explicit override wins, then the characters that force it, then the role's team. */
export function seatIsEvil(player: Player, role: Role | null | undefined): boolean {
  if (player.isEvil !== undefined) return player.isEvil;
  if (player.isTheLunatic) return false;
  if (player.isTheMarionette) return true;
  return role ? role.team === 'minion' || role.team === 'demon' : false;
}

// White halo that lifts seat text off the token face; dropped when dead so it doesn't glow.
export const SEAT_NAME_GLOW = '0 1.5px 3px rgba(255,255,255,1), 0 0 5px rgba(255,255,255,1), 0 0 8px rgba(255,255,255,0.9)';
export const SEAT_PRONOUN_GLOW = '0 1px 2px rgba(255,255,255,1), 0 0 4px rgba(255,255,255,0.9)';
export const SEAT_NAME_COLOR = '#1a1a1a';
export const SEAT_PRONOUN_COLOR = '#555';
export const SEAT_DEAD_OPACITY = 0.75;

/** Text shadow for a seat's name/pronouns — no halo once the player is dead. */
export function seatTextShadow(isDead: boolean | undefined, glow: string): string {
  return isDead ? 'none' : glow;
}
