import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Undo2 } from 'lucide-react';
import rolesData from './roles.json';
import { cn } from './utils/cn';
import type { Player, Role, PlacedReminder } from './types';
import { TEAM_ORDER } from './types';
import { parseScriptFile } from './utils/scriptUtils';

import { performStandardAssignment } from './utils/standardAssignment';
import { getValidationSummary } from './utils/whaleBucketValidation';
import PlayerDetailsModal from './components/shared/PlayerDetailsModal';
import GamePhase from './components/shared/GamePhase';
import StandardSetupPhase from './components/standard/SetupPhase';
import SetupPlayerEditModal from './components/standard/SetupPlayerEditModal';
import { usePlayerDragAndDrop } from './hooks/usePlayerDragAndDrop';
import { useGameSocket } from './hooks/useGameSocket';
import { useStorytellerSync, getSyncParams } from './hooks/useStorytellerSync';
import { usePersistedField, readPersistedField } from './hooks/usePersistedField';
import PageLayout from './components/shared/PageLayout';
import DialogModal from './components/shared/DialogModal';
import { useDialog } from './hooks/useDialog';
import RoomCodeModal from './components/shared/RoomCodeModal';
import HeaderCodeBadge from './components/shared/HeaderCodeBadge';
import ResetGameModal from './components/shared/ResetGameModal';

type Phase = 'setup' | 'game';

const STORAGE_KEY = 'standard-botc-game';

const generateId = (): string =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).substring(2);

interface SetupProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function StandardSetup({ theme, toggleTheme }: SetupProps) {
  const [{ isSecondary, urlSync, urlGame }] = useState(() => getSyncParams());

  const [showSyncModal, setShowSyncModal] = useState(false);

  const [syncCode, setSyncCode] = useState<string>(() => {
    if (isSecondary && urlSync) return urlSync.toUpperCase();

    const saved = localStorage.getItem('standard-botc-sync-code');
    if (saved) return saved;
    const newSync = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    localStorage.setItem('standard-botc-sync-code', newSync);
    return newSync;
  });

  const [gameCode, setGameCode] = useState<string>(() => {
    if (isSecondary && urlGame) return urlGame.toUpperCase();

    const saved = localStorage.getItem('standard-botc-game-code');
    if (saved) return saved;
    const newCode = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    localStorage.setItem('standard-botc-game-code', newCode);
    return newCode;
  });

  const [remotePlayerIds, setRemotePlayerIds] = useState<Set<string>>(new Set());
  const [showRoomCodeModal, setShowRoomCodeModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [grimoireConfirmed, setGrimoireConfirmed] = useState(false);

  const [reminderTokens, setReminderTokens] = usePersistedField<PlacedReminder[]>(STORAGE_KEY, 'reminderTokens', []);

  const [checkedItems, setCheckedItems] = usePersistedField<Record<string, boolean>>(STORAGE_KEY, 'checkedItems', {});

  const [players, setPlayers] = usePersistedField<Player[]>(STORAGE_KEY, 'players', []);
  const [isLilMonstaGame, setIsLilMonstaGame] = usePersistedField<boolean>(STORAGE_KEY, 'isLilMonstaGame', false);
  const [phase, setPhase] = usePersistedField<Phase>(STORAGE_KEY, 'phase', 'setup');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [timeOfDay, setTimeOfDay] = usePersistedField<'night' | 'day'>(STORAGE_KEY, 'timeOfDay', 'night');
  const [dayNumber, setDayNumber] = usePersistedField<number>(STORAGE_KEY, 'dayNumber', 1);

  // Traveler states
  const [newTravelerName, setNewTravelerName] = useState('');
  const [newTravelerRoleId, setNewTravelerRoleId] = useState('beggar');

  // Details modal states
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isSearchingRole, setIsSearchingRole] = useState(false);
  const [modalRoleSearch, setModalRoleSearch] = useState('');

  // Script states
  const [scriptName, setScriptName] = usePersistedField<string>(STORAGE_KEY, 'scriptName', "All Roles");
  const [scriptAuthor, setScriptAuthor] = usePersistedField<string>(STORAGE_KEY, 'scriptAuthor', "");
  const [customScriptRoles, setCustomScriptRoles] = usePersistedField<Role[] | null>(STORAGE_KEY, 'customScriptRoles', null);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<string>>(() => {
    const loadedSelectedIds = readPersistedField<string[] | null>(STORAGE_KEY, 'selectedCharacterIds', null);
    if (loadedSelectedIds) {
      return new Set(loadedSelectedIds);
    }
    const scriptRoles = readPersistedField<Role[] | null>(STORAGE_KEY, 'customScriptRoles', null) || (rolesData as Role[]);
    return new Set(scriptRoles.map(r => r.id));
  });
  const [demonBluffs, setDemonBluffs] = usePersistedField<string[]>(STORAGE_KEY, 'demonBluffs', []);
  const [gameLog, setGameLog] = usePersistedField<string[]>(STORAGE_KEY, 'gameLog', []);

  // timeOfDay/dayNumber refs so log callbacks always see current values without stale closures
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rotationOffset, setRotationOffset] = usePersistedField<number>(STORAGE_KEY, 'rotationOffset', 0);
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
          gameType: 'standard',
          players: listToBroadcast.map(({ notes, ...rest }) => rest),
          scriptName,
          scriptAuthor,
          customScriptRoles
        });
      }
    }, 1000);
  }, [scriptName, scriptAuthor, customScriptRoles]);

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
    setSearchTerm('');
    setTimeOfDay('night');
    setDayNumber(1);
    setIsLilMonstaGame(false);
    setScriptName("All Roles");
    setCustomScriptRoles(null);
    setDemonBluffs([]);
    setGameLog([]);
    setReminderTokens([]);
    setCheckedItems({});
    setRemotePlayerIds(new Set());
    localStorage.removeItem(STORAGE_KEY);
    const newCode = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    localStorage.setItem('standard-botc-game-code', newCode);
    const newSync = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    localStorage.setItem('standard-botc-sync-code', newSync);
    window.location.hash = '';
    setGameCode(newCode);
    setSyncCode(newSync);
  };

  // Reset the round but keep the sync session (and every connected player)
  // alive. Clears role assignments and per-round state, drops back to setup,
  // and — most importantly — tells every synced player to return to the
  // waiting room so they'll get a fresh character when the grimoire reopens.
  const resetGameKeepConnected = () => {
    const clearedPlayers = players.map(p => ({
      ...p,
      roleId: '',
      roleIds: undefined,
      isDead: false,
      hasDeadVote: false,
      isTheDrunk: false,
      isTheMarionette: false,
      isTheLunatic: false,
      isTheLilMonsta: false,
      isEvil: undefined,
      notes: undefined,
    }));
    setPlayers(clearedPlayers);
    setPhase('setup');
    setSearchTerm('');
    setTimeOfDay('night');
    setDayNumber(1);
    setIsLilMonstaGame(false);
    setDemonBluffs([]);
    setGameLog([]);
    setReminderTokens([]);
    setCheckedItems({});
    setGrimoireConfirmed(false);

    // Broadcast immediately (no debounce): first the explicit reset command,
    // then a setup_update carrying the cleared roster + script. The reset
    // command is the primary signal; the setup_update doubles as a backup that
    // pulls any player who missed it back to the waiting room.
    if (sendMessageRef.current) {
      sendMessageRef.current({ type: 'game_reset', gameType: 'standard' });
      sendMessageRef.current({
        type: 'setup_update',
        gameType: 'standard',
        players: clearedPlayers.map(({ notes, ...rest }) => rest),
        scriptName,
        scriptAuthor,
        customScriptRoles,
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
      pronouns?: string;
      checkOnly?: boolean;
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
          gameType: 'standard',
          playerId: payload.id,
          playerName: payload.name,
          scriptName,
          scriptAuthor,
          customScriptRoles
        });
      }

      if (!payload.checkOnly) {
        setRemotePlayerIds(prev => new Set([...prev, payload.id]));
        setPlayers(prev => {
          const exists = prev.some(p => p.name.trim().toLowerCase() === payload.name.trim().toLowerCase() || p.id === payload.id);
          if (exists) {
            return prev.map(p =>
              (p.name.trim().toLowerCase() === payload.name.trim().toLowerCase() || p.id === payload.id)
                ? { ...p, id: payload.id, pronouns: payload.pronouns }
                : p
            );
          }
          return [
            ...prev,
            {
              id: payload.id,
              name: payload.name,
              isDead: false,
              roleId: '',
              pronouns: payload.pronouns,
            }
          ];
        });
      }

      if (phase === 'setup') {
        const updatedPlayers = isExistingPlayer
          ? players.map(p =>
              (p.name.trim().toLowerCase() === payload.name.trim().toLowerCase() || p.id === payload.id)
                ? { ...p, id: payload.id, pronouns: payload.pronouns }
                : p
            )
          : (payload.checkOnly ? players : [
              ...players,
              {
                id: payload.id,
                name: payload.name,
                isDead: false,
                roleId: '',
                pronouns: payload.pronouns,
              }
            ]);
        broadcastSetupUpdate(updatedPlayers);
      }

      if (phase === 'game' && sendMessageRef.current) {
        sendMessageRef.current({
          type: 'game_update',
          players: players.map(({ notes, ...rest }) => rest),
          timeOfDay,
          dayNumber,
          scriptName,
          scriptAuthor,
          customScriptRoles
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
        dayNumber,
        scriptName,
        scriptAuthor,
        customScriptRoles
      });
    }
  }, [phase, players, timeOfDay, dayNumber, scriptName, scriptAuthor, customScriptRoles, sendMessage, isSecondary]);

  // Broadcast player list to players during setup phase
  useEffect(() => {
    if (!isSecondary && phase === 'setup') {
      // Only broadcast standard setup updates on initial mount or phase change
      // rather than on every players list alteration to prevent loop storm
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
    customScriptRoleIds: customScriptRoles ? customScriptRoles.map(r => r.id) : null,
    scriptName,
    scriptAuthor,
    isLilMonstaGame,
    demonBluffs,
    reminderTokens,
    checkedItems,
    rotationOffset,
  }), [
    players, phase, timeOfDay, dayNumber, customScriptRoles, scriptName, scriptAuthor, isLilMonstaGame, demonBluffs, reminderTokens, checkedItems, rotationOffset
  ]);

  const handleApplySync = useCallback((incoming: typeof syncState) => {
    const customScriptRolesResolved = incoming.customScriptRoleIds
      ? incoming.customScriptRoleIds.map((id: string) => {
          const matched = (rolesData as Role[]).find(r => r.id === id);
          if (matched) return matched;
          return {
            id,
            name: id.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            team: 'townsfolk' as const
          };
        })
      : null;

    const localStateStr = JSON.stringify(syncState);
    const incomingStateStr = JSON.stringify(incoming);

    if (localStateStr !== incomingStateStr) {
      setPlayers(incoming.players || []);
      setPhase(incoming.phase || 'setup');
      setTimeOfDay(incoming.timeOfDay || 'night');
      setDayNumber(incoming.dayNumber || 1);
      setCustomScriptRoles(customScriptRolesResolved);
      setScriptName(incoming.scriptName || "All Roles");
      setScriptAuthor(incoming.scriptAuthor || "");
      setIsLilMonstaGame(incoming.isLilMonstaGame || false);
      setDemonBluffs(incoming.demonBluffs || []);
      setReminderTokens(incoming.reminderTokens || []);
      setCheckedItems(incoming.checkedItems || {});
      setRotationOffset(incoming.rotationOffset ?? 0);
    }
  }, [
    syncState, setPlayers, setPhase, setTimeOfDay, setDayNumber, setCustomScriptRoles,
    setScriptName, setScriptAuthor, setIsLilMonstaGame, setDemonBluffs, setReminderTokens, setCheckedItems, setRotationOffset
  ]);

  useStorytellerSync({
    isSecondary,
    syncCode,
    localState: syncState,
    onApplySync: handleApplySync,
  });

  // Synchronize selectedCharacterIds with customScriptRoles
  const rolesForSync = customScriptRoles || (rolesData as Role[]);
  const [prevScriptRoles, setPrevScriptRoles] = useState<Role[]>(rolesForSync);
  if (prevScriptRoles !== rolesForSync) {
    setPrevScriptRoles(rolesForSync);
    setSelectedCharacterIds(new Set(rolesForSync.map(r => r.id)));
  }

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      players,
      phase,
      timeOfDay,
      dayNumber,
      customScriptRoles,
      scriptName,
      scriptAuthor,
      isLilMonstaGame,
      demonBluffs,
      gameLog,
      reminderTokens,
      checkedItems,
      selectedCharacterIds: [...selectedCharacterIds],
      rotationOffset,
    }));
  }, [players, phase, timeOfDay, dayNumber, customScriptRoles, scriptName, scriptAuthor, isLilMonstaGame, demonBluffs, gameLog, reminderTokens, checkedItems, selectedCharacterIds, rotationOffset]);

  const toggleTimeOfDay = () => {
    setCheckedItems({});
    if (timeOfDay === 'night') {
      setTimeOfDay('day');
      addLogEntry(`Advanced to Day ${dayNumber}`, 'day', dayNumber);
    } else {
      setDayNumber(dayNumber + 1);
      setTimeOfDay('night');
      addLogEntry(`Advanced to Night ${dayNumber + 1}`, 'night', dayNumber + 1);
    }
  };

  const addPlayer = () => {
    if (players.length >= 20) return;
    const name = newPlayerName.trim() || `Player #${players.length + 1}`;
    const newPlayer: Player = {
      id: generateId(),
      name,
      isDead: false,
      isTheDrunk: false,
      isTheMarionette: false,
      isTheLilMonsta: false,
    };
    setPlayers([...players, newPlayer]);
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
    const newPlayer: Player = {
      id: generateId(),
      name: newTravelerName.trim(),
      roleId: newTravelerRoleId,
      isDead: false,
      isTheDrunk: false,
      isTheMarionette: false,
      isTheLilMonsta: false,
    };
    setPlayers([newPlayer, ...players]);
    setNewTravelerName('');
    const travelerRole = (rolesData as Role[]).find(r => r.id === newTravelerRoleId);
    addLogEntry(`${newTravelerName.trim()} joined as ${travelerRole?.name ?? newTravelerRoleId} (Traveler)`);
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

    if (phase === 'game') {
      if (player && player.roleId !== (roleId || undefined)) {
        const newRole = (rolesData as Role[]).find(r => r.id === roleId);
        if (oldRole && newRole) {
          addLogEntry(`${player.name} changed from ${oldRole.name} to ${newRole.name}`);
        } else if (newRole) {
          addLogEntry(`${player.name} assigned ${newRole.name}`);
        }
      }
    }
    let newPlayers = players.map(p => {
      if (p.id === id) {
        return {
          ...p,
          roleId: roleId || undefined,
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
          newPlayers = newPlayers.map(p => p.id === candidate.id ? { ...p, roleId: 'king' } : p);
        }
      }
    } else if (roleId === 'huntsman') {
      const hasDamsel = newPlayers.some(p => p.roleId === 'damsel');
      if (!hasDamsel) {
        const candidate = newPlayers.find(p => p.id !== id && !p.roleId) ||
                          newPlayers.find(p => p.id !== id && p.roleId !== 'huntsman');
        if (candidate) {
          newPlayers = newPlayers.map(p => p.id === candidate.id ? { ...p, roleId: 'damsel' } : p);
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
    const player = players.find(p => p.id === id);
    if (player) {
      const roleObj = (rolesData as Role[]).find(r => r.id === player.roleId);
      const defaultEvil = roleObj ? (roleObj.team === 'minion' || roleObj.team === 'demon') : false;
      const currentEvil = player.isEvil !== undefined ? player.isEvil : defaultEvil;
      addLogEntry(`${player.name} marked as ${!currentEvil ? 'Evil' : 'Good'}`);
    }
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
    const player = players.find(p => p.id === id);
    if (player) {
      addLogEntry(`${player.name} ${!player.isDrunkOrPoisoned ? 'marked as Drunk/Poisoned' : 'cleared of Drunk/Poisoned'}`);
    }
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, isDrunkOrPoisoned: !p.isDrunkOrPoisoned } : p));
  };

  const togglePlayerTheDrunk = (id: string) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === id) {
        const nextVal = !p.isTheDrunk;
        return {
          ...p,
          isTheDrunk: nextVal,
          isTheMarionette: nextVal ? false : p.isTheMarionette,
          isTheLilMonsta: nextVal ? false : p.isTheLilMonsta,
        };
      }
      return p;
    }));
  };

  const togglePlayerTheMarionette = (id: string) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === id) {
        const nextVal = !p.isTheMarionette;
        return {
          ...p,
          isTheMarionette: nextVal,
          isTheDrunk: nextVal ? false : p.isTheDrunk,
          isTheLilMonsta: nextVal ? false : p.isTheLilMonsta,
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
          isTheDrunk: nextVal ? false : p.isTheDrunk,
          isTheMarionette: nextVal ? false : p.isTheMarionette,
          isTheLilMonsta: nextVal ? false : p.isTheLilMonsta,
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
          isTheDrunk: nextVal ? false : p.isTheDrunk,
          isTheMarionette: nextVal ? false : p.isTheMarionette,
          isTheLunatic: nextVal ? false : p.isTheLunatic,
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

  const handleScriptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseScriptFile(file)
      .then(({ name, author, roles }) => {
        setCustomScriptRoles(roles);
        setScriptName(name);
        setScriptAuthor(author);
      })
      .catch(err => showAlert((err as Error).message));
  };

  const clearCustomScript = () => {
    setCustomScriptRoles(null);
    setScriptName("All Roles");
    setScriptAuthor("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentScriptRoles = customScriptRoles || (rolesData as Role[]);

  const selectionRoles = useMemo(() => {
    const roles = [...currentScriptRoles];
    const allTravelers = (rolesData as Role[]).filter(r => r.team === 'traveler');
    for (const traveler of allTravelers) {
      if (!roles.some(r => r.id === traveler.id)) {
        roles.push(traveler);
      }
    }
    return roles;
  }, [currentScriptRoles]);

  const randomlyAssignRoles = () => {
    const assignedPlayers = performStandardAssignment(players, currentScriptRoles, selectionRoles);
    if (!assignedPlayers) {
      const N = players.length;
      showAlert(N < 5
        ? "Please add at least 5 players to assign roles."
        : "The active script must contain at least some Townsfolk, Minions, and Demons.");
      return;
    }
    setPlayers(assignedPlayers);
    setIsLilMonstaGame(assignedPlayers.some(p => p.isTheLilMonsta));
  };

  const randomlyAssignWithRoles = (selectedRoles: Role[]) => {
    const allTravelers = (rolesData as Role[]).filter(r => r.team === 'traveler');
    const customSelectionRoles = [...selectedRoles];
    for (const traveler of allTravelers) {
      if (!customSelectionRoles.some(r => r.id === traveler.id)) {
        customSelectionRoles.push(traveler);
      }
    }
    const assignedPlayers = performStandardAssignment(players, selectedRoles, customSelectionRoles)!;
    setPlayers(assignedPlayers);
    setIsLilMonstaGame(assignedPlayers.some(p => p.isTheLilMonsta));
  };

  // Un-assign every player's character (and any special-role state), keeping
  // the players themselves — the Standard analog of Whale Bucket's "Clear All".
  const clearAllRoles = () => {
    setPlayers(prev => prev.map(p => ({
      ...p,
      roleId: '',
      roleIds: undefined,
      isDead: false,
      hasDeadVote: false,
      isTheDrunk: false,
      isTheMarionette: false,
      isTheLunatic: false,
      isTheLilMonsta: false,
      isEvil: undefined,
    })));
    setIsLilMonstaGame(false);
  };



  const validationSummary = useMemo(() => {
    return getValidationSummary(players);
  }, [players]);

  const allAssigned = players.length >= 5 && players.every(p => p.roleId);
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

  // Modal logic details
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
  const filteredModalRoles = selectionRoles
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
            ? () => setPhase('setup')
            : remotePlayerIds.size > 0
              // Synced with players: don't silently abandon them by returning to
              // the Host menu — surface the reset/disconnect choice first.
              ? () => setShowResetModal(true)
              : undefined
      }
      titleContent={
        <div className="flex items-center justify-center gap-2">
          <h1 className="font-display text-xl font-bold text-clocktower-blood tracking-widest uppercase">
            Standard
          </h1>
          {isSecondary ? (
            <HeaderCodeBadge
              onClick={confirmDisconnect}
              title="Click to disconnect secondary storyteller device"
              isLightModeActive={isLightModeActive}
            >
              Sync with <span className="text-clocktower-blood font-mono uppercase tracking-wider">{syncCode}</span>
            </HeaderCodeBadge>
          ) : phase === 'setup' ? (
            <HeaderCodeBadge
              onClick={() => setShowRoomCodeModal(true)}
              title="Click to share room"
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
        ) : phase === 'setup' ? (
          <HeaderCodeBadge
            mobile
            onClick={() => setShowRoomCodeModal(true)}
            title="Click to share room"
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
        <StandardSetupPhase
          players={players}
          isSecondary={isSecondary}
          setPhase={(p) => {
            if (p === 'game') {
              const roleLines = players
                .filter(pl => pl.roleId)
                .map(pl => {
                  const r = (rolesData as Role[]).find(ro => ro.id === pl.roleId);
                  const modifiers = [
                    pl.isTheLunatic && 'Lunatic',
                    pl.isTheMarionette && 'Marionette',
                    pl.isTheDrunk && 'Drunk',
                    pl.isTheLilMonsta && 'Lil Monsta',
                  ].filter(Boolean).join(', ');
                  const label = r?.name ?? pl.roleId;
                  return `  ${pl.name} → ${modifiers ? `${label} (${modifiers})` : label}`;
                });
              addLogEntry(`Game started — ${scriptName} · ${players.length} players\n${roleLines.join('\n')}`, 'night', 1);
            }
            setPhase(p);
          }}
          customScriptRoles={customScriptRoles}
          scriptName={scriptName}
          scriptAuthor={scriptAuthor}
          selectedCharacterIds={selectedCharacterIds}
          setSelectedCharacterIds={setSelectedCharacterIds}
          newPlayerName={newPlayerName}
          setNewPlayerName={setNewPlayerName}
          addPlayer={addPlayer}
          fileInputRef={fileInputRef}
          handleScriptUpload={handleScriptUpload}
          clearCustomScript={clearCustomScript}
          randomlyAssignRoles={randomlyAssignRoles}
          randomlyAssignWithRoles={randomlyAssignWithRoles}
          clearAllRoles={clearAllRoles}
          resetGame={resetGame}
          scriptRoles={customScriptRoles || (rolesData as Role[])}
          setActivePlayerId={setActivePlayerId}
          setSearchTerm={setSearchTerm}
          validationSummary={validationSummary}
          isLightModeActive={isLightModeActive}
          allAssigned={allAssigned}
          remotePlayerCount={remotePlayerIds.size}
          remotePlayerIds={remotePlayerIds}
          grimoireConfirmed={grimoireConfirmed}
          onGrimoireConfirmed={() => setGrimoireConfirmed(true)}
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
          selectionRoles={selectionRoles}
          draggedIndex={draggedIndex}
          dragOverIndex={dragOverIndex}
          setSelectedPlayerId={setSelectedPlayerId}
          toggleTimeOfDay={toggleTimeOfDay}
          addTravelerGamePhase={addTravelerGamePhase}
          setNewTravelerName={setNewTravelerName}
          setNewTravelerRoleId={setNewTravelerRoleId}
          handleMouseDown={handleMouseDown}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleDragEnd={handleDragEnd}
          handleTouchStart={handleTouchStart}
          handleTouchMove={handleTouchMove}
          handleTouchEnd={handleTouchEnd}
          onResetDead={resetDead}
          onResetTime={resetTime}
          scriptName={scriptName}
          scriptAuthor={scriptAuthor}
          customScriptRoles={customScriptRoles}
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
            const scriptSlug = scriptName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const dt = new Date().toISOString().replace('T', '-').slice(0, 16).replace(':', '');
            a.download = `standard-${scriptSlug}-${players.length}p-${dt}.txt`;
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

      {/* Player Edit Modal (setup phase) */}
      {activePlayerId && (
        <SetupPlayerEditModal
          activePlayerId={activePlayerId}
          players={players}
          customScriptRoles={customScriptRoles}
          selectionRoles={selectionRoles}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isLightModeActive={isLightModeActive}
          updatePlayerName={updatePlayerName}
          updatePlayerRole={updatePlayerRole}
          removePlayer={removePlayer}
          togglePlayerTheDrunk={togglePlayerTheDrunk}
          togglePlayerTheMarionette={togglePlayerTheMarionette}
          togglePlayerTheLunatic={togglePlayerTheLunatic}
          togglePlayerTheLilMonsta={togglePlayerTheLilMonsta}
          onClose={() => { setActivePlayerId(null); setSearchTerm(''); }}
          isSecondary={isSecondary}
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
        joinUrl={`${window.location.origin}${window.location.pathname}#/standard?syncCode=${syncCode}&gameCode=${gameCode}`}
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
