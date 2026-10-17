export type HiddenRoleTag = 'drunk' | 'marionette' | 'lunatic' | 'lilmonsta';

const FORBIDDEN_HIDDEN_ROLE_IDS: Record<HiddenRoleTag, Set<string>> = {
  drunk: new Set(['drunk']),
  marionette: new Set(['drunk', 'lunatic']),
  lunatic: new Set(['lilmonsta']),
  lilmonsta: new Set(['marionette']),
};

export function isEligibleHiddenRole(tag: HiddenRoleTag, roleId: string): boolean {
  return !FORBIDDEN_HIDDEN_ROLE_IDS[tag].has(roleId);
}
