export type HiddenIdentityTag = 'drunk' | 'marionette' | 'lunatic' | 'lilmonsta';

const FORBIDDEN_HIDDEN_IDENTITY_ROLE_IDS: Record<HiddenIdentityTag, Set<string>> = {
  drunk: new Set(['drunk']),
  marionette: new Set(['drunk', 'lunatic']),
  lunatic: new Set(['lilmonsta']),
  lilmonsta: new Set(['marionette']),
};

export function isEligibleHiddenIdentityRole(tag: HiddenIdentityTag, roleId: string): boolean {
  return !FORBIDDEN_HIDDEN_IDENTITY_ROLE_IDS[tag].has(roleId);
}
