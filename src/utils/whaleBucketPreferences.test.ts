import { describe, expect, it } from 'vitest';
import type { PlayerPreferences, Role } from '../types';
import { chooseLilMonstaMinion } from './whaleBucketPreferences';

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
