import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Undo2 } from 'lucide-react';
import rolesData from './official_roles.json';
import { cn } from './utils/cn';
import type { Role, Player as BasePlayer, PlayerPreferences } from './types';
import { TEAM_ORDER } from './types';
import { assignCharacters } from './utils/assignment';
import { getValidationSummary } from './utils/whaleBucketValidation';
import PlayerDetailsModal from './components/PlayerDetailsModal';
import WhaleBucketSetupPhase from './components/WhaleBucketSetupPhase';
import WhaleBucketDraftPhase from './components/WhaleBucketDraftPhase';
import GamePhase from './components/GamePhase';
import PreferenceSelectionModal from './components/PreferenceSelectionModal';
import ManualOverrideModal from './components/ManualOverrideModal';
import { usePlayerDragAndDrop } from './hooks/usePlayerDragAndDrop';
import { useGameSocket } from './hooks/useGameSocket';
import PageLayout from './components/PageLayout';
import DialogModal from './components/DialogModal';
import RoomCodeModal from './components/RoomCodeModal';
import { useDialog } from './hooks/useDialog';

export type Player = Omit<BasePlayer, 'preferences'> & {
  preferences: PlayerPreferences;
};

type Phase = 'setup' | 'draft' | 'game';

interface SetupProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function WhaleBucket({ theme, toggleTheme }: SetupProps) {
  const [gameCode, setGameCode] = useState<string>(() => {
    const saved = localStorage.getItem('whale-bucket-game-code');
    if (saved) return saved;
    const newCode = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    localStorage.setItem('whale-bucket-game-code', newCode);
    return newCode;
  });

  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('whale-bucket-game');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const p = parsed.players || [];
        type SavedPlayer = Omit<Player, 'preferences'> & { preferences?: Partial<Player['preferences']> };
        return p.map((player: SavedPlayer) => ({
          ...player,
          preferences: {
            townsfolk: player.preferences?.townsfolk || [],
            outsider: player.preferences?.outsider || [],
            minion: player.preferences?.minion || [],
            demon: player.preferences?.demon || [],
            traveler: player.preferences?.traveler || []
          }
        }));
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });
  const [isLilMonstaGame, setIsLilMonstaGame] = useState<boolean>(() => {
    const saved = localStorage.getItem('whale-bucket-game');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.isLilMonstaGame || false;
      } catch (e) {
        console.error(e);
      }
    }
    return false;
  });
  const [phase, setPhase] = useState<Phase>(() => {
    const saved = localStorage.getItem('whale-bucket-game');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.phase || 'setup';
      } catch (e) {
        console.error(e);
      }
    }
    return 'setup';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDraftPlayerId, setActiveDraftPlayerId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<'night' | 'day'>(() => {
    const saved = localStorage.getItem('whale-bucket-game');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.timeOfDay || 'night';
      } catch (e) {
        console.error(e);
      }
    }
    return 'night';
  });
  const [dayNumber, setDayNumber] = useState<number>(() => {
    const saved = localStorage.getItem('whale-bucket-game');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.dayNumber || 1;
      } catch (e) {
        console.error(e);
      }
    }
    return 1;
  });

  // Traveler states
  const [allowTravelers] = useState<boolean>(() => {
    const saved = localStorage.getItem('whale-bucket-game');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.allowTravelers || false;
      } catch (e) {
        console.error(e);
      }
    }
    return false;
  });
  const [gameLog, setGameLog] = useState<string[]>(() => {
    const saved = localStorage.getItem('whale-bucket-game');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.gameLog || [];
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // Refs so log callbacks always see current values without stale closures
  const timeOfDayRef = useRef(timeOfDay);
  const dayNumberRef = useRef(dayNumber);
  useEffect(() => { timeOfDayRef.current = timeOfDay; }, [timeOfDay]);
  useEffect(() => { dayNumberRef.current = dayNumber; }, [dayNumber]);

  const addLogEntry = useCallback((message: string, tod?: 'day' | 'night', dn?: number) => {
    const useTod = tod ?? timeOfDayRef.current;
    const useDn = dn ?? dayNumberRef.current;
    const label = useTod === 'night' ? `Night ${useDn}` : `Day ${useDn}`;
    const clock = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setGameLog(prev => [...prev, `[${label} · ${clock}] ${message}`]);
  }, []);

  const handleStartGame = useCallback(() => {
    const roleMap = new Map((rolesData as Role[]).map(r => [r.id, r]));
    const teamLabels: Record<string, string> = { townsfolk: 'TF', outsider: 'Out', minion: 'Min', demon: 'Dmn' };

    players.forEach(p => {
      const role = p.roleId ? roleMap.get(p.roleId) : null;
      const roleName = role?.name ?? 'Unassigned';
      const prefTag = p.assignedFromPref ? ' ★' : '';
      addLogEntry(`${p.name} → ${roleName}${prefTag}`, 'night', 1);
    });

    players.forEach(p => {
      const prefParts: string[] = [];
      (['townsfolk', 'outsider', 'minion', 'demon'] as const).forEach(team => {
        const prefs = p.preferences[team];
        if (prefs.length > 0) {
          const names = prefs.map(id => roleMap.get(id)?.name ?? id).join(', ');
          prefParts.push(`${teamLabels[team]}: ${names}`);
        }
      });
      if (prefParts.length > 0) {
        addLogEntry(`${p.name}'s prefs — ${prefParts.join(' | ')}`, 'night', 1);
      }
    });

    setPhase('game');
  }, [players, addLogEntry]);

  const [demonBluffs, setDemonBluffs] = useState<string[]>(() => {
    const saved = localStorage.getItem('whale-bucket-game');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.demonBluffs || [];
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });
  const [showRoomCodeModal, setShowRoomCodeModal] = useState(false);

  const [newTravelerName, setNewTravelerName] = useState('');
  const [newTravelerRoleId, setNewTravelerRoleId] = useState('beggar');

  // Exclusion states
  const [excludedRoleIds, setExcludedRoleIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('whale-bucket-game');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.excludedRoleIds || ['drunk', 'marionette', 'lunatic'];
      } catch (e) {
        console.error(e);
      }
    }
    return ['drunk', 'marionette', 'lunatic'];
  });

  const broadcastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendMessageRef = useRef<((payload: unknown) => Promise<void>) | null>(null);

  const broadcastSetupUpdate = useCallback((listToBroadcast: Player[]) => {
    if (broadcastTimeoutRef.current) {
      clearTimeout(broadcastTimeoutRef.current);
    }
    broadcastTimeoutRef.current = setTimeout(() => {
      if (sendMessageRef.current) {
        sendMessageRef.current({
          type: 'setup_update',
          gameType: 'whale-bucket',
          players: listToBroadcast,
          excludedRoleIds
        });
      }
    }, 1000);
  }, [excludedRoleIds]);

  // Preference modal states
  const [activePrefModal, setActivePrefModal] = useState<{ playerId: string; team: Role['team'] } | null>(null);
  const [prefSearchTerm, setPrefSearchTerm] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isSearchingRole, setIsSearchingRole] = useState(false);
  const [modalRoleSearch, setModalRoleSearch] = useState('');

  // Drag and drop states
  const {
    draggedIndex,
    dragOverIndex,
    handleMouseDown,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    movePlayer,
  } = usePlayerDragAndDrop(players, setPlayers);

  const handleIncomingMessage = (data: unknown) => {
    const payload = data as {
      type: string;
      id: string;
      name: string;
      checkOnly?: boolean;
      preferences?: PlayerPreferences;
      pronouns?: string;
    };
    if (payload.type === 'player_join' && payload.name && payload.id) {
      const isExistingPlayer = players.some(
        p => p.name.trim().toLowerCase() === payload.name.trim().toLowerCase() || p.id === payload.id
      );
      if (phase === 'game' && !isExistingPlayer) {
        return;
      }

      if (sendMessageRef.current) {
        sendMessageRef.current({
          type: 'code_valid',
          gameType: 'whale-bucket',
          playerId: payload.id,
          playerName: payload.name,
          excludedRoleIds
        });
      }

      if (!payload.checkOnly) {
        setPlayers(prev => {
          const exists = prev.some(p => p.name.trim().toLowerCase() === payload.name.trim().toLowerCase() || p.id === payload.id);
          if (exists) {
            return prev.map(p => {
              if (p.name.trim().toLowerCase() === payload.name.trim().toLowerCase() || p.id === payload.id) {
                return {
                  ...p,
                  preferences: payload.preferences || p.preferences,
                  pronouns: payload.pronouns,
                };
              }
              return p;
            });
          }
          return [
            ...prev,
            {
              id: payload.id,
              name: payload.name,
              isDead: false,
              roleId: '',
              isTheDrunk: false,
              isTheMarionette: false,
              isTheLilMonsta: false,
              pronouns: payload.pronouns,
              preferences: payload.preferences || {
                townsfolk: [],
                outsider: [],
                minion: [],
                demon: [],
                traveler: []
              }
            }
          ];
        });
      }

      if (phase === 'setup' || phase === 'draft') {
        const updatedPlayers = isExistingPlayer ? (
          payload.checkOnly ? players : players.map(p => {
            if (p.name.trim().toLowerCase() === payload.name.trim().toLowerCase() || p.id === payload.id) {
              return {
                ...p,
                preferences: payload.preferences || p.preferences,
                pronouns: payload.pronouns,
              };
            }
            return p;
          })
        ) : (
          payload.checkOnly ? players : [
            ...players,
            {
              id: payload.id,
              name: payload.name,
              isDead: false,
              roleId: '',
              isTheDrunk: false,
              isTheMarionette: false,
              isTheLilMonsta: false,
              pronouns: payload.pronouns,
              preferences: payload.preferences || {
                townsfolk: [],
                outsider: [],
                minion: [],
                demon: [],
                traveler: []
              }
            }
          ]
        );
        broadcastSetupUpdate(updatedPlayers);
      }

      if (phase === 'game' && sendMessageRef.current) {
        sendMessageRef.current({
          type: 'game_update',
          players,
          timeOfDay,
          dayNumber
        });
      }
    }
  };

  const { sendMessage } = useGameSocket(gameCode, handleIncomingMessage);
  
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  // Sync game state to players when in game phase
  useEffect(() => {
    if (phase === 'game') {
      sendMessage({
        type: 'game_update',
        players,
        timeOfDay,
        dayNumber
      });
    }
  }, [phase, players, timeOfDay, dayNumber, sendMessage]);

  // Broadcast player list to players during setup or draft phases
  useEffect(() => {
    if (phase === 'setup' || phase === 'draft') {
      const initialTimer = setTimeout(() => {
        broadcastSetupUpdate(players);
      }, 500);
      return () => clearTimeout(initialTimer);
    }
  }, [phase, players, broadcastSetupUpdate]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('whale-bucket-game', JSON.stringify({ players, phase, timeOfDay, dayNumber, allowTravelers, isLilMonstaGame, excludedRoleIds, gameLog, demonBluffs }));
  }, [players, phase, timeOfDay, dayNumber, allowTravelers, isLilMonstaGame, excludedRoleIds, gameLog, demonBluffs]);

  const toggleTimeOfDay = () => {
    if (timeOfDay === 'night') {
      setTimeOfDay('day');
      addLogEntry(`Advanced to Day ${dayNumberRef.current}`, 'day', dayNumberRef.current);
    } else {
      setTimeOfDay('night');
      setDayNumber(prev => prev + 1);
      addLogEntry(`Advanced to Night ${dayNumberRef.current + 1}`, 'night', dayNumberRef.current + 1);
    }
  };

  const createNewPlayer = (name: string, roleId?: string): Player => ({
    id: Math.random().toString(36).substring(2, 11),
    name: name.trim(),
    roleId,
    preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] },
    isDead: false,
    isTheDrunk: false,
    isTheMarionette: false,
    isTheLilMonsta: false,
  });

  const addPlayer = () => {
    if (players.length >= 20) return;
    const name = newPlayerName.trim() || `Player #${players.length + 1}`;
    setPlayers([...players, createNewPlayer(name)]);
    setNewPlayerName('');
  };

  const addTravelerGamePhase = () => {
    if (!newTravelerName.trim()) {
      showAlert("Please enter a traveler name.");
      return;
    }
    if (!newTravelerRoleId) {
      showAlert("Please select a traveler role.");
      return;
    }
    if (players.length >= 20) {
      showAlert("Maximum players reached (20).");
      return;
    }
    setPlayers([createNewPlayer(newTravelerName, newTravelerRoleId), ...players]);
    setNewTravelerName('');
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const updatePlayerName = (id: string, name: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, name } : p));
  };

  const updatePlayerNotes = (id: string, notes: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, notes } : p));
  };

  const updatePlayerRoles = (id: string, roleIds: string[]) => {
    setPlayers(players.map(p => p.id === id ? { ...p, roleIds } : p));
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

  const autoFillPreferences = (playerId?: string) => {
    const allRoles = rolesData as Role[];
    setPlayers(players.map(p => {
      if (playerId !== undefined && p.id !== playerId) return p;
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
          const available = allRoles.filter(r => r.team === team && !excludedRoleIds.includes(r.id));
          if (available.length > 0) {
            const randIdx = Math.floor(Math.random() * available.length);
            newPrefs[team] = [available[randIdx].id];
          }
        }
      }
      
      return { ...p, preferences: newPrefs };
    }));
  };

  const autoFillPlayerPreferences = (playerId: string) => autoFillPreferences(playerId);
  const autoFillAllPreferences = () => autoFillPreferences();

  const clearAllPreferences = () => {
    showConfirm('Clear preferences for all players?', () => {
      setPlayers(players.map(p => ({
        ...p,
        preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] }
      })));
    }, 'Clear Preferences');
  };

  const runAssignment = () => {
    const result = assignCharacters(players, rolesData as Role[], allowTravelers);
    if (!result) {
      showAlert('Could not find a valid assignment matching standard/modified player counts. Try adding more preference options.');
      return;
    }
    
    const hasChoirboy = result.some(r => r.role.id === 'choirboy');
    const hasHuntsman = result.some(r => r.role.id === 'huntsman');

    const updatedPlayers = players.map(p => {
      const assigned = result.find(r => r.player.id === p.id);
      let isRevealed = assigned?.fromPref || assigned?.role.id === 'legion' || assigned?.role.id === 'riot';
      if (hasChoirboy && (assigned?.role.id === 'choirboy' || assigned?.role.id === 'king')) {
        isRevealed = true;
      }
      if (hasHuntsman && (assigned?.role.id === 'huntsman' || assigned?.role.id === 'damsel')) {
        isRevealed = true;
      }
      let roleId = isRevealed ? assigned?.role.id : undefined;
      let isTheLunatic = false;
      let isTheLilMonsta = false;

      if (assigned && assigned.role.id === 'lunatic') {
        isTheLunatic = true;
        const demons = (rolesData as Role[]).filter(r => r.team === 'demon');
        const chosenDemon = demons[Math.floor(Math.random() * demons.length)] || { id: 'imp' };
        roleId = chosenDemon.id;
      } else if (assigned && assigned.role.id === 'lilmonsta') {
        isTheLilMonsta = true;
        const minions = (rolesData as Role[]).filter(r => r.team === 'minion');
        const chosenMinion = minions[Math.floor(Math.random() * minions.length)] || { id: 'poisoner' };
        roleId = chosenMinion.id;
      }

      return {
        ...p,
        roleId,
        assignedFromPref: assigned?.fromPref || false,
        isTheDrunk: false,
        isTheMarionette: false,
        isTheLunatic,
        isTheLilMonsta,
        isEvil: assigned?.player.isEvil,
      };
    });
    setPlayers(updatedPlayers);
    setIsLilMonstaGame(updatedPlayers.some(p => p.isTheLilMonsta));
    setPhase('draft');
  };

  const updatePlayerRole = (id: string, roleId: string) => {
    let newPlayers = players.map(p => {
      if (p.id === id) {
        const role = (rolesData as Role[]).find(r => r.id === roleId);
        const isPref = role ? (p.preferences[role.team] || []).includes(roleId) : false;
        return {
          ...p,
          roleId: roleId || undefined,
          assignedFromPref: isPref,
          isEvil: undefined,
          isTheDrunk: false,
          isTheMarionette: false,
          isTheLunatic: false,
          isTheLilMonsta: false,
        };
      }
      return p;
    });

    if (roleId === 'choirboy') {
      const hasKing = newPlayers.some(p => p.roleId === 'king');
      if (!hasKing) {
        const candidate = newPlayers.find(p => p.id !== id && !p.roleId) ||
                          newPlayers.find(p => p.id !== id && p.roleId !== 'choirboy');
        if (candidate) {
          newPlayers = newPlayers.map(p => p.id === candidate.id ? { ...p, roleId: 'king', assignedFromPref: false } : p);
        }
      }
    } else if (roleId === 'huntsman') {
      const hasDamsel = newPlayers.some(p => p.roleId === 'damsel');
      if (!hasDamsel) {
        const candidate = newPlayers.find(p => p.id !== id && !p.roleId) ||
                          newPlayers.find(p => p.id !== id && p.roleId !== 'huntsman');
        if (candidate) {
          newPlayers = newPlayers.map(p => p.id === candidate.id ? { ...p, roleId: 'damsel', assignedFromPref: false } : p);
        }
      }
    }

    setPlayers(newPlayers);
  };

  const togglePlayerDead = (id: string) => {
    const player = players.find(p => p.id === id);
    if (player) {
      const nextDead = !player.isDead;
      addLogEntry(nextDead ? `${player.name} died` : `${player.name} returned to life`);
    }
    setPlayers(players.map(p => {
      if (p.id === id) {
        const nextDead = !p.isDead;
        return {
          ...p,
          isDead: nextDead,
          hasDeadVote: nextDead ? true : undefined
        };
      }
      return p;
    }));
  };

  const togglePlayerDeadVote = (id: string) => {
    const player = players.find(p => p.id === id);
    if (player) {
      addLogEntry(player.hasDeadVote ? `${player.name}'s ghost vote used` : `${player.name}'s ghost vote restored`);
    }
    setPlayers(players.map(p => p.id === id ? { ...p, hasDeadVote: !p.hasDeadVote } : p));
  };

  const togglePlayerEvil = (id: string) => {
    setPlayers(players.map(p => {
      if (p.id === id) {
        const roleObj = (rolesData as Role[]).find(r => r.id === p.roleId);
        const defaultEvil = roleObj ? (roleObj.team === 'minion' || roleObj.team === 'demon') : false;
        const currentEvil = p.isEvil !== undefined ? p.isEvil : defaultEvil;
        return { ...p, isEvil: !currentEvil };
      }
      return p;
    }));
  };

  const togglePlayerDrunkOrPoisoned = (id: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, isDrunkOrPoisoned: !p.isDrunkOrPoisoned } : p));
  };

  const togglePlayerTheDrunk = (id: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, isTheDrunk: !p.isTheDrunk, isTheMarionette: false, isTheLilMonsta: false } : p));
  };

  const togglePlayerTheMarionette = (id: string) => {
    setPlayers(players.map(p => {
      if (p.id === id) {
        const nextVal = !p.isTheMarionette;
        return {
          ...p,
          isTheMarionette: nextVal,
          isTheDrunk: false,
          isTheLilMonsta: false,
          isEvil: nextVal ? true : undefined,
        };
      }
      return p;
    }));
  };

  const togglePlayerTheLunatic = (id: string) => {
    setPlayers(players.map(p => {
      if (p.id === id) {
        const nextVal = !p.isTheLunatic;
        return {
          ...p,
          isTheLunatic: nextVal,
          isTheDrunk: false,
          isTheMarionette: false,
          isTheLilMonsta: false,
          isEvil: nextVal ? false : undefined,
        };
      }
      return p;
    }));
  };

  const togglePlayerTheLilMonsta = (id: string) => {
    const isTurningOn = !players.find(x => x.id === id)?.isTheLilMonsta;
    if (isTurningOn) {
      setIsLilMonstaGame(true);
    }
    setPlayers(players.map(p => {
      if (p.id === id) {
        const nextVal = !p.isTheLilMonsta;
        return {
          ...p,
          isTheLilMonsta: nextVal,
          isTheDrunk: false,
          isTheMarionette: false,
          isTheLunatic: false
        };
      }
      if (isTurningOn) {
        return {
          ...p,
          isTheLilMonsta: false,
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
    showConfirm('Are you sure you want to reset the game? This clears all players and settings.', async () => {
      if (sendMessageRef.current) {
        try {
          await sendMessageRef.current({ type: 'storyteller_quit' });
        } catch (e) {
          console.error('Failed to notify players on reset:', e);
        }
      }
      setPlayers([]);
      setPhase('setup');
      setActiveDraftPlayerId(null);
      setSearchTerm('');
      setTimeOfDay('night');
      setDayNumber(1);
      setIsLilMonstaGame(false);
      localStorage.removeItem('whale-bucket-game');
      const newCode = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
      localStorage.setItem('whale-bucket-game-code', newCode);
      setGameCode(newCode);
      window.location.hash = '';
    }, 'Reset Game');
  };

  const resetDead = () => {
    showConfirm('Mark all players as alive?', () => {
      setPlayers(prev => prev.map(p => ({ ...p, isDead: false, hasDeadVote: false })));
    }, 'Reset Dead');
  };

  const resetTime = () => {
    showConfirm('Reset back to Night 1?', () => {
      setDayNumber(1);
      setTimeOfDay('night');
    }, 'Reset Time');
  };

  const validationSummary = useMemo(() => {
    return getValidationSummary(players);
  }, [players]);

  const isLightModeActive = theme === 'light';
  const { dialogProps, showAlert, showConfirm } = useDialog();

  // Details Modal variables
  const modalPlayer = selectedPlayerId ? players.find(x => x.id === selectedPlayerId) : null;
  const modalRoleObj = modalPlayer ? (rolesData as Role[]).find(r => r.id === modalPlayer.roleId) : undefined;
  const filteredModalRoles = (rolesData as Role[])
    .filter(r =>
      r.name.toLowerCase().includes(modalRoleSearch.toLowerCase()) ||
      r.team.toLowerCase().includes(modalRoleSearch.toLowerCase())
    )
    .sort((a, b) => {
      const isCurrentA = a.id === modalPlayer?.roleId;
      const isCurrentB = b.id === modalPlayer?.roleId;
      if (isCurrentA && !isCurrentB) return -1;
      if (!isCurrentA && isCurrentB) return 1;

      const orderA = TEAM_ORDER[a.team] ?? 99;
      const orderB = TEAM_ORDER[b.team] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  const currentIndex = selectedPlayerId ? players.findIndex(x => x.id === selectedPlayerId) : -1;
  const prevPlayerId = selectedPlayerId && currentIndex !== -1 ? players[(currentIndex - 1 + players.length) % players.length].id : null;
  const nextPlayerId = selectedPlayerId && currentIndex !== -1 ? players[(currentIndex + 1) % players.length].id : null;

  return (
    <>
    <PageLayout
      theme={theme}
      toggleTheme={toggleTheme}
      backHref={phase === 'setup' ? "#/host" : undefined}
      onBack={phase !== 'setup' ? () => { if (phase === 'game') setPhase('draft'); else setPhase('setup'); } : undefined}
      titleContent={
        <div className="flex items-center justify-center gap-2">
          <h1 className="font-display text-xl font-bold text-clocktower-blood tracking-widest uppercase">
            Whale Buffet
          </h1>
          <div
          onClick={() => setShowRoomCodeModal(true)}
            className={cn(
              "hidden md:flex cursor-pointer text-xs font-bold px-2 py-0.5 rounded border transition-all duration-200 select-none items-baseline gap-1",
              isLightModeActive
                ? "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                : "bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-850"
            )}
            title="Click to copy join link"
          >
            Room: <span className="text-clocktower-blood font-mono uppercase tracking-wider">{gameCode}</span>
          </div>
        </div>
      }
      extraControls={
        <button
          id="reset-game-button"
          onClick={resetGame}
          className={cn("p-2 transition-colors", isLightModeActive ? "text-gray-600 hover:text-gray-900" : "text-gray-500 hover:text-white")}
          title="Reset game"
        >
          <Undo2 size={20} />
        </button>
      }
      headerExtra={
        <div
          onClick={() => setShowRoomCodeModal(true)}
          className={cn(
            "md:hidden cursor-pointer text-xs font-bold px-2 py-0.5 rounded border transition-all duration-200 select-none flex items-baseline gap-1",
            isLightModeActive
              ? "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
              : "bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-850"
          )}
          title="Click to copy join link"
        >
          Room: <span className="text-clocktower-blood font-mono uppercase tracking-wider">{gameCode}</span>
        </div>
      }
      contentClassName="px-4 pt-6 pb-4"
    >

      {phase === 'setup' && (
        <WhaleBucketSetupPhase
          players={players}
          newPlayerName={newPlayerName}
          setNewPlayerName={setNewPlayerName}
          allowTravelers={allowTravelers}
          draggedIndex={draggedIndex}
          dragOverIndex={dragOverIndex}
          handleMouseDown={handleMouseDown}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleDragEnd={handleDragEnd}
          handleTouchStart={handleTouchStart}
          handleTouchMove={handleTouchMove}
          handleTouchEnd={handleTouchEnd}
          movePlayer={movePlayer}
          addPlayer={addPlayer}
          removePlayer={removePlayer}
          updatePlayerName={updatePlayerName}
          autoFillPlayerPreferences={autoFillPlayerPreferences}
          autoFillAllPreferences={autoFillAllPreferences}
          clearAllPreferences={clearAllPreferences}
          setActivePrefModal={setActivePrefModal}
          setPrefSearchTerm={setPrefSearchTerm}
          runAssignment={runAssignment}
          isLightModeActive={isLightModeActive}
          excludedRoleIds={excludedRoleIds}
          setExcludedRoleIds={setExcludedRoleIds}
        />
      )}

      {phase === 'draft' && (
        <WhaleBucketDraftPhase
          players={players}
          validationSummary={validationSummary}
          isLightModeActive={isLightModeActive}
          setPhase={setPhase}
          onStartGame={handleStartGame}
          runAssignment={runAssignment}
          setActiveDraftPlayerId={setActiveDraftPlayerId}
          togglePlayerTheDrunk={togglePlayerTheDrunk}
          togglePlayerTheMarionette={togglePlayerTheMarionette}
          togglePlayerTheLunatic={togglePlayerTheLunatic}
          togglePlayerTheLilMonsta={togglePlayerTheLilMonsta}
        />
      )}

      {phase === 'game' && (
        <GamePhase
          players={players}
          timeOfDay={timeOfDay}
          dayNumber={dayNumber}
          newTravelerName={newTravelerName}
          newTravelerRoleId={newTravelerRoleId}
          isLightModeActive={isLightModeActive}
          draggedIndex={draggedIndex}
          dragOverIndex={dragOverIndex}
          handleMouseDown={handleMouseDown}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleDragEnd={handleDragEnd}
          handleTouchStart={handleTouchStart}
          handleTouchMove={handleTouchMove}
          handleTouchEnd={handleTouchEnd}
          setSelectedPlayerId={setSelectedPlayerId}
          toggleTimeOfDay={toggleTimeOfDay}
          addTravelerGamePhase={addTravelerGamePhase}
          setNewTravelerName={setNewTravelerName}
          setNewTravelerRoleId={setNewTravelerRoleId}
          onResetDead={resetDead}
          onResetTime={resetTime}
          travelerCardTitle="Add Traveler (Late Arrival)"
          demonBluffs={demonBluffs}
          onUpdateDemonBluffs={(bluffs) => {
            setDemonBluffs(bluffs);
            const filled = bluffs.filter(Boolean);
            if (filled.length === 3) {
              const names = filled.map(id => (rolesData as Role[]).find(r => r.id === id)?.name ?? id);
              addLogEntry(`Demon bluffs set: ${names.join(', ')}`);
            }
          }}
          gameLog={gameLog}
          onDownloadLog={() => {
            const header = `Blood on the Clocktower — Game Log\n${new Date().toLocaleString()}\n${'─'.repeat(40)}\n`;
            const content = header + gameLog.join('\n');
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const dt = new Date().toISOString().replace('T', '-').slice(0, 16).replace(':', '');
            a.download = `whalebuffet-all-roles-${players.length}p-${dt}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          onLogEvent={addLogEntry}
          onDeclareWinner={(team) => {
            const label = team === 'good' ? '🌟 Good wins!' : '😈 Evil wins!';
            addLogEntry(`Game over ${label}`);
            if (sendMessageRef.current) {
              sendMessageRef.current({ type: 'game_winner', team });
            }
          }}
        />
      )}

      {/* Preference Selection Modal */}
      {activePrefModal && (
        <PreferenceSelectionModal
          activePrefModal={activePrefModal}
          players={players}
          prefSearchTerm={prefSearchTerm}
          setPrefSearchTerm={setPrefSearchTerm}
          togglePreference={togglePreference}
          setPlayers={setPlayers}
          setActivePrefModal={setActivePrefModal}
          excludedRoleIds={excludedRoleIds}
        />
      )}

      {/* Manual Override Modal */}
      {activeDraftPlayerId && (
        <ManualOverrideModal
          activeDraftPlayerId={activeDraftPlayerId}
          players={players}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          updatePlayerRole={updatePlayerRole}
          setActiveDraftPlayerId={setActiveDraftPlayerId}
          isLightModeActive={isLightModeActive}
        />
      )}

      {/* Player Details Modal */}
      {selectedPlayerId && modalPlayer && (
        <PlayerDetailsModal
          player={modalPlayer}
          players={players}
          roleObj={modalRoleObj}
          filteredModalRoles={filteredModalRoles}
          isSearchingRole={isSearchingRole}
          modalRoleSearch={modalRoleSearch}
          isLightModeActive={isLightModeActive}
          onClose={closeDetailsModal}
          onPrevPlayer={() => prevPlayerId && setSelectedPlayerId(prevPlayerId)}
          onNextPlayer={() => nextPlayerId && setSelectedPlayerId(nextPlayerId)}
          onUpdateName={updatePlayerName}
          onUpdateRole={updatePlayerRole}
          onUpdateRoles={updatePlayerRoles}
          onUpdateNotes={updatePlayerNotes}
          onToggleDead={togglePlayerDead}
          onToggleDeadVote={togglePlayerDeadVote}
          onToggleDrunkOrPoisoned={togglePlayerDrunkOrPoisoned}
          onToggleEvil={togglePlayerEvil}
          onToggleLilMonsta={togglePlayerTheLilMonsta}
          isLilMonstaGame={isLilMonstaGame}
          onSetSearchingRole={setIsSearchingRole}
          onSetModalRoleSearch={setModalRoleSearch}
          onLogEvent={phase === 'game' ? addLogEntry : undefined}
        />
      )}
    </PageLayout>
    <DialogModal {...dialogProps} isLightModeActive={isLightModeActive} />
    {showRoomCodeModal && (
      <RoomCodeModal
        gameCode={gameCode}
        joinUrl={`${window.location.origin}${window.location.pathname}#/join?code=${gameCode}`}
        onClose={() => setShowRoomCodeModal(false)}
        isLightModeActive={isLightModeActive}
      />
    )}
    </>
  );
}
