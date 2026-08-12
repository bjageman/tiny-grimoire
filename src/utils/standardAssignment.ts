import type { Player, Role } from '../types';
import { DISTRIBUTION } from '../constants';
import { ALL_ROLES } from './roleData';
import {
  shuffle,
  fillToCount,
  getMasqueradeFakeRole,
  isTravelerRole,
  splitTravelers,
  applyChoirboyKing,
  applyHuntsmanDamsel,
  applyVillageIdiotCount,
  assignSimpleRolesToPlayers,
  placeRolesAroundCircle,
} from './standardAssignmentHelpers';

export function performStandardAssignment(
  players: Player[],
  currentScriptRoles: Role[],
  selectionRoles: Role[],
  fallbackScriptRoles?: Role[],
  sentinelOutsiderDelta: number = 0,
  villageIdiotCount: number = 1
): Player[] | null {
  const N = players.length;
  if (N < 5) return null;

  const manualTravelerIds = new Set(
    players.filter(p => isTravelerRole(p.roleId, selectionRoles)).map(p => p.id)
  );

  const neededTravelers = N > 15 ? N - 15 : 0;
  let travelerCount = Math.max(manualTravelerIds.size, neededTravelers);
  const maxTravelers = N - 5;
  if (travelerCount > maxTravelers) {
    travelerCount = maxTravelers;
  }

  const baseCount = N - travelerCount;
  const base = DISTRIBUTION[baseCount] || { townsfolk: 0, outsider: 0, minion: 0, demon: 0 };

  const fallbackPool = fallbackScriptRoles || [];
  const fallbackTfs = fallbackPool.filter(r => r.team === 'townsfolk');
  const fallbackOuts = fallbackPool.filter(r => r.team === 'outsider');
  const fallbackMins = fallbackPool.filter(r => r.team === 'minion');
  const fallbackDems = fallbackPool.filter(r => r.team === 'demon');

  const masterTfs = (ALL_ROLES as Role[]).filter(r => r.team === 'townsfolk');
  const masterOuts = (ALL_ROLES as Role[]).filter(r => r.team === 'outsider');
  const masterMins = (ALL_ROLES as Role[]).filter(r => r.team === 'minion');
  const masterDems = (ALL_ROLES as Role[]).filter(r => r.team === 'demon');

  let tfs = currentScriptRoles.filter(r => r.team === 'townsfolk');
  const outs = currentScriptRoles.filter(r => r.team === 'outsider');
  const mins = currentScriptRoles.filter(r => r.team === 'minion');
  const dems = currentScriptRoles.filter(r => r.team === 'demon');

  const hasAtheistRole = tfs.some(r => r.id === 'atheist');
  let isAtheistActive = false;
  if (hasAtheistRole) {
    const bagCandidates = [...dems, tfs.find(r => r.id === 'atheist')!];
    isAtheistActive = shuffle(bagCandidates)[0].id === 'atheist';
  }

  if (isAtheistActive) {
    const O = base.outsider;
    const atheistRole = tfs.find(r => r.id === 'atheist')!;
    let selectedOutsiders = shuffle(outs).slice(0, O);
    let selectedTownsfolk = [atheistRole, ...shuffle(tfs.filter(t => t.id !== 'atheist')).slice(0, baseCount - O - 1)];

    selectedTownsfolk = applyChoirboyKing(tfs, selectedTownsfolk, ['atheist']);
    ({ tfs: selectedTownsfolk, outs: selectedOutsiders } = applyHuntsmanDamsel(outs, selectedTownsfolk, selectedOutsiders, ['atheist']));
    selectedTownsfolk = applyVillageIdiotCount(selectedTownsfolk, villageIdiotCount, ['atheist', 'choirboy', 'king', 'huntsman']);

    const finalRolesList = shuffle([...selectedOutsiders, ...selectedTownsfolk]);
    fillToCount(finalRolesList, baseCount, [tfs, fallbackTfs, masterTfs], tfs[0], outs[0]);

    const { travelerIds, basePlayers } = splitTravelers(players, travelerCount, manualTravelerIds);
    return assignSimpleRolesToPlayers(players, shuffle(finalRolesList), travelerIds, basePlayers, selectionRoles);
  }

  if (hasAtheistRole) {
    tfs = tfs.filter(t => t.id !== 'atheist');
  }

  const tempDemons = shuffle(dems);
  const chosenDemonAtTop = tempDemons[0];
  const legionRole = dems.find(d => d.id === 'legion');
  const hasLegion = !!(legionRole && chosenDemonAtTop && chosenDemonAtTop.id === 'legion');

  if (hasLegion && legionRole) {
    const L = Math.round(baseCount * 0.6);
    const finalRolesList = shuffle([...Array(L).fill(legionRole), ...shuffle(tfs).slice(0, baseCount - L)]);
    fillToCount(finalRolesList, baseCount, [tfs, fallbackTfs, masterTfs], tfs[0], dems[0]);
    const { travelerIds, basePlayers } = splitTravelers(players, travelerCount, manualTravelerIds);
    return assignSimpleRolesToPlayers(players, shuffle(finalRolesList), travelerIds, basePlayers, selectionRoles, 'legion');
  }


  // Normal / non-Legion setup
  const nonLegionDemons = dems.filter(d => d.id !== 'legion');
  const chosenDemon = shuffle(nonLegionDemons)[0];

  const hasLordOfTyphon = chosenDemon && chosenDemon.id === 'lordoftyphon';
  const hasKazali = chosenDemon && chosenDemon.id === 'kazali';
  const targetMinionsCount = hasKazali ? 0 : (base.minion + (hasLordOfTyphon ? 1 : 0));

  let selectedMinions = shuffle(mins).slice(0, targetMinionsCount);
  const hasSummoner = selectedMinions.some(m => m.id === 'summoner');

  const targetDemonsCount = hasSummoner ? Math.max(0, base.demon - 1) : base.demon;
  const selectedDemons = chosenDemon && targetDemonsCount > 0 ? [chosenDemon] : [];

  const hasLilMonsta = selectedDemons.some(d => d.id === 'lilmonsta');
  if (hasLilMonsta) {
    selectedMinions = shuffle(mins.filter(m => m.id !== 'lilmonsta')).slice(0, base.minion);
  }

  const hasXaan = selectedMinions.some(m => m.id === 'xaan');
  const bypassAdjustments = hasKazali || hasXaan;

  // Sentinel (Fabled): a fixed Storyteller-chosen ±1 Outsider shift; ignored under Kazali/Xaan.
  const baseOutsiderModifier = (selectedMinions.some(m => m.id === 'baron') ? 2 : 0) +
                               (selectedDemons.some(d => d.id === 'fanggu') ? 1 : 0) -
                               (selectedDemons.some(d => d.id === 'vigormortis') ? 1 : 0) +
                               (bypassAdjustments ? 0 : sentinelOutsiderDelta);

  const gfRange = (!bypassAdjustments && selectedMinions.some(m => m.id === 'godfather')) ? [-1, 1] : [0];
  const balRange = (!bypassAdjustments && tfs.some(t => t.id === 'balloonist')) ? [0, 1] : [0];
  const hermRange = (!bypassAdjustments && outs.some(o => o.id === 'hermit')) ? [-1, 0] : [0];

  const tfDelta = (selectedMinions.some(m => m.id === 'marionette') ? 1 : 0) + (outs.some(o => o.id === 'drunk') ? 1 : 0);

  interface Combination {
    gf: number;
    bal: number;
    herm: number;
  }

  const validCombos: Combination[] = [];

  for (const gf of gfRange) {
    for (const bal of balRange) {
      for (const herm of hermRange) {
        const tempOuts = Math.max(0, base.outsider + baseOutsiderModifier + gf + bal + herm);
        let tempTfs = baseCount - selectedDemons.length - selectedMinions.length - tempOuts;
        if (tempTfs < 0) tempTfs = 0;

        const fitsOutsiders = tempOuts <= outs.length;
        const fitsTownsfolk = (tempTfs + tfDelta) <= tfs.length;

        if (fitsOutsiders && fitsTownsfolk) {
          validCombos.push({ gf, bal, herm });
        }
      }
    }
  }

  let chosenCombo: Combination;
  if (validCombos.length > 0) {
    chosenCombo = validCombos[Math.floor(Math.random() * validCombos.length)];
  } else {
    chosenCombo = {
      gf: gfRange[Math.floor(Math.random() * gfRange.length)],
      bal: balRange[Math.floor(Math.random() * balRange.length)],
      herm: hermRange[Math.floor(Math.random() * hermRange.length)]
    };
  }

  const outsiderModifier = baseOutsiderModifier + chosenCombo.gf;
  let targetOutsiders = Math.max(0, base.outsider + outsiderModifier);

  if (bypassAdjustments) {
    const maxOutsiders = baseCount - selectedDemons.length - selectedMinions.length;
    targetOutsiders = Math.floor(Math.random() * (maxOutsiders + 1));
  }
  let targetTownsfolk = baseCount - selectedDemons.length - selectedMinions.length - targetOutsiders;
  if (targetTownsfolk < 0) {
    targetTownsfolk = 0;
    targetOutsiders = baseCount - selectedDemons.length - selectedMinions.length;
  }

  const hasMarionette = !bypassAdjustments && selectedMinions.some(m => m.id === 'marionette');

  let selectedOutsiders = shuffle(outs).slice(0, targetOutsiders);
  let selectedTownsfolk = shuffle(tfs).slice(0, targetTownsfolk);

  // 1. Balloonist's +0/+1 Outsider only applies if it was actually dealt (balRange is gated on the pool), so re-check the draw.
  const balloonistInPlay = selectedTownsfolk.some(t => t.id === 'balloonist');
  if (!bypassAdjustments && chosenCombo.bal === 1 && balloonistInPlay && outs.length > selectedOutsiders.length) {
    const remainingOuts = outs.filter(o => !selectedOutsiders.some(so => so.id === o.id));
    if (remainingOuts.length > 0) {
      const newOut = remainingOuts[Math.floor(Math.random() * remainingOuts.length)];
      selectedOutsiders.push(newOut);
      const balloonistIdx = selectedTownsfolk.findIndex(t => t.id === 'balloonist');
      const nonBalloonistTfs = selectedTownsfolk.filter((_, idx) => idx !== balloonistIdx);
      if (nonBalloonistTfs.length > 0) {
        const removedTf = nonBalloonistTfs[Math.floor(Math.random() * nonBalloonistTfs.length)];
        selectedTownsfolk = selectedTownsfolk.filter(t => t.id !== removedTf.id);
      }
    }
  }

  // 2. Hermit: same pool-vs-draw problem as Balloonist; only fires when another Outsider can absorb the -1 (removing the Hermit would invalidate it).
  const hermitInPlay = selectedOutsiders.some(o => o.id === 'hermit');
  if (!bypassAdjustments && chosenCombo.herm === -1 && hermitInPlay) {
    const otherOutsiders = selectedOutsiders.filter(o => o.id !== 'hermit');
    if (otherOutsiders.length > 0) {
      const outToRemove = otherOutsiders[Math.floor(Math.random() * otherOutsiders.length)];
      selectedOutsiders = selectedOutsiders.filter(o => o.id !== outToRemove.id);
      const remainingTfs = tfs.filter(t => !selectedTownsfolk.some(st => st.id === t.id));
      if (remainingTfs.length > 0) {
        selectedTownsfolk.push(remainingTfs[Math.floor(Math.random() * remainingTfs.length)]);
      }
    }
  }

  // 3. Huntsman & Damsel adjustment
  ({ tfs: selectedTownsfolk, outs: selectedOutsiders } = applyHuntsmanDamsel(outs, selectedTownsfolk, selectedOutsiders, ['choirboy', 'king', 'balloonist']));

  // 4. Choirboy & King adjustment
  selectedTownsfolk = applyChoirboyKing(tfs, selectedTownsfolk, ['huntsman', 'balloonist']);

  // 5. Village Idiot: 1-3 copies, each extra consuming another Townsfolk slot.
  selectedTownsfolk = applyVillageIdiotCount(selectedTownsfolk, villageIdiotCount, ['choirboy', 'king', 'huntsman', 'balloonist']);

  const finalRolesList = shuffle([
    ...selectedDemons,
    ...selectedMinions,
    ...selectedOutsiders,
    ...selectedTownsfolk
  ]);

  fillToCount(finalRolesList, baseCount, [tfs, fallbackTfs, masterTfs], tfs[0], outs[0], mins[0], dems[0]);

  const roleIdsInPlay = new Set(finalRolesList.map(r => r.id));

  // Marionette's displayed identity: a non-colliding not-in-play Townsfolk (or Outsider only if no Townsfolk exist) from the script's own pool, since its target was already reduced by 1; falls back to the official list only if exhausted.
  const marionetteFakeTeam: 'townsfolk' | 'outsider' | null = !hasMarionette
    ? null
    : tfs.length > 0 ? 'townsfolk' : (outs.length > 0 ? 'outsider' : null);

  let marionetteFakeRole: Role | null = null;
  if (marionetteFakeTeam) {
    const excludeIds = new Set([...roleIdsInPlay, 'drunk', 'lunatic']);
    const scriptPool = marionetteFakeTeam === 'outsider' ? outs : tfs;
    const fallbackPool = marionetteFakeTeam === 'outsider' ? fallbackOuts : fallbackTfs;
    const masterPool = marionetteFakeTeam === 'outsider' ? masterOuts : masterTfs;

    marionetteFakeRole = getMasqueradeFakeRole(
      scriptPool,
      fallbackPool,
      masterPool,
      excludeIds,
      r => r.id !== 'drunk' && r.id !== 'lunatic'
    );
  }

  // Drunk's fake Townsfolk identity: script townsfolk first (non-colliding not-in-play if possible), then in-play, then master list.
  const hasDrunkInPlay = finalRolesList.some(r => r.id === 'drunk');
  let drunkFakeRole: Role | null = null;
  if (hasDrunkInPlay) {
    const excludeIds = new Set([...roleIdsInPlay]);
    if (marionetteFakeRole) excludeIds.add(marionetteFakeRole.id);

    drunkFakeRole = getMasqueradeFakeRole(
      tfs,
      fallbackTfs,
      masterTfs,
      excludeIds,
      r => r.id !== marionetteFakeRole?.id
    );
  }

  // Lil' Monsta displays as a Minion; draw its fake identity from script minions first, then master list.
  const hasLilMonstaInPlay = finalRolesList.some(r => r.id === 'lilmonsta');
  let lilMonstaFakeRole: Role | null = null;
  if (hasLilMonstaInPlay) {
    const excludeIds = new Set([...roleIdsInPlay]);

    lilMonstaFakeRole = getMasqueradeFakeRole(
      mins,
      fallbackMins,
      masterMins,
      excludeIds
    );
  }

  // Lunatic displays as the Demon; draw from script demons first, excluding the real Demon if possible.
  const hasLunaticInPlay = finalRolesList.some(r => r.id === 'lunatic');
  let lunaticFakeRole: Role | null = null;
  if (hasLunaticInPlay) {
    const excludeIds = new Set([...roleIdsInPlay]);

    lunaticFakeRole = getMasqueradeFakeRole(
      dems,
      fallbackDems,
      masterDems,
      excludeIds
    );
  }

  const { travelerIds, basePlayers } = splitTravelers(players, travelerCount, manualTravelerIds);
  const basePlayerIndex = new Map(basePlayers.map((p, i) => [p.id, i]));

  const assignedRoles = placeRolesAroundCircle(finalRolesList, basePlayers.length);

  const travelerRoles = shuffle(
    selectionRoles.filter(r => r.team === 'traveler' || (r.team as string) === 'traveller')
  );
  if (travelerRoles.length === 0) {
    travelerRoles.push({ id: 'beggar', name: 'Beggar', team: 'traveler' } as Role);
  }

  let travelerIdx = 0;
  const assignedPlayers = players.map(p => {
    if (travelerIds.has(p.id)) {
      if (manualTravelerIds.has(p.id)) {
        return { ...p, isTheDrunk: false, isTheMarionette: false, isTheLunatic: false, isTheLilMonsta: false };
      }
      const assignedTraveler = travelerRoles[travelerIdx % travelerRoles.length];
      travelerIdx++;
      return { ...p, roleId: assignedTraveler.id, isTheDrunk: false, isTheMarionette: false, isTheLunatic: false, isTheLilMonsta: false };
    }

    const role = assignedRoles[basePlayerIndex.get(p.id) ?? 0];
    let roleId = role?.id;
    let isTheDrunk = false;
    let isTheMarionette = false;
    let isTheLunatic = false;
    let isTheLilMonsta = false;

    if (roleId === 'drunk') {
      isTheDrunk = true;
      const fakeTF = drunkFakeRole
        ?? tfs.filter(t => !roleIdsInPlay.has(t.id))[0]
        ?? tfs[Math.floor(Math.random() * tfs.length)];
      roleId = fakeTF?.id ?? roleId;
    } else if (roleId === 'marionette') {
      isTheMarionette = true;
      const matchedGood = marionetteFakeRole
        ?? [...tfs, ...outs].filter(g => !roleIdsInPlay.has(g.id))[0]
        ?? tfs[0];
      roleId = matchedGood.id;
    } else if (roleId === 'lunatic') {
      isTheLunatic = true;
      const matchedDemon = lunaticFakeRole
        ?? dems.filter(d => !roleIdsInPlay.has(d.id))[0]
        ?? dems[Math.floor(Math.random() * dems.length)]
        ?? dems[0];
      roleId = matchedDemon.id;
    } else if (roleId === 'lilmonsta') {
      isTheLilMonsta = true;
      const matchedMinion = lilMonstaFakeRole
        ?? mins.filter(m => !roleIdsInPlay.has(m.id))[0]
        ?? mins[0];
      roleId = matchedMinion.id;
    }

    return {
      ...p,
      roleId,
      isTheDrunk,
      isTheMarionette,
      isTheLunatic,
      isTheLilMonsta,
      isEvil: (roleId === 'legion' || isTheMarionette) ? true : undefined,
    };
  });

  const travelerRoleIds = new Set(selectionRoles.filter(r => r.team === 'traveler' || (r.team as string) === 'traveller').map(r => r.id));
  const tfIds = new Set(tfs.map(r => r.id));
  const outIds = new Set(outs.map(r => r.id));

  const hasHuntsmanInPlay = assignedPlayers.some(p => p.roleId === 'huntsman');
  const hasDamselInPlay = assignedPlayers.some(p => p.roleId === 'damsel');

  if (hasHuntsmanInPlay && !hasDamselInPlay) {
    const eligiblePlayers = assignedPlayers.filter(p =>
      p.roleId &&
      !travelerRoleIds.has(p.roleId) &&
      !p.isTheMarionette &&
      !p.isTheLunatic &&
      p.roleId !== 'huntsman' &&
      (tfIds.has(p.roleId) || outIds.has(p.roleId))
    );
    if (eligiblePlayers.length > 0) {
      const chosenForDamsel = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
      chosenForDamsel.roleId = 'damsel';
      chosenForDamsel.isTheDrunk = false;
    }
  }

  const hasAtheist = assignedPlayers.some(p => p.roleId === 'atheist' && !p.isTheDrunk && !p.isTheMarionette && !p.isTheLunatic);
  if (hasAtheist) {
    assignedPlayers.forEach(p => { p.isEvil = undefined; });
  } else {
    const hasBountyHunter = assignedPlayers.some(p => p.roleId === 'bountyhunter' && !p.isTheDrunk && !p.isTheMarionette && !p.isTheLunatic);
    if (hasBountyHunter) {
      const townsfolkPlayers = assignedPlayers.filter(p =>
        p.roleId &&
        !travelerRoleIds.has(p.roleId) &&
        tfIds.has(p.roleId) &&
        !p.isTheMarionette
      );
      if (townsfolkPlayers.length > 0) {
        const chosen = townsfolkPlayers[Math.floor(Math.random() * townsfolkPlayers.length)];
        chosen.isEvil = true;
      }
    }
  }

  return assignedPlayers;
}
