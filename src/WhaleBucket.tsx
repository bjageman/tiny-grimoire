import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Undo2 } from 'lucide-react';
import rolesData from './official_roles.json';
import { cn } from './utils/cn';
import type { Role, Player as BasePlayer, PlayerPreferences, PlacedReminder } from './types';
import { TEAM_ORDER } from './types';
import { assignCharacters } from './utils/assignment';
import { getValidationSummary } from './utils/validationSummary';
import PlayerDetailsModal from './components/shared/PlayerDetailsModal';
import WhaleBucketSetupPhase from './components/whalebucket/SetupPhase';
import WhaleBucketDraftPhase from './components/whalebucket/DraftPhase';
import GamePhase from './components/shared/GamePhase';
import WhaleBucketPlayerPreferenceModal from './components/whalebucket/PlayerPreferenceModal';
import WhaleBucketDraftEditModal from './components/whalebucket/DraftEditModal';
import { usePlayerDragAndDrop } from './hooks/usePlayerDragAndDrop';
import { useGameSocket } from './hooks/useGameSocket';
import { useStorytellerSync, getSyncParams } from './hooks/useStorytellerSync';
import { usePersistedField, readPersistedField } from './hooks/usePersistedField';
import PageLayout from './components/shared/PageLayout';
import DialogModal from './components/shared/DialogModal';
import RoomCodeModal from './components/shared/RoomCodeModal';
import HeaderCodeBadge from './components/shared/HeaderCodeBadge';
import ResetGameModal from './components/shared/ResetGameModal';
import { useDialog } from './hooks/useDialog';

export type Player = Omit<BasePlayer, 'preferences'> & {
  preferences: PlayerPreferences;
};

type Phase = 'setup' | 'draft' | 'game';

const STORAGE_KEY = 'whale-bucket-game';

interface SetupProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function WhaleBucket({ theme, toggleTheme }: SetupProps) {
  const [{ isSecondary, urlSync, urlGame }] = useState(() => getSyncParams());

  const [showSyncModal, setShowSyncModal] = useState(false);

  const [syncCode, setSyncCode] = useState<string>(() => {
    if (isSecondary && urlSync) return urlSync.toUpperCase();

    const saved = localStorage.getItem('whale-bucket-sync-code');
    if (saved) return saved;
    const newSync = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    localStorage.setItem('whale-bucket-sync-code', newSync);
    return newSync;
  });

  const [gameCode, setGameCode] = useState<string>(() => {
    if (isSecondary && urlGame) return urlGame.toUpperCase();

    const saved = localStorage.getItem('whale-bucket-game-code');
    if (saved) return saved;
    const newCode = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    localStorage.setItem('whale-bucket-game-code', newCode);
    return newCode;
  });

  const [players, setPlayers] = useState<Player[]>(() => {
    type SavedPlayer = Omit<Player, 'preferences'> & { preferences?: Partial<Player['preferences']> };
    return readPersistedField<SavedPlayer[]>(STORAGE_KEY, 'players', []).map(player => ({
      ...player,
      preferences: {
        townsfolk: player.preferences?.townsfolk || [],
        outsider: player.preferences?.outsider || [],
        minion: player.preferences?.minion || [],
        demon: player.preferences?.demon || [],
        traveler: player.preferences?.traveler || []
      }
    }));
  });
  const [isLilMonstaGame, setIsLilMonstaGame] = usePersistedField<boolean>(STORAGE_KEY, 'isLilMonstaGame', false);
  const [phase, setPhase] = usePersistedField<Phase>(STORAGE_KEY, 'phase', 'setup');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDraftPlayerId, setActiveDraftPlayerId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [timeOfDay, setTimeOfDay] = usePersistedField<'night' | 'day'>(STORAGE_KEY, 'timeOfDay', 'night');
  const [dayNumber, setDayNumber] = usePersistedField<number>(STORAGE_KEY, 'dayNumber', 1);

  // Traveler states
  const [allowTravelers, setAllowTravelers] = usePersistedField<boolean>(STORAGE_KEY, 'allowTravelers', false);
  const [gameLog, setGameLog] = usePersistedField<string[]>(STORAGE_KEY, 'gameLog', []);

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
  }, [setGameLog]);

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
        const prefs = p.preferences?.[team];
        if (prefs && prefs.length > 0) {
          const names = prefs.map(id => roleMap.get(id)?.name ?? id).join(', ');
          prefParts.push(`${teamLabels[team]}: ${names}`);
        }
      });
      if (prefParts.length > 0) {
        addLogEntry(`${p.name}'s prefs — ${prefParts.join(' | ')}`, 'night', 1);
      }
    });

    setPhase('game');
  }, [players, addLogEntry, setPhase]);

  const [demonBluffs, setDemonBluffs] = usePersistedField<string[]>(STORAGE_KEY, 'demonBluffs', []);
  const [showRoomCodeModal, setShowRoomCodeModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [remotePlayerIds, setRemotePlayerIds] = useState<Set<string>>(new Set());

  const [reminderTokens, setReminderTokens] = usePersistedField<PlacedReminder[]>(STORAGE_KEY, 'reminderTokens', []);

  const [checkedItems, setCheckedItems] = usePersistedField<Record<string, boolean>>(STORAGE_KEY, 'checkedItems', {});

  const [newTravelerName, setNewTravelerName] = useState('');
  const [newTravelerRoleId, setNewTravelerRoleId] = useState('beggar');

  // Exclusion states
  const [excludedRoleIds, setExcludedRoleIds] = usePersistedField<string[]>(STORAGE_KEY, 'excludedRoleIds', ['drunk', 'marionette', 'lunatic']);

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
          players: listToBroadcast.map(({ notes, ...rest }) => rest),
          excludedRoleIds
        });
      }
    }, 1000);
  }, [excludedRoleIds]);

  // Preference modal states
  const [rotationOffset, setRotationOffset] = usePersistedField<number>(STORAGE_KEY, 'rotationOffset', 0);
  const [activePreferencePlayerId, setActivePreferencePlayerId] = useState<string | null>(null);
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
        setRemotePlayerIds(prev => new Set([...prev, payload.id]));
        setPlayers(prev => {
          const exists = prev.some(p => p.name.trim().toLowerCase() === payload.name.trim().toLowerCase() || p.id === payload.id);
          if (exists) {
            return prev.map(p => {
              if (p.name.trim().toLowerCase() === payload.name.trim().toLowerCase() || p.id === payload.id) {
                return {
                  ...p,
                  id: payload.id,
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
                id: payload.id,
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
          players: players.map(({ notes, ...rest }) => rest),
          timeOfDay,
          dayNumber
        });
      }
    }
  };

  const { sendMessage } = useGameSocket(!isSecondary ? gameCode : '', handleIncomingMessage);
  
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  // Sync game state to players when in game phase
  useEffect(() => {
    if (!isSecondary && phase === 'game' && sendMessage) {
      sendMessage({
        type: 'game_update',
        players: players.map(({ notes, ...rest }) => rest),
        timeOfDay,
        dayNumber
      });
    }
  }, [phase, players, timeOfDay, dayNumber, sendMessage, isSecondary]);

  // Broadcast player list to players during setup or draft phases
  useEffect(() => {
    if (!isSecondary && (phase === 'setup' || phase === 'draft')) {
      const initialTimer = setTimeout(() => {
        broadcastSetupUpdate(players);
      }, 500);
      return () => clearTimeout(initialTimer);
    }
  }, [phase, players, broadcastSetupUpdate, isSecondary]);

  // Storyteller Sync channel (laptop <-> phone)
  const syncState = useMemo(() => ({
    players: phase === 'game' ? players.map(({ preferences, ...rest }) => rest) : players,
    phase,
    timeOfDay,
    dayNumber,
    allowTravelers,
    isLilMonstaGame,
    excludedRoleIds,
    demonBluffs,
    reminderTokens,
    checkedItems,
    rotationOffset,
  }), [
    players, phase, timeOfDay, dayNumber, allowTravelers, isLilMonstaGame, excludedRoleIds, demonBluffs, reminderTokens, checkedItems, rotationOffset
  ]);

  const handleApplySync = useCallback((incoming: typeof syncState) => {
    const localStateStr = JSON.stringify(syncState);
    const incomingStateStr = JSON.stringify(incoming);

    if (localStateStr !== incomingStateStr) {
      setPlayers((incoming.players || []) as Player[]);
      setPhase(incoming.phase || 'setup');
      setTimeOfDay(incoming.timeOfDay || 'night');
      setDayNumber(incoming.dayNumber || 1);
      setAllowTravelers(incoming.allowTravelers ?? false);
      setIsLilMonstaGame(incoming.isLilMonstaGame || false);
      setExcludedRoleIds(incoming.excludedRoleIds || ['drunk', 'marionette', 'lunatic']);
      setDemonBluffs(incoming.demonBluffs || []);
      setReminderTokens(incoming.reminderTokens || []);
      setCheckedItems(incoming.checkedItems || {});
      setRotationOffset(incoming.rotationOffset ?? 0);
    }
  }, [
    syncState, setPhase, setTimeOfDay, setDayNumber, setAllowTravelers, setIsLilMonstaGame,
    setExcludedRoleIds, setDemonBluffs, setReminderTokens, setCheckedItems, setRotationOffset
  ]);

  useStorytellerSync({
    isSecondary,
    syncCode,
    localState: syncState,
    onApplySync: handleApplySync,
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      players,
      phase,
      timeOfDay,
      dayNumber,
      allowTravelers,
      isLilMonstaGame,
      excludedRoleIds,
      gameLog,
      demonBluffs,
      reminderTokens,
      checkedItems,
      rotationOffset,
    }));
  }, [players, phase, timeOfDay, dayNumber, allowTravelers, isLilMonstaGame, excludedRoleIds, gameLog, demonBluffs, reminderTokens, checkedItems, rotationOffset]);

  const toggleTimeOfDay = () => {
    setCheckedItems({});
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
    if (players.length >= 15) return;
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
    if (players.length >= 15) {
      showAlert("Maximum players reached (15).");
      return;
    }
    setPlayers([createNewPlayer(newTravelerName, newTravelerRoleId), ...players]);
    setNewTravelerName('');
  };

  const removePlayer = (id: string) => {
    const player = players.find(p => p.id === id);
    if (!player) return;

    const performRemoval = () => {
      setPlayers(players.filter(p => p.id !== id));
      if (remotePlayerIds.has(id)) {
        setRemotePlayerIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        if (sendMessageRef.current) {
          sendMessageRef.current({
            type: 'booted',
            playerId: id,
          });
        }
      }
    };

    if (remotePlayerIds.has(id)) {
      showConfirm(`Are you sure you want to remove the connected player "${player.name}"?`, performRemoval, 'Remove Player');
    } else {
      performRemoval();
    }
  };

  const updatePlayerName = (id: string, name: string) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  };

  const updatePlayerNotes = (id: string, notes: string) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, notes } : p));
  };

  const updatePlayerPronouns = (id: string, pronouns: string) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, pronouns } : p));
  };

  const updatePlayerRoles = (id: string, roleIds: string[]) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, roleIds } : p));
  };

  const togglePreference = (playerId: string, team: Role['team'], roleId: string) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const current = p.preferences?.[team] || [];
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
    setPlayers(prev => prev.map(p => {
      if (playerId !== undefined && p.id !== playerId) return p;
      const prefs = p.preferences || { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] };
      const newPrefs = {
        townsfolk: prefs.townsfolk.length > 0 ? [...prefs.townsfolk] : [],
        outsider: prefs.outsider.length > 0 ? [...prefs.outsider] : [],
        minion: prefs.minion.length > 0 ? [...prefs.minion] : [],
        demon: prefs.demon.length > 0 ? [...prefs.demon] : [],
        traveler: prefs.traveler?.length > 0 ? [...prefs.traveler] : []
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
      setPlayers(prev => prev.map(p => ({
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
        const assignedDemonIds = result.filter(r => r.role.team === 'demon').map(r => r.role.id);
        const candidates = (rolesData as Role[]).filter(r => 
          r.team === 'demon' && 
          !excludedRoleIds.includes(r.id) && 
          !assignedDemonIds.includes(r.id)
        );
        const fallbackCandidates = (rolesData as Role[]).filter(r => r.team === 'demon' && !excludedRoleIds.includes(r.id));
        const finalCandidates = candidates.length > 0 ? candidates : (fallbackCandidates.length > 0 ? fallbackCandidates : [{ id: 'imp' }]);
        const chosenDemon = finalCandidates[Math.floor(Math.random() * finalCandidates.length)];
        roleId = chosenDemon.id;
      } else if (assigned && assigned.role.id === 'lilmonsta') {
        isTheLilMonsta = true;
        const assignedMinionIds = result.filter(r => r.role.team === 'minion').map(r => r.role.id);
        const candidates = (rolesData as Role[]).filter(r => 
          r.team === 'minion' && 
          !excludedRoleIds.includes(r.id) && 
          !assignedMinionIds.includes(r.id)
        );
        const fallbackCandidates = (rolesData as Role[]).filter(r => r.team === 'minion' && !excludedRoleIds.includes(r.id));
        const finalCandidates = candidates.length > 0 ? candidates : (fallbackCandidates.length > 0 ? fallbackCandidates : [{ id: 'poisoner' }]);
        const chosenMinion = finalCandidates[Math.floor(Math.random() * finalCandidates.length)];
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
    const player = players.find(p => p.id === id);
    const oldRole = player?.roleId ? (rolesData as Role[]).find(r => r.id === player.roleId) : undefined;
    const defaultEvil = oldRole ? (oldRole.team === 'minion' || oldRole.team === 'demon') : false;
    const currentAlignment = player 
      ? (player.isEvil !== undefined 
          ? player.isEvil 
          : player.isTheLunatic 
            ? false 
            : player.isTheMarionette 
              ? true 
              : defaultEvil) 
      : undefined;

    let newPlayers = players.map(p => {
      if (p.id === id) {
        const role = (rolesData as Role[]).find(r => r.id === roleId);
        const isPref = role ? (p.preferences?.[role.team] || []).includes(roleId) : false;
        return {
          ...p,
          roleId: roleId || undefined,
          assignedFromPref: isPref,
          isEvil: phase === 'game' ? currentAlignment : undefined,
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
    setPlayers(prev => prev.map(p => {
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
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, hasDeadVote: !p.hasDeadVote } : p));
  };

  const togglePlayerEvil = (id: string) => {
    setPlayers(prev => prev.map(p => {
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
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, isDrunkOrPoisoned: !p.isDrunkOrPoisoned } : p));
  };

  const togglePlayerTheDrunk = (id: string) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, isTheDrunk: !p.isTheDrunk, isTheMarionette: false, isTheLilMonsta: false } : p));
  };

  const togglePlayerTheMarionette = (id: string) => {
    setPlayers(prev => prev.map(p => {
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
    setPlayers(prev => prev.map(p => {
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
    setPlayers(prev => prev.map(p => {
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

  const performFullReset = async () => {
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
    setReminderTokens([]);
    setCheckedItems({});
    setRemotePlayerIds(new Set());
    localStorage.removeItem(STORAGE_KEY);
    const newCode = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    localStorage.setItem('whale-bucket-game-code', newCode);
    const newSync = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    localStorage.setItem('whale-bucket-sync-code', newSync);
    setGameCode(newCode);
    setSyncCode(newSync);
    window.location.hash = '';
  };

  // Reset the round but keep the sync session (and every connected player)
  // alive. Player preferences are retained; only role assignments and
  // per-round state are cleared. Every synced player is told to return to the
  // waiting room so they'll get a fresh character when the grimoire reopens.
  const resetGameKeepConnected = () => {
    const clearedPlayers = players.map(p => ({
      ...p,
      roleId: undefined,
      roleIds: undefined,
      isDead: false,
      hasDeadVote: false,
      isTheDrunk: false,
      isTheMarionette: false,
      isTheLunatic: false,
      isTheLilMonsta: false,
      isEvil: undefined,
      notes: undefined,
      // Wipe preferences so everyone re-picks fresh for the next round.
      preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] },
    }));
    setPlayers(clearedPlayers);
    setPhase('setup');
    setActiveDraftPlayerId(null);
    setSearchTerm('');
    setTimeOfDay('night');
    setDayNumber(1);
    setIsLilMonstaGame(false);
    setDemonBluffs([]);
    setGameLog([]);
    setReminderTokens([]);
    setCheckedItems({});

    // Broadcast immediately (no debounce): the explicit reset command first,
    // then a setup_update carrying the cleared roster as a backup that pulls
    // any player who missed the command back to the preferences picker.
    if (sendMessageRef.current) {
      sendMessageRef.current({ type: 'game_reset', gameType: 'whale-bucket' });
      sendMessageRef.current({
        type: 'setup_update',
        gameType: 'whale-bucket',
        players: clearedPlayers.map(({ notes, ...rest }) => rest),
        excludedRoleIds,
      });
    }
  };

  const resetGame = () => {
    if (remotePlayerIds.size > 0) {
      setShowResetModal(true);
    } else {
      showConfirm('Are you sure you want to reset the game? This clears all players and settings.', performFullReset, 'Reset Game');
    }
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

  const confirmDisconnect = useCallback(() => {
    showConfirm(
      "Disconnect secondary device? This will stop syncing with the primary grimoire.",
      () => {
        window.location.hash = '#/host';
      }
    );
  }, [showConfirm]);

  // Details Modal variables
  const modalPlayer = selectedPlayerId ? players.find(x => x.id === selectedPlayerId) : null;
  const modalRoleObj = modalPlayer ? (() => {
    const actualRoleId = modalPlayer.isTheDrunk
      ? 'drunk'
      : modalPlayer.isTheMarionette
        ? (modalPlayer.roleId || 'marionette')
        : modalPlayer.isTheLunatic
          ? (modalPlayer.roleId || 'lunatic')
          : modalPlayer.roleId;
    return (rolesData as Role[]).find(r => r.id === actualRoleId);
  })() : undefined;
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
      backHref={phase === 'setup' && remotePlayerIds.size === 0 && !isSecondary ? "#/host" : undefined}
      onBack={
        isSecondary
          ? confirmDisconnect
          : phase !== 'setup'
            ? () => { if (phase === 'game') setPhase('draft'); else setPhase('setup'); }
            : remotePlayerIds.size > 0
              // Synced with players: surface the reset/disconnect choice instead
              // of silently returning to the Host menu.
              ? () => setShowResetModal(true)
              : undefined
      }
      titleContent={
        <div className="flex items-center justify-center gap-2">
          <h1 className="font-display text-xl font-bold text-clocktower-blood tracking-widest uppercase">
            Whale Buffet
          </h1>
          {isSecondary ? (
            <HeaderCodeBadge
              onClick={confirmDisconnect}
              title="Click to disconnect secondary storyteller device"
              isLightModeActive={isLightModeActive}
            >
              Sync with <span className="text-clocktower-blood font-mono uppercase tracking-wider">{syncCode}</span>
            </HeaderCodeBadge>
          ) : phase !== 'game' ? (
            <HeaderCodeBadge
              onClick={() => setShowRoomCodeModal(true)}
              title="Click to copy join link"
              isLightModeActive={isLightModeActive}
            >
              Room: <span className="text-clocktower-blood font-mono uppercase tracking-wider">{gameCode}</span>
            </HeaderCodeBadge>
          ) : (
            <HeaderCodeBadge
              onClick={() => setShowSyncModal(true)}
              title="Sync other device as secondary controller"
              isLightModeActive={isLightModeActive}
            >
              Sync Other Device
            </HeaderCodeBadge>
          )}
        </div>
      }
      extraControls={
        <button
          id="reset-game-button"
          onClick={resetGame}
          disabled={isSecondary}
          className={cn(
            "p-2 transition-colors",
            isLightModeActive ? "text-gray-600 hover:text-gray-900" : "text-gray-500 hover:text-white",
            isSecondary && "opacity-40 cursor-not-allowed"
          )}
          title={isSecondary ? "This action is disabled on secondary devices to prevent sync issues." : "Reset game"}
        >
          <Undo2 size={20} />
        </button>
      }
      headerExtra={
        isSecondary ? (
          <HeaderCodeBadge
            mobile
            onClick={confirmDisconnect}
            title="Click to disconnect secondary storyteller device"
            isLightModeActive={isLightModeActive}
          >
            Sync with <span className="text-clocktower-blood font-mono uppercase tracking-wider">{syncCode}</span>
          </HeaderCodeBadge>
        ) : phase !== 'game' ? (
          <HeaderCodeBadge
            mobile
            onClick={() => setShowRoomCodeModal(true)}
            title="Click to copy join link"
            isLightModeActive={isLightModeActive}
          >
            Room: <span className="text-clocktower-blood font-mono uppercase tracking-wider">{gameCode}</span>
          </HeaderCodeBadge>
        ) : (
          <HeaderCodeBadge
            mobile
            onClick={() => setShowSyncModal(true)}
            title="Sync other device as secondary controller"
            isLightModeActive={isLightModeActive}
          >
            Sync Other Device
          </HeaderCodeBadge>
        )
      }
      contentClassName="px-4 pt-6 pb-4"
    >

      {phase === 'setup' && (
        <WhaleBucketSetupPhase
          players={players}
          isSecondary={isSecondary}
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
          addPlayer={addPlayer}
          autoFillAllPreferences={autoFillAllPreferences}
          clearAllPreferences={clearAllPreferences}
          resetGame={resetGame}
          setActivePreferencePlayerId={setActivePreferencePlayerId}
          runAssignment={runAssignment}
          onManuallyAssign={() => setPhase('draft')}
          isLightModeActive={isLightModeActive}
          excludedRoleIds={excludedRoleIds}
          setExcludedRoleIds={setExcludedRoleIds}
          remotePlayerIds={remotePlayerIds}
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
          remotePlayerIds={remotePlayerIds}
        />
      )}

      {phase === 'game' && (
        <GamePhase
          players={players}
          isSynced={false}
          isSecondary={isSecondary}
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
            const broadcast = () => {
              const label = team === 'good' ? '🌟 Good wins!' : '😈 Evil wins!';
              addLogEntry(`Game over ${label}`);
              if (sendMessageRef.current) {
                sendMessageRef.current({ type: 'game_winner', team });
              }
            };
            if (remotePlayerIds.size > 0) {
              const teamLabel = team === 'good' ? 'Good' : 'Evil';
              showConfirm(`Declare ${teamLabel} the winner? This will notify all ${remotePlayerIds.size} connected player${remotePlayerIds.size === 1 ? '' : 's'}.`, broadcast);
            } else {
              broadcast();
            }
          }}
          reminderTokens={reminderTokens}
          onSetReminderTokens={setReminderTokens}
          checkedItems={checkedItems}
          onSetCheckedItems={setCheckedItems}
          rotationOffset={rotationOffset}
          onRotationChange={setRotationOffset}
        />
      )}

      {/* Player Preference Modal (setup phase) */}
      {activePreferencePlayerId && (
        <WhaleBucketPlayerPreferenceModal
          activePlayerId={activePreferencePlayerId}
          players={players}
          setPlayers={setPlayers}
          allowTravelers={allowTravelers}
          excludedRoleIds={excludedRoleIds}
          isLightModeActive={isLightModeActive}
          updatePlayerName={updatePlayerName}
          removePlayer={removePlayer}
          togglePreference={togglePreference}
          autoFillPlayerPreferences={autoFillPlayerPreferences}
          onClose={() => setActivePreferencePlayerId(null)}
          isSecondary={isSecondary}
        />
      )}

      {/* Draft Player Edit Modal */}
      {activeDraftPlayerId && (
        <WhaleBucketDraftEditModal
          activeDraftPlayerId={activeDraftPlayerId}
          players={players}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          updatePlayerRole={updatePlayerRole}
          togglePlayerTheDrunk={togglePlayerTheDrunk}
          togglePlayerTheMarionette={togglePlayerTheMarionette}
          togglePlayerTheLunatic={togglePlayerTheLunatic}
          togglePlayerTheLilMonsta={togglePlayerTheLilMonsta}
          isLightModeActive={isLightModeActive}
          onClose={() => { setActiveDraftPlayerId(null); setSearchTerm(''); }}
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
          onUpdatePronouns={updatePlayerPronouns}
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
    {showSyncModal && (
      <RoomCodeModal
        gameCode={syncCode}
        joinUrl={`${window.location.origin}${window.location.pathname}#/whale-bucket?syncCode=${syncCode}&gameCode=${gameCode}`}
        onClose={() => setShowSyncModal(false)}
        isLightModeActive={isLightModeActive}
        syncOnly={true}
      />
    )}
    {showResetModal && (
      <ResetGameModal
        remotePlayerCount={remotePlayerIds.size}
        isLightModeActive={isLightModeActive}
        onCancel={() => setShowResetModal(false)}
        onKeepPlayers={() => {
          setShowResetModal(false);
          resetGameKeepConnected();
        }}
        onDisconnect={() => {
          setShowResetModal(false);
          performFullReset();
        }}
      />
    )}
    </>
  );
}
