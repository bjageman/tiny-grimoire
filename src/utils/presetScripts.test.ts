import { describe, it, expect } from 'vitest';
import { PRESET_SCRIPTS, presetTeamCounts } from './presetScripts';
import rolesData from '../roles.json';
import type { Role } from '../types';

describe('PRESET_SCRIPTS', () => {
  it('ships the three official base scripts', () => {
    expect(PRESET_SCRIPTS.map(p => p.name)).toEqual(['Trouble Brewing', 'Bad Moon Rising', 'Sects & Violets']);
  });

  it('resolves every character against the app role list', () => {
    const known = new Set((rolesData as Role[]).map(r => r.id));
    PRESET_SCRIPTS.forEach(p => {
      const unknown = p.roles.filter(r => !known.has(r.id)).map(r => r.id);
      expect({ script: p.name, unknown }).toEqual({ script: p.name, unknown: [] });
    });
  });

  it('normalizes the official "traveller" spelling to the app\'s team name', () => {
    const teams = new Set(PRESET_SCRIPTS.flatMap(p => p.roles.map(r => r.team)));
    expect(teams.has('traveler' as Role['team'])).toBe(true);
    expect([...teams]).not.toContain('traveller');
  });

  it('matches the official team distribution for each script', () => {
    const counts = Object.fromEntries(PRESET_SCRIPTS.map(p => [p.name, presetTeamCounts(p)]));
    expect(counts['Trouble Brewing']).toEqual({ townsfolk: 13, outsider: 4, minion: 4, demon: 1, traveler: 5 });
    expect(counts['Bad Moon Rising']).toEqual({ townsfolk: 13, outsider: 4, minion: 4, demon: 4, traveler: 5 });
    expect(counts['Sects & Violets']).toEqual({ townsfolk: 13, outsider: 4, minion: 4, demon: 4, traveler: 5 });
  });

  it('lists each script in team order so the script modal reads correctly', () => {
    const rank = { townsfolk: 0, outsider: 1, minion: 2, demon: 3, traveler: 4 };
    PRESET_SCRIPTS.forEach(p => {
      const ranks = p.roles.map(r => rank[r.team]);
      expect({ script: p.name, sorted: [...ranks].every((v, i) => i === 0 || ranks[i - 1] <= v) })
        .toEqual({ script: p.name, sorted: true });
    });
  });

  it('never repeats a character within a script', () => {
    PRESET_SCRIPTS.forEach(p => {
      expect(new Set(p.roles.map(r => r.id)).size).toBe(p.roles.length);
    });
  });

  it('puts the expected signature characters on each script', () => {
    const idsFor = (name: string) => new Set(PRESET_SCRIPTS.find(p => p.name === name)!.roles.map(r => r.id));
    expect(idsFor('Trouble Brewing').has('imp')).toBe(true);
    expect(idsFor('Trouble Brewing').has('zombuul')).toBe(false);
    expect(idsFor('Bad Moon Rising').has('zombuul')).toBe(true);
    expect(idsFor('Sects & Violets').has('vortox')).toBe(true);
  });
});
