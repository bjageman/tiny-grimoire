import { useState, useEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Plus, Trash2, Search, RefreshCcw, AlertTriangle, Sparkles, Shuffle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import rolesData from './roles.json';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Role {
  id: string;
  name: string;
  team: 'townsfolk' | 'outsider' | 'minion' | 'demon';
}

interface Player {
  id: string;
  name: string;
  preferences: {
    townsfolk: string[]; // up to 4 role IDs
    outsider: string[];
    minion: string[];
    demon: string[];
  };
  roleId?: string;
  assignedFromPref?: boolean;
  isDead: boolean;
  isTheDrunk?: boolean;
  isTheMarionette?: boolean;
}

type Phase = 'setup' | 'draft' | 'game';

const DISTRIBUTION: Record<number, { townsfolk: number; outsider: number; minion: number; demon: number }> = {
  5: { townsfolk: 3, outsider: 0, minion: 1, demon: 1 },
  6: { townsfolk: 3, outsider: 1, minion: 1, demon: 1 },
  7: { townsfolk: 5, outsider: 0, minion: 1, demon: 1 },
  8: { townsfolk: 5, outsider: 1, minion: 1, demon: 1 },
  9: { townsfolk: 5, outsider: 2, minion: 1, demon: 1 },
  10: { townsfolk: 7, outsider: 0, minion: 2, demon: 1 },
  11: { townsfolk: 7, outsider: 1, minion: 2, demon: 1 },
  12: { townsfolk: 7, outsider: 2, minion: 2, demon: 1 },
  13: { townsfolk: 9, outsider: 0, minion: 3, demon: 1 },
  14: { townsfolk: 9, outsider: 1, minion: 3, demon: 1 },
  15: { townsfolk: 9, outsider: 2, minion: 3, demon: 1 },
};

interface AssignmentResult {
  player: Player;
  role: Role;
  fromPref: boolean;
}

function assignCharacters(players: Player[], allRoles: Role[]): AssignmentResult[] | null {
  const N = players.length;
  if (N < 5) return null;

  const base = DISTRIBUTION[N] || { townsfolk: 0, outsider: 0, minion: 0, demon: 0 };

  const hasPref = (roleId: string) => players.some(p => 
    p.preferences.townsfolk.includes(roleId) ||
    p.preferences.outsider.includes(roleId) ||
    p.preferences.minion.includes(roleId) ||
    p.preferences.demon.includes(roleId)
  );

  const randomChoice = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  const selectRoleForPlayer = (player: Player, team: Role['team'], usedRoleIds: Set<string>): { role: Role; fromPref: boolean } => {
    const prefs = player.preferences[team] || [];
    // Exclude special setup roles from normal random assignment
    const availablePrefs = prefs.filter(id => 
      !usedRoleIds.has(id) && 
      id !== 'legion' && 
      id !== 'riot' && 
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
      r.id !== 'riot' &&
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
      r.id !== 'riot' &&
      r.id !== 'atheist' &&
      r.id !== 'drunk' &&
      r.id !== 'marionette'
    );
    return { role: randomChoice(fallbackRoles), fromPref: false };
  };

  // Perform a single initial shuffle to select candidate roles and modes based on the selected demon candidate
  const initialShuffledPlayers = shuffle(players);
  const demonCandidate = initialShuffledPlayers[0];

  const modes: ('normal' | 'legion' | 'riot' | 'atheist')[] = ['normal'];
  
  // Legion and Riot are only possible if the randomly selected demon candidate preferred them
  if (demonCandidate.preferences.demon.includes('legion')) {
    modes.push('legion');
  }
  if (demonCandidate.preferences.demon.includes('riot')) {
    modes.push('riot');
  }
  // Atheist remains randomized globally based on Townsfolk preferences
  if (hasPref('atheist')) {
    modes.push('atheist');
  }

  const mode = modes[Math.floor(Math.random() * modes.length)];

  if (mode === 'legion') {
    const L = Math.round(N * 0.6);
    const usedRoleIds = new Set<string>();
    const assignment: AssignmentResult[] = [];
    
    const legionRole = allRoles.find(r => r.id === 'legion')!;
    for (let i = 0; i < L; i++) {
      assignment.push({
        player: initialShuffledPlayers[i],
        role: legionRole,
        fromPref: initialShuffledPlayers[i].preferences.demon.includes('legion')
      });
    }
    
    for (let i = L; i < N; i++) {
      const p = initialShuffledPlayers[i];
      const { role, fromPref } = selectRoleForPlayer(p, 'townsfolk', usedRoleIds);
      usedRoleIds.add(role.id);
      assignment.push({ player: p, role, fromPref });
    }
    
    return assignment;
  }

  if (mode === 'riot') {
    const D = 1 + base.minion;
    const usedRoleIds = new Set<string>();
    const assignment: AssignmentResult[] = [];
    
    const riotRole = allRoles.find(r => r.id === 'riot')!;
    for (let i = 0; i < D; i++) {
      assignment.push({
        player: initialShuffledPlayers[i],
        role: riotRole,
        fromPref: initialShuffledPlayers[i].preferences.demon.includes('riot')
      });
    }
    
    for (let i = D; i < N; i++) {
      const p = initialShuffledPlayers[i];
      const { role, fromPref } = selectRoleForPlayer(p, 'townsfolk', usedRoleIds);
      usedRoleIds.add(role.id);
      assignment.push({ player: p, role, fromPref });
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
      player: initialShuffledPlayers[0],
      role: atheistRole,
      fromPref: initialShuffledPlayers[0].preferences.townsfolk.includes('atheist')
    });
    
    let assignedT = 1;
    for (let i = 1; i < N; i++) {
      const p = initialShuffledPlayers[i];
      if (assignedT < T) {
        let roleInfo;
        if (includeBalloonist && !usedRoleIds.has('balloonist') && (assignedT === T - 1 || Math.random() < 0.3)) {
          const role = allRoles.find(r => r.id === 'balloonist')!;
          roleInfo = { role, fromPref: p.preferences.townsfolk.includes('balloonist') };
        } else {
          roleInfo = selectRoleForPlayer(p, 'townsfolk', usedRoleIds);
        }
        usedRoleIds.add(roleInfo.role.id);
        assignment.push({ player: p, role: roleInfo.role, fromPref: roleInfo.fromPref });
        assignedT++;
      } else {
        const { role, fromPref } = selectRoleForPlayer(p, 'outsider', usedRoleIds);
        usedRoleIds.add(role.id);
        assignment.push({ player: p, role, fromPref });
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
    assignment.push({ player: demonPlayer, role: demonRole, fromPref: demonFromPref });
    
    const numMinions = base.minion + (demonRole.id === 'lilmonsta' ? 1 : 0);
    for (let i = 1; i <= numMinions; i++) {
      const minionPlayer = shuffledPlayers[i];
      const { role: minionRole, fromPref: minionFromPref } = selectRoleForPlayer(minionPlayer, 'minion', usedRoleIds);
      usedRoleIds.add(minionRole.id);
      assignment.push({ player: minionPlayer, role: minionRole, fromPref: minionFromPref });
    }
    
    const remainingPlayers = shuffledPlayers.slice(1 + numMinions);
    const tempAssignment: { player: Player; team: 'townsfolk' | 'outsider' }[] = [];
    for (let i = 0; i < remainingPlayers.length; i++) {
      const team = (i < base.outsider) ? 'outsider' : 'townsfolk';
      tempAssignment.push({ player: remainingPlayers[i], team });
    }
    
    const tempUsedRoleIds = new Set(usedRoleIds);
    const goodAssignments: AssignmentResult[] = [];
    for (const temp of tempAssignment) {
      const { role, fromPref } = selectRoleForPlayer(temp.player, temp.team, tempUsedRoleIds);
      tempUsedRoleIds.add(role.id);
      goodAssignments.push({ player: temp.player, role, fromPref });
    }
    
    const fullAssignment = [...assignment, ...goodAssignments];
    let valid = false;
    
    for (let adj = 0; adj < 10; adj++) {
      const hasBaron = fullAssignment.some(a => a.role.id === 'baron');
      const hasFangGu = fullAssignment.some(a => a.role.id === 'fanggu');
      const hasBalloonist = fullAssignment.some(a => a.role.id === 'balloonist');
      const hasGodfather = fullAssignment.some(a => a.role.id === 'godfather');
      
      const deltaOut = (hasBaron ? 2 : 0) + (hasFangGu ? 1 : 0) + (hasBalloonist ? 1 : 0);
      const currentOutsiders = fullAssignment.filter(a => a.role.team === 'outsider');
      
      const targetOutMin = base.outsider + deltaOut - (hasGodfather ? 1 : 0);
      const targetOutMax = base.outsider + deltaOut + (hasGodfather ? 1 : 0);
      
      let chosenTargetOut = base.outsider + deltaOut;
      if (hasGodfather) {
        if (currentOutsiders.length === targetOutMin) {
          chosenTargetOut = targetOutMin;
        } else if (currentOutsiders.length === targetOutMax) {
          chosenTargetOut = targetOutMax;
        } else {
          chosenTargetOut = Math.random() < 0.5 ? targetOutMin : targetOutMax;
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
          const otherTF = fullAssignment.find(a => a.role.team === 'townsfolk' && a.role.id !== 'choirboy' && a.role.id !== 'balloonist');
          if (otherTF) {
            const kingRole = allRoles.find(r => r.id === 'king')!;
            otherTF.role = kingRole;
            otherTF.fromPref = otherTF.player.preferences.townsfolk.includes('king');
          } else {
            jinxesMet = false;
          }
        }
        
        if (hasHuntsman && !hasDamsel) {
          const otherOut = fullAssignment.find(a => a.role.team === 'outsider');
          if (otherOut) {
            const damselRole = allRoles.find(r => r.id === 'damsel')!;
            otherOut.role = damselRole;
            otherOut.fromPref = otherOut.player.preferences.outsider.includes('damsel');
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
        if (roleCounts[id] > 1 && id !== 'legion' && id !== 'riot') {
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

const getPreferenceLabel = (prefs: string[], defaultLabel: string) => {
  if (prefs.length === 0) return defaultLabel;
  type RoleEntry = { id: string; name: string };
  const allRoles = rolesData as RoleEntry[];
  const names = prefs.map(id => allRoles.find(r => r.id === id)?.name || id);
  return names.join(', ');
};

export default function WhaleBucket() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [phase, setPhase] = useState<Phase>('setup');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDraftPlayerId, setActiveDraftPlayerId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<'night' | 'day'>('night');
  const [dayNumber, setDayNumber] = useState<number>(1);


  // Preference modal states
  const [activePrefModal, setActivePrefModal] = useState<{ playerId: string; team: Role['team'] } | null>(null);
  const [prefSearchTerm, setPrefSearchTerm] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isSearchingRole, setIsSearchingRole] = useState(false);
  const [modalRoleSearch, setModalRoleSearch] = useState('');

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('whale-bucket-game');
    if (saved) {
      try {
        const { players: p, phase: ph, timeOfDay: tod, dayNumber: dn } = JSON.parse(saved);
        type SavedPlayer = Omit<Player, 'preferences'> & { preferences?: Player['preferences'] };
        const validatedPlayers = (p || []).map((player: SavedPlayer) => ({
          ...player,
          preferences: player.preferences || { townsfolk: [], outsider: [], minion: [], demon: [] }
        }));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPlayers(validatedPlayers);
        setPhase(ph || 'setup');
        setTimeOfDay(tod || 'night');
        setDayNumber(dn || 1);

      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save to localStorage and update document theme
  useEffect(() => {
    localStorage.setItem('whale-bucket-game', JSON.stringify({ players, phase, timeOfDay, dayNumber }));
    
    if (phase === 'game' && timeOfDay === 'day') {
      document.documentElement.classList.add('theme-day');
    } else {
      document.documentElement.classList.remove('theme-day');
    }
    
    return () => {
      document.documentElement.classList.remove('theme-day');
    };
  }, [players, phase, timeOfDay, dayNumber]);

  const toggleTimeOfDay = () => {
    if (timeOfDay === 'night') {
      setTimeOfDay('day');
    } else {
      setTimeOfDay('night');
      setDayNumber(prev => prev + 1);
    }
  };

  const addPlayer = () => {
    if (players.length >= 15) return;
    const name = newPlayerName.trim() || `Player #${players.length + 1}`;
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      preferences: {
        townsfolk: [],
        outsider: [],
        minion: [],
        demon: []
      },
      isDead: false,
      isTheDrunk: false,
      isTheMarionette: false,
    };
    setPlayers([...players, newPlayer]);
    setNewPlayerName('');
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const updatePlayerName = (id: string, name: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, name } : p));
  };

  const togglePreference = (playerId: string, team: Role['team'], roleId: string) => {
    setPlayers(players.map(p => {
      if (p.id !== playerId) return p;
      const current = p.preferences[team] || [];
      const newPrefs = current.includes(roleId) ? [] : [roleId];
      return {
        ...p,
        preferences: {
          ...p.preferences,
          [team]: newPrefs
        }
      };
    }));
  };

  const autoFillPlayerPreferences = (playerId: string) => {
    const allRoles = rolesData as Role[];
    setPlayers(players.map(p => {
      if (p.id !== playerId) return p;
      const newPrefs = {
        townsfolk: p.preferences.townsfolk.length > 0 ? [...p.preferences.townsfolk] : [],
        outsider: p.preferences.outsider.length > 0 ? [...p.preferences.outsider] : [],
        minion: p.preferences.minion.length > 0 ? [...p.preferences.minion] : [],
        demon: p.preferences.demon.length > 0 ? [...p.preferences.demon] : []
      };
      
      const teams: ('townsfolk' | 'outsider' | 'minion' | 'demon')[] = ['townsfolk', 'outsider', 'minion', 'demon'];
      for (const team of teams) {
        if (newPrefs[team].length === 0) {
          const available = allRoles.filter(r => r.team === team);
          if (available.length > 0) {
            const randIdx = Math.floor(Math.random() * available.length);
            newPrefs[team] = [available[randIdx].id];
          }
        }
      }
      
      return { ...p, preferences: newPrefs };
    }));
  };

  const autoFillAllPreferences = () => {
    const allRoles = rolesData as Role[];
    setPlayers(players.map(p => {
      const newPrefs = {
        townsfolk: p.preferences.townsfolk.length > 0 ? [...p.preferences.townsfolk] : [],
        outsider: p.preferences.outsider.length > 0 ? [...p.preferences.outsider] : [],
        minion: p.preferences.minion.length > 0 ? [...p.preferences.minion] : [],
        demon: p.preferences.demon.length > 0 ? [...p.preferences.demon] : []
      };
      
      const teams: ('townsfolk' | 'outsider' | 'minion' | 'demon')[] = ['townsfolk', 'outsider', 'minion', 'demon'];
      for (const team of teams) {
        if (newPrefs[team].length === 0) {
          const available = allRoles.filter(r => r.team === team);
          if (available.length > 0) {
            const randIdx = Math.floor(Math.random() * available.length);
            newPrefs[team] = [available[randIdx].id];
          }
        }
      }
      
      return { ...p, preferences: newPrefs };
    }));
  };

  const clearAllPreferences = () => {
    if (confirm('Clear preferences for all players?')) {
      setPlayers(players.map(p => ({
        ...p,
        preferences: { townsfolk: [], outsider: [], minion: [], demon: [] }
      })));
    }
  };

  const runAssignment = () => {
    const result = assignCharacters(players, rolesData as Role[]);
    if (!result) {
      alert('Could not find a valid assignment matching standard/modified player counts. Try adding more preference options.');
      return;
    }
    
    const updatedPlayers = players.map(p => {
      const assigned = result.find(r => r.player.id === p.id);
      return {
        ...p,
        roleId: assigned?.fromPref ? assigned?.role.id : undefined,
        assignedFromPref: assigned?.fromPref || false,
        isTheDrunk: false,
        isTheMarionette: false,
      };
    });
    setPlayers(updatedPlayers);
    setPhase('draft');
  };

  const updatePlayerRole = (id: string, roleId: string) => {
    setPlayers(players.map(p => {
      if (p.id === id) {
        const role = (rolesData as Role[]).find(r => r.id === roleId);
        const isPref = role ? (p.preferences[role.team] || []).includes(roleId) : false;
        return {
          ...p,
          roleId: roleId || undefined,
          assignedFromPref: isPref,
        };
      }
      return p;
    }));
  };

  const togglePlayerDead = (id: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, isDead: !p.isDead } : p));
  };



  const togglePlayerTheDrunk = (id: string) => {
    setPlayers(players.map(p => {
      if (p.id === id) {
        const nextVal = !p.isTheDrunk;
        return {
          ...p,
          isTheDrunk: nextVal,
          isTheMarionette: nextVal ? false : p.isTheMarionette
        };
      }
      return p;
    }));
  };

  const togglePlayerTheMarionette = (id: string) => {
    setPlayers(players.map(p => {
      if (p.id === id) {
        const nextVal = !p.isTheMarionette;
        return {
          ...p,
          isTheMarionette: nextVal,
          isTheDrunk: nextVal ? false : p.isTheDrunk
        };
      }
      return p;
    }));
  };

  const closeDetailsModal = () => {
    setSelectedPlayerId(null);
    setIsSearchingRole(false);
    setModalRoleSearch('');
  };

  const resetGame = () => {
    if (confirm('Are you sure you want to reset the game? This clears all players and preferences.')) {
      setPlayers([]);
      setPhase('setup');
      setActiveDraftPlayerId(null);
      setSearchTerm('');
      setTimeOfDay('night');
      setDayNumber(1);
      localStorage.removeItem('whale-bucket-game');
    }
  };

  const validationSummary = useMemo(() => {
    if (phase === 'setup' || players.length === 0) return null;
    
    const N = players.length;
    const base = DISTRIBUTION[N] || { townsfolk: 0, outsider: 0, minion: 0, demon: 0 };
    
    const counts = players.reduce((acc, p) => {
      if (p.roleId) {
        if (p.isTheMarionette) {
          acc.minion++;
        } else if (p.isTheDrunk) {
          acc.outsider++;
        } else if (p.roleId === 'lilmonsta') {
          acc.minion++;
        } else {
          const role = (rolesData as Role[]).find(r => r.id === p.roleId);
          if (role) acc[role.team]++;
        }
      }
      return acc;
    }, { townsfolk: 0, outsider: 0, minion: 0, demon: 0 });
    
    const assignedRoles = players.map(p => {
      if (p.isTheMarionette) return (rolesData as Role[]).find(r => r.id === 'marionette');
      if (p.isTheDrunk) return (rolesData as Role[]).find(r => r.id === 'drunk');
      return (rolesData as Role[]).find(r => r.id === p.roleId);
    }).filter(Boolean) as Role[];
    const hasLegion = assignedRoles.some(r => r.id === 'legion');
    const hasRiot = assignedRoles.some(r => r.id === 'riot');
    const hasAtheist = assignedRoles.some(r => r.id === 'atheist');
    const hasBaron = assignedRoles.some(r => r.id === 'baron');
    const hasGodfather = assignedRoles.some(r => r.id === 'godfather');
    const hasFangGu = assignedRoles.some(r => r.id === 'fanggu');
    const hasBalloonist = assignedRoles.some(r => r.id === 'balloonist');
    const hasLilMonsta = assignedRoles.some(r => r.id === 'lilmonsta');
    
    let expectedDemon = base.demon;
    let expectedMinion = base.minion;
    let expectedOutsider = base.outsider;
    
    const modifications: string[] = [];
    
    if (hasLegion) {
      const L = Math.round(N * 0.6);
      expectedDemon = L;
      expectedMinion = 0;
      expectedOutsider = 0;
      modifications.push(`Legion active (${L} Demons, 0 Minions/Outsiders)`);
    } else if (hasRiot) {
      const D = 1 + base.minion;
      expectedDemon = D;
      expectedMinion = 0;
      expectedOutsider = 0;
      modifications.push(`Riot active (${D} Demons, 0 Minions/Outsiders)`);
    } else if (hasAtheist) {
      expectedDemon = 0;
      expectedMinion = 0;
      const delta = (hasBaron ? 2 : 0) + (hasFangGu ? 1 : 0) + (hasBalloonist ? 1 : 0);
      expectedOutsider = base.outsider + delta;
      modifications.push("Atheist (No Evil players)");
      if (hasBaron) modifications.push("Baron (+2 Outsiders)");
      if (hasFangGu) modifications.push("Fang Gu (+1 Outsider)");
      if (hasBalloonist) modifications.push("Balloonist (+1 Outsider)");
    } else {
      if (hasLilMonsta) {
        expectedMinion += 1;
        expectedDemon -= 1;
        modifications.push("Lil' Monsta (+1 Minion, -1 Demon)");
      }
      if (hasBaron) {
        expectedOutsider += 2;
        modifications.push("Baron (+2 Outsiders)");
      }
      if (hasFangGu) {
        expectedOutsider += 1;
        modifications.push("Fang Gu (+1 Outsider)");
      }
      if (hasBalloonist) {
        expectedOutsider += 1;
        modifications.push("Balloonist (+1 Outsider)");
      }
      if (hasGodfather) {
        modifications.push("Godfather (+1 or -1 Outsider)");
      }
    }
    
    const expectedTownsfolk = N - expectedDemon - expectedMinion - expectedOutsider;
    
    const isOutsiderValid = (hasGodfather && !hasLegion && !hasRiot)
      ? (counts.outsider === expectedOutsider + 1 || counts.outsider === expectedOutsider - 1)
      : counts.outsider === expectedOutsider;
    
    const isTownsfolkValid = (hasGodfather && !hasLegion && !hasRiot)
      ? (counts.townsfolk === N - expectedDemon - expectedMinion - (expectedOutsider + 1) ||
         counts.townsfolk === N - expectedDemon - expectedMinion - (expectedOutsider - 1))
      : counts.townsfolk === expectedTownsfolk;
    
    const isDemonValid = counts.demon === expectedDemon;
    const isMinionValid = counts.minion === expectedMinion;
    
    // Jinx checks
    const hasChoirboy = assignedRoles.some(r => r.id === 'choirboy');
    const hasKing = assignedRoles.some(r => r.id === 'king');
    const hasHuntsman = assignedRoles.some(r => r.id === 'huntsman');
    const hasDamsel = assignedRoles.some(r => r.id === 'damsel');
    
    const jinxWarnings: string[] = [];
    if (hasChoirboy && !hasKing) jinxWarnings.push("Choirboy in play, but no King assigned.");
    if (hasHuntsman && !hasDamsel) jinxWarnings.push("Huntsman in play, but no Damsel assigned.");
    
    const isValid = isDemonValid && isMinionValid && isOutsiderValid && isTownsfolkValid && jinxWarnings.length === 0;
    
    return {
      base,
      counts,
      expected: {
        townsfolk: expectedTownsfolk,
        outsider: expectedOutsider,
        minion: expectedMinion,
        demon: expectedDemon
      },
      hasGodfather,
      modifications,
      isDemonValid,
      isMinionValid,
      isOutsiderValid,
      isTownsfolkValid,
      jinxWarnings,
      isValid
    };
  }, [players, phase]);

  const filteredPrefRoles = useMemo(() => {
    if (!activePrefModal) return [];
    return (rolesData as Role[]).filter(r => 
      r.team === activePrefModal.team &&
      r.name.toLowerCase().includes(prefSearchTerm.toLowerCase())
    );
  }, [activePrefModal, prefSearchTerm]);

  const filteredRoles = useMemo(() => {
    return (rolesData as Role[]).filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const grimoireConfig = useMemo(() => {
    const count = players.length;
    if (count <= 6) {
      return {
        boardClass: "w-[88vw] h-[84vw] max-w-[560px] max-h-[520px] rounded-[28px]",
        radiusX: 38,
        radiusY: 36,
        btnStyle: { width: '25cqw', height: '25cqw' } as CSSProperties,
        dotStyle: { top: '6%', width: '1.8cqw', height: '1.8cqw' } as CSSProperties,
        nameStyle: { fontSize: '4.2cqw', maxWidth: '23cqw', marginTop: '0.5cqw' } as CSSProperties,
        roleStyle: { fontSize: '3.3cqw', maxWidth: '23cqw', marginTop: '0cqw' } as CSSProperties,
        charLimit: 16,
        tooltipClass: "top-18",
        centerBtnStyle: { width: '25cqw', height: '25cqw' } as CSSProperties,
        centerText1Style: { fontSize: '3.5cqw' } as CSSProperties,
        centerText2Style: { fontSize: '2.8cqw', marginTop: '0.1cqw' } as CSSProperties,
      };
    } else if (count <= 10) {
      return {
        boardClass: "w-[90vw] h-[86vw] max-w-[620px] max-h-[580px] rounded-[34px]",
        radiusX: 40,
        radiusY: 37,
        btnStyle: { width: '21cqw', height: '21cqw' } as CSSProperties,
        dotStyle: { top: '6%', width: '1.5cqw', height: '1.5cqw' } as CSSProperties,
        nameStyle: { fontSize: '3.6cqw', maxWidth: '19cqw', marginTop: '0.4cqw' } as CSSProperties,
        roleStyle: { fontSize: '2.8cqw', maxWidth: '19cqw', marginTop: '0cqw' } as CSSProperties,
        charLimit: 14,
        tooltipClass: "top-16",
        centerBtnStyle: { width: '21cqw', height: '21cqw' } as CSSProperties,
        centerText1Style: { fontSize: '2.9cqw' } as CSSProperties,
        centerText2Style: { fontSize: '2.3cqw', marginTop: '0.1cqw' } as CSSProperties,
      };
    } else {
      return {
        boardClass: "w-[92vw] h-[88vw] max-w-[680px] max-h-[620px] rounded-[40px]",
        radiusX: 42,
        radiusY: 38,
        btnStyle: { width: '16.5cqw', height: '16.5cqw' } as CSSProperties,
        dotStyle: { top: '6%', width: '1.2cqw', height: '1.2cqw' } as CSSProperties,
        nameStyle: { fontSize: '3.0cqw', maxWidth: '15cqw', marginTop: '0.3cqw' } as CSSProperties,
        roleStyle: { fontSize: '2.3cqw', maxWidth: '15cqw', marginTop: '0cqw' } as CSSProperties,
        charLimit: 12,
        tooltipClass: "top-14",
        centerBtnStyle: { width: '17cqw', height: '17cqw' } as CSSProperties,
        centerText1Style: { fontSize: '2.4cqw' } as CSSProperties,
        centerText2Style: { fontSize: '1.9cqw', marginTop: '0.1cqw' } as CSSProperties,
      };
    }
  }, [players.length]);

  return (
    <div className={cn(
      "min-h-screen p-4 font-sans mx-auto transition-colors duration-300",
      phase === 'game' 
        ? "max-w-xl md:max-w-6xl landscape:max-w-6xl" 
        : "max-w-xl",
      phase === 'game' && timeOfDay === 'day'
        ? "text-clocktower-night"
        : "text-clocktower-parchment"
    )}>
      <header className={cn(
        "flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 border-b pb-2 gap-3 sm:gap-0",
        phase === 'game' && timeOfDay === 'day' ? "border-clocktower-blood/20" : "border-clocktower-blood"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative flex justify-center items-center w-full sm:w-auto sm:justify-start sm:gap-3">
            <a href="#/" className={cn("absolute left-0 transition-colors text-sm sm:static", phase === 'game' && timeOfDay === 'day' ? "text-gray-600 hover:text-gray-800" : "text-gray-500 hover:text-gray-300")}>← Home</a>
            <h1 className="text-2xl font-bold text-clocktower-blood tracking-wide text-center sm:text-left">Whale Bucket</h1>
            <button id="reset-game-button" onClick={resetGame} className={cn("absolute right-0 p-2 transition-colors sm:hidden", phase === 'game' && timeOfDay === 'day' ? "text-gray-600 hover:text-gray-900" : "text-gray-500 hover:text-white")} title="Reset game">
              <RefreshCcw size={20} />
            </button>
          </div>
          <div id="character-type-legend" className="flex justify-center sm:justify-start gap-2.5 text-[9px] font-bold tracking-wider text-gray-500 w-full sm:w-auto">
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-clocktower-townsfolk" /> Townsfolk</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-clocktower-outsider" /> Outsider</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-clocktower-minion" /> Minion</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-clocktower-demon" /> Demon</span>
          </div>
        </div>
        <button id="reset-game-button-desktop" onClick={resetGame} className={cn("hidden sm:block p-2 transition-colors", phase === 'game' && timeOfDay === 'day' ? "text-gray-600 hover:text-gray-900" : "text-gray-500 hover:text-white")} title="Reset game">
          <RefreshCcw size={20} />
        </button>
      </header>

      {phase === 'setup' && (
        <div className="space-y-6">
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-300">1. Seating & Preferences ({players.length})</h2>
              {players.length > 0 && (
                <div className="flex gap-2">
                  <button 
                    onClick={autoFillAllPreferences} 
                    className="text-[10px] bg-clocktower-townsfolk/10 text-clocktower-townsfolk border border-clocktower-townsfolk/20 px-2 py-1 rounded hover:bg-clocktower-townsfolk/25 transition-all"
                  >
                    Auto-Fill All
                  </button>
                  <button 
                    onClick={clearAllPreferences} 
                    className="text-[10px] bg-gray-800 text-gray-400 border border-gray-700 px-2 py-1 rounded hover:bg-gray-700 transition-all"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                disabled={players.length >= 15}
                placeholder={players.length >= 15 ? "Maximum players reached (15)" : "Enter player name in seating order..."}
                className="flex-1 bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-clocktower-blood text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button 
                onClick={addPlayer} 
                disabled={players.length >= 15}
                className={cn(
                  "px-4 py-2 rounded transition-colors text-white",
                  players.length >= 15 
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50 border border-gray-800" 
                    : "bg-clocktower-blood hover:bg-red-800 border border-clocktower-blood"
                )}
              >
                <Plus size={20} />
              </button>
            </div>


            
            <div className="space-y-3">
              {players.map((p, index) => (
                <div key={p.id} className="bg-gray-900/60 p-3 rounded-lg border border-gray-800/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-mono w-5">#{index + 1}</span>
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => updatePlayerName(p.id, e.target.value)}
                      className="flex-grow font-semibold text-gray-200 bg-transparent border-b border-transparent hover:border-gray-800/80 focus:border-clocktower-blood focus:outline-none px-1.5 py-0.5 rounded transition-all"
                    />
                    <button
                      onClick={() => autoFillPlayerPreferences(p.id)}
                      className="text-[10px] text-clocktower-townsfolk hover:underline flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-clocktower-townsfolk/5 border border-clocktower-townsfolk/20"
                      title="Auto-fill random preferences for this player"
                    >
                      <Shuffle size={10} /> Auto
                    </button>
                    <button onClick={() => removePlayer(p.id)} className="text-gray-600 hover:text-red-500 p-1 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  {/* Preference buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        setActivePrefModal({ playerId: p.id, team: 'townsfolk' });
                        setPrefSearchTerm('');
                      }}
                      title={getPreferenceLabel(p.preferences.townsfolk, "No Townsfolk preference")}
                      className={cn(
                        "text-[10px] font-bold py-1.5 px-0.5 rounded border transition-all text-center truncate block w-full whitespace-nowrap",
                        p.preferences.townsfolk.length > 0
                          ? "bg-clocktower-townsfolk/15 border-clocktower-townsfolk/40 text-clocktower-townsfolk"
                          : "bg-gray-950/40 border-gray-800 text-gray-500 hover:border-gray-700"
                      )}
                    >
                      {getPreferenceLabel(p.preferences.townsfolk, "TF")}
                    </button>
                    <button
                      onClick={() => {
                        setActivePrefModal({ playerId: p.id, team: 'outsider' });
                        setPrefSearchTerm('');
                      }}
                      title={getPreferenceLabel(p.preferences.outsider, "No Outsider preference")}
                      className={cn(
                        "text-[10px] font-bold py-1.5 px-0.5 rounded border transition-all text-center truncate block w-full whitespace-nowrap",
                        p.preferences.outsider.length > 0
                          ? "bg-clocktower-outsider/15 border-clocktower-outsider/40 text-clocktower-outsider"
                          : "bg-gray-950/40 border-gray-800 text-gray-500 hover:border-gray-700"
                      )}
                    >
                      {getPreferenceLabel(p.preferences.outsider, "OUT")}
                    </button>
                    <button
                      onClick={() => {
                        setActivePrefModal({ playerId: p.id, team: 'minion' });
                        setPrefSearchTerm('');
                      }}
                      title={getPreferenceLabel(p.preferences.minion, "No Minion preference")}
                      className={cn(
                        "text-[10px] font-bold py-1.5 px-0.5 rounded border transition-all text-center truncate block w-full whitespace-nowrap",
                        p.preferences.minion.length > 0
                          ? "bg-clocktower-minion/15 border-clocktower-minion/40 text-clocktower-minion"
                          : "bg-gray-950/40 border-gray-800 text-gray-500 hover:border-gray-700"
                      )}
                    >
                      {getPreferenceLabel(p.preferences.minion, "MIN")}
                    </button>
                    <button
                      onClick={() => {
                        setActivePrefModal({ playerId: p.id, team: 'demon' });
                        setPrefSearchTerm('');
                      }}
                      title={getPreferenceLabel(p.preferences.demon, "No Demon preference")}
                      className={cn(
                        "text-[10px] font-bold py-1.5 px-0.5 rounded border transition-all text-center truncate block w-full whitespace-nowrap",
                        p.preferences.demon.length > 0
                          ? "bg-clocktower-demon/15 border-clocktower-demon/40 text-clocktower-demon"
                          : "bg-gray-950/40 border-gray-800 text-gray-500 hover:border-gray-700"
                      )}
                    >
                      {getPreferenceLabel(p.preferences.demon, "DEM")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-gray-900 p-4 rounded-lg border border-gray-850">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Standard Base Distribution</h3>
            {players.length >= 5 ? (
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
                <div className="p-2 rounded bg-gray-950/40 border border-gray-800 text-clocktower-townsfolk">
                  TS: {(DISTRIBUTION[players.length] || { townsfolk: 0 }).townsfolk}
                </div>
                <div className="p-2 rounded bg-gray-950/40 border border-gray-800 text-clocktower-outsider">
                  O: {(DISTRIBUTION[players.length] || { outsider: 0 }).outsider}
                </div>
                <div className="p-2 rounded bg-gray-950/40 border border-gray-800 text-clocktower-minion">
                  M: {(DISTRIBUTION[players.length] || { minion: 0 }).minion}
                </div>
                <div className="p-2 rounded bg-gray-950/40 border border-gray-800 text-clocktower-demon">
                  D: {(DISTRIBUTION[players.length] || { demon: 0 }).demon}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Add at least 5 players to view distribution.</p>
            )}
          </section>



          <button
            disabled={players.length < 5}
            onClick={runAssignment}
            className="w-full bg-clocktower-blood hover:bg-red-800 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/40 flex items-center justify-center gap-2"
          >
            <Sparkles size={16} /> Randomly Assign Characters
          </button>
        </div>
      )}      {phase === 'draft' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-300">2. Character Draft Assignment</h2>
            <button
              onClick={runAssignment}
              className="text-xs text-clocktower-townsfolk flex items-center gap-1 hover:underline font-semibold"
            >
              <Shuffle size={12} /> Re-Assign
            </button>
          </div>

          <div className="space-y-2.5">
            {players.map(p => {
              const roleObj = (rolesData as Role[]).find(r => r.id === p.roleId);
              return (
                <div key={p.id} className="bg-gray-900 p-3 rounded-lg border border-gray-855 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-200">{p.name}</span>
                    <div className="flex items-center gap-2">
                      {p.isTheDrunk && (
                        <span className="text-[8px] font-black text-black bg-yellow-600 border border-yellow-750 px-1 py-0.5 rounded uppercase">
                          THE DRUNK
                        </span>
                      )}
                      {p.isTheMarionette && (
                        <span className="text-[8px] font-black text-white bg-clocktower-minion border border-clocktower-minion/30 px-1 py-0.5 rounded uppercase">
                          THE MARIONETTE
                        </span>
                      )}
                      {p.assignedFromPref ? (
                        <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1 rounded flex items-center gap-0.5">
                          ★ PREF
                        </span>
                      ) : (
                        <span className="text-[8px] font-medium text-gray-500 bg-gray-950 px-1 rounded border border-gray-850">
                          FALLBACK
                        </span>
                      )}
                      <span className={cn(
                        "text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border",
                        roleObj?.team === 'townsfolk' && "text-clocktower-townsfolk border-clocktower-townsfolk/40 bg-clocktower-townsfolk/5",
                        roleObj?.team === 'outsider' && "text-clocktower-outsider border-clocktower-outsider/40 bg-clocktower-outsider/5",
                        roleObj?.team === 'minion' && "text-clocktower-minion border-clocktower-minion/40 bg-clocktower-minion/5",
                        roleObj?.team === 'demon' && "text-clocktower-demon border-clocktower-demon/40 bg-clocktower-demon/5",
                      )}>
                        {roleObj?.team || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {!p.roleId ? (
                    <div className="relative">
                      <div 
                        onClick={() => setActiveDraftPlayerId(p.id)}
                        className="flex items-center bg-gray-800/50 rounded px-3 py-1.5 border border-gray-700/60 cursor-text text-sm text-gray-400"
                      >
                        Tap to select character...
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-gray-955/40 px-3 py-2 rounded border border-gray-850">
                        <span className={cn(
                          "font-semibold text-sm",
                          roleObj?.team === 'townsfolk' && "text-clocktower-townsfolk",
                          roleObj?.team === 'outsider' && "text-clocktower-outsider",
                          roleObj?.team === 'minion' && "text-clocktower-minion",
                          roleObj?.team === 'demon' && "text-clocktower-demon",
                        )}>
                          {roleObj?.name}
                        </span>
                        <button onClick={() => setActiveDraftPlayerId(p.id)} className="text-gray-500 hover:text-gray-300 text-xs underline font-medium">
                          Change
                        </button>
                      </div>

                      {/* Secret Role Draft Toggles */}
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => togglePlayerTheDrunk(p.id)}
                          className={cn(
                            "px-2.5 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1",
                            p.isTheDrunk
                              ? "bg-yellow-600 border-yellow-755 text-black font-black"
                              : "bg-gray-950 border-gray-855 text-gray-500 hover:text-gray-400"
                          )}
                        >
                          🍺 The Drunk
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePlayerTheMarionette(p.id)}
                          className={cn(
                            "px-2.5 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1",
                            p.isTheMarionette
                              ? "bg-clocktower-minion border-clocktower-minion/40 text-white font-black"
                              : "bg-gray-950 border-gray-855 text-gray-500 hover:text-gray-400"
                          )}
                        >
                          🎭 The Marionette
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Validation Summary Card */}
          {validationSummary && (
            <div className="bg-gray-900/90 border border-gray-800 rounded-lg p-3 space-y-2.5">
              <div className="flex items-center gap-1.5">
                {validationSummary.isValid ? (
                  <CheckCircle size={16} className="text-clocktower-outsider" />
                ) : (
                  <AlertTriangle size={16} className="text-clocktower-minion" />
                )}
                <span className="font-semibold text-xs tracking-wide uppercase text-gray-300">
                  Grimoire Balance Verification
                </span>
              </div>

              {validationSummary.modifications.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {validationSummary.modifications.map((m, idx) => (
                    <span key={idx} className="text-[9px] bg-clocktower-blood/10 border border-clocktower-blood/30 text-clocktower-parchment/80 px-1.5 py-0.5 rounded font-medium">
                      {m}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono border-t border-gray-800 pt-2.5">
                <div>
                  <div className="text-gray-500">TF</div>
                  <div className={cn("font-bold text-xs mt-0.5", validationSummary.isTownsfolkValid ? "text-clocktower-townsfolk" : "text-yellow-500")}>
                    {validationSummary.counts.townsfolk} / {validationSummary.expected.townsfolk}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">OUT</div>
                  <div className={cn("font-bold text-xs mt-0.5", validationSummary.isOutsiderValid ? "text-clocktower-outsider" : "text-yellow-500")}>
                    {validationSummary.counts.outsider} / {validationSummary.hasGodfather ? `${validationSummary.expected.outsider - 1} or ${validationSummary.expected.outsider + 1}` : validationSummary.expected.outsider}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">MIN</div>
                  <div className={cn("font-bold text-xs mt-0.5", validationSummary.isMinionValid ? "text-clocktower-minion" : "text-yellow-500")}>
                    {validationSummary.counts.minion} / {validationSummary.expected.minion}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">DEM</div>
                  <div className={cn("font-bold text-xs mt-0.5", validationSummary.isDemonValid ? "text-clocktower-demon" : "text-yellow-500")}>
                    {validationSummary.counts.demon} / {validationSummary.expected.demon}
                  </div>
                </div>
              </div>

              {validationSummary.jinxWarnings.length > 0 && (
                <div className="border-t border-gray-800 pt-2 space-y-1">
                  {validationSummary.jinxWarnings.map((w, idx) => (
                    <div key={idx} className="text-[10px] text-yellow-500 flex items-center gap-1 font-medium">
                      <AlertTriangle size={10} /> {w}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setPhase('setup')} className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-lg font-bold transition-colors">
              Back to Setup
            </button>
            <button
              disabled={players.some(p => !p.roleId)}
              onClick={() => setPhase('game')}
              className="flex-[2] bg-clocktower-blood hover:bg-red-800 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-40 shadow-lg shadow-black/40"
            >
              Open Grimoire
            </button>
          </div>
        </div>
      )}

      {phase === 'game' && (
        <div className="space-y-6 animate-fadeIn md:grid md:grid-cols-[3fr_2fr] md:gap-8 md:space-y-0 md:items-start landscape:grid landscape:grid-cols-[3fr_2fr] landscape:gap-6 landscape:space-y-0 landscape:items-start">
          {/* Column 1: Board Visual & Header */}
          <div className="space-y-4">

            <div id="grimoire-circle-board" className={cn(
              "relative border shadow-inner flex items-center justify-center overflow-visible my-4 mx-auto transition-colors duration-300",
              timeOfDay === 'day'
                ? "bg-white/50 border-gray-300 shadow-gray-200/50"
                : "bg-gray-950/40 border-gray-900/60 shadow-black/45",
              grimoireConfig.boardClass
            )}
            style={{ containerType: 'size' }}
            >
              <button
                onClick={toggleTimeOfDay}
                style={grimoireConfig.centerBtnStyle}
                className={cn(
                  "absolute rounded-full border flex flex-col items-center justify-center transition-all cursor-pointer z-20 select-none shadow-md",
                  timeOfDay === 'day'
                    ? "bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100/70"
                    : "bg-clocktower-night/50 border-clocktower-blood/20 text-clocktower-parchment hover:bg-clocktower-blood/10"
                )}
                title="Click to toggle Day/Night"
              >
                <span 
                  style={grimoireConfig.centerText1Style}
                  className={cn(
                    "font-serif tracking-widest font-bold transition-colors",
                    timeOfDay === 'day' ? "text-yellow-600" : "text-clocktower-blood/60"
                  )}
                >
                  BOTC
                </span>
                <span 
                  style={grimoireConfig.centerText2Style}
                  className="font-bold font-mono uppercase tracking-wide"
                >
                  {timeOfDay} {dayNumber}
                </span>
              </button>

              {players.map((p, index) => {
                const total = players.length;
                const angle = (index * (360 / total) - 90) * (Math.PI / 180);
                
                const leftPos = 50 + grimoireConfig.radiusX * Math.cos(angle);
                const topPos = 50 + grimoireConfig.radiusY * Math.sin(angle);

                const roleObj = (rolesData as Role[]).find(r => r.id === p.roleId);

                return (
                  <div 
                    key={p.id}
                    style={{
                      position: 'absolute',
                      left: `${leftPos}%`,
                      top: `${topPos}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className="z-10 hover:z-50 group"
                  >
                    <div className="relative flex flex-col items-center">
                      <button
                        onClick={() => setSelectedPlayerId(p.id)}
                        style={grimoireConfig.btnStyle}
                        className={cn(
                          "rounded-full border-2 flex flex-col items-center justify-center transition-all shadow-md relative",
                          timeOfDay === 'day'
                            ? p.isDead
                              ? "bg-gray-200 border-gray-300 text-gray-400 scale-95 opacity-50"
                              : "bg-white border-gray-300 text-clocktower-night hover:border-gray-400 hover:bg-gray-50"
                            : p.isDead
                              ? "bg-black border-gray-800 text-gray-655 scale-95 opacity-50" 
                              : "bg-gray-900 border-gray-700 text-clocktower-parchment hover:border-gray-500"
                        )}
                      >
                        <div 
                          style={grimoireConfig.dotStyle}
                          className={cn(
                            "absolute rounded-full shadow-xs",
                            roleObj?.team === 'townsfolk' && "bg-clocktower-townsfolk",
                            roleObj?.team === 'outsider' && "bg-clocktower-outsider",
                            roleObj?.team === 'minion' && "bg-clocktower-minion",
                            roleObj?.team === 'demon' && "bg-clocktower-demon",
                          )} 
                        />

                        <span 
                          style={grimoireConfig.nameStyle}
                          className={cn(
                            "font-bold font-sans tracking-tighter truncate text-center leading-tight",
                            p.isDead && "line-through",
                            timeOfDay === 'day'
                              ? p.isDead ? "text-gray-400" : "text-clocktower-night font-bold"
                              : p.isDead ? "text-gray-700" : "text-clocktower-parchment"
                          )}
                        >
                          {p.name.substring(0, grimoireConfig.charLimit)}
                        </span>

                        <span 
                          style={grimoireConfig.roleStyle}
                          className={cn(
                            "font-semibold truncate leading-none text-gray-400 px-0.5 text-center",
                            roleObj?.team === 'townsfolk' && "text-clocktower-townsfolk/85",
                            roleObj?.team === 'outsider' && "text-clocktower-outsider/85",
                            roleObj?.team === 'minion' && "text-clocktower-minion/85",
                            roleObj?.team === 'demon' && "text-clocktower-demon/85",
                            p.isDead && "line-through opacity-50"
                          )}
                        >
                          {roleObj?.name.substring(0, grimoireConfig.charLimit)}
                        </span>
                        {p.isTheDrunk && (
                          <span className="absolute bottom-0 bg-yellow-600 text-black text-[7px] font-black px-1 rounded-sm border border-yellow-700 shadow-sm leading-tight translate-y-1/2 z-20">
                            THE DRUNK
                          </span>
                        )}
                        {p.isTheMarionette && (
                          <span className="absolute bottom-0 bg-clocktower-minion text-white text-[7px] font-black px-1 rounded-sm border border-clocktower-minion/40 shadow-sm leading-tight translate-y-1/2 z-20">
                            THE MARIONETTE
                          </span>
                        )}
                      </button>

                      <div className={cn("absolute scale-0 group-hover:scale-100 bg-gray-900/95 border border-gray-800 p-2 rounded text-center shadow-xl transition-all z-50 pointer-events-none min-w-[100px]", grimoireConfig.tooltipClass)}>
                        <p className="font-bold text-xs text-white">{p.name}</p>
                        <p className={cn(
                          "text-[10px] font-medium",
                          roleObj?.team === 'townsfolk' && "text-clocktower-townsfolk",
                          roleObj?.team === 'outsider' && "text-clocktower-outsider",
                          roleObj?.team === 'minion' && "text-clocktower-minion",
                          roleObj?.team === 'demon' && "text-clocktower-demon",
                        )}>{roleObj?.name}</p>
                        <p className="text-[8px] text-gray-500 italic mt-0.5">
                          {p.isDead ? 'Dead' : 'Alive'} {p.isTheDrunk ? '(The Drunk)' : ''} {p.isTheMarionette ? '(The Marionette)' : ''}
                        </p>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Ledger & Controls */}
          <div className="space-y-6 md:pt-10 landscape:pt-10">
            <button
              onClick={() => setPhase('draft')}
              className={cn(
                "w-full py-3 rounded-lg font-bold transition-all text-sm shadow-md",
                timeOfDay === 'day'
                  ? "bg-white hover:bg-gray-50 text-clocktower-night border border-gray-300"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              )}
            >
              Return to Draft Screen
            </button>

            <div className={cn(
              "rounded-lg border p-3 space-y-1.5 transition-colors duration-300",
              timeOfDay === 'day'
                ? "bg-white/50 border-gray-300 text-clocktower-night"
                : "bg-gray-900/40 border-gray-800/80"
            )}>
              <h4 className={cn(
                "text-[10px] uppercase font-bold tracking-wider",
                timeOfDay === 'day' ? "text-gray-600" : "text-gray-500"
              )}>Grimoire Ledger Reference</h4>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                {players.map((p, index) => {
                  const rObj = (rolesData as Role[]).find(r => r.id === p.roleId);
                  return (
                    <div key={p.id} onClick={() => setSelectedPlayerId(p.id)} className={cn(
                      "flex items-center gap-1.5 py-0.5 px-1.5 rounded border transition-colors min-w-0 cursor-pointer hover:ring-1 hover:ring-gray-500/50",
                      p.isDead && "opacity-45",
                      timeOfDay === 'day'
                        ? "bg-white/40 border-gray-200 hover:bg-white/70"
                        : "bg-gray-950/20 border-gray-900/40 hover:bg-gray-900/60"
                    )}>
                      <span className={cn("text-[9px] font-mono w-4 shrink-0", timeOfDay === 'day' ? "text-gray-500" : "text-gray-600")}>{index + 1}</span>
                      <span className={cn(
                        "font-medium truncate flex-1 min-w-0",
                        p.isDead && "line-through text-gray-500",
                        timeOfDay === 'day' && !p.isDead ? "text-clocktower-night" : "text-gray-200"
                      )}>{p.name}</span>
                      <span className={cn(
                        "font-semibold text-[10px] flex items-center gap-1 shrink-0 max-w-[45%] min-w-0",
                        rObj?.team === 'townsfolk' && "text-clocktower-townsfolk",
                        rObj?.team === 'outsider' && "text-clocktower-outsider",
                        rObj?.team === 'minion' && "text-clocktower-minion",
                        rObj?.team === 'demon' && "text-clocktower-demon",
                      )}>
                        <span className="truncate">{rObj?.name ?? '—'}</span>
                        {p.isTheDrunk && <span className="text-[8px] bg-yellow-600 text-black px-0.5 rounded leading-none shrink-0">DK</span>}
                        {p.isTheMarionette && <span className="text-[8px] bg-clocktower-minion text-white px-0.5 rounded leading-none shrink-0">MN</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- Preference Selection Modal ----------------- */}
      {activePrefModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-lg p-4 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-white">
                  Select {activePrefModal.team === 'townsfolk' ? 'Townsfolk' : activePrefModal.team === 'outsider' ? 'Outsiders' : activePrefModal.team === 'minion' ? 'Minions' : 'Demons'}
                </h3>
                <p className="text-xs text-gray-500">
                  For {players.find(p => p.id === activePrefModal.playerId)?.name} (select 1)
                </p>
              </div>
              <button onClick={() => setActivePrefModal(null)} className="text-xs text-clocktower-townsfolk hover:underline font-bold">
                Done
              </button>
            </div>

            <div className="flex items-center bg-gray-955 border border-gray-800 rounded px-2.5 py-1.5 text-sm">
              <Search size={14} className="text-gray-500 mr-2" />
              <input
                type="text"
                placeholder={`Search character name...`}
                className="bg-transparent flex-1 outline-none text-white text-xs placeholder-gray-600"
                value={prefSearchTerm}
                onChange={(e) => setPrefSearchTerm(e.target.value)}
              />
            </div>

            <div className="overflow-y-auto flex-1 border border-gray-800 rounded bg-gray-950/40 divide-y divide-gray-800/60 pr-1">
              {filteredPrefRoles.map(role => {
                const isSelected = players
                  .find(p => p.id === activePrefModal.playerId)
                  ?.preferences[activePrefModal.team].includes(role.id);
                
                return (
                  <button
                    key={role.id}
                    onClick={() => {
                      togglePreference(activePrefModal.playerId, activePrefModal.team, role.id);
                      setActivePrefModal(null);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2.5 hover:bg-gray-800 text-xs transition-colors flex justify-between items-center",
                      isSelected && "bg-gray-800/30"
                    )}
                  >
                    <span className={cn(
                      "font-semibold text-xs",
                      role.team === 'townsfolk' && "text-clocktower-townsfolk",
                      role.team === 'outsider' && "text-clocktower-outsider",
                      role.team === 'minion' && "text-clocktower-minion",
                      role.team === 'demon' && "text-clocktower-demon",
                    )}>
                      {role.name}
                    </span>
                    {isSelected ? (
                      <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-550/20 px-1.5 py-0.5 rounded font-black">
                        ✓ ACTIVE
                      </span>
                    ) : (
                      <span className="text-[9px] text-gray-650 font-mono">+ ADD</span>
                    )}
                  </button>
                );
              })}
              {filteredPrefRoles.length === 0 && (
                <div className="p-4 text-xs text-gray-500 italic text-center">No characters found.</div>
              )}
            </div>
            
            <div className="flex justify-between items-center pt-2.5 border-t border-gray-800">
              <button
                onClick={() => {
                  const p = players.find(x => x.id === activePrefModal.playerId);
                  if (p) {
                    setPlayers(players.map(x => x.id === p.id ? {
                      ...x,
                      preferences: { ...x.preferences, [activePrefModal.team]: [] }
                    } : x));
                  }
                }}
                className="text-xs text-gray-500 hover:text-red-400 hover:underline"
              >
                Clear Selection
              </button>
              <button
                onClick={() => {
                  const p = players.find(x => x.id === activePrefModal.playerId);
                  if (p) {
                    const available = (rolesData as Role[]).filter(r => r.team === activePrefModal.team);
                    if (available.length > 0) {
                      const randIdx = Math.floor(Math.random() * available.length);
                      const r = available[randIdx];
                      setPlayers(players.map(x => x.id === p.id ? {
                        ...x,
                        preferences: { ...x.preferences, [activePrefModal.team]: [r.id] }
                      } : x));
                    }
                  }
                  setActivePrefModal(null);
                }}
                className="text-xs text-clocktower-townsfolk hover:underline font-semibold"
              >
                Select Random
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- Manual Override / Search Select Modal ----------------- */}
      {activeDraftPlayerId && (() => {
        const draftPlayer = players.find(p => p.id === activeDraftPlayerId);
        const preferredIds = draftPlayer ? [
          ...(draftPlayer.preferences.townsfolk || []),
          ...(draftPlayer.preferences.outsider || []),
          ...(draftPlayer.preferences.minion || []),
          ...(draftPlayer.preferences.demon || []),
        ] : [];
        const preferredRoles = filteredRoles.filter(r => preferredIds.includes(r.id));
        const otherRoles = filteredRoles.filter(r => !preferredIds.includes(r.id));

        return (
          <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-lg p-4 space-y-3 max-h-[80vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-gray-300">
                  Change Role for {draftPlayer?.name}
                </h3>
                <button onClick={() => { setActiveDraftPlayerId(null); setSearchTerm(''); }} className="text-xs text-gray-500 underline">
                  Close
                </button>
              </div>
              
              <div className="flex items-center bg-gray-955 border border-gray-855 rounded px-3 py-2 text-sm">
                <Search size={14} className="text-gray-500 mr-2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search character name..."
                  className="bg-transparent flex-1 outline-none text-xs text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="overflow-y-auto flex-1 border border-gray-800 rounded bg-gray-955/40 divide-y divide-gray-800/60 pr-1">
                {preferredRoles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => {
                      updatePlayerRole(activeDraftPlayerId, role.id);
                      setActiveDraftPlayerId(null);
                      setSearchTerm('');
                    }}
                    className="w-full text-left px-3 py-2.5 bg-amber-500/5 hover:bg-amber-500/10 text-xs transition-colors flex justify-between items-center"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "font-semibold text-xs",
                        role.team === 'townsfolk' && "text-clocktower-townsfolk",
                        role.team === 'outsider' && "text-clocktower-outsider",
                        role.team === 'minion' && "text-clocktower-minion",
                        role.team === 'demon' && "text-clocktower-demon",
                      )}>
                        {role.name}
                      </span>
                      <span className="text-[8px] bg-amber-500/25 text-amber-400 px-1 rounded-sm uppercase font-extrabold tracking-wider leading-none">
                        ★ Pick
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-mono text-gray-650">{role.team[0]}</span>
                  </button>
                ))}

                {otherRoles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => {
                      updatePlayerRole(activeDraftPlayerId, role.id);
                      setActiveDraftPlayerId(null);
                      setSearchTerm('');
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-800 text-xs transition-colors flex justify-between items-center"
                  >
                    <span className={cn(
                      "font-semibold text-xs",
                      role.team === 'townsfolk' && "text-clocktower-townsfolk",
                      role.team === 'outsider' && "text-clocktower-outsider",
                      role.team === 'minion' && "text-clocktower-minion",
                      role.team === 'demon' && "text-clocktower-demon",
                    )}>
                      {role.name}
                    </span>
                    <span className="text-[10px] uppercase font-mono text-gray-650">{role.team[0]}</span>
                  </button>
                ))}

                {filteredRoles.length === 0 && (
                  <div className="p-3 text-xs text-gray-500 italic text-center">No matching roles found.</div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ----------------- Player Detail Modal ----------------- */}
      {selectedPlayerId && (() => {
        const p = players.find(x => x.id === selectedPlayerId);
        if (!p) return null;
        const roleObj = (rolesData as Role[]).find(r => r.id === p.roleId);
        const filteredModalRoles = (rolesData as Role[]).filter(r =>
          r.name.toLowerCase().includes(modalRoleSearch.toLowerCase())
        );
        const currentIndex = players.findIndex(x => x.id === selectedPlayerId);
        const prevPlayer = players[(currentIndex - 1 + players.length) % players.length];
        const nextPlayer = players[(currentIndex + 1) % players.length];

        return (
          <div 
            onClick={closeDetailsModal}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "border w-full max-w-sm rounded-lg p-5 space-y-4 shadow-2xl transition-colors duration-300",
                timeOfDay === 'day' 
                  ? "bg-clocktower-parchment border-clocktower-blood/20 text-clocktower-night" 
                  : "bg-gray-900 border-gray-800 text-clocktower-parchment"
              )}
            >
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setSelectedPlayerId(prevPlayer.id)}
                  title={prevPlayer.name}
                  className={cn(
                    "p-1.5 rounded-lg border transition-colors",
                    timeOfDay === 'day'
                      ? "border-gray-300 text-gray-600 hover:bg-gray-100"
                      : "border-gray-700 text-gray-400 hover:bg-gray-800"
                  )}
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="text-center">
                  <h3 className={cn("font-bold text-xl", timeOfDay === 'day' ? "text-clocktower-night" : "text-white")}>
                    Player Details
                  </h3>
                  <p className={cn("text-xs", timeOfDay === 'day' ? "text-gray-600" : "text-gray-400")}>
                    {currentIndex + 1} of {players.length}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlayerId(nextPlayer.id)}
                    title={nextPlayer.name}
                    className={cn(
                      "p-1.5 rounded-lg border transition-colors",
                      timeOfDay === 'day'
                        ? "border-gray-300 text-gray-600 hover:bg-gray-100"
                        : "border-gray-700 text-gray-400 hover:bg-gray-800"
                    )}
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={closeDetailsModal}
                    className={cn(
                      "text-sm font-semibold hover:underline",
                      timeOfDay === 'day' ? "text-clocktower-blood" : "text-clocktower-townsfolk"
                    )}
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Player Info Card */}
              <div className={cn(
                "p-4 rounded-lg border space-y-3",
                timeOfDay === 'day' 
                  ? "bg-white/60 border-gray-300" 
                  : "bg-gray-950/40 border-gray-800"
              )}>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider opacity-60 block mb-1">Player Name</label>
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => updatePlayerName(p.id, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && closeDetailsModal()}
                    className={cn(
                      "w-full font-semibold text-base px-2 py-1 rounded border focus:outline-none focus:border-clocktower-blood bg-transparent transition-colors",
                      timeOfDay === 'day'
                        ? "border-gray-300 text-clocktower-night focus:bg-white"
                        : "border-gray-800 text-gray-200 focus:bg-gray-950"
                    )}
                  />
                </div>

                <div className="border-t pt-2.5 opacity-80" />

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider opacity-60 block mb-1">Assigned Character</label>
                  {isSearchingRole ? (
                    <div className="space-y-2 pt-1 animate-fadeIn">
                      <div className="flex items-center bg-gray-950 border border-gray-800 rounded px-2.5 py-1 text-sm">
                        <Search size={12} className="text-gray-500 mr-2" />
                        <input
                          type="text"
                          placeholder="Search character name..."
                          className="bg-transparent flex-1 outline-none text-white text-xs placeholder-gray-600"
                          value={modalRoleSearch}
                          onChange={(e) => setModalRoleSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                      
                      <div className="overflow-y-auto max-h-40 border border-gray-800 rounded bg-gray-950/40 divide-y divide-gray-800/60 pr-1">
                        {p.roleId && (
                          <button
                            type="button"
                            onClick={() => {
                              updatePlayerRole(p.id, '');
                              setIsSearchingRole(false);
                              setModalRoleSearch('');
                            }}
                            className="w-full text-left px-2 py-1.5 hover:bg-red-950/20 text-xs text-red-400 font-semibold border-b border-gray-800/65"
                          >
                            × Clear Character
                          </button>
                        )}
                        {filteredModalRoles.map(role => (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => {
                              updatePlayerRole(p.id, role.id);
                              setIsSearchingRole(false);
                              setModalRoleSearch('');
                            }}
                            className="w-full text-left px-2 py-1.5 hover:bg-gray-800 text-xs transition-colors flex justify-between items-center"
                          >
                            <span className={cn(
                              "font-semibold text-xs",
                              role.team === 'townsfolk' && "text-clocktower-townsfolk",
                              role.team === 'outsider' && "text-clocktower-outsider",
                              role.team === 'minion' && "text-clocktower-minion",
                              role.team === 'demon' && "text-clocktower-demon",
                            )}>
                              {role.name}
                            </span>
                            <span className="text-[9px] uppercase font-mono text-gray-500">{role.team[0]}</span>
                          </button>
                        ))}
                        {filteredModalRoles.length === 0 && (
                          <div className="p-2 text-xs text-gray-550 italic text-center">No matching roles found.</div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchingRole(false);
                          setModalRoleSearch('');
                        }}
                        className={cn(
                          "text-xs font-semibold hover:underline mt-1",
                          timeOfDay === 'day' ? "text-clocktower-blood" : "text-clocktower-townsfolk"
                        )}
                      >
                        ← Cancel
                      </button>
                    </div>
                  ) : (
                    roleObj ? (
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border",
                            roleObj.team === 'townsfolk' && "text-clocktower-townsfolk border-clocktower-townsfolk/40 bg-clocktower-townsfolk/5",
                            roleObj.team === 'outsider' && "text-clocktower-outsider border-clocktower-outsider/40 bg-clocktower-outsider/5",
                            roleObj.team === 'minion' && "text-clocktower-minion border-clocktower-minion/40 bg-clocktower-minion/5",
                            roleObj.team === 'demon' && "text-clocktower-demon border-clocktower-demon/40 bg-clocktower-demon/5",
                          )}>
                            {roleObj.team}
                          </span>
                          <span className={cn(
                            "font-bold text-base",
                            roleObj.team === 'townsfolk' && "text-clocktower-townsfolk",
                            roleObj.team === 'outsider' && "text-clocktower-outsider",
                            roleObj.team === 'minion' && "text-clocktower-minion",
                            roleObj.team === 'demon' && "text-clocktower-demon",
                          )}>
                            {roleObj.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsSearchingRole(true)}
                          className={cn(
                            "text-xs underline font-medium",
                            timeOfDay === 'day' ? "text-clocktower-blood hover:text-red-800" : "text-clocktower-townsfolk hover:text-blue-400"
                          )}
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-sm italic opacity-60">No character assigned</p>
                        <button
                          type="button"
                          onClick={() => setIsSearchingRole(true)}
                          className={cn(
                            "text-xs underline font-medium",
                            timeOfDay === 'day' ? "text-clocktower-blood hover:text-red-800" : "text-clocktower-townsfolk hover:text-blue-400"
                          )}
                        >
                          Select
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Status Controls */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm">Life Status</span>
                    <p className="text-xs opacity-60">Dead players can only vote once</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (p.isDead) togglePlayerDead(p.id);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded text-xs font-bold border transition-all",
                        !p.isDead 
                          ? "bg-clocktower-outsider border-clocktower-outsider/40 text-white" 
                          : timeOfDay === 'day' 
                            ? "bg-white border-gray-300 text-gray-400 hover:text-gray-600" 
                            : "bg-gray-950/40 border-gray-800 text-gray-500 hover:text-gray-300"
                      )}
                    >
                      Alive
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!p.isDead) togglePlayerDead(p.id);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded text-xs font-bold border transition-all",
                        p.isDead 
                          ? "bg-clocktower-blood border-clocktower-blood/40 text-white" 
                          : timeOfDay === 'day' 
                            ? "bg-white border-gray-300 text-gray-400 hover:text-gray-600" 
                            : "bg-gray-950/40 border-gray-800 text-gray-500 hover:text-gray-300"
                      )}
                    >
                      Dead
                    </button>
                  </div>
                </div>


              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
