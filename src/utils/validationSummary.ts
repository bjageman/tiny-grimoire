import type { Player, Role } from '../types';
import { getDistribution } from '../constants';
import rolesData from '../official_roles.json';

const OFFICIAL_ROLE_IDS = new Set((rolesData as Role[]).map(r => r.id));

export interface ValidationSummary {
  base: { townsfolk: number; outsider: number; minion: number; demon: number; traveler: number };
  counts: { townsfolk: number; outsider: number; minion: number; demon: number; traveler: number };
  expected: { townsfolk: number; outsider: number; minion: number; demon: number; traveler: number };
  hasGodfather: boolean;
  modifications: string[];
  isDemonValid: boolean;
  isMinionValid: boolean;
  isOutsiderValid: boolean;
  isTownsfolkValid: boolean;
  jinxWarnings: string[];
  warnings: string[];
  failures: string[];
  isValid: boolean;
  expectedOutsiderLabel: string;
  expectedTownsfolkLabel: string;
}

export function getValidationSummary(players: Player[], allRoles: Role[] = rolesData as Role[]): ValidationSummary | null {
  if (players.length === 0) return null;

  const N = players.length;
  const travelerCount = players.filter(p => {
    if (!p.roleId) return false;
    const r = allRoles.find(role => role.id === p.roleId);
    return r?.team === 'traveler';
  }).length;
  const baseCount = N - travelerCount;
  const base = getDistribution(baseCount);
  
  const counts = players.reduce((acc, p) => {
    if (p.roleId) {
      if (p.isTheMarionette) {
        acc.minion++;
      } else if (p.isTheDrunk) {
        acc.outsider++;
      } else if (p.isTheLunatic) {
        acc.outsider++;
      } else if (p.roleId === 'lilmonsta') {
        acc.minion++;
      } else {
        const role = allRoles.find(r => r.id === p.roleId);
        if (role) acc[role.team]++;
      }
    }
    return acc;
  }, { townsfolk: 0, outsider: 0, minion: 0, demon: 0, traveler: 0 });
  
  const assignedRoles = players.map(p => {
    if (p.isTheMarionette) return allRoles.find(r => r.id === 'marionette');
    if (p.isTheDrunk) return allRoles.find(r => r.id === 'drunk');
    if (p.isTheLunatic) return allRoles.find(r => r.id === 'lunatic');
    return allRoles.find(r => r.id === p.roleId);
  }).filter(Boolean) as Role[];
  const hasLegion = assignedRoles.some(r => r.id === 'legion');
  const hasRiot = assignedRoles.some(r => r.id === 'riot');
  const hasAtheist = assignedRoles.some(r => r.id === 'atheist');
  const hasBaron = assignedRoles.some(r => r.id === 'baron');
  const hasGodfather = assignedRoles.some(r => r.id === 'godfather');
  const hasFangGu = assignedRoles.some(r => r.id === 'fanggu');
  const hasVigormortis = assignedRoles.some(r => r.id === 'vigormortis');
  const hasBalloonist = assignedRoles.some(r => r.id === 'balloonist');
  const hasHuntsman = assignedRoles.some(r => r.id === 'huntsman');
  const hasAlchemist = assignedRoles.some(r => r.id === 'alchemist');
  const hasLilMonsta = assignedRoles.some(r => r.id === 'lilmonsta') || players.some(p => p.isTheLilMonsta);
  const hasHermit = assignedRoles.some(r => r.id === 'hermit');
  const hasSummoner = assignedRoles.some(r => r.id === 'summoner');
  const hasLordOfTyphon = assignedRoles.some(r => r.id === 'lordoftyphon');
  const hasKazali = assignedRoles.some(r => r.id === 'kazali');
  const hasXaan = assignedRoles.some(r => r.id === 'xaan');

  // Marionette's own seat is always tallied as a Minion (see `counts` above). If it displays
  // as the Outsider, there's no other real Outsider this game, so the expected Outsider count
  // drops by 1 with no compensation elsewhere. If it displays as Townsfolk, nothing changes —
  // Townsfolk is a large enough pool that one extra apparent Townsfolk isn't tracked here.
  const marionettePlayer = players.find(p => p.isTheMarionette);
  const marionetteFakeTeam = marionettePlayer
    ? allRoles.find(r => r.id === marionettePlayer.roleId)?.team
    : undefined;
  const marionetteOutsiderDelta = marionetteFakeTeam === 'outsider' ? -1 : 0;
  
  let expectedDemon = base.demon;
  let expectedMinion = base.minion;
  
  const modifications: string[] = [];
  
  if (hasLegion) {
    const L = Math.round(baseCount * 0.6);
    expectedDemon = L;
    expectedMinion = 0;
    modifications.push(`Legion active (${L} Demons, 0 Minions/Outsiders)`);
  } else if (hasRiot) {
    const D = 1 + base.minion;
    expectedDemon = D;
    expectedMinion = 0;
    modifications.push(`Riot active (${D} Demons, 0 Minions/Outsiders)`);
  } else if (hasAtheist) {
    expectedDemon = 0;
    expectedMinion = 0;
    modifications.push("Atheist (No Evil players)");
    if (hasBaron) modifications.push("Baron (+2 Outsiders)");
    if (hasFangGu) modifications.push("Fang Gu (+1 Outsider)");
    if (hasVigormortis) modifications.push("Vigormortis (-1 Outsider)");
    if (hasBalloonist) modifications.push("Balloonist (0 or +1 Outsider)");
    if (hasHuntsman) modifications.push("Huntsman (0 or +1 Outsider)");
    if (hasHermit) modifications.push("Hermit (0 or -1 Outsider)");
  } else {
    if (hasLilMonsta) {
      expectedMinion += 1;
      expectedDemon -= 1;
      modifications.push("Lil' Monsta (+1 Minion, -1 Demon)");
    }
    if (hasLordOfTyphon) {
      expectedMinion += 1;
      modifications.push("Lord of Typhon (+1 Minion)");
    }
    if (hasSummoner) {
      expectedDemon -= 1;
      modifications.push("Summoner (-1 Demon)");
    }
    if (hasBaron) {
      modifications.push("Baron (+2 Outsiders)");
    }
    if (hasFangGu) {
      modifications.push("Fang Gu (+1 Outsider)");
    }
    if (hasVigormortis) {
      modifications.push("Vigormortis (-1 Outsider)");
    }
    if (hasBalloonist) {
      modifications.push("Balloonist (0 or +1 Outsider)");
    }
    if (hasHuntsman) {
      modifications.push("Huntsman (0 or +1 Outsider)");
    }
    if (hasHermit) {
      modifications.push("Hermit (0 or -1 Outsider)");
    }
    if (hasGodfather) {
      modifications.push("Godfather (+1 or -1 Outsider)");
    }
    if (marionetteFakeTeam === 'outsider') {
      modifications.push("Marionette displays as Outsider (-1 Outsider)");
    }
  }

  if (hasKazali) {
    expectedMinion = 0;
    modifications.push("Kazali (0 Minions)");
    modifications.push("Kazali (Any Outsider count)");
  }
  if (hasXaan) {
    modifications.push("Xaan (Any Outsider count)");
  }
  
  expectedDemon = Math.max(0, expectedDemon);

  const gfMods = (hasGodfather && !hasLegion && !hasRiot) ? [-1, 1] : [0];
  const balMods = (hasBalloonist && !hasLegion && !hasRiot) ? [0, 1] : [0];
  const huntMods = (hasHuntsman && !hasLegion && !hasRiot) ? [0, 1] : [0];
  const hermMods = (hasHermit && !hasLegion && !hasRiot) ? [-1, 0] : [0];
  const fixedOutsiderDelta = (hasLegion || hasRiot) ? 0 : ((hasBaron ? 2 : 0) + (hasFangGu ? 1 : 0) - (hasVigormortis ? 1 : 0) + marionetteOutsiderDelta);
  // Townsfolk's expected count is derived from Outsider's below (it's "whatever's left"), but
  // the Marionette's -1 Outsider shift is NOT supposed to bump Townsfolk up to compensate — so
  // this mirrors fixedOutsiderDelta minus the Marionette term specifically for that derivation.
  const fixedOutsiderDeltaForTownsfolk = fixedOutsiderDelta - marionetteOutsiderDelta;

  const possibleOutsiderCounts = new Set<number>();
  if (hasLegion || hasRiot) {
    possibleOutsiderCounts.add(0);
  } else if (hasKazali || hasXaan) {
    const maxOutsiders = Math.max(0, baseCount - expectedDemon - expectedMinion);
    for (let i = 0; i <= maxOutsiders; i++) {
      possibleOutsiderCounts.add(i);
    }
  } else {
    for (const gf of gfMods) {
      for (const bal of balMods) {
        for (const hunt of huntMods) {
          for (const herm of hermMods) {
            const total = base.outsider + fixedOutsiderDelta + gf + bal + hunt + herm;
            possibleOutsiderCounts.add(Math.max(0, total));
          }
        }
      }
    }
  }

  const validOutsiders = Array.from(possibleOutsiderCounts).sort((a, b) => a - b);
  const validTownsfolk = validOutsiders.map(out => Math.max(0, baseCount - expectedDemon - expectedMinion - out + marionetteOutsiderDelta));
  const uniqueTownsfolk = Array.from(new Set(validTownsfolk)).sort((a, b) => a - b);

  const isOutsiderValid = validOutsiders.includes(counts.outsider);
  const isTownsfolkValid = isOutsiderValid && counts.townsfolk === baseCount - expectedDemon - expectedMinion - counts.outsider + marionetteOutsiderDelta;
  const isDemonValid = counts.demon === expectedDemon;
  const isMinionValid = counts.minion === expectedMinion;

  const expectedOutsiderLabel = (hasKazali || hasXaan) ? 'any' : validOutsiders.join(' or ');
  const expectedTownsfolkLabel = (hasKazali || hasXaan) ? 'any' : uniqueTownsfolk.join(' or ');

  // For backward compatibility / display fallback
  const expectedOutsider = Math.max(0, base.outsider + fixedOutsiderDelta);
  const expectedTownsfolk = baseCount - expectedDemon - expectedMinion - (base.outsider + fixedOutsiderDeltaForTownsfolk);
  
  // Jinx checks
  const hasChoirboy = assignedRoles.some(r => r.id === 'choirboy');
  const hasKing = assignedRoles.some(r => r.id === 'king');
  const hasDamsel = assignedRoles.some(r => r.id === 'damsel');
  
  const warnings: string[] = [];
  const failures: string[] = [];
  if (hasChoirboy && !hasKing) failures.push("Choirboy in play, but no King assigned.");
  if (hasHuntsman && !hasDamsel) failures.push("Huntsman in play, but no Damsel assigned.");
  if (hasAlchemist) warnings.push("Alchemist in play — ability may affect setup.");

  const customRolesAssigned = assignedRoles.filter(r => !OFFICIAL_ROLE_IDS.has(r.id));
  if (customRolesAssigned.length > 0) {
    const uniqueNames = [...new Set(customRolesAssigned.map(r => r.name))];
    warnings.push(`Custom: ${uniqueNames.join(', ')} — adjust setup manually.`);
  }

  // Drunk/Marionette/Lunatic are always supposed to display as a different, fake character —
  // if a player's shown icon is literally one of these three, their true identity is exposed.
  const revealingMasqueradeIds = new Set(['drunk', 'marionette', 'lunatic']);
  for (const p of players) {
    if (p.roleId && revealingMasqueradeIds.has(p.roleId)) {
      const role = allRoles.find(r => r.id === p.roleId);
      failures.push(`${p.name} is displayed as ${role?.name ?? p.roleId} itself, revealing their true identity.`);
    }
  }

  const roleIdFreq: Record<string, number> = {};
  for (const p of players) {
    if (!p.roleId || p.isTheLunatic || p.isTheDrunk || p.isTheMarionette) continue;
    roleIdFreq[p.roleId] = (roleIdFreq[p.roleId] || 0) + 1;
  }
  for (const [roleId, count] of Object.entries(roleIdFreq)) {
    if (count > 1 && roleId !== 'legion') {
      const role = allRoles.find(r => r.id === roleId);
      failures.push(`${role?.name ?? roleId} is assigned to ${count} players.`);
    }
  }

  // Marionette check: each Marionette must neighbor at least one Demon
  const basePlayersInOrder = players.filter(p => {
    if (!p.roleId) return true;
    const r = allRoles.find(role => role.id === p.roleId);
    return r?.team !== 'traveler';
  });
  const marionettePlayers = basePlayersInOrder.filter(p => p.isTheMarionette);
  const demonPlayers = basePlayersInOrder.filter(p => {
    if (!p.roleId || p.isTheMarionette || p.isTheDrunk || p.isTheLunatic) return false;
    const r = allRoles.find(role => role.id === p.roleId);
    return r?.team === 'demon';
  });

  if (marionettePlayers.length > 0) {
    if (demonPlayers.length === 0) {
      failures.push("A Marionette is in play, but there is no Demon assigned.");
    } else {
      const K = basePlayersInOrder.length;
      for (const mp of marionettePlayers) {
        const m_idx = basePlayersInOrder.findIndex(p => p.id === mp.id);
        const isNeighboringDemon = demonPlayers.some(dp => {
          const d_idx = basePlayersInOrder.findIndex(p => p.id === dp.id);
          return (d_idx - 1 + K) % K === m_idx || (d_idx + 1) % K === m_idx;
        });
        if (!isNeighboringDemon) {
          failures.push(`Marionette (${mp.name}) must be sitting next to the Demon.`);
        }
      }
    }
  }
  // Check for characters not on the script
  const missingRoleIds = new Set<string>();
  for (const p of players) {
    if (p.roleId) {
      if (!allRoles.some(r => r.id === p.roleId)) {
        missingRoleIds.add(p.roleId);
      }
      const trueRoleId = p.isTheMarionette ? 'marionette' :
                         p.isTheDrunk ? 'drunk' :
                         p.isTheLunatic ? 'lunatic' :
                         null;
      if (trueRoleId && !allRoles.some(r => r.id === trueRoleId)) {
        missingRoleIds.add(trueRoleId);
      }
    }
  }
  if (missingRoleIds.size === 1) {
    failures.push("1 character is not on the script.");
  } else if (missingRoleIds.size > 1) {
    failures.push(`${missingRoleIds.size} characters are not on the script.`);
  }

  
  const jinxWarnings = [...warnings, ...failures];
  const isValid = isDemonValid && isMinionValid && isOutsiderValid && isTownsfolkValid && jinxWarnings.length === 0;
  
  return {
    base,
    counts,
    expected: {
      townsfolk: expectedTownsfolk,
      outsider: expectedOutsider,
      minion: expectedMinion,
      demon: expectedDemon,
      traveler: base.traveler
    },
    hasGodfather,
    modifications,
    isDemonValid,
    isMinionValid,
    isOutsiderValid,
    isTownsfolkValid,
    jinxWarnings,
    warnings,
    failures,
    isValid,
    expectedOutsiderLabel,
    expectedTownsfolkLabel
  };
}
