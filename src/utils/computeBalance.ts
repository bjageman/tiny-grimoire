import { getDistribution } from '../constants';
import officialRolesData from '../official_roles.json';
import type { Role } from '../types';

const OFFICIAL_ROLE_IDS = new Set((officialRolesData as { id: string }[]).map(r => r.id));

export function computeBalance(selectedRoles: Role[], playerCount: number) {
  const basePlayerCount = Math.min(15, playerCount);
  const base = getDistribution(basePlayerCount);

  const has = (id: string) => selectedRoles.some(r => r.id === id);
  const hasDrunk       = has('drunk');

  const counts = {
    townsfolk: selectedRoles.filter(r => r.team === 'townsfolk').length,
    outsider:  selectedRoles.filter(r => r.team === 'outsider').length,
    minion:    selectedRoles.filter(r => r.team === 'minion').length,
    demon:     selectedRoles.filter(r => r.team === 'demon').length,
  };

  const hasLegion      = has('legion');
  const hasAtheist     = has('atheist');
  const hasBaron       = has('baron');
  const hasFangGu      = has('fanggu');
  const hasBalloonist  = has('balloonist');
  const hasHuntsman    = has('huntsman');
  const hasAlchemist   = has('alchemist');
  const hasHermit      = has('hermit');
  const hasGodfather   = has('godfather');
  const hasLilMonsta   = has('lilmonsta');
  const hasSummoner    = has('summoner');
  const hasLordOfTyphon = has('lordoftyphon');
  const hasVigormortis = has('vigormortis');
  const hasKazali      = has('kazali');
  const hasXaan        = has('xaan');
  const hasLunatic     = has('lunatic');
  const hasMarionette  = has('marionette');

  let expectedDemon  = base.demon;
  let expectedMinion = base.minion;
  const modifications: string[] = [];

  if (hasLegion) {
    const L = Math.round(basePlayerCount * 0.6);
    expectedDemon  = L;
    expectedMinion = 0;
    modifications.push(`Legion active (${L} Demons, 0 Minions/Outsiders)`);
  } else if (hasAtheist) {
    expectedDemon  = 0;
    expectedMinion = 0;
    modifications.push("Atheist (No Evil players)");
    if (hasBaron)      modifications.push("Baron (+2 Outsiders)");
    if (hasFangGu)     modifications.push("Fang Gu (+1 Outsider)");
    if (hasVigormortis) modifications.push("Vigormortis (-1 Outsider)");
    if (hasBalloonist) modifications.push("Balloonist (0 or +1 Outsider)");
    if (hasHuntsman)   modifications.push("Huntsman (0 or +1 Outsider)");
    if (hasHermit)     modifications.push("Hermit (0 or -1 Outsider)");
  } else {
    if (hasLilMonsta)    { expectedMinion += 1; expectedDemon -= 1; modifications.push("Lil' Monsta (+1 Minion, -1 Demon)"); }
    if (hasLordOfTyphon) { expectedMinion += 1; modifications.push("Lord of Typhon (+1 Minion)"); }
    if (hasSummoner)     { expectedDemon  -= 1; modifications.push("Summoner (-1 Demon)"); }
    if (hasLunatic)      modifications.push("Lunatic (0 or +1 Demon)");
    if (hasBaron)        modifications.push("Baron (+2 Outsiders)");
    if (hasFangGu)       modifications.push("Fang Gu (+1 Outsider)");
    if (hasVigormortis)  modifications.push("Vigormortis (-1 Outsider)");
    if (hasBalloonist)   modifications.push("Balloonist (0 or +1 Outsider)");
    if (hasHuntsman)     modifications.push("Huntsman (0 or +1 Outsider)");
    if (hasHermit)       modifications.push("Hermit (0 or -1 Outsider)");
    if (hasGodfather)    modifications.push("Godfather (+1 or -1 Outsider)");
    if (hasDrunk)        modifications.push("Drunk (+1 Townsfolk)");
    if (hasMarionette)   modifications.push("Marionette (+1 Townsfolk)");
  }

  if (hasKazali) { expectedMinion = 0; modifications.push("Kazali (0 Minions)", "Kazali (Any Outsider count)"); }
  if (hasXaan)   modifications.push("Xaan (Any Outsider count)");

  expectedDemon = Math.max(0, expectedDemon);

  // Drunk and Marionette each need an extra Townsfolk beyond the real target for a non-colliding fake identity (see standardAssignment.ts).
  const tfDelta = hasLegion ? 0 : (hasDrunk ? 1 : 0) + (hasMarionette ? 1 : 0);

  const gfMods   = (hasGodfather  && !hasLegion) ? [-1, 1] : [0];
  const balMods  = (hasBalloonist && !hasLegion) ? [0, 1]  : [0];
  const huntMods = (hasHuntsman   && !hasLegion) ? [0, 1]  : [0];
  const hermMods = (hasHermit     && !hasLegion) ? [-1, 0] : [0];
  const fixedDelta = hasLegion ? 0 : ((hasBaron ? 2 : 0) + (hasFangGu ? 1 : 0) - (hasVigormortis ? 1 : 0));

  const possibleOutsiders = new Set<number>();
  if (hasLegion) {
    possibleOutsiders.add(0);
  } else if (hasKazali || hasXaan) {
    const max = Math.max(0, basePlayerCount - expectedDemon - expectedMinion);
    for (let i = 0; i <= max; i++) possibleOutsiders.add(i);
  } else {
    for (const gf of gfMods) for (const bal of balMods) for (const hunt of huntMods) for (const herm of hermMods) {
      possibleOutsiders.add(Math.max(0, base.outsider + fixedDelta + gf + bal + hunt + herm));
    }
  }

  const validOutsiders  = Array.from(possibleOutsiders).sort((a, b) => a - b);
  const validTownsfolk  = validOutsiders.map(out => Math.max(0, basePlayerCount - expectedDemon - expectedMinion - out) + tfDelta);
  const uniqueTownsfolk = Array.from(new Set(validTownsfolk)).sort((a, b) => a - b);

  const isOutsiderValid  = (hasKazali || hasXaan) ? true : validOutsiders.includes(counts.outsider);
  const isTownsfolkValid = (hasKazali || hasXaan) ? true : (isOutsiderValid && counts.townsfolk === basePlayerCount - expectedDemon - expectedMinion - counts.outsider + tfDelta);
  const isDemonValid     = hasLunatic
    ? (counts.demon === expectedDemon || counts.demon === expectedDemon + 1)
    : (counts.demon === expectedDemon);
  const isMinionValid    = counts.minion === expectedMinion;

  const expectedOutsiderLabel  = (hasKazali || hasXaan) ? 'any' : validOutsiders.join(' or ');
  const expectedTownsfolkLabel = (hasKazali || hasXaan) ? 'any' : uniqueTownsfolk.join(' or ');
  const expectedDemonLabel     = hasLunatic
    ? `${expectedDemon} or ${expectedDemon + 1}`
    : String(expectedDemon);

  const jinxWarnings: string[] = [];
  if (has('choirboy') && !has('king'))     jinxWarnings.push("Choirboy in play, but no King selected.");
  if (hasHuntsman && !has('damsel'))   jinxWarnings.push("Huntsman in play, but no Damsel selected.");
  if (hasAlchemist) jinxWarnings.push("Alchemist in play — ability may affect setup.");

  const customRolesInPlay = selectedRoles.filter(r => !OFFICIAL_ROLE_IDS.has(r.id));
  if (customRolesInPlay.length > 0) {
    jinxWarnings.push(`Custom: ${customRolesInPlay.map(r => r.name).join(', ')} — adjust setup manually.`);
  }

  const isValid = isDemonValid && isMinionValid && isOutsiderValid && isTownsfolkValid && jinxWarnings.length === 0;

  return { counts, modifications, validOutsiders, isDemonValid, isMinionValid, isOutsiderValid, isTownsfolkValid, isValid, expectedOutsiderLabel, expectedTownsfolkLabel, expectedDemonLabel, expectedDemon, expectedMinion, jinxWarnings };
}
