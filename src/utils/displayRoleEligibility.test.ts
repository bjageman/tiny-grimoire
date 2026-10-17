import { describe, expect, it } from 'vitest';
import { isEligibleAutoAssignedDisplayRole, type AutoAssignmentTag } from './displayRoleEligibility';

describe('isEligibleAutoAssignedDisplayRole', () => {
  it.each([
    ['drunk', 'drunk'],
    ['marionette', 'drunk'],
    ['marionette', 'lunatic'],
    ['lunatic', 'lilmonsta'],
    ['lilmonsta', 'marionette'],
  ] as const)('rejects %s displaying as %s during auto-assignment', (tag, roleId) => {
    expect(isEligibleAutoAssignedDisplayRole(tag, roleId)).toBe(false);
  });

  it.each([
    ['drunk', 'washerwoman'],
    ['marionette', 'recluse'],
    ['lunatic', 'imp'],
    ['lilmonsta', 'poisoner'],
  ] as [AutoAssignmentTag, string][])('allows %s displaying as %s during auto-assignment', (tag, roleId) => {
    expect(isEligibleAutoAssignedDisplayRole(tag, roleId)).toBe(true);
  });
});
