import { describe, it, expect } from 'vitest';
import { ALL_ROLES, PLAYABLE_ROLES, ABILITY_BY_ID } from './roleData';

describe('role data', () => {
  it('holds every character, with the playable set excluding Fabled and Lorics', () => {
    expect(ALL_ROLES).toHaveLength(181);
    expect(PLAYABLE_ROLES).toHaveLength(156);
    expect(ALL_ROLES.length - PLAYABLE_ROLES.length).toBe(
      ALL_ROLES.filter(r => r.team === 'fabled' || r.team === 'loric').length
    );
  });

  it('keeps Fabled and Lorics out of the playable set', () => {
    expect(PLAYABLE_ROLES.some(r => r.id === 'djinn')).toBe(false);
    expect(PLAYABLE_ROLES.some(r => r.id === 'bootlegger')).toBe(false);
    expect(ALL_ROLES.some(r => r.id === 'djinn')).toBe(true);
    expect(ALL_ROLES.some(r => r.id === 'bootlegger')).toBe(true);
  });

  it('uses the app\'s "traveler" spelling everywhere, never the official "traveller"', () => {
    expect(ALL_ROLES.filter(r => (r.team as string) === 'traveller')).toEqual([]);
    expect(PLAYABLE_ROLES.filter(r => r.team === 'traveler')).toHaveLength(18);
  });

  it('no longer carries the edition tag', () => {
    expect(ALL_ROLES.filter(r => 'edition' in r)).toEqual([]);
  });

  it('gives every character a unique id, a name and a team', () => {
    expect(new Set(ALL_ROLES.map(r => r.id)).size).toBe(ALL_ROLES.length);
    expect(ALL_ROLES.filter(r => !r.id || !r.name || !r.team)).toEqual([]);
  });

  it('carries the official ability text that scripts omit', () => {
    expect(ABILITY_BY_ID.get('washerwoman')).toContain('Townsfolk');
    expect([...ABILITY_BY_ID.values()].filter(a => !a)).toEqual([]);
  });

  it('keeps the night reminders the night order widget reads', () => {
    const imp = ALL_ROLES.find(r => r.id === 'imp');
    expect(imp?.otherNightReminder).toBeTruthy();
    expect(ALL_ROLES.find(r => r.id === 'washerwoman')?.firstNightReminder).toBeTruthy();
  });
});
