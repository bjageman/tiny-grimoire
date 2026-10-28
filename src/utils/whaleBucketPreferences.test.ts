import { describe, expect, it } from 'vitest';
import type { PlayerPreferences, Role } from '../types';
import { chooseLilMonstaMinion, hasCompleteWhaleBucketPreferences } from './whaleBucketPreferences';

describe('chooseLilMonstaMinion', () => {
  it("uses the Lil' Monsta player's eligible Minion preference", () => {
    const preferences: PlayerPreferences = {
      townsfolk: [],
      outsider: [],
      minion: ['poisoner'],
      demon: ['lilmonsta'],
      traveler: [],
    };
    const roles: Role[] = [
      { id: 'poisoner', name: 'Poisoner', team: 'minion' },
      { id: 'spy', name: 'Spy', team: 'minion' },
    ];

    const chosenRole = chooseLilMonstaMinion(preferences, new Set(['spy']), roles, []);

    expect(chosenRole?.id).toBe('poisoner');
  });

  it('does not use an excluded Minion preference', () => {
    const preferences: PlayerPreferences = {
      townsfolk: [],
      outsider: [],
      minion: ['poisoner'],
      demon: ['lilmonsta'],
      traveler: [],
    };
    const roles: Role[] = [
      { id: 'poisoner', name: 'Poisoner', team: 'minion' },
      { id: 'spy', name: 'Spy', team: 'minion' },
    ];

    const chosenRole = chooseLilMonstaMinion(preferences, new Set(), roles, ['poisoner']);

    expect(chosenRole?.id).toBe('spy');
  });

  it("does not assign Marionette to the Lil' Monsta tag", () => {
    const preferences: PlayerPreferences = {
      townsfolk: [],
      outsider: [],
      minion: ['marionette'],
      demon: ['lilmonsta'],
      traveler: [],
    };
    const roles: Role[] = [
      { id: 'marionette', name: 'Marionette', team: 'minion' },
      { id: 'poisoner', name: 'Poisoner', team: 'minion' },
    ];

    const chosenRole = chooseLilMonstaMinion(preferences, new Set(), roles, []);

    expect(chosenRole?.id).toBe('poisoner');
  });
});

describe('hasCompleteWhaleBucketPreferences', () => {
  const complete = { townsfolk: ['chef'], outsider: ['drunk'], minion: ['poisoner'], demon: ['imp'] };

  it('requires exactly one selection per core category and does not require Traveler', () => {
    expect(hasCompleteWhaleBucketPreferences(complete)).toBe(true);
    expect(hasCompleteWhaleBucketPreferences(undefined)).toBe(false);
    expect(hasCompleteWhaleBucketPreferences({})).toBe(false);
    expect(hasCompleteWhaleBucketPreferences({ ...complete, demon: [] })).toBe(false);
    expect(hasCompleteWhaleBucketPreferences({ ...complete, demon: [''] })).toBe(false);
    expect(hasCompleteWhaleBucketPreferences({ ...complete, townsfolk: ['chef', 'empath'] })).toBe(false);
  });
});
