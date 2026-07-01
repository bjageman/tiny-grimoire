import { describe, it, expect } from 'vitest';
import { computeBalance } from './computeBalance';
import type { Role } from '../types';

const r = (id: string, team: Role['team']): Role => ({ id, name: id, team });

const tf  = (id: string) => r(id, 'townsfolk');
const out = (id: string) => r(id, 'outsider');
const min = (id: string) => r(id, 'minion');
const dem = (id: string) => r(id, 'demon');

// Distribution reference:
//  6 players: 3 TF / 1 Out / 1 Minion / 1 Demon
//  8 players: 5 TF / 1 Out / 1 Minion / 1 Demon
// 10 players: 7 TF / 0 Out / 2 Minion / 1 Demon
// 12 players: 7 TF / 2 Out / 2 Minion / 1 Demon

describe('computeBalance — Drunk', () => {
  it('counts Drunk in the outsider column, not townsfolk', () => {
    // 6-player game: base 3/1/1/1. Drunk fills the 1 outsider slot.
    // Selecting Drunk + 4 TF (3 real + 1 fake for Drunk) + 1 minion + 1 demon.
    const roles = [out('drunk'), tf('washerwoman'), tf('empath'), tf('chef'), tf('monk'), min('poisoner'), dem('imp')];
    const b = computeBalance(roles, 6);

    expect(b.counts.outsider).toBe(1); // Drunk counts as outsider
    expect(b.counts.townsfolk).toBe(4); // 4 actual TF characters selected
  });

  it('isOutsiderValid is true when Drunk fills the outsider slot', () => {
    // 6-player base has 1 outsider slot; Drunk occupies it.
    const roles = [out('drunk'), tf('washerwoman'), tf('empath'), tf('chef'), tf('monk'), min('poisoner'), dem('imp')];
    const b = computeBalance(roles, 6);
    expect(b.isOutsiderValid).toBe(true);
  });

  it('requires +1 TF for Drunk fake identity (tfDelta = 1)', () => {
    // 6 players: base 3/1/1/1. validTownsfolk = (6-1-1-1) + 1 = 4.
    // 3 TF selected → invalid; 4 TF selected → valid.
    const threeAndDrunk = [out('drunk'), tf('washerwoman'), tf('empath'), tf('chef'), min('poisoner'), dem('imp')];
    const fourAndDrunk  = [...threeAndDrunk, tf('monk')];

    expect(computeBalance(threeAndDrunk, 6).isTownsfolkValid).toBe(false);
    expect(computeBalance(fourAndDrunk,  6).isTownsfolkValid).toBe(true);
  });

  it('is fully valid with Drunk + correct TF count', () => {
    // 6 players, Drunk + 4 TF + 1 minion + 1 demon = 7 characters for 6 players.
    const roles = [out('drunk'), tf('washerwoman'), tf('empath'), tf('chef'), tf('monk'), min('poisoner'), dem('imp')];
    const b = computeBalance(roles, 6);
    expect(b.isValid).toBe(true);
  });

  it('is invalid when Drunk is selected but no outsider slot exists', () => {
    // 10-player base: 7/0/2/1 — no outsider slot. Drunk cannot fit without Baron.
    const roles = [
      out('drunk'),
      min('poisoner'), min('scarlet_woman'), dem('imp'),
      tf('washerwoman'), tf('empath'), tf('chef'), tf('monk'), tf('soldier'), tf('slayer'), tf('virgin'), tf('ravenkeeper'),
    ];
    const b = computeBalance(roles, 10);
    expect(b.isOutsiderValid).toBe(false);
    expect(b.isValid).toBe(false);
  });

  it('is valid when Drunk is combined with Baron (adds 2 outsider slots)', () => {
    // 10-player base: 7/0/2/1. Baron +2 → need 2 outsiders.
    // With Drunk as one outsider + tfDelta 1: need (7-2)+1=6 TF.
    // 6 TF + Drunk + Recluse + Baron + another minion + Imp = 11 characters for 10 players.
    const roles = [
      out('drunk'), out('recluse'),
      min('baron'), min('assassin'), dem('imp'),
      tf('washerwoman'), tf('empath'), tf('chef'), tf('monk'), tf('soldier'), tf('slayer'),
    ];
    const b = computeBalance(roles, 10);
    expect(b.isOutsiderValid).toBe(true);
    expect(b.isTownsfolkValid).toBe(true);
    expect(b.isValid).toBe(true);
  });

  it('shows "Drunk (+1 Townsfolk)" in modifications', () => {
    const roles = [out('drunk'), tf('washerwoman'), tf('empath'), tf('chef'), tf('monk'), min('poisoner'), dem('imp')];
    const b = computeBalance(roles, 6);
    expect(b.modifications).toContain('Drunk (+1 Townsfolk)');
  });
});

describe('computeBalance — Marionette', () => {
  it('requires +1 TF for Marionette fake identity (tfDelta = 1)', () => {
    // 8-player base: 5/1/1/1. Marionette counts as minion; tfDelta adds 1.
    // validTownsfolk = (8-1-1-1) + 1 = 6.
    const withoutExtra = [out('recluse'), min('marionette'), dem('imp'), tf('washerwoman'), tf('empath'), tf('chef'), tf('monk'), tf('soldier')];
    const withExtra    = [...withoutExtra, tf('slayer')];

    expect(computeBalance(withoutExtra, 8).isTownsfolkValid).toBe(false); // 5 TF, need 6
    expect(computeBalance(withExtra,    8).isTownsfolkValid).toBe(true);  // 6 TF
  });
});

describe('computeBalance — Balloonist', () => {
  it('allows 0 or +1 Outsider when Balloonist is selected', () => {
    // 8-player base: 5 TF / 1 Out / 1 Minion / 1 Demon. Balloonist is a Townsfolk.
    const roles = [tf('washerwoman'), tf('librarian'), tf('investigator'), tf('chef'), tf('balloonist'), out('recluse'), min('poisoner'), dem('imp')];
    const b = computeBalance(roles, 8);
    expect(b.modifications).toContain('Balloonist (0 or +1 Outsider)');
    expect(b.isOutsiderValid).toBe(true);
    expect(b.isValid).toBe(true);
  });

  it('is valid with Balloonist and +1 Outsider (2 outsiders instead of 1)', () => {
    const roles = [tf('washerwoman'), tf('librarian'), tf('investigator'), tf('balloonist'), out('recluse'), out('mutant'), min('poisoner'), dem('imp')];
    const b = computeBalance(roles, 8);
    expect(b.counts.outsider).toBe(2);
    expect(b.isOutsiderValid).toBe(true);
    expect(b.isTownsfolkValid).toBe(true);
    expect(b.isValid).toBe(true);
  });
});

describe('computeBalance — Huntsman', () => {
  it('allows 0 or +1 Outsider when Huntsman is selected, and warns if no Damsel is selected', () => {
    // 8-player base: 5 TF / 1 Out / 1 Minion / 1 Demon. Huntsman is a Townsfolk.
    const roles = [tf('washerwoman'), tf('librarian'), tf('investigator'), tf('chef'), tf('huntsman'), out('recluse'), min('poisoner'), dem('imp')];
    const b = computeBalance(roles, 8);
    expect(b.modifications).toContain('Huntsman (0 or +1 Outsider)');
    expect(b.isOutsiderValid).toBe(true);
    expect(b.jinxWarnings).toContain('Huntsman in play, but no Damsel selected.');
    expect(b.isValid).toBe(false);
  });

  it('clears the Huntsman/Damsel jinx warning once Damsel is selected', () => {
    const roles = [tf('washerwoman'), tf('librarian'), tf('investigator'), tf('huntsman'), out('recluse'), out('damsel'), min('poisoner'), dem('imp')];
    const b = computeBalance(roles, 8);
    expect(b.counts.outsider).toBe(2);
    expect(b.jinxWarnings).not.toContain('Huntsman in play, but no Damsel selected.');
    expect(b.isValid).toBe(true);
  });
});

describe('computeBalance — basic distribution', () => {
  it('is valid for a clean 6-player selection with outsider', () => {
    // 6 players base: 3/1/1/1
    const roles = [out('recluse'), min('poisoner'), dem('imp'), tf('washerwoman'), tf('empath'), tf('chef')];
    const b = computeBalance(roles, 6);
    expect(b.isValid).toBe(true);
    expect(b.counts).toEqual({ townsfolk: 3, outsider: 1, minion: 1, demon: 1 });
  });

  it('is valid for a clean 10-player selection without outsiders', () => {
    // 10 players base: 7/0/2/1
    const roles = [
      min('poisoner'), min('scarlet_woman'), dem('imp'),
      tf('washerwoman'), tf('empath'), tf('chef'), tf('monk'), tf('soldier'), tf('slayer'), tf('virgin'),
    ];
    const b = computeBalance(roles, 10);
    expect(b.isValid).toBe(true);
    expect(b.counts).toEqual({ townsfolk: 7, outsider: 0, minion: 2, demon: 1 });
  });

  it('is invalid when a role is missing', () => {
    // 6 players base: 3/1/1/1 — drop 1 TF
    const roles = [out('recluse'), min('poisoner'), dem('imp'), tf('washerwoman'), tf('empath')];
    expect(computeBalance(roles, 6).isValid).toBe(false);
  });
});
