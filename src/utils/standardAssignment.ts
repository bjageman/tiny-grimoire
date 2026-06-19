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

  const selectedDemons = shuffle(dems).slice(0, base.demon);
  let selectedMinions = shuffle(mins).slice(0, base.minion);

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
  let targetTownsfolk = baseCount - base.demon - base.minion - targetOutsiders;
  if (targetTownsfolk < 0) {
    targetTownsfolk = 0;
    targetOutsiders = baseCount - base.demon - base.minion;
  }

  const selectedOutsiders = shuffle(outs).slice(0, targetOutsiders);
  let selectedTownsfolk = shuffle(tfs).slice(0, targetTownsfolk);

  if (selectedTownsfolk.some(t => t.id === 'balloonist') && outs.length > selectedOutsiders.length) {
    const remainingOuts = outs.filter(o => !selectedOutsiders.some(so => so.id === o.id));
    if (remainingOuts.length > 0) {
      selectedOutsiders.push(remainingOuts[Math.floor(Math.random() * remainingOuts.length)]);
      const balloonistIdx = selectedTownsfolk.findIndex(t => t.id === 'balloonist');
      const nonBalloonistTfs = selectedTownsfolk.filter((_, idx) => idx !== balloonistIdx);
      if (nonBalloonistTfs.length > 0) {
        const removedTf = nonBalloonistTfs[Math.floor(Math.random() * nonBalloonistTfs.length)];
        selectedTownsfolk = selectedTownsfolk.filter(t => t.id !== removedTf.id);
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
  const basePlayers = shuffledPlayers.slice(travelerCount);

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
      };
    }

    const bpIdx = basePlayers.findIndex(bp => bp.id === p.id);
    const role = assignedRoles[bpIdx];
    let roleId = role?.id;
    let isTheDrunk = false;
    let isTheMarionette = false;
    let isTheLunatic = false;

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
    }

    return {
      ...p,
      roleId,
      isTheDrunk,
      isTheMarionette,
      isTheLunatic,
    };
  });
}
