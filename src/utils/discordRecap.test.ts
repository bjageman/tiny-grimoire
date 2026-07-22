import { describe, it, expect } from 'vitest';
import { buildDiscordPost, deriveWinner, recapImageFilename, DISCORD_MESSAGE_LIMIT } from './discordRecap';
import type { Player, Role } from '../types';

const roles: Role[] = [
  { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk' },
  { id: 'butler', name: 'Butler', team: 'outsider' },
  { id: 'poisoner', name: 'Poisoner', team: 'minion' },
  { id: 'imp', name: 'Imp', team: 'demon' },
  { id: 'drunk', name: 'Drunk', team: 'outsider' },
];

const player = (over: Partial<Player> & { id: string; name: string }): Player => ({
  isDead: false,
  ...over,
});

const players: Player[] = [
  player({ id: 'p1', name: 'Alice', roleId: 'washerwoman' }),
  player({ id: 'p2', name: 'Bob', roleId: 'butler', isDead: true }),
  player({ id: 'p3', name: 'Iris', roleId: 'poisoner' }),
  player({ id: 'p4', name: 'Jonas', roleId: 'imp' }),
];

const base = {
  players,
  rolesData: roles,
  scriptName: 'Trouble Brewing',
  dayNumber: 3,
  timeOfDay: 'day' as const,
  date: new Date('2026-07-13T12:00:00Z'),
};

describe('deriveWinner', () => {
  it('reads the winner back out of the log line the game writes', () => {
    expect(deriveWinner(['[Day 3 · 23:20] Game over 😈 Evil wins!'])).toBe('evil');
    expect(deriveWinner(['[Day 3 · 23:20] Game over 🌟 Good wins!'])).toBe('good');
  });

  it('returns null while the game is still running', () => {
    expect(deriveWinner(['[Day 1 · 20:48] Dev died'])).toBeNull();
    expect(deriveWinner([])).toBeNull();
  });

  it('takes the most recent result when a game was declared more than once', () => {
    expect(deriveWinner([
      '[Day 2 · 21:00] Game over 🌟 Good wins!',
      '[Day 3 · 23:20] Game over 😈 Evil wins!',
    ])).toBe('evil');
  });
});

describe('buildDiscordPost', () => {
  it('leads with the outcome and lists every player with their final role', () => {
    const { text, truncated } = buildDiscordPost({
      ...base,
      gameLog: ['[Day 3 · 23:20] Game over 😈 Evil wins!'],
    });

    expect(text).toContain('## Trouble Brewing — 😈 Evil Wins');
    expect(text).toContain('4 players · 3 alive · ended Day 3');
    expect(text).toContain('🔵 **Alice** — Washerwoman');
    expect(text).toContain('🟥 ***Jonas*** — _Imp_');
    expect(truncated).toBe(false);
  });

  it('marks the dead', () => {
    const { text } = buildDiscordPost({ ...base, gameLog: [] });
    expect(text).toContain('🔷 ~~**Bob** — Butler~~');
    expect(text).toContain('🔵 **Alice** — Washerwoman');
    expect(text).not.toContain('~~**Alice**~~');
  });

  it('names the character a player only thinks they are', () => {
    const { text } = buildDiscordPost({
      ...base,
      players: [player({ id: 'p1', name: 'Alice', roleId: 'washerwoman', isTheDrunk: true })],
      gameLog: [],
    });
    expect(text).toContain('_(Drunk)_');
  });

  it('says the game is unfinished when no winner was declared', () => {
    const { text } = buildDiscordPost({ ...base, gameLog: ['[Day 1 · 20:48] Dev died'] });
    expect(text).toContain('In progress');
  });

  it('never includes a game log section', () => {
    const gameLog = [
      ...Array.from({ length: 200 }, (_, i) => `[Day 1 · 20:${String(i % 60).padStart(2, '0')}] filler entry number ${i}`),
      '[Day 9 · 23:20] Game over 🌟 Good wins!',
    ];

    const { text } = buildDiscordPost({ ...base, gameLog });

    expect(text).not.toContain('**Game Log**');
    expect(text).not.toContain('filler entry number');
    // The roster is the point of the recap, so it survives intact.
    expect(text).toContain('🟥 ***Jonas*** — _Imp_');
  });

  it('never exceeds the limit even when the roster alone overflows it', () => {
    const crowd = Array.from({ length: 60 }, (_, i) =>
      player({ id: `x${i}`, name: `Player With A Very Long Name ${i}`, roleId: 'washerwoman' })
    );

    for (const gameLog of [[], ['[Day 1 · 20:00] something happened']]) {
      const { text, truncated } = buildDiscordPost({ ...base, players: crowd, gameLog });
      expect(text.length).toBeLessThanOrEqual(DISCORD_MESSAGE_LIMIT);
      expect(truncated).toBe(true);
      // A clamped body must not end mid-surrogate, or Discord shows a replacement glyph.
      expect(text).not.toMatch(/[\uD800-\uDBFF]$/);
    }
  });

  it('leaves a post that already fits completely untouched', () => {
    const { text, truncated } = buildDiscordPost({ ...base, gameLog: ['[Day 1 · 20:00] Dev died'] });
    expect(truncated).toBe(false);
    expect(text).not.toContain('…');
  });
});

describe('recapImageFilename', () => {
  it('names the file after the script, player count and date', () => {
    const name = recapImageFilename('Trouble Brewing', 10, new Date('2026-07-13T12:00:00Z'));
    expect(name).toBe('trouble-brewing-10p-2026-07-13.png');
  });

  it('survives a script name with no usable characters', () => {
    expect(recapImageFilename('!!!', 7, new Date('2026-07-13T12:00:00Z')))
      .toBe('grimoire-7p-2026-07-13.png');
  });
});
