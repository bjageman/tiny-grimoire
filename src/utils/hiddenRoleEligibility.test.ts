import { describe, expect, it } from 'vitest';
import { isEligibleHiddenRole, type HiddenRoleTag } from './hiddenRoleEligibility';

describe('isEligibleHiddenRole', () => {
  it.each([
    ['drunk', 'drunk'],
    ['marionette', 'drunk'],
    ['marionette', 'lunatic'],
    ['lunatic', 'lilmonsta'],
    ['lilmonsta', 'marionette'],
  ] as const)('rejects %s displaying as %s during auto-assignment', (tag, roleId) => {
    expect(isEligibleHiddenRole(tag, roleId)).toBe(false);
  });

  it.each([
    ['drunk', 'washerwoman'],
    ['marionette', 'recluse'],
    ['lunatic', 'imp'],
    ['lilmonsta', 'poisoner'],
  ] as [HiddenRoleTag, string][])('allows %s shown as %s during auto-assignment', (tag, roleId) => {
    expect(isEligibleHiddenRole(tag, roleId)).toBe(true);
  });
});
