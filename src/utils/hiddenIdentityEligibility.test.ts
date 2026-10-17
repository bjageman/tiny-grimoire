import { describe, expect, it } from 'vitest';
import { isEligibleHiddenIdentityRole, type HiddenIdentityTag } from './hiddenIdentityEligibility';

describe('isEligibleHiddenIdentityRole', () => {
  it.each([
    ['drunk', 'drunk'],
    ['marionette', 'drunk'],
    ['marionette', 'lunatic'],
    ['lunatic', 'lilmonsta'],
    ['lilmonsta', 'marionette'],
  ] as const)('rejects %s displaying as %s during auto-assignment', (tag, roleId) => {
    expect(isEligibleHiddenIdentityRole(tag, roleId)).toBe(false);
  });

  it.each([
    ['drunk', 'washerwoman'],
    ['marionette', 'recluse'],
    ['lunatic', 'imp'],
    ['lilmonsta', 'poisoner'],
  ] as [HiddenIdentityTag, string][])('allows %s shown as %s during auto-assignment', (tag, roleId) => {
    expect(isEligibleHiddenIdentityRole(tag, roleId)).toBe(true);
  });
});
