import type { Role } from '../types';
import { getDistribution } from '../constants';

export function computeBalance(selectedRoles: Role[], playerCount: number) {
  const base = getDistribution(playerCount);

  const has = (id: string) => selectedRoles.some(r => r.id === id);
  const hasDrunk       = has('drunk');

  const counts = {
    townsfolk: selectedRoles.filter(r => r.team === 'townsfolk').length,
    outsider:  selectedRoles.filter(r => r.team === 'outsider').length,
    minion:    selectedRoles.filter(r => r.team === 'minion').length,
    demon:     selectedRoles.filter(r => r.team === 'demon').length,
  };

  const hasLegion      = has('legion');
  const hasRiot        = has('riot');
  const hasAtheist     = has('atheist');
  const hasBaron       = has('baron');
  const hasFangGu      = has('fanggu');
  const hasBalloonist  = has('balloonist');
  const hasHermit      = has('hermit');
  const hasGodfather   = has('godfather');
  const hasLilMonsta   = has('lilmonsta');
  const hasSummoner    = has('summoner');
  const hasLordOfTyphon = has('lordoftyphon');
  const hasKazali      = has('kazali');
  const hasXaan        = has('xaan');
  const hasLunatic     = has('lunatic');
  const hasMarionette  = has('marionette');

  let expectedDemon  = base.demon;
  let expectedMinion = base.minion;
  const modifications: string[] = [];

  if (hasLegion) {
    const L = Math.round(playerCount * 0.6);
    expectedDemon  = L;
    expectedMinion = 0;
    modifications.push(`Legion active (${L} Demons, 0 Minions/Outsiders)`);
  } else if (hasRiot) {
    const D = 1 + base.minion;
    expectedDemon  = D;
    expectedMinion = 0;
    modifications.push(`Riot active (${D} Demons, 0 Minions/Outsiders)`);
  } else if (hasAtheist) {
    expectedDemon  = 0;
    expectedMinion = 0;
    modifications.push("Atheist (No Evil players)");
    if (hasBaron)      modifications.push("Baron (+2 Outsiders)");
    if (hasFangGu)     modifications.push("Fang Gu (+1 Outsider)");
    if (hasBalloonist) modifications.push("Balloonist (0 or +1 Outsider)");
    if (hasHermit)     modifications.push("Hermit (0 or -1 Outsider)");
  } else {
    if (hasLilMonsta)    { expectedMinion += 1; expectedDemon -= 1; modifications.push("Lil' Monsta (+1 Minion, -1 Demon)"); }
    if (hasLordOfTyphon) { expectedMinion += 1; modifications.push("Lord of Typhon (+1 Minion)"); }
    if (hasSummoner)     { expectedDemon  -= 1; modifications.push("Summoner (-1 Demon)"); }
    if (hasLunatic)      modifications.push("Lunatic (0 or +1 Demon)");
    if (hasBaron)        modifications.push("Baron (+2 Outsiders)");
    if (hasFangGu)       modifications.push("Fang Gu (+1 Outsider)");
    if (hasBalloonist)   modifications.push("Balloonist (0 or +1 Outsider)");
    if (hasHermit)       modifications.push("Hermit (0 or -1 Outsider)");
    if (hasGodfather)    modifications.push("Godfather (+1 or -1 Outsider)");
    if (hasMarionette)   modifications.push("Marionette (+1 Townsfolk)");
    if (hasDrunk)        modifications.push("Drunk (+1 Townsfolk)");
  }

  if (hasKazali) { expectedMinion = 0; modifications.push("Kazali (0 Minions)", "Kazali (Any Outsider count)"); }
  if (hasXaan)   modifications.push("Xaan (Any Outsider count)");

  expectedDemon = Math.max(0, expectedDemon);

  // Drunk and Marionette each need 1 extra character in the selection (for the role they impersonate).
  const tfDelta = !hasLegion && !hasRiot ? ((hasDrunk ? 1 : 0) + (hasMarionette ? 1 : 0)) : 0;

  const gfMods   = (hasGodfather  && !hasLegion && !hasRiot) ? [-1, 1] : [0];
  const balMods  = (hasBalloonist && !hasLegion && !hasRiot) ? [0, 1]  : [0];
  const hermMods = (hasHermit     && !hasLegion && !hasRiot) ? [-1, 0] : [0];
  const fixedDelta = (hasLegion || hasRiot) ? 0 : ((hasBaron ? 2 : 0) + (hasFangGu ? 1 : 0));

  const possibleOutsiders = new Set<number>();
  if (hasLegion || hasRiot) {
    possibleOutsiders.add(0);
  } else if (hasKazali || hasXaan) {
    const max = Math.max(0, playerCount - expectedDemon - expectedMinion);
    for (let i = 0; i <= max; i++) possibleOutsiders.add(i);
  } else {
    for (const gf of gfMods) for (const bal of balMods) for (const herm of hermMods) {
      possibleOutsiders.add(Math.max(0, base.outsider + fixedDelta + gf + bal + herm));
    }
  }

  const validOutsiders  = Array.from(possibleOutsiders).sort((a, b) => a - b);
  const validTownsfolk  = validOutsiders.map(out => Math.max(0, playerCount - expectedDemon - expectedMinion - out) + tfDelta);
  const uniqueTownsfolk = Array.from(new Set(validTownsfolk)).sort((a, b) => a - b);

  const isOutsiderValid  = (hasKazali || hasXaan) ? true : validOutsiders.includes(counts.outsider);
  const isTownsfolkValid = (hasKazali || hasXaan) ? true : (isOutsiderValid && counts.townsfolk === playerCount - expectedDemon - expectedMinion - counts.outsider + tfDelta);
  const isDemonValid     = counts.demon  === expectedDemon;
  const isMinionValid    = counts.minion === expectedMinion;

  const expectedOutsiderLabel  = (hasKazali || hasXaan) ? 'any' : validOutsiders.join(' or ');
  const expectedTownsfolkLabel = (hasKazali || hasXaan) ? 'any' : uniqueTownsfolk.join(' or ');

  const jinxWarnings: string[] = [];
  if (has('choirboy') && !has('king'))     jinxWarnings.push("Choirboy in play, but no King selected.");
  if (has('huntsman') && !has('damsel'))   jinxWarnings.push("Huntsman in play, but no Damsel selected.");

  const isValid = isDemonValid && isMinionValid && isOutsiderValid && isTownsfolkValid && jinxWarnings.length === 0;

  return { counts, modifications, validOutsiders, isDemonValid, isMinionValid, isOutsiderValid, isTownsfolkValid, isValid, expectedOutsiderLabel, expectedTownsfolkLabel, expectedDemon, expectedMinion, jinxWarnings };
}
