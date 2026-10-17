export type AutoAssignmentTag = 'drunk' | 'marionette' | 'lunatic' | 'lilmonsta';

const FORBIDDEN_DISPLAY_ROLE_IDS: Record<AutoAssignmentTag, Set<string>> = {
  drunk: new Set(['drunk']),
  marionette: new Set(['drunk', 'lunatic']),
  lunatic: new Set(['lilmonsta']),
  lilmonsta: new Set(['marionette', 'summoner']),
};

export function isEligibleAutoAssignedDisplayRole(tag: AutoAssignmentTag, roleId: string): boolean {
  return !FORBIDDEN_DISPLAY_ROLE_IDS[tag].has(roleId);
}
