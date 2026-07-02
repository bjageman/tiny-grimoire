import type { Player, Role } from '../types';
import { DISTRIBUTION } from '../constants';

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

function fillToCount(list: Role[], count: number, pool: Role[], ...fallbacks: (Role | undefined)[]): void {
  while (list.length < count) {
    const inPlay = new Set(list.map(r => r.id));
    const unused = pool.find(r => !inPlay.has(r.id));
    if (unused) {
      list.push(unused);
    } else {
      const fallback = fallbacks.find(Boolean);
      if (fallback) list.push(fallback); else break;
    }
  }
}

function splitTravelers(players: Player[], travelerCount: number): { travelerIds: Set<string>; basePlayers: Player[] } {
  const shuffled = shuffle(players);
  const travelerIds = new Set(shuffled.slice(0, travelerCount).map(p => p.id));
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
  const travelerRole = selectionRoles.find(r => r.team === 'traveler') ?? { id: 'beggar' };

  return players.map(p => {
    if (travelerIds.has(p.id)) {
      return { ...p, roleId: travelerRole.id, isTheDrunk: false, isTheMarionette: false, isTheLunatic: false, isTheLilMonsta: false };
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
  selectionRoles: Role[]
): Player[] | null {
  const N = players.length;
  if (N < 5) return null;

  const travelerCount = N > 15 ? N - 15 : 0;
  const baseCount = N - travelerCount;
  const base = DISTRIBUTION[baseCount] || { townsfolk: 0, outsider: 0, minion: 0, demon: 0 };

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
    fillToCount(finalRolesList, baseCount, tfs, tfs[0], outs[0]);

    const { travelerIds, basePlayers } = splitTravelers(players, travelerCount);
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
    fillToCount(finalRolesList, baseCount, tfs, tfs[0], dems[0]);
    const { travelerIds, basePlayers } = splitTravelers(players, travelerCount);
    return assignSimpleRolesToPlayers(players, shuffle(finalRolesList), travelerIds, basePlayers, selectionRoles, 'legion');
  }

  const riotRole = dems.find(d => d.id === 'riot');
  const hasRiot = !!(riotRole && chosenDemonAtTop && chosenDemonAtTop.id === 'riot');

  if (hasRiot && riotRole) {
    const D = 1 + base.minion;
    const finalRolesList = shuffle([...Array(D).fill(riotRole), ...shuffle(tfs).slice(0, baseCount - D)]);
    fillToCount(finalRolesList, baseCount, tfs, tfs[0], dems[0]);
    const { travelerIds, basePlayers } = splitTravelers(players, travelerCount);
    return assignSimpleRolesToPlayers(players, shuffle(finalRolesList), travelerIds, basePlayers, selectionRoles, 'riot');
  }

  // Normal / non-Legion / non-Riot setup
  const nonLegionDemons = dems.filter(d => d.id !== 'legion' && d.id !== 'riot');
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

  let outsiderModifier = 0;
  if (selectedMinions.some(m => m.id === 'baron')) outsiderModifier += 2;
  if (selectedMinions.some(m => m.id === 'godfather')) outsiderModifier += Math.random() < 0.5 ? 1 : -1;
  if (selectedDemons.some(d => d.id === 'fanggu')) outsiderModifier += 1;
  if (selectedDemons.some(d => d.id === 'vigormortis')) outsiderModifier -= 1;

  let targetOutsiders = Math.max(0, base.outsider + outsiderModifier);
  const hasXaan = selectedMinions.some(m => m.id === 'xaan');
  const bypassAdjustments = hasKazali || hasXaan;
  if (bypassAdjustments) {
    const maxOutsiders = baseCount - selectedDemons.length - selectedMinions.length;
    targetOutsiders = Math.floor(Math.random() * (maxOutsiders + 1));
  }
  let targetTownsfolk = baseCount - selectedDemons.length - selectedMinions.length - targetOutsiders;
  if (targetTownsfolk < 0) {
    targetTownsfolk = 0;
    targetOutsiders = baseCount - selectedDemons.length - selectedMinions.length;
  }

  let selectedOutsiders = shuffle(outs).slice(0, targetOutsiders);
  let selectedTownsfolk = shuffle(tfs).slice(0, targetTownsfolk);

  // 1. Balloonist adjustment
  if (!bypassAdjustments && selectedTownsfolk.some(t => t.id === 'balloonist') && Math.random() < 0.5 && outs.length > selectedOutsiders.length) {
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
  if (!bypassAdjustments && selectedOutsiders.some(o => o.id === 'hermit') && Math.random() < 0.5) {
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

  fillToCount(finalRolesList, baseCount, tfs, tfs[0], outs[0], mins[0], dems[0]);

  const roleIdsInPlay = new Set(finalRolesList.map(r => r.id));
  const { travelerIds, basePlayers } = splitTravelers(players, travelerCount);
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

  const travelerRole = selectionRoles.find(r => r.team === 'traveler') ?? { id: 'beggar' };

  const assignedPlayers = players.map(p => {
    if (travelerIds.has(p.id)) {
      return { ...p, roleId: travelerRole.id, isTheDrunk: false, isTheMarionette: false, isTheLunatic: false, isTheLilMonsta: false };
    }

    const role = assignedRoles[basePlayerIndex.get(p.id) ?? 0];
    let roleId = role?.id;
    let isTheDrunk = false;
    let isTheMarionette = false;
    let isTheLunatic = false;
    let isTheLilMonsta = false;

    if (roleId === 'drunk') {
      isTheDrunk = true;
      const unmatchedTFs = tfs.filter(t => !roleIdsInPlay.has(t.id));
      const fakeTF = unmatchedTFs.length > 0
        ? unmatchedTFs[Math.floor(Math.random() * unmatchedTFs.length)]
        : tfs[Math.floor(Math.random() * tfs.length)];
      roleId = fakeTF?.id ?? roleId;
    } else if (roleId === 'marionette') {
      isTheMarionette = true;
      const unmatchedGoods = [...tfs, ...outs].filter(g => !roleIdsInPlay.has(g.id));
      const matchedGood = unmatchedGoods[Math.floor(Math.random() * unmatchedGoods.length)] || tfs[0];
      roleId = matchedGood.id;
    } else if (roleId === 'lunatic') {
      isTheLunatic = true;
      const matchedDemon = dems[Math.floor(Math.random() * dems.length)] || dems[0];
      roleId = matchedDemon.id;
    } else if (roleId === 'lilmonsta') {
      isTheLilMonsta = true;
      const unmatchedMinions = mins.filter(m => !roleIdsInPlay.has(m.id));
      const matchedMinion = unmatchedMinions[Math.floor(Math.random() * unmatchedMinions.length)] || mins[0];
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

  const travelerRoleIds = new Set(selectionRoles.filter(r => r.team === 'traveler').map(r => r.id));
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
