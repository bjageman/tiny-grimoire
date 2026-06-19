import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Search, RefreshCcw, AlertTriangle, Sparkles, Shuffle, CheckCircle, ChevronLeft, ChevronRight, Sun, Moon, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import rolesData from './roles.json';
import { cn } from './utils/cn';
import type { Role, Player as BasePlayer, PlayerPreferences } from './types';
import { getDistribution } from './constants';
import { assignCharacters, getPreferenceLabel } from './utils/assignment';
import GrimoireBoard from './components/GrimoireBoard';

export type Player = Omit<BasePlayer, 'preferences'> & {
  preferences: PlayerPreferences;
};

type Phase = 'setup' | 'draft' | 'game';

interface SetupProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function WhaleBucket({ theme, toggleTheme }: SetupProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [phase, setPhase] = useState<Phase>('setup');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDraftPlayerId, setActiveDraftPlayerId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<'night' | 'day'>('night');
  const [dayNumber, setDayNumber] = useState<number>(1);

  // Traveler states
  const [allowTravelers, setAllowTravelers] = useState<boolean>(false);
  const [newTravelerName, setNewTravelerName] = useState('');
  const [newTravelerRoleId, setNewTravelerRoleId] = useState('beggar');

  // Preference modal states
  const [activePrefModal, setActivePrefModal] = useState<{ playerId: string; team: Role['team'] } | null>(null);
  const [prefSearchTerm, setPrefSearchTerm] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isSearchingRole, setIsSearchingRole] = useState(false);
  const [modalRoleSearch, setModalRoleSearch] = useState('');

  // Drag and drop states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData("text/plain");
    const sourceIndex = sourceIndexStr ? parseInt(sourceIndexStr, 10) : draggedIndex;
    if (sourceIndex !== null && sourceIndex !== undefined && !isNaN(sourceIndex)) {
      if (sourceIndex !== targetIndex) {
        const updated = [...players];
        const [removed] = updated.splice(sourceIndex, 1);
        updated.splice(targetIndex, 0, removed);
        setPlayers(updated);
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const movePlayer = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= players.length) return;
    const updated = [...players];
    const [removed] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, removed);
    setPlayers(updated);
  };

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('whale-bucket-game');
    if (saved) {
      try {
        const { players: p, phase: ph, timeOfDay: tod, dayNumber: dn, allowTravelers: at } = JSON.parse(saved);
        type SavedPlayer = Omit<Player, 'preferences'> & { preferences?: Partial<Player['preferences']> };
        const validatedPlayers = (p || []).map((player: SavedPlayer) => ({
          ...player,
          preferences: {
            townsfolk: player.preferences?.townsfolk || [],
            outsider: player.preferences?.outsider || [],
            minion: player.preferences?.minion || [],
            demon: player.preferences?.demon || [],
            traveler: player.preferences?.traveler || []
          }
        }));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPlayers(validatedPlayers);
        setPhase(ph || 'setup');
        setTimeOfDay(tod || 'night');
        setDayNumber(dn || 1);
        if (at !== undefined) setAllowTravelers(!!at);

      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save to localStorage and update document theme
  useEffect(() => {
    localStorage.setItem('whale-bucket-game', JSON.stringify({ players, phase, timeOfDay, dayNumber, allowTravelers }));
    
    const isLightMode = theme === 'light';
    if (isLightMode) {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }
    
    return () => {
      document.documentElement.classList.remove('theme-light');
    };
  }, [players, phase, timeOfDay, dayNumber, allowTravelers, theme]);

  const toggleTimeOfDay = () => {
    if (timeOfDay === 'night') {
      setTimeOfDay('day');
    } else {
      setTimeOfDay('night');
      setDayNumber(prev => prev + 1);
    }
  };

  const addPlayer = () => {
    if (players.length >= 20) return;
    const name = newPlayerName.trim() || `Player #${players.length + 1}`;
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      preferences: {
        townsfolk: [],
        outsider: [],
        minion: [],
        demon: [],
        traveler: []
      },
      isDead: false,
      isTheDrunk: false,
      isTheMarionette: false,
    };
    setPlayers([...players, newPlayer]);
    setNewPlayerName('');
  };

  const addTravelerGamePhase = () => {
    if (!newTravelerName.trim()) {
      alert("Please enter a traveler name.");
      return;
    }
    if (!newTravelerRoleId) {
      alert("Please select a traveler role.");
      return;
    }
    if (players.length >= 20) {
      alert("Maximum players reached (20).");
      return;
    }
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name: newTravelerName.trim(),
      roleId: newTravelerRoleId,
      preferences: {
        townsfolk: [],
        outsider: [],
        minion: [],
        demon: [],
        traveler: []
      },
      isDead: false,
      isTheDrunk: false,
      isTheMarionette: false,
    };
    setPlayers([...players, newPlayer]);
    setNewTravelerName('');
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
        demon: p.preferences.demon.length > 0 ? [...p.preferences.demon] : [],
        traveler: p.preferences.traveler?.length > 0 ? [...p.preferences.traveler] : []
      };
      
      const teams: ('townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler')[] = ['townsfolk', 'outsider', 'minion', 'demon'];
      if (allowTravelers) {
        teams.push('traveler');
      }
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
        demon: p.preferences.demon.length > 0 ? [...p.preferences.demon] : [],
        traveler: p.preferences.traveler?.length > 0 ? [...p.preferences.traveler] : []
      };
      
      const teams: ('townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler')[] = ['townsfolk', 'outsider', 'minion', 'demon'];
      if (allowTravelers) {
        teams.push('traveler');
      }
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
        preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] }
      })));
    }
  };

  const runAssignment = () => {
    const result = assignCharacters(players, rolesData as Role[], allowTravelers);
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
    const travelerCount = players.filter(p => {
      if (!p.roleId) return false;
      const r = (rolesData as Role[]).find(role => role.id === p.roleId);
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
        } else if (p.roleId === 'lilmonsta') {
          acc.minion++;
        } else {
          const role = (rolesData as Role[]).find(r => r.id === p.roleId);
          if (role) acc[role.team]++;
        }
      }
      return acc;
    }, { townsfolk: 0, outsider: 0, minion: 0, demon: 0, traveler: 0 });
    
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
      const L = Math.round(baseCount * 0.6);
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
    
    const expectedTownsfolk = baseCount - expectedDemon - expectedMinion - expectedOutsider;
    
    const isOutsiderValid = (hasGodfather && !hasLegion && !hasRiot)
      ? (counts.outsider === expectedOutsider + 1 || counts.outsider === expectedOutsider - 1)
      : counts.outsider === expectedOutsider;
    
    const isTownsfolkValid = (hasGodfather && !hasLegion && !hasRiot)
      ? (counts.townsfolk === baseCount - expectedDemon - expectedMinion - (expectedOutsider + 1) ||
         counts.townsfolk === baseCount - expectedDemon - expectedMinion - (expectedOutsider - 1))
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

    // Marionette check: each Marionette must neighbor at least one Demon
    const basePlayersInOrder = players.filter(p => {
      if (!p.roleId) return true;
      const r = (rolesData as Role[]).find(role => role.id === p.roleId);
      return r?.team !== 'traveler';
    });
    const marionettePlayers = basePlayersInOrder.filter(p => p.isTheMarionette);
    const demonPlayers = basePlayersInOrder.filter(p => {
      if (!p.roleId || p.isTheMarionette || p.isTheDrunk) return false;
      const r = (rolesData as Role[]).find(role => role.id === p.roleId);
      return r?.team === 'demon';
    });

    if (marionettePlayers.length > 0) {
      if (demonPlayers.length === 0) {
        jinxWarnings.push("A Marionette is in play, but there is no Demon assigned.");
      } else {
        const K = basePlayersInOrder.length;
        for (const mp of marionettePlayers) {
          const m_idx = basePlayersInOrder.findIndex(p => p.id === mp.id);
          const isNeighboringDemon = demonPlayers.some(dp => {
            const d_idx = basePlayersInOrder.findIndex(p => p.id === dp.id);
            return (d_idx - 1 + K) % K === m_idx || (d_idx + 1) % K === m_idx;
          });
          if (!isNeighboringDemon) {
            jinxWarnings.push(`Marionette (${mp.name}) must be sitting next to the Demon.`);
          }
        }
      }
    }
    
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



  const isLightModeActive = theme === 'light';

  return (
    <div className={cn(
      "min-h-screen p-4 font-sans mx-auto transition-colors duration-300",
      phase === 'game' 
        ? "max-w-xl md:max-w-6xl landscape:max-w-6xl" 
        : "max-w-xl md:max-w-4xl",
      isLightModeActive
        ? "bg-clocktower-parchment text-clocktower-night"
        : "bg-clocktower-night text-clocktower-parchment"
    )}>
      <header className={cn(
        "flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 border-b pb-2 gap-3 sm:gap-0",
        isLightModeActive ? "border-clocktower-blood/20" : "border-clocktower-blood"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative flex justify-center items-center w-full sm:w-auto sm:justify-start sm:gap-3">
            <a href="#/" className={cn("absolute left-0 transition-colors text-sm sm:static", isLightModeActive ? "text-gray-600 hover:text-gray-800" : "text-gray-500 hover:text-gray-300")}>← Home</a>
            <h1 className="text-2xl font-bold text-clocktower-blood tracking-wide text-center sm:text-left">Whale Bucket</h1>
            <div className="absolute right-0 flex items-center gap-1 sm:hidden">
              <button
                onClick={toggleTheme}
                className={cn("p-2 transition-colors", isLightModeActive ? "text-gray-600 hover:text-gray-900" : "text-gray-500 hover:text-white")}
                title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                id="reset-game-button"
                onClick={resetGame}
                className={cn("p-2 transition-colors", isLightModeActive ? "text-gray-600 hover:text-gray-900" : "text-gray-500 hover:text-white")}
                title="Reset game"
              >
                <RefreshCcw size={20} />
              </button>
            </div>
          </div>
          <div id="character-type-legend" className="flex justify-center sm:justify-start gap-2.5 text-[9px] font-bold tracking-wider text-gray-500 w-full sm:w-auto">
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-clocktower-townsfolk" /> Townsfolk</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-clocktower-outsider" /> Outsider</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-clocktower-minion" /> Minion</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-clocktower-demon" /> Demon</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className={cn("p-2 transition-colors", isLightModeActive ? "text-gray-600 hover:text-gray-900" : "text-gray-500 hover:text-white")}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            id="reset-game-button-desktop"
            onClick={resetGame}
            className={cn("p-2 transition-colors", isLightModeActive ? "text-gray-600 hover:text-gray-900" : "text-gray-500 hover:text-white")}
            title="Reset game"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </header>      {phase === 'setup' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[5fr_3fr] md:grid-rows-[auto_1fr] md:items-start animate-fadeIn">
          {/* Section A: Draft Options */}
          <div className="md:col-start-2 md:row-start-1 w-full">
            {/* Draft Options Toggle */}
            <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-800/50 flex flex-col gap-3">
              <div>
                <span className="text-xs font-bold text-gray-300 block uppercase tracking-wider text-left">Draft Options</span>
                <span className="text-[10px] text-gray-500 block text-left">Configure drafting setup rules</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="draft-traveler-toggle"
                  type="checkbox"
                  checked={allowTravelers}
                  onChange={(e) => setAllowTravelers(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-clocktower-traveler"></div>
                <span className="ml-2 text-xs font-semibold text-gray-300">Players will pick a traveler</span>
              </label>
            </div>
          </div>

          {/* Section B: Seating & Preferences */}
          <div className="md:col-start-1 md:row-start-1 md:row-span-2 space-y-6 w-full">
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
                  disabled={players.length >= 20}
                  placeholder={players.length >= 20 ? "Maximum players reached (20)" : "Enter player name in seating order..."}
                  className="flex-1 bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-clocktower-blood text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button 
                  onClick={addPlayer} 
                  disabled={players.length >= 20}
                  className={cn(
                    "px-4 py-2 rounded transition-colors text-white",
                    players.length >= 20 
                      ? "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50 border border-gray-800" 
                      : "bg-clocktower-blood hover:bg-red-800 border border-clocktower-blood"
                  )}
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="space-y-3">
                {players.map((p, index) => (
                  <div
                    key={p.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "bg-gray-900/60 p-3 rounded-lg border border-gray-800/50 space-y-2 transition-all",
                      draggedIndex === index && "opacity-40 border-dashed border-clocktower-blood/50 scale-[0.98]",
                      dragOverIndex === index && draggedIndex !== index && "border-t-2 border-t-clocktower-blood bg-gray-800/20"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-gray-600 cursor-grab active:cursor-grabbing hover:text-gray-400 p-0.5 shrink-0 flex items-center">
                        <GripVertical size={14} />
                      </div>
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
                      <div className="flex gap-0.5 items-center bg-gray-955/45 px-1 py-0.5 rounded border border-gray-800">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => movePlayer(index, 'up')}
                          className="text-gray-500 hover:text-gray-200 disabled:opacity-20 disabled:hover:text-gray-500 transition-colors p-0.5"
                          title="Move player up"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          type="button"
                          disabled={index === players.length - 1}
                          onClick={() => movePlayer(index, 'down')}
                          className="text-gray-500 hover:text-gray-200 disabled:opacity-20 disabled:hover:text-gray-500 transition-colors p-0.5"
                          title="Move player down"
                        >
                          <ChevronDown size={12} />
                        </button>
                      </div>
                      <button onClick={() => removePlayer(p.id)} className="text-gray-600 hover:text-red-500 p-1 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    {/* Preference buttons */}
                    <div className={cn("grid gap-1.5 pt-1", allowTravelers ? "grid-cols-5" : "grid-cols-4")}>
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
                            : "bg-gray-950/40 border-gray-800 text-gray-550 hover:border-gray-700"
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
                            : "bg-gray-950/40 border-gray-800 text-gray-550 hover:border-gray-700"
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
                            : "bg-gray-950/40 border-gray-800 text-gray-550 hover:border-gray-700"
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
                            : "bg-gray-950/40 border-gray-800 text-gray-550 hover:border-gray-700"
                        )}
                      >
                        {getPreferenceLabel(p.preferences.demon, "DEM")}
                      </button>
                      {allowTravelers && (
                        <button
                          onClick={() => {
                            setActivePrefModal({ playerId: p.id, team: 'traveler' });
                            setPrefSearchTerm('');
                          }}
                          title={getPreferenceLabel(p.preferences.traveler || [], "No Traveler preference")}
                          className={cn(
                            "text-[10px] font-bold py-1.5 px-0.5 rounded border transition-all text-center truncate block w-full whitespace-nowrap",
                            p.preferences.traveler && p.preferences.traveler.length > 0
                              ? "bg-clocktower-traveler/15 border-clocktower-traveler/40 text-clocktower-traveler"
                              : "bg-gray-950/40 border-gray-800 text-gray-550 hover:border-gray-700"
                          )}
                        >
                          {getPreferenceLabel(p.preferences.traveler || [], "TRV")}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Section C: Distribution & Assign Button */}
          <div className="md:col-start-2 md:row-start-2 space-y-6 w-full">
            <section className="bg-gray-900 p-4 rounded-lg border border-gray-855">
              <h3 className="text-xs font-bold text-gray-550 uppercase tracking-wider mb-2.5 text-left">Standard Base Distribution</h3>
              {players.length >= 5 ? (() => {
                const travelerPlayersCount = players.filter(p => {
                  if (allowTravelers && p.preferences.traveler && p.preferences.traveler.length > 0) {
                    return true;
                  }
                  return false;
                }).length;
                const minTravelers = players.length > 15 ? players.length - 15 : 0;
                const actualTravelers = Math.max(travelerPlayersCount, minTravelers);
                const baseCount = players.length - actualTravelers;
                const dist = getDistribution(baseCount);
                return (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
                      <div className="p-2 rounded bg-gray-950/40 border border-gray-800 text-clocktower-townsfolk">
                        TS: {dist.townsfolk}
                      </div>
                      <div className="p-2 rounded bg-gray-950/40 border border-gray-800 text-clocktower-outsider">
                        O: {dist.outsider}
                      </div>
                      <div className="p-2 rounded bg-gray-950/40 border border-gray-800 text-clocktower-minion">
                        M: {dist.minion}
                      </div>
                      <div className="p-2 rounded bg-gray-950/40 border border-gray-800 text-clocktower-demon">
                        D: {dist.demon}
                      </div>
                    </div>
                    {(dist.traveler > 0 || actualTravelers > 0) && (
                      <div className="text-center text-xs font-semibold p-2 rounded bg-gray-950/40 border border-gray-800 text-clocktower-traveler">
                        Travelers: {actualTravelers > 0 ? actualTravelers : dist.traveler}
                      </div>
                    )}
                  </div>
                );
              })() : (
                <p className="text-xs text-gray-500 italic text-left">Add at least 5 players to view distribution.</p>
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
        </div>
      )}
      {phase === 'draft' && (
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
                        <div className="flex items-center gap-2">
                          {roleObj && (
                            <img
                              src={`/icons/${roleObj.id}.svg`}
                              alt={roleObj.name}
                              className="w-5 h-5 object-contain shrink-0"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          )}
                          <span className={cn(
                            "font-semibold text-sm",
                            roleObj?.team === 'townsfolk' && "text-clocktower-townsfolk",
                            roleObj?.team === 'outsider' && "text-clocktower-outsider",
                            roleObj?.team === 'minion' && "text-clocktower-minion",
                            roleObj?.team === 'demon' && "text-clocktower-demon",
                          )}>
                            {roleObj?.name}
                          </span>
                        </div>
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
            <div className={cn(
              "border rounded-lg p-3 space-y-2.5 transition-colors duration-300",
              isLightModeActive
                ? "bg-white border-gray-250 text-clocktower-night shadow-sm"
                : "bg-gray-900/90 border-gray-800"
            )}>
              <div className="flex items-center gap-1.5">
                {validationSummary.isValid ? (
                  <CheckCircle size={16} className="text-clocktower-outsider" />
                ) : (
                  <AlertTriangle size={16} className="text-clocktower-minion" />
                )}
                <span className={cn(
                  "font-semibold text-xs tracking-wide uppercase",
                  isLightModeActive ? "text-gray-700" : "text-gray-300"
                )}>
                  Grimoire Balance Verification
                </span>
              </div>

              {validationSummary.modifications.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {validationSummary.modifications.map((m, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        "text-[9px] border px-1.5 py-0.5 rounded font-medium transition-colors duration-300",
                        isLightModeActive
                          ? "bg-clocktower-blood/5 border-clocktower-blood/20 text-clocktower-blood"
                          : "bg-clocktower-blood/10 border-clocktower-blood/30 text-clocktower-parchment/80"
                      )}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}

              <div className={cn(
                "grid text-center text-[10px] font-mono border-t pt-2.5",
                isLightModeActive ? "border-gray-200" : "border-gray-800",
                validationSummary.expected.traveler > 0 || validationSummary.counts.traveler > 0
                  ? "grid-cols-5 gap-1"
                  : "grid-cols-4 gap-2"
              )}>
                <div>
                  <div className="text-gray-500">TF</div>
                  <div className={cn("font-bold text-xs mt-0.5", validationSummary.isTownsfolkValid ? "text-clocktower-townsfolk" : (isLightModeActive ? "text-amber-700" : "text-yellow-500"))}>
                    {validationSummary.counts.townsfolk} / {validationSummary.expected.townsfolk}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">OUT</div>
                  <div className={cn("font-bold text-xs mt-0.5", validationSummary.isOutsiderValid ? "text-clocktower-outsider" : (isLightModeActive ? "text-amber-700" : "text-yellow-500"))}>
                    {validationSummary.counts.outsider} / {validationSummary.hasGodfather ? `${validationSummary.expected.outsider - 1} or ${validationSummary.expected.outsider + 1}` : validationSummary.expected.outsider}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">MIN</div>
                  <div className={cn("font-bold text-xs mt-0.5", validationSummary.isMinionValid ? "text-clocktower-minion" : (isLightModeActive ? "text-amber-700" : "text-yellow-500"))}>
                    {validationSummary.counts.minion} / {validationSummary.expected.minion}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">DEM</div>
                  <div className={cn("font-bold text-xs mt-0.5", validationSummary.isDemonValid ? "text-clocktower-demon" : (isLightModeActive ? "text-amber-700" : "text-yellow-500"))}>
                    {validationSummary.counts.demon} / {validationSummary.expected.demon}
                  </div>
                </div>
                {(validationSummary.expected.traveler > 0 || validationSummary.counts.traveler > 0) && (
                  <div>
                    <div className="text-gray-500">TRV</div>
                    <div className="font-bold text-xs mt-0.5 text-clocktower-traveler">
                      {validationSummary.counts.traveler} / {validationSummary.expected.traveler}
                    </div>
                  </div>
                )}
              </div>

              {validationSummary.jinxWarnings.length > 0 && (
                <div className={cn("border-t pt-2 space-y-1", isLightModeActive ? "border-gray-200" : "border-gray-800")}>
                  {validationSummary.jinxWarnings.map((w, idx) => (
                    <div key={idx} className={cn("text-[10px] flex items-center gap-1 font-medium", isLightModeActive ? "text-amber-700" : "text-yellow-500")}>
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

            <GrimoireBoard
              players={players}
              timeOfDay={timeOfDay}
              dayNumber={dayNumber}
              toggleTimeOfDay={toggleTimeOfDay}
              onSelectPlayer={setSelectedPlayerId}
              rolesData={rolesData as Role[]}
            />
          </div>

          {/* Column 2: Ledger & Controls */}
          <div className="space-y-6 md:pt-10 landscape:pt-10">
            <button
              onClick={() => setPhase('draft')}
              className={cn(
                "w-full py-3 rounded-lg font-bold transition-all text-sm shadow-md",
                isLightModeActive
                  ? "bg-white hover:bg-gray-50 text-clocktower-night border border-gray-300"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              )}
            >
              Return to Draft Screen
            </button>

            <div className={cn(
              "rounded-lg border p-3 space-y-1.5 transition-colors duration-300",
              isLightModeActive
                ? "bg-white/50 border-gray-300 text-clocktower-night"
                : "bg-gray-900/40 border-gray-800/80"
            )}>
              <h4 className={cn(
                "text-[10px] uppercase font-bold tracking-wider",
                isLightModeActive ? "text-gray-600" : "text-gray-500"
              )}>Grimoire Ledger Reference</h4>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                {players.map((p, index) => {
                  const rObj = (rolesData as Role[]).find(r => r.id === p.roleId);
                  return (
                    <div
                      key={p.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedPlayerId(p.id)}
                      className={cn(
                        "flex items-center gap-1.5 py-0.5 px-1.5 rounded border transition-colors min-w-0 cursor-move hover:ring-1 hover:ring-gray-500/50",
                        p.isDead && "opacity-45",
                        draggedIndex === index && "opacity-40 border-dashed border-clocktower-blood/50 scale-[0.98]",
                        dragOverIndex === index && draggedIndex !== index && "border-t-2 border-t-clocktower-blood bg-gray-800/20",
                        isLightModeActive
                          ? "bg-white/40 border-gray-200 hover:bg-white/70"
                          : "bg-gray-955/20 border-gray-900/40 hover:bg-gray-900/60"
                      )}
                    >
                      <div className="text-gray-500 cursor-grab active:cursor-grabbing hover:text-gray-400 p-0.5 shrink-0 flex items-center">
                        <GripVertical size={10} />
                      </div>
                      <span className={cn("text-[9px] font-mono w-4 shrink-0", isLightModeActive ? "text-gray-505" : "text-gray-600")}>{index + 1}</span>
                      <span className={cn(
                        "font-medium truncate flex-1 min-w-0",
                        p.isDead && "line-through text-gray-500",
                        isLightModeActive && !p.isDead ? "text-clocktower-night" : "text-gray-200"
                      )}>{p.name}</span>
                      <span className={cn(
                        "font-semibold text-[10px] flex items-center gap-1 shrink-0 max-w-[45%] min-w-0",
                        rObj?.team === 'townsfolk' && "text-clocktower-townsfolk",
                        rObj?.team === 'outsider' && "text-clocktower-outsider",
                        rObj?.team === 'minion' && "text-clocktower-minion",
                        rObj?.team === 'demon' && "text-clocktower-demon",
                        rObj?.team === 'traveler' && "text-clocktower-traveler",
                      )}>
                        {rObj && (
                          <img
                            src={`/icons/${rObj.id}.svg`}
                            alt={rObj.name}
                            className="w-3.5 h-3.5 object-contain shrink-0"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <span className="truncate">{rObj?.name ?? '—'}</span>
                        {p.isTheDrunk && <span className="text-[8px] bg-yellow-600 text-black px-0.5 rounded leading-none shrink-0">DK</span>}
                        {p.isTheMarionette && <span className="text-[8px] bg-clocktower-minion text-white px-0.5 rounded leading-none shrink-0">MN</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add Traveler Card (Late Arrival) */}
            <div className={cn(
              "rounded-lg border p-3.5 space-y-3 transition-colors duration-300",
              isLightModeActive
                ? "bg-white/50 border-gray-300 text-clocktower-night"
                : "bg-gray-900/40 border-gray-800/80"
            )}>
              <h4 className={cn(
                "text-[10px] uppercase font-bold tracking-wider",
                isLightModeActive ? "text-gray-600" : "text-gray-500"
              )}>Add Traveler (Late Arrival)</h4>
              
              <div className="flex flex-col gap-2">
                <input
                  id="game-traveler-name-input"
                  type="text"
                  placeholder="Traveler name..."
                  value={newTravelerName}
                  onChange={(e) => setNewTravelerName(e.target.value)}
                  className={cn(
                    "w-full rounded px-2.5 py-1.5 text-xs focus:outline-none border transition-colors",
                    isLightModeActive
                      ? "bg-white border-gray-300 text-clocktower-night focus:border-clocktower-blood"
                      : "bg-gray-950 border-gray-800 text-gray-200 focus:border-clocktower-blood"
                  )}
                />
                
                <div className="flex gap-2">
                  <select
                    id="game-traveler-role-select"
                    value={newTravelerRoleId}
                    onChange={(e) => setNewTravelerRoleId(e.target.value)}
                    className={cn(
                      "flex-1 rounded px-2 py-1.5 text-xs focus:outline-none border transition-colors",
                      isLightModeActive
                        ? "bg-white border-gray-300 text-clocktower-night focus:border-clocktower-blood"
                        : "bg-gray-950 border-gray-800 text-gray-200 focus:border-clocktower-blood"
                    )}
                  >
                    {(rolesData as Role[]).filter(r => r.team === 'traveler').map(r => (
                      <option
                        key={r.id}
                        value={r.id}
                        className={isLightModeActive ? "bg-white text-clocktower-night" : "bg-gray-950 text-gray-200"}
                      >
                        {r.name}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    id="game-add-traveler-button"
                    onClick={addTravelerGamePhase}
                    disabled={players.length >= 20}
                    className="bg-clocktower-traveler hover:bg-purple-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
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
                  Select {activePrefModal.team === 'townsfolk' ? 'Townsfolk' : activePrefModal.team === 'outsider' ? 'Outsiders' : activePrefModal.team === 'minion' ? 'Minions' : activePrefModal.team === 'demon' ? 'Demons' : 'Travelers'}
                </h3>
                <p className="text-xs text-gray-550">
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
                  ?.preferences[activePrefModal.team]?.includes(role.id);
                
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
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img
                        src={`/icons/${role.id}.svg`}
                        alt={role.name}
                        className="w-5 h-5 object-contain shrink-0"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <span className={cn(
                        "font-semibold text-xs truncate",
                        role.team === 'townsfolk' && "text-clocktower-townsfolk",
                        role.team === 'outsider' && "text-clocktower-outsider",
                        role.team === 'minion' && "text-clocktower-minion",
                        role.team === 'demon' && "text-clocktower-demon",
                        role.team === 'traveler' && "text-clocktower-traveler",
                      )}>
                        {role.name}
                      </span>
                    </div>
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
                {preferredRoles.map(role => {
                  const selectedByPlayer = players.find(pl => pl.roleId === role.id && pl.id !== activeDraftPlayerId);
                  return (
                    <button
                      key={role.id}
                      onClick={() => {
                        updatePlayerRole(activeDraftPlayerId, role.id);
                        setActiveDraftPlayerId(null);
                        setSearchTerm('');
                      }}
                      className="w-full text-left px-3 py-2.5 bg-amber-500/5 hover:bg-amber-500/10 text-xs transition-colors flex justify-between items-center"
                    >
                      <div className="flex items-center min-w-0 flex-1 gap-1.5 mr-2">
                        <img
                          src={`/icons/${role.id}.svg`}
                          alt={role.name}
                          className="w-5 h-5 object-contain shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <span className={cn(
                          "font-semibold text-xs truncate",
                          role.team === 'townsfolk' && "text-clocktower-townsfolk",
                          role.team === 'outsider' && "text-clocktower-outsider",
                          role.team === 'minion' && "text-clocktower-minion",
                          role.team === 'demon' && "text-clocktower-demon",
                        )}>
                          {role.name}
                        </span>
                        <span className="text-[8px] bg-amber-500/25 text-amber-400 px-1 rounded-sm uppercase font-extrabold tracking-wider leading-none shrink-0">
                          ★ Pick
                        </span>
                        {selectedByPlayer && (
                          <span className={cn(
                            "text-[8px] px-1 py-0.5 rounded shrink-0 font-medium border",
                            isLightModeActive 
                              ? "bg-gray-100 border-gray-200 text-gray-600" 
                              : "bg-gray-800/40 border-gray-700/30 text-gray-400"
                          )}>
                            Taken: {selectedByPlayer.name}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase font-mono text-gray-650">{role.team[0]}</span>
                    </button>
                  );
                })}

                {otherRoles.map(role => {
                  const selectedByPlayer = players.find(pl => pl.roleId === role.id && pl.id !== activeDraftPlayerId);
                  return (
                    <button
                      key={role.id}
                      onClick={() => {
                        updatePlayerRole(activeDraftPlayerId, role.id);
                        setActiveDraftPlayerId(null);
                        setSearchTerm('');
                      }}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-800 text-xs transition-colors flex justify-between items-center"
                    >
                      <div className="flex items-center min-w-0 flex-1 gap-1.5 mr-2">
                        <img
                          src={`/icons/${role.id}.svg`}
                          alt={role.name}
                          className="w-5 h-5 object-contain shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <span className={cn(
                          "font-semibold text-xs truncate",
                          role.team === 'townsfolk' && "text-clocktower-townsfolk",
                          role.team === 'outsider' && "text-clocktower-outsider",
                          role.team === 'minion' && "text-clocktower-minion",
                          role.team === 'demon' && "text-clocktower-demon",
                        )}>
                          {role.name}
                        </span>
                        {selectedByPlayer && (
                          <span className={cn(
                            "text-[8px] px-1 py-0.5 rounded shrink-0 font-medium border",
                            isLightModeActive 
                              ? "bg-gray-100 border-gray-200 text-gray-600" 
                              : "bg-gray-800/40 border-gray-700/30 text-gray-400"
                          )}>
                            Taken: {selectedByPlayer.name}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase font-mono text-gray-650">{role.team[0]}</span>
                    </button>
                  );
                })}

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
                "border w-full max-w-sm md:max-w-xl min-h-[480px] md:min-h-0 rounded-lg p-5 md:p-6 space-y-4 flex flex-col justify-between shadow-2xl transition-colors duration-300",
                isLightModeActive 
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
                    isLightModeActive
                      ? "border-gray-300 text-gray-600 hover:bg-gray-100"
                      : "border-gray-700 text-gray-400 hover:bg-gray-800"
                  )}
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="text-center">
                  <h3 className={cn("font-bold text-xl", isLightModeActive ? "text-clocktower-night" : "text-white")}>
                    Player Details
                  </h3>
                  <p className={cn("text-xs", isLightModeActive ? "text-gray-600" : "text-gray-400")}>
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
                      isLightModeActive
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
                      isLightModeActive ? "text-clocktower-blood" : "text-clocktower-townsfolk"
                    )}
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Player Info Card */}
              <div className={cn(
                "p-4 rounded-lg border space-y-3",
                isLightModeActive 
                  ? "bg-white/60 border-gray-300" 
                  : "bg-gray-955/40 border-gray-800"
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
                      isLightModeActive
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
                      
                      <div className="overflow-y-auto max-h-48 md:max-h-72 border border-gray-800 rounded bg-gray-955/40 divide-y divide-gray-800/60 pr-1">
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
                        {filteredModalRoles.map(role => {
                          const selectedByPlayer = players.find(pl => pl.roleId === role.id && pl.id !== p.id);
                          return (
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
                              <div className="flex items-center min-w-0 flex-1 gap-1.5 mr-2">
                                <img
                                  src={`/icons/${role.id}.svg`}
                                  alt={role.name}
                                  className="w-5 h-5 object-contain shrink-0"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                                <span className={cn(
                                  "font-semibold text-xs truncate",
                                  role.team === 'townsfolk' && "text-clocktower-townsfolk",
                                  role.team === 'outsider' && "text-clocktower-outsider",
                                  role.team === 'minion' && "text-clocktower-minion",
                                  role.team === 'demon' && "text-clocktower-demon",
                                  role.team === 'traveler' && "text-clocktower-traveler",
                                )}>
                                  {role.name}
                                </span>
                                {selectedByPlayer && (
                                  <span className={cn(
                                    "text-[8px] px-1 py-0.5 rounded shrink-0 font-medium border",
                                    isLightModeActive 
                                      ? "bg-gray-100 border-gray-200 text-gray-600" 
                                      : "bg-gray-800/40 border-gray-700/30 text-gray-400"
                                  )}>
                                    Taken: {selectedByPlayer.name}
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] uppercase font-mono text-gray-500">{role.team[0]}</span>
                            </button>
                          );
                        })}
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
                          isLightModeActive ? "text-clocktower-blood" : "text-clocktower-townsfolk"
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
                            isLightModeActive ? "text-clocktower-blood hover:text-red-800" : "text-clocktower-townsfolk hover:text-blue-400"
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
                            isLightModeActive ? "text-clocktower-blood hover:text-red-800" : "text-clocktower-townsfolk hover:text-blue-400"
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
                          : isLightModeActive 
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
                          : isLightModeActive 
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
