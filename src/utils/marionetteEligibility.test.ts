import { describe, expect, it } from 'vitest';
import type { Player, Role } from '../types';
import { hasActualDemonNeighbor, isActualDemon, isMarionetteEligible } from './marionetteEligibility';

const roles: Role[] = [
  { id: 'chef', name: 'Chef', team: 'townsfolk' },
  { id: 'recluse', name: 'Recluse', team: 'outsider' },
  { id: 'poisoner', name: 'Poisoner', team: 'minion' },
  { id: 'imp', name: 'Imp', team: 'demon' },
];
const findRole = (roleId?: string) => roles.find(role => role.id === roleId);

describe('Marionette eligibility', () => {
  it("treats a Lil' Monsta-tagged Minion as the actual Demon", () => {
    const lilMonsta: Player = { id: 'demon', name: 'Demon', roleId: 'poisoner', isTheLilMonsta: true, isDead: false };
    expect(isActualDemon(lilMonsta, findRole)).toBe(true);
  });

  it('does not treat a Lunatic displaying a Demon as the actual Demon', () => {
    const lunatic: Player = { id: 'lunatic', name: 'Lunatic', roleId: 'imp', isTheLunatic: true, isDead: false };
    expect(isActualDemon(lunatic, findRole)).toBe(false);
  });

  it("allows a good Marionette identity beside a Lil' Monsta-tagged player", () => {
    const players: Player[] = [
      { id: 'marionette', name: 'Marionette', roleId: 'chef', isDead: false },
      { id: 'demon', name: 'Demon', roleId: 'poisoner', isTheLilMonsta: true, isDead: false },
    ];
    expect(hasActualDemonNeighbor(players, 'marionette', findRole)).toBe(true);
    expect(isMarionetteEligible(players, 'marionette', 'recluse', findRole)).toBe(true);
  });
});
