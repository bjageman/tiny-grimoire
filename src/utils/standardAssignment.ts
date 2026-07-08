import type { Player, Role } from '../types';
import { DISTRIBUTION } from '../constants';
import masterRoles from '../official_roles.json';

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

function fillToCount(list: Role[], count: number, pools: Role[][], ...fallbacks: (Role | undefined)[]): void {
  while (list.length < count) {
    const inPlay = new Set(list.map(r => r.id));
    let unused: Role | undefined;
    for (const pool of pools) {
      unused = pool.find(r => !inPlay.has(r.id));
      if (unused) break;
    }
    if (unused) {
      list.push(unused);
    } else {
      const fallback = fallbacks.find(Boolean);
      if (fallback) list.push(fallback); else break;
    }
  }
}

function findUnusedRole(pools: Role[][], excludeIds: Set<string>): Role | null {
  for (const pool of pools) {
    const unused = pool.find(r => !excludeIds.has(r.id));
    if (unused) return unused;
  }
  return null;
}

function getMasqueradeFakeRole(
  activePool: Role[],
  fallbackPool: Role[],
  masterPool: Role[],
  excludeIds: Set<string>,
  lastResortFilter?: (r: Role) => boolean
): Role | null {
  // 1. Try unused in active pool or fallback pool
  const unused = findUnusedRole([activePool, fallbackPool], excludeIds);
  if (unused) return unused;

  // 2. Try any role in active pool (even if in play)
  const activeFallback = lastResortFilter ? activePool.filter(lastResortFilter) : activePool;
  if (activeFallback.length > 0) {
    return activeFallback[Math.floor(Math.random() * activeFallback.length)];
  }

  // 3. Try any role in fallback pool (even if in play)
  const fallbackFallback = lastResortFilter ? fallbackPool.filter(lastResortFilter) : fallbackPool;
  if (fallbackFallback.length > 0) {
    return fallbackFallback[Math.floor(Math.random() * fallbackFallback.length)];
  }

  // 4. Try unused in master pool (outside script)
  const unusedMaster = findUnusedRole([masterPool], excludeIds);
  if (unusedMaster) return unusedMaster;

  // 5. Absolute last resort: first master role
  return masterPool[0] || null;
}

function isTravelerRole(roleId: string | undefined, selectionRoles: Role[]): boolean {
  if (!roleId) return false;
  const role = selectionRoles.find(r => r.id === roleId) || (masterRoles as Role[]).find(r => r.id === roleId);
  return role?.team === 'traveler' || (role?.team as string) === 'traveller';
}

function splitTravelers(
  players: Player[],
  travelerCount: number,
  manualTravelerIds: Set<string>
): { travelerIds: Set<string>; basePlayers: Player[] } {
  const travelerIds = new Set<string>();

  for (const id of manualTravelerIds) {
    if (travelerIds.size < travelerCount) {
      travelerIds.add(id);
    }
  }

  if (travelerIds.size < travelerCount) {
    const nonManualPlayers = players.filter(p => !manualTravelerIds.has(p.id));
    const shuffled = shuffle(nonManualPlayers);
    for (const p of shuffled) {
      if (travelerIds.size >= travelerCount) break;
      travelerIds.add(p.id);
    }
  }

  return { travelerIds, basePlayers: players.filter(p => !travelerIds.has(p.id)) };
}

function applyChoirboyKing(tfs: Role[], selectedTownsfolk: Role[], exclude: string[]): Role[] {
  if (!selectedTownsfolk.some(t => t.id === 'choirboy') || selectedTownsfolk.some(t => t.id === 'king')) return selectedTownsfolk;
  const kingRole = tfs.find(t => t.id === 'king');
  if (!kingRole) return selectedTownsfolk;
  const excluded = new Set(['choirboy', ...exclude]);
  const swappable = selectedTownsfolk.filter(t => !excluded.has(t.id));
  if (swappable.length === 0) return selectedTownsfolk;
  const remove = swappable[Math.floor(Math.random() * swappable.length)];
  return [...selectedTownsfolk.filter(t => t.id !== remove.id), kingRole];
}

function applyHuntsmanDamsel(
  outs: Role[],
  selectedTownsfolk: Role[],
  selectedOutsiders: Role[],
  tfExclude: string[]
): { tfs: Role[]; outs: Role[] } {
  if (!selectedTownsfolk.some(t => t.id === 'huntsman') || selectedOutsiders.some(o => o.id === 'damsel')) {
    return { tfs: selectedTownsfolk, outs: selectedOutsiders };
  }
  const damselRole = outs.find(o => o.id === 'damsel');
  if (!damselRole) return { tfs: selectedTownsfolk, outs: selectedOutsiders };

  const otherOutsiders = selectedOutsiders.filter(o => o.id !== 'damsel');
  if (otherOutsiders.length > 0) {
    const remove = otherOutsiders[Math.floor(Math.random() * otherOutsiders.length)];
    return { tfs: selectedTownsfolk, outs: [...selectedOutsiders.filter(o => o.id !== remove.id), damselRole] };
  }

  const excluded = new Set(['huntsman', ...tfExclude]);
  const swappable = selectedTownsfolk.filter(t => !excluded.has(t.id));
  const newTfs = swappable.length > 0
    ? selectedTownsfolk.filter(t => t.id !== swappable[Math.floor(Math.random() * swappable.length)].id)
    : selectedTownsfolk;
  return { tfs: newTfs, outs: [...selectedOutsiders, damselRole] };
}

function assignSimpleRolesToPlayers(
  players: Player[],
  assignedRoles: Role[],
  travelerIds: Set<string>,
  basePlayers: Player[],
  selectionRoles: Role[],
  isEvilId?: string
): Player[] {
  const basePlayerIndex = new Map(basePlayers.map((p, i) => [p.id, i]));
  const travelerRoles = shuffle(
    selectionRoles.filter(r => r.team === 'traveler' || (r.team as string) === 'traveller')
  );
  if (travelerRoles.length === 0) {
    travelerRoles.push({ id: 'beggar', name: 'Beggar', team: 'traveler' } as Role);
  }

  let travelerIdx = 0;
  return players.map(p => {
    if (travelerIds.has(p.id)) {
      if (isTravelerRole(p.roleId, selectionRoles)) {
        return { ...p, isTheDrunk: false, isTheMarionette: false, isTheLunatic: false, isTheLilMonsta: false };
      }
      const assignedTraveler = travelerRoles[travelerIdx % travelerRoles.length];
      travelerIdx++;
      return { ...p, roleId: assignedTraveler.id, isTheDrunk: false, isTheMarionette: false, isTheLunatic: false, isTheLilMonsta: false };
    }
    const roleId = assignedRoles[basePlayerIndex.get(p.id) ?? 0]?.id;
    return {
      ...p,
      roleId,
      isTheDrunk: false,
      isTheMarionette: false,
      isTheLunatic: false,
      isTheLilMonsta: false,
      isEvil: (isEvilId && roleId === isEvilId) ? true : undefined,
    };
  });
}

export function performStandardAssignment(
  players: Player[],
  currentScriptRoles: Role[],
  selectionRoles: Role[],
  fallbackScriptRoles?: Role[]
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

  const masterTfs = (masterRoles as Role[]).filter(r => r.team === 'townsfolk');
  const masterOuts = (masterRoles as Role[]).filter(r => r.team === 'outsider');
  const masterMins = (masterRoles as Role[]).filter(r => r.team === 'minion');
  const masterDems = (masterRoles as Role[]).filter(r => r.team === 'demon');

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

  // Riot's "Minions become Riot" transformation happens on day 3 during play, not at setup
  // ([setup: false] on the character, unlike Legion's setup-time "[Most players are Legion]") —
  // so at initial assignment it's just a normal single Demon, no distribution changes.

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

  const baseOutsiderModifier = (selectedMinions.some(m => m.id === 'baron') ? 2 : 0) +
                               (selectedDemons.some(d => d.id === 'fanggu') ? 1 : 0) -
                               (selectedDemons.some(d => d.id === 'vigormortis') ? 1 : 0);

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

  // 1. Balloonist adjustment
  if (!bypassAdjustments && chosenCombo.bal === 1 && outs.length > selectedOutsiders.length) {
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

  // 2. Hermit adjustment
  if (!bypassAdjustments && chosenCombo.herm === -1) {
    const otherOutsiders = selectedOutsiders.filter(o => o.id !== 'hermit');
    if (otherOutsiders.length > 0) {
      const outToRemove = otherOutsiders[Math.floor(Math.random() * otherOutsiders.length)];
      selectedOutsiders = selectedOutsiders.filter(o => o.id !== outToRemove.id);
    } else {
      selectedOutsiders = selectedOutsiders.filter(o => o.id !== 'hermit');
    }
    const remainingTfs = tfs.filter(t => !selectedTownsfolk.some(st => st.id === t.id));
    if (remainingTfs.length > 0) {
      selectedTownsfolk.push(remainingTfs[Math.floor(Math.random() * remainingTfs.length)]);
    }
  }

  // 3. Huntsman & Damsel adjustment
  ({ tfs: selectedTownsfolk, outs: selectedOutsiders } = applyHuntsmanDamsel(outs, selectedTownsfolk, selectedOutsiders, ['choirboy', 'king', 'balloonist']));

  // 4. Choirboy & King adjustment
  selectedTownsfolk = applyChoirboyKing(tfs, selectedTownsfolk, ['huntsman', 'balloonist']);

  const finalRolesList = shuffle([
    ...selectedDemons,
    ...selectedMinions,
    ...selectedOutsiders,
    ...selectedTownsfolk
  ]);

  fillToCount(finalRolesList, baseCount, [tfs, fallbackTfs, masterTfs], tfs[0], outs[0], mins[0], dems[0]);

  const roleIdsInPlay = new Set(finalRolesList.map(r => r.id));

  // Pick the Marionette's displayed identity now that the real role list is fully finalized
  // (including any fillToCount padding). Its team's real target was already reduced by 1 above
  // (with the freed slot handed to the other good team), so a non-colliding, not-actually-
  // in-play character from that same team is guaranteed to exist in the script's own pool —
  // no need to reach outside it, and the real Townsfolk/Outsider/Minion/Demon counts used for
  // balance aren't perturbed. Falls back to the full official role list only in the (should be
  // unreachable) case the script pool is somehow exhausted anyway.
  // Marionette bluffs as a Townsfolk by default. It only bluffs as an Outsider if the script has
  // no Townsfolk at all to draw from — a true last resort that should be unreachable on any real
  // script, since every script has Townsfolk characters.
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

  // Same reasoning for the Drunk's fake Townsfolk identity: draw from this script's
  // townsfolk first, guaranteeing a non-colliding "not-in-play" character if possible.
  // Falls back to in-play script townsfolk, and finally the master list if necessary.
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

  // Lil' Monsta displays as a Minion (it's secretly the Demon), so its fake identity is drawn
  // from script minions first, falling back to master list if script minions are exhausted.
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

  // Lunatic displays as the Demon (it's secretly an Outsider). Exclude the real Demon if possible
  // so the Lunatic can't coincidentally be told it's the exact same Demon that's actually in play.
  // Drawn from script demons first.
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

  const K = basePlayers.length;
  const assignedRoles: Role[] = new Array(K);
  const assignedIndices = new Set<number>();

  const demonRoleIndex = finalRolesList.findIndex(r => r.team === 'demon');
  const marionetteRoleIndex = finalRolesList.findIndex(r => r.id === 'marionette');
  const typhonRoleIndex = finalRolesList.findIndex(r => r.id === 'lordoftyphon');

  if (typhonRoleIndex !== -1) {
    const evilRoles = finalRolesList.filter(r => r.team === 'demon' || r.team === 'minion');
    const goodRoles = finalRolesList.filter(r => r.team !== 'demon' && r.team !== 'minion');
    const E = evilRoles.length;

    const start = Math.floor(Math.random() * K);
    let typhonRelativeIdx = 0;
    if (E >= 3) {
      typhonRelativeIdx = 1 + Math.floor(Math.random() * (E - 2));
    } else if (E === 2) {
      typhonRelativeIdx = Math.floor(Math.random() * 2);
    }

    const minionRoles = evilRoles.filter(r => r.id !== 'lordoftyphon');
    const hasMarionette = minionRoles.some(r => r.id === 'marionette');

    if (hasMarionette && E >= 3) {
      const adjacentOffsets = [-1, 1];
      const chosenOffset = adjacentOffsets[Math.floor(Math.random() * adjacentOffsets.length)];
      const marionetteRelativeIdx = typhonRelativeIdx + chosenOffset;

      const otherMinions = minionRoles.filter(m => m.id !== 'marionette');
      const shuffledOtherMinions = shuffle(otherMinions);

      let otherMinionCount = 0;
      for (let i = 0; i < E; i++) {
        const idx = (start + i) % K;
        if (i === typhonRelativeIdx) {
          assignedRoles[idx] = finalRolesList[typhonRoleIndex];
        } else if (i === marionetteRelativeIdx) {
          assignedRoles[idx] = minionRoles.find(m => m.id === 'marionette')!;
        } else {
          assignedRoles[idx] = shuffledOtherMinions[otherMinionCount++];
        }
        assignedIndices.add(idx);
      }
    } else {
      const shuffledMinions = shuffle(minionRoles);
      let minionCount = 0;
      for (let i = 0; i < E; i++) {
        const idx = (start + i) % K;
        if (i === typhonRelativeIdx) {
          assignedRoles[idx] = finalRolesList[typhonRoleIndex];
        } else {
          assignedRoles[idx] = shuffledMinions[minionCount++];
        }
        assignedIndices.add(idx);
      }
    }

    const shuffledGood = shuffle(goodRoles);
    let goodAssignCount = 0;
    for (let i = 0; i < K; i++) {
      if (!assignedIndices.has(i)) {
        assignedRoles[i] = shuffledGood[goodAssignCount++];
      }
    }
  } else if (demonRoleIndex !== -1 && marionetteRoleIndex !== -1 && K >= 3) {
    const d_idx = Math.floor(Math.random() * K);
    assignedRoles[d_idx] = finalRolesList[demonRoleIndex];
    assignedIndices.add(d_idx);

    const possibleNeighbors = [
      (d_idx - 1 + K) % K,
      (d_idx + 1) % K
    ];
    const m_idx = possibleNeighbors[Math.floor(Math.random() * possibleNeighbors.length)];
    assignedRoles[m_idx] = finalRolesList[marionetteRoleIndex];
    assignedIndices.add(m_idx);

    const remainingRoles = finalRolesList.filter((_, idx) => idx !== demonRoleIndex && idx !== marionetteRoleIndex);
    const shuffledRemainingRoles = shuffle(remainingRoles);

    let remIdx = 0;
    for (let i = 0; i < K; i++) {
      if (!assignedIndices.has(i)) {
        assignedRoles[i] = shuffledRemainingRoles[remIdx++];
      }
    }
  } else {
    const shuffledRoles = shuffle(finalRolesList);
    for (let i = 0; i < K; i++) {
      assignedRoles[i] = shuffledRoles[i];
    }
  }

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
