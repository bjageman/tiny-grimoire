import type { Role, Player, AssignmentResult } from '../types';
import { DISTRIBUTION } from '../constants';
import rolesData from '../official_roles.json';

export function assignCharacters(
  players: Player[],
  allRoles: Role[],
  allowTravelers: boolean = false
): AssignmentResult[] | null {
  const N = players.length;
  if (N < 5) return null;

  const randomChoice = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  // 1. Identify traveler players
  let travelerPlayers: Player[] = [];
  if (allowTravelers) {
    travelerPlayers = players.filter(p => p.preferences?.traveler && p.preferences.traveler.length > 0);
  }

  // If player count exceeds 15, we must allocate travelers
  const minTravelersNeeded = N > 15 ? N - 15 : 0;
  if (travelerPlayers.length < minTravelersNeeded) {
    const remainingCandidates = players.filter(p => !travelerPlayers.some(tp => tp.id === p.id));
    const shuffledCandidates = shuffle(remainingCandidates);
    const additionalNeeded = minTravelersNeeded - travelerPlayers.length;
    travelerPlayers.push(...shuffledCandidates.slice(0, additionalNeeded));
  }

  // Ensure base setup has at least 5 players
  const maxTravelers = N - 5;
  if (travelerPlayers.length > maxTravelers) {
    travelerPlayers = travelerPlayers.slice(0, maxTravelers);
  }

  const travelerIds = new Set(travelerPlayers.map(p => p.id));
  const basePlayers = players.filter(p => !travelerIds.has(p.id));

  // 2. Assign traveler roles
  const travelerRoles = allRoles.filter(r => r.team === 'traveler' || (r.team as string) === 'traveller');
  const masterTravelers = (rolesData as Role[])
    .filter(r => r.team === 'traveler' || (r.team as string) === 'traveller')
    .map(r => ({ ...r, team: (r.team as string) === 'traveller' ? 'traveler' : r.team }));
  const availableTravelers = travelerRoles.length > 0 ? travelerRoles : masterTravelers;

  const usedTravelerIds = new Set<string>();
  const travelerAssignments: AssignmentResult[] = [];

  for (const tp of travelerPlayers) {
    const prefs = allowTravelers ? (tp.preferences?.traveler || []) : [];
    const availablePrefs = prefs.filter(id => !usedTravelerIds.has(id));

    let chosenRole: Role;
    let fromPref = false;

    if (availablePrefs.length > 0) {
      const id = randomChoice(availablePrefs);
      const role = allRoles.find(r => r.id === id) || masterTravelers.find(r => r.id === id);
      if (role) {
        chosenRole = role;
        fromPref = true;
      } else {
        const fallbackList = availableTravelers.filter(r => !usedTravelerIds.has(r.id));
        chosenRole = fallbackList.length > 0 ? randomChoice(fallbackList) : randomChoice(availableTravelers);
      }
    } else {
      const fallbackList = availableTravelers.filter(r => !usedTravelerIds.has(r.id));
      chosenRole = fallbackList.length > 0 ? randomChoice(fallbackList) : randomChoice(availableTravelers);
    }

    usedTravelerIds.add(chosenRole.id);
    travelerAssignments.push({
      player: tp,
      role: chosenRole,
      fromPref
    });
  }

  // 3. Assign base players using standard logic
  const baseCount = basePlayers.length;
  if (baseCount < 5) return null;

  const baseDist = DISTRIBUTION[baseCount] || { townsfolk: 0, outsider: 0, minion: 0, demon: 0 };
  const baseAssignments = assignBaseCharacters(basePlayers, allRoles, baseDist);
  if (!baseAssignments) return null;

  const finalAssignments = [...baseAssignments, ...travelerAssignments];
  const hasAtheist = finalAssignments.some(a => a.role.id === 'atheist' && !a.player.isTheDrunk && !a.player.isTheMarionette && !a.player.isTheLunatic);
  if (hasAtheist) {
    finalAssignments.forEach(a => {
      a.player.isEvil = undefined;
    });
  } else {
    const hasBountyHunter = finalAssignments.some(a => a.role.id === 'bountyhunter');
    if (hasBountyHunter) {
      const townsfolkAssignments = finalAssignments.filter(a => 
        a.role.team === 'townsfolk' &&
        a.player.isEvil !== true
      );
      if (townsfolkAssignments.length > 0) {
        const chosen = townsfolkAssignments[Math.floor(Math.random() * townsfolkAssignments.length)];
        chosen.player = { ...chosen.player, isEvil: true };
      }
    }
  }

  return finalAssignments;
}

function assignBaseCharacters(
  players: Player[],
  allRoles: Role[],
  base: { townsfolk: number; outsider: number; minion: number; demon: number }
): AssignmentResult[] | null {
  const N = players.length;
  const hasPref = (roleId: string) => players.some(p => 
    p.preferences?.townsfolk.includes(roleId) ||
    p.preferences?.outsider.includes(roleId) ||
    p.preferences?.minion.includes(roleId) ||
    p.preferences?.demon.includes(roleId)
  );

  const randomChoice = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  const selectRoleForPlayer = (player: Player, team: Role['team'], usedRoleIds: Set<string>): { role: Role; fromPref: boolean } => {
    const prefs = player.preferences?.[team] || [];
    const availablePrefs = prefs.filter(id =>
      !usedRoleIds.has(id) &&
      id !== 'legion' &&
      id !== 'atheist' &&
      id !== 'drunk' &&
      id !== 'marionette'
    );
    
    if (availablePrefs.length > 0) {
      const id = randomChoice(availablePrefs);
      const role = allRoles.find(r => r.id === id);
      if (role) return { role, fromPref: true };
    }
    
    const teamRoles = allRoles.filter(r =>
      r.team === team &&
      !usedRoleIds.has(r.id) &&
      r.id !== 'legion' &&
      r.id !== 'atheist' &&
      r.id !== 'drunk' &&
      r.id !== 'marionette'
    );
    if (teamRoles.length > 0) {
      const role = randomChoice(teamRoles);
      return { role, fromPref: false };
    }
    
    const fallbackRoles = allRoles.filter(r =>
      r.team === team &&
      r.id !== 'legion' &&
      r.id !== 'atheist' &&
      r.id !== 'drunk' &&
      r.id !== 'marionette'
    );
    return { role: randomChoice(fallbackRoles), fromPref: false };
  };

  const initialShuffledPlayers = shuffle(players);
  const demonCandidate = initialShuffledPlayers[0];

  const scriptDemons = allRoles.filter(r => r.team === 'demon');
  const scriptTownsfolk = allRoles.filter(r => r.team === 'townsfolk');

  // Decide if Atheist is active (if atheist is in script and either preferred or randomly chosen)
  const hasAtheist = scriptTownsfolk.some(t => t.id === 'atheist');
  const preferAtheist = hasPref('atheist');
  const isAtheistActive = hasAtheist && (preferAtheist ? Math.random() < 0.5 : Math.random() < 1 / Math.max(1, scriptDemons.length + 1));

  let chosenDemon: Role | null = null;
  if (!isAtheistActive && scriptDemons.length > 0) {
    const demonPrefs = demonCandidate.preferences?.demon || [];
    const availablePrefs = demonPrefs.filter(id => scriptDemons.some(d => d.id === id));
    if (availablePrefs.length > 0) {
      const id = randomChoice(availablePrefs);
      chosenDemon = scriptDemons.find(d => d.id === id) || null;
    } else {
      chosenDemon = randomChoice(scriptDemons);
    }
  }

  // Riot transforms Minions during play (day 3), not at setup, so it's just a normal single Demon here.
  let mode: 'normal' | 'legion' | 'atheist' = 'normal';
  if (isAtheistActive) {
    mode = 'atheist';
  } else if (chosenDemon?.id === 'legion') {
    mode = 'legion';
  }

  if (mode === 'legion') {
    const L = Math.round(N * 0.6);
    const usedRoleIds = new Set<string>();
    const assignment: AssignmentResult[] = [];
    const legionRole = allRoles.find(r => r.id === 'legion')!;

    // Categorize players based on preferences to respect good-preferring players
    const goodPreferring = initialShuffledPlayers.filter(p => (p.preferences?.townsfolk || []).length > 0 && !(p.preferences?.demon || []).includes('legion'));
    const legionPreferring = initialShuffledPlayers.filter(p => (p.preferences?.demon || []).includes('legion'));
    const neutral = initialShuffledPlayers.filter(p => !goodPreferring.some(gp => gp.id === p.id) && !legionPreferring.some(lp => lp.id === p.id));

    // Prioritize good-preferring players for Townsfolk roles, then neutral, then legion-preferring as fallback
    const candidatesForGood = [...goodPreferring, ...neutral, ...legionPreferring];
    const goodPlayers = candidatesForGood.slice(0, N - L);
    const legionPlayers = candidatesForGood.slice(N - L);

    // Assign Legion to the legionPlayers
    for (const p of legionPlayers) {
      assignment.push({
        player: { ...p, isEvil: true },
        role: legionRole,
        fromPref: !!p.preferences?.demon.includes('legion')
      });
    }

    // Assign Townsfolk to the goodPlayers, honoring their preferences
    for (const p of goodPlayers) {
      const { role, fromPref } = selectRoleForPlayer(p, 'townsfolk', usedRoleIds);
      usedRoleIds.add(role.id);
      assignment.push({
        player: { ...p, isEvil: undefined },
        role,
        fromPref
      });
    }

    return assignment;
  }

  if (mode === 'atheist') {
    const includeBalloonist = hasPref('balloonist') && Math.random() < 0.7;
    const O = base.outsider + (includeBalloonist ? 1 : 0);
    const T = N - O;
    const usedRoleIds = new Set<string>();
    const assignment: AssignmentResult[] = [];
    const atheistRole = allRoles.find(r => r.id === 'atheist')!;
    usedRoleIds.add('atheist');
    assignment.push({
      player: { ...initialShuffledPlayers[0], isEvil: undefined },
      role: atheistRole,
      fromPref: !!initialShuffledPlayers[0].preferences?.townsfolk.includes('atheist')
    });
    let assignedT = 1;
    for (let i = 1; i < N; i++) {
      const p = initialShuffledPlayers[i];
      if (assignedT < T) {
        let roleInfo;
        if (includeBalloonist && !usedRoleIds.has('balloonist') && (assignedT === T - 1 || Math.random() < 0.3)) {
          const role = allRoles.find(r => r.id === 'balloonist')!;
          roleInfo = { role, fromPref: !!p.preferences?.townsfolk.includes('balloonist') };
        } else {
          roleInfo = selectRoleForPlayer(p, 'townsfolk', usedRoleIds);
        }
        usedRoleIds.add(roleInfo.role.id);
        assignment.push({
          player: { ...p, isEvil: undefined },
          role: roleInfo.role,
          fromPref: roleInfo.fromPref
        });
        assignedT++;
      } else {
        const { role, fromPref } = selectRoleForPlayer(p, 'outsider', usedRoleIds);
        usedRoleIds.add(role.id);
        assignment.push({
          player: { ...p, isEvil: undefined },
          role,
          fromPref
        });
      }
    }
    return assignment;
  }

  // Normal Mode
  for (let attempt = 0; attempt < 500; attempt++) {
    const shuffledPlayers = attempt === 0 ? initialShuffledPlayers : shuffle(players);
    const usedRoleIds = new Set<string>();
    const assignment: AssignmentResult[] = [];
    
    const demonPlayer = shuffledPlayers[0];
    const { role: demonRole, fromPref: demonFromPref } = selectRoleForPlayer(demonPlayer, 'demon', usedRoleIds);
    usedRoleIds.add(demonRole.id);
    assignment.push({ player: { ...demonPlayer, isEvil: undefined }, role: demonRole, fromPref: demonFromPref });
    
    const numMinions = demonRole.id === 'kazali' ? 0 : (base.minion + (demonRole.id === 'lilmonsta' || demonRole.id === 'lordoftyphon' ? 1 : 0));
    const minionPlayers: Player[] = [];
    if (demonRole.id === 'lordoftyphon') {
      const d_idx = players.findIndex(p => p.id === demonPlayer.id);
      const E = 1 + numMinions;
      let typhonRelativeIdx = 0;
      if (E >= 3) {
        typhonRelativeIdx = 1 + Math.floor(Math.random() * (E - 2));
      } else if (E === 2) {
        typhonRelativeIdx = Math.floor(Math.random() * 2);
      }
      const start_idx = (d_idx - typhonRelativeIdx + N) % N;
      for (let i = 0; i < E; i++) {
        if (i !== typhonRelativeIdx) {
          minionPlayers.push(players[(start_idx + i) % N]);
        }
      }
    } else {
      for (let i = 1; i <= numMinions; i++) {
        minionPlayers.push(shuffledPlayers[i]);
      }
    }

    for (const minionPlayer of minionPlayers) {
      const { role: minionRole, fromPref: minionFromPref } = selectRoleForPlayer(minionPlayer, 'minion', usedRoleIds);
      usedRoleIds.add(minionRole.id);
      assignment.push({ player: { ...minionPlayer, isEvil: undefined }, role: minionRole, fromPref: minionFromPref });
    }

    const hasSummoner = assignment.some(a => a.role.id === 'summoner');
    if (hasSummoner) {
      const demonAss = assignment.find(a => a.role.team === 'demon');
      if (demonAss) {
        usedRoleIds.delete(demonAss.role.id);
        const { role: tfRole, fromPref: tfFromPref } = selectRoleForPlayer(demonPlayer, 'townsfolk', usedRoleIds);
        demonAss.role = tfRole;
        demonAss.fromPref = tfFromPref;
        demonAss.player = { ...demonPlayer, isEvil: undefined };
        usedRoleIds.add(tfRole.id);
      }
    }
    
    const minionPlayerIds = new Set(minionPlayers.map(mp => mp.id));
    const remainingPlayers = shuffledPlayers.filter(p => p.id !== demonPlayer.id && !minionPlayerIds.has(p.id));
    const hasXaan = assignment.some(a => a.role.id === 'xaan');
    const targetOutsiders = (demonRole.id === 'kazali' || hasXaan) ? Math.floor(Math.random() * (remainingPlayers.length + 1)) : base.outsider;
    const tempAssignment: { player: Player; team: 'townsfolk' | 'outsider' }[] = [];
    for (let i = 0; i < remainingPlayers.length; i++) {
      const team = (i < targetOutsiders) ? 'outsider' : 'townsfolk';
      tempAssignment.push({ player: remainingPlayers[i], team });
    }
    tempAssignment.sort((a, b) => {
      const hasPrefA = (a.player.preferences?.[a.team] || []).length > 0;
      const hasPrefB = (b.player.preferences?.[b.team] || []).length > 0;
      if (hasPrefA && !hasPrefB) return -1;
      if (!hasPrefA && hasPrefB) return 1;
      return 0;
    });
    
    const tempUsedRoleIds = new Set(usedRoleIds);
    const goodAssignments: AssignmentResult[] = [];
    for (const temp of tempAssignment) {
      const { role, fromPref } = selectRoleForPlayer(temp.player, temp.team, tempUsedRoleIds);
      tempUsedRoleIds.add(role.id);
      goodAssignments.push({ player: { ...temp.player, isEvil: undefined }, role, fromPref });
    }
    
    const fullAssignment = [...assignment, ...goodAssignments];
    let valid = false;
    
    for (let adj = 0; adj < 10; adj++) {
      const hasBaron = fullAssignment.some(a => a.role.id === 'baron');
      const hasFangGu = fullAssignment.some(a => a.role.id === 'fanggu');
      const hasVigormortis = fullAssignment.some(a => a.role.id === 'vigormortis');
      const hasBalloonist = fullAssignment.some(a => a.role.id === 'balloonist');
      const hasGodfather = fullAssignment.some(a => a.role.id === 'godfather');
      const hasHermit = fullAssignment.some(a => a.role.id === 'hermit');
      
      const fixedDeltaOut = (hasBaron ? 2 : 0) + (hasFangGu ? 1 : 0) - (hasVigormortis ? 1 : 0);
      const currentOutsiders = fullAssignment.filter(a => a.role.team === 'outsider');
      
      const gfMods = hasGodfather ? [-1, 1] : [0];
      const balMods = hasBalloonist ? [0, 1] : [0];
      const hermMods = hasHermit ? [-1, 0] : [0];
      
      const possibleCounts = new Set<number>();
      const hasKazali = demonRole.id === 'kazali';
      const hasXaan = fullAssignment.some(a => a.role.id === 'xaan');
      if (hasKazali || hasXaan) {
        let expectedDemon = base.demon;
        let expectedMinion = base.minion;
        const hasLilMonsta = fullAssignment.some(a => a.role.id === 'lilmonsta');
        const hasLordOfTyphon = fullAssignment.some(a => a.role.id === 'lordoftyphon');
        const hasSummoner = fullAssignment.some(a => a.role.id === 'summoner');
        if (hasLilMonsta) {
          expectedMinion += 1;
          expectedDemon -= 1;
        }
        if (hasLordOfTyphon) {
          expectedMinion += 1;
        }
        if (hasSummoner) {
          expectedDemon -= 1;
        }
        if (hasKazali) {
          expectedMinion = 0;
        }
        expectedDemon = Math.max(0, expectedDemon);
        const maxOutsiders = Math.max(0, N - expectedDemon - expectedMinion);
        for (let i = 0; i <= maxOutsiders; i++) {
          possibleCounts.add(i);
        }
      } else {
        for (const gf of gfMods) {
          for (const bal of balMods) {
            for (const herm of hermMods) {
              possibleCounts.add(Math.max(0, base.outsider + fixedDeltaOut + gf + bal + herm));
            }
          }
        }
      }
      
      const validOutsiderCounts = Array.from(possibleCounts);
      
      let chosenTargetOut = base.outsider + fixedDeltaOut;
      if (validOutsiderCounts.length > 0) {
        if (validOutsiderCounts.includes(currentOutsiders.length)) {
          chosenTargetOut = currentOutsiders.length;
        } else {
          chosenTargetOut = validOutsiderCounts.reduce((prev, curr) => 
            Math.abs(curr - currentOutsiders.length) < Math.abs(prev - currentOutsiders.length) ? curr : prev
          );
        }
      }
      
      chosenTargetOut = Math.max(0, Math.min(remainingPlayers.length, chosenTargetOut));
      
      if (currentOutsiders.length === chosenTargetOut) {
        const hasChoirboy = fullAssignment.some(a => a.role.id === 'choirboy');
        const hasKing = fullAssignment.some(a => a.role.id === 'king');
        const hasHuntsman = fullAssignment.some(a => a.role.id === 'huntsman');
        const hasDamsel = fullAssignment.some(a => a.role.id === 'damsel');
        
        let jinxesMet = true;
        if (hasChoirboy && !hasKing) {
          const kingRole = allRoles.find(r => r.id === 'king');
          if (kingRole) {
            const otherTF = fullAssignment.find(a => a.role.team === 'townsfolk' && a.role.id !== 'choirboy' && a.role.id !== 'balloonist' && !a.fromPref) ||
                            fullAssignment.find(a => a.role.team === 'townsfolk' && a.role.id !== 'choirboy' && a.role.id !== 'balloonist');
            if (otherTF) {
              otherTF.role = kingRole;
              otherTF.fromPref = !!otherTF.player.preferences?.townsfolk.includes('king');
            } else {
              jinxesMet = false;
            }
          } else {
            jinxesMet = false;
          }
        }
        
        if (hasHuntsman && !hasDamsel) {
          const damselRole = allRoles.find(r => r.id === 'damsel');
          if (damselRole) {
            const otherOut = fullAssignment.find(a => a.role.team === 'outsider' && !a.fromPref) ||
                             fullAssignment.find(a => a.role.team === 'outsider');
            if (otherOut) {
              otherOut.role = damselRole;
              otherOut.fromPref = !!otherOut.player.preferences?.outsider.includes('damsel');
            } else {
              const otherTF = fullAssignment.find(a => a.role.team === 'townsfolk' && a.role.id !== 'huntsman' && a.role.id !== 'choirboy' && a.role.id !== 'king' && a.role.id !== 'balloonist' && !a.fromPref) ||
                              fullAssignment.find(a => a.role.team === 'townsfolk' && a.role.id !== 'huntsman' && a.role.id !== 'choirboy' && a.role.id !== 'king' && a.role.id !== 'balloonist');
              if (otherTF) {
                otherTF.role = damselRole;
                otherTF.fromPref = !!otherTF.player.preferences?.outsider.includes('damsel');
              } else {
                jinxesMet = false;
              }
            }
          } else {
            jinxesMet = false;
          }
        }
        
        if (jinxesMet) {
          valid = true;
          break;
        }
      }
      
      const usedIds = new Set(fullAssignment.map(a => a.role.id));
      if (currentOutsiders.length < chosenTargetOut) {
        const tfToChange = fullAssignment.find(a => a.role.team === 'townsfolk' && a.role.id !== 'balloonist' && a.role.id !== 'choirboy' && a.role.id !== 'king');
        if (tfToChange) {
          usedIds.delete(tfToChange.role.id);
          const { role, fromPref } = selectRoleForPlayer(tfToChange.player, 'outsider', usedIds);
          tfToChange.role = role;
          tfToChange.fromPref = fromPref;
        } else {
          break;
        }
      } else if (currentOutsiders.length > chosenTargetOut) {
        const outToChange = fullAssignment.find(a => a.role.team === 'outsider' && a.role.id !== 'damsel');
        if (outToChange) {
          usedIds.delete(outToChange.role.id);
          const { role, fromPref } = selectRoleForPlayer(outToChange.player, 'townsfolk', usedIds);
          outToChange.role = role;
          outToChange.fromPref = fromPref;
        } else {
          break;
        }
      }
    }
    
    if (valid) {
      const roleCounts: Record<string, number> = {};
      for (const a of fullAssignment) {
        roleCounts[a.role.id] = (roleCounts[a.role.id] || 0) + 1;
      }
      let duplicateCheck = true;
      for (const id in roleCounts) {
        if (roleCounts[id] > 1 && id !== 'legion') {
          duplicateCheck = false;
        }
      }
      if (duplicateCheck) {
        return fullAssignment;
      }
    }
  }
  return null;
}

export const getPreferenceLabel = (prefs: string[], defaultLabel: string) => {
  if (!prefs || prefs.length === 0) return defaultLabel;
  type RoleEntry = { id: string; name: string };
  const allRoles = rolesData as RoleEntry[];
  const names = prefs.map(id => allRoles.find(r => r.id === id)?.name || id);
  return names.join(', ');
};
