import type { Player, Role } from '../types';
import { DISTRIBUTION } from '../constants';

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

  const tfs = currentScriptRoles.filter(r => r.team === 'townsfolk');
  const outs = currentScriptRoles.filter(r => r.team === 'outsider');
  const mins = currentScriptRoles.filter(r => r.team === 'minion');
  const dems = currentScriptRoles.filter(r => r.team === 'demon');

  if (dems.length === 0 || mins.length === 0 || tfs.length === 0) {
    return null;
  }

  const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  const tempDemons = shuffle(dems);
  const chosenDemonAtTop = tempDemons[0];
  const legionRole = dems.find(d => d.id === 'legion');
  const hasLegion = !!(legionRole && chosenDemonAtTop && chosenDemonAtTop.id === 'legion');

  if (hasLegion && legionRole) {
    const L = Math.round(baseCount * 0.6);
    const legionDemons = Array(L).fill(legionRole);

    const targetTownsfolk = baseCount - L;
    const legionTownsfolk = shuffle(tfs).slice(0, targetTownsfolk);

    const finalRolesList = shuffle([
      ...legionDemons,
      ...legionTownsfolk
    ]);

    while (finalRolesList.length < baseCount) {
      const unusedTfs = tfs.filter(t => !finalRolesList.some(fr => fr.id === t.id));
      if (unusedTfs.length > 0) {
        finalRolesList.push(unusedTfs[0]);
      } else {
        finalRolesList.push(tfs[0] || dems[0]);
      }
    }

    const shuffledPlayers = shuffle(players);
    const travelerPlayers = shuffledPlayers.slice(0, travelerCount);
    const basePlayers = players.filter(p => !travelerPlayers.some(tp => tp.id === p.id));

    const assignedRoles = shuffle(finalRolesList);

    return players.map(p => {
      const isTraveler = travelerPlayers.some(tp => tp.id === p.id);
      if (isTraveler) {
        const matched = selectionRoles.find(r => r.team === 'traveler') || { id: 'beggar' };
        return {
          ...p,
          roleId: matched.id,
          isTheDrunk: false,
          isTheMarionette: false,
          isTheLunatic: false,
          isTheLilMonsta: false,
        };
      }

      const bpIdx = basePlayers.findIndex(bp => bp.id === p.id);
      const role = assignedRoles[bpIdx];
      const roleId = role?.id;

      return {
        ...p,
        roleId,
        isTheDrunk: false,
        isTheMarionette: false,
        isTheLunatic: false,
        isTheLilMonsta: false,
        isEvil: roleId === 'legion' ? true : undefined,
      };
    });
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

  let outsiderModifier = 0;
  if (selectedMinions.some(m => m.id === 'baron')) {
    outsiderModifier += 2;
  }
  if (selectedMinions.some(m => m.id === 'godfather')) {
    outsiderModifier += Math.random() < 0.5 ? 1 : -1;
  }
  if (selectedDemons.some(d => d.id === 'fanggu')) {
    outsiderModifier += 1;
  }

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
  const hasHuntsman = selectedTownsfolk.some(t => t.id === 'huntsman');
  const hasDamsel = selectedOutsiders.some(o => o.id === 'damsel');
  if (hasHuntsman && !hasDamsel) {
    const damselRole = outs.find(o => o.id === 'damsel');
    if (damselRole) {
      const otherOutsiders = selectedOutsiders.filter(o => o.id !== 'damsel');
      if (otherOutsiders.length > 0) {
        const outToRemove = otherOutsiders[Math.floor(Math.random() * otherOutsiders.length)];
        selectedOutsiders = selectedOutsiders.filter(o => o.id !== outToRemove.id);
        selectedOutsiders.push(damselRole);
      } else {
        selectedOutsiders.push(damselRole);
        const otherTfs = selectedTownsfolk.filter(t => t.id !== 'huntsman' && t.id !== 'choirboy' && t.id !== 'king' && t.id !== 'balloonist');
        if (otherTfs.length > 0) {
          const tfToRemove = otherTfs[Math.floor(Math.random() * otherTfs.length)];
          selectedTownsfolk = selectedTownsfolk.filter(t => t.id !== tfToRemove.id);
        }
      }
    }
  }

  // 4. Choirboy & King adjustment
  const hasChoirboy = selectedTownsfolk.some(t => t.id === 'choirboy');
  const hasKing = selectedTownsfolk.some(t => t.id === 'king');
  if (hasChoirboy && !hasKing) {
    const kingRole = tfs.find(t => t.id === 'king');
    if (kingRole) {
      const otherTfs = selectedTownsfolk.filter(t => t.id !== 'choirboy' && t.id !== 'huntsman' && t.id !== 'balloonist');
      if (otherTfs.length > 0) {
        const tfToRemove = otherTfs[Math.floor(Math.random() * otherTfs.length)];
        selectedTownsfolk = selectedTownsfolk.filter(t => t.id !== tfToRemove.id);
        selectedTownsfolk.push(kingRole);
      }
    }
  }

  const finalRolesList = shuffle([
    ...selectedDemons,
    ...selectedMinions,
    ...selectedOutsiders,
    ...selectedTownsfolk
  ]);

  while (finalRolesList.length < baseCount) {
    const unusedTfs = tfs.filter(t => !finalRolesList.some(fr => fr.id === t.id));
    if (unusedTfs.length > 0) {
      finalRolesList.push(unusedTfs[0]);
    } else {
      finalRolesList.push(tfs[0] || outs[0] || mins[0] || dems[0]);
    }
  }

  const roleIdsInPlay = finalRolesList.map(r => r.id);
  const shuffledPlayers = shuffle(players);
  const travelerPlayers = shuffledPlayers.slice(0, travelerCount);
  const basePlayers = players.filter(p => !travelerPlayers.some(tp => tp.id === p.id));

  const K = basePlayers.length;
  const assignedRoles: Role[] = new Array(K);
  const assignedIndices = new Set<number>();

  const demonRoleIndex = finalRolesList.findIndex(r => r.team === 'demon');
  const marionetteRoleIndex = finalRolesList.findIndex(r => r.id === 'marionette');

  if (demonRoleIndex !== -1 && marionetteRoleIndex !== -1 && K >= 3) {
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

  return players.map(p => {
    const isTraveler = travelerPlayers.some(tp => tp.id === p.id);
    if (isTraveler) {
      const matched = selectionRoles.find(r => r.team === 'traveler') || { id: 'beggar' };
      return {
        ...p,
        roleId: matched.id,
        isTheDrunk: false,
        isTheMarionette: false,
        isTheLunatic: false,
        isTheLilMonsta: false,
      };
    }

    const bpIdx = basePlayers.findIndex(bp => bp.id === p.id);
    const role = assignedRoles[bpIdx];
    let roleId = role?.id;
    let isTheDrunk = false;
    let isTheMarionette = false;
    let isTheLunatic = false;
    let isTheLilMonsta = false;

    if (roleId === 'drunk') {
      isTheDrunk = true;
      const unmatchedTfs = tfs.filter(t => !roleIdsInPlay.includes(t.id));
      const matchedTf = unmatchedTfs[Math.floor(Math.random() * unmatchedTfs.length)] || tfs[0];
      roleId = matchedTf.id;
    } else if (roleId === 'marionette') {
      isTheMarionette = true;
      const unmatchedGoods = [...tfs, ...outs].filter(g => !roleIdsInPlay.includes(g.id));
      const matchedGood = unmatchedGoods[Math.floor(Math.random() * unmatchedGoods.length)] || tfs[0];
      roleId = matchedGood.id;
    } else if (roleId === 'lunatic') {
      isTheLunatic = true;
      const matchedDemon = dems[Math.floor(Math.random() * dems.length)] || dems[0];
      roleId = matchedDemon.id;
    } else if (roleId === 'lilmonsta') {
      isTheLilMonsta = true;
      const unmatchedMinions = mins.filter(m => !roleIdsInPlay.includes(m.id));
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
}
