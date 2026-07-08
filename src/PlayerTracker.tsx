import { useState, useEffect, useMemo, useRef } from 'react';
import { Undo2 } from 'lucide-react';
import rolesData from './roles.json';
import { cn } from './utils/cn';
import type { Player, Role, PlacedReminder } from './types';
import { TEAM_ORDER } from './types';
import { parseScriptFile } from './utils/scriptUtils';

import PlayerDetailsModal from './components/shared/PlayerDetailsModal';
import GamePhase from './components/shared/GamePhase';
import PlayerTrackerSetupPhase from './components/tracker/SetupPhase';
import PlayerTrackerNameEditModal from './components/tracker/NameEditModal';
import { usePlayerDragAndDrop } from './hooks/usePlayerDragAndDrop';
import { useGameSocket } from './hooks/useGameSocket';
import { usePersistedField, readPersistedField } from './hooks/usePersistedField';
import PageLayout from './components/shared/PageLayout';
import DialogModal from './components/shared/DialogModal';
import HeaderCodeBadge from './components/shared/HeaderCodeBadge';
import RoomCodeModal from './components/shared/RoomCodeModal';
import { useDialog } from './hooks/useDialog';

type Phase = 'setup' | 'game';

const STORAGE_KEY = 'player-tracker-botc-game';

function parseShareCodeFromHash(): string | null {
  const hash = window.location.hash;
  const queryStr = hash.includes('?') ? hash.split('?')[1] : window.location.search;
  return new URLSearchParams(queryStr).get('shareCode');
}

interface SetupProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function PlayerTracker({ theme, toggleTheme }: SetupProps) {
  const [players, setPlayers] = usePersistedField<Player[]>(STORAGE_KEY, 'players', []);
  const [phase, setPhase] = usePersistedField<Phase>(STORAGE_KEY, 'phase', 'setup');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [timeOfDay, setTimeOfDay] = usePersistedField<'night' | 'day'>(STORAGE_KEY, 'timeOfDay', 'night');
  const [dayNumber, setDayNumber] = usePersistedField<number>(STORAGE_KEY, 'dayNumber', 1);

  // Traveler states
  const [newTravelerName, setNewTravelerName] = useState('');
  const [newTravelerRoleId, setNewTravelerRoleId] = useState('beggar');

  // Details modal states
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [activeTrackerPlayerId, setActiveTrackerPlayerId] = useState<string | null>(null);
  const [isSearchingRole, setIsSearchingRole] = useState(false);
  const [modalRoleSearch, setModalRoleSearch] = useState('');

  // Script states
  const [scriptName, setScriptName] = usePersistedField<string>(STORAGE_KEY, 'scriptName', "All Roles");
  const [scriptAuthor, setScriptAuthor] = usePersistedField<string>(STORAGE_KEY, 'scriptAuthor', "");
  const [customScriptRoles, setCustomScriptRoles] = usePersistedField<Role[] | null>(STORAGE_KEY, 'customScriptRoles', null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [gameCode, setGameCode] = useState<string | null>(() =>
    readPersistedField<string | null>(STORAGE_KEY, 'code', null) || sessionStorage.getItem('joined-code') || null
  );

  const isSynced = !!gameCode;
  const { dialogProps, showAlert, showConfirm } = useDialog();

  // A one-way "share my local notes" code — separate from `gameCode` (which
  // is only ever set when this tracker has joined a live Storyteller game).
  // Anyone with this code can view a read-only copy of the grimoire and
  // player names; no characters, status, or notes are ever sent.
  const [shareCode, setShareCode] = useState<string>(() => {
    const saved = localStorage.getItem('tracker-botc-share-code');
    if (saved) return saved;
    const newCode = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    localStorage.setItem('tracker-botc-share-code', newCode);
    return newCode;
  });
  const [showShareModal, setShowShareModal] = useState(false);

  const [gameNotes, setGameNotes] = usePersistedField<string>(STORAGE_KEY, 'gameNotes', '');
  const [enableReminders, setEnableReminders] = usePersistedField<boolean>(STORAGE_KEY, 'enableReminders', false);
  const [reminderTokens, setReminderTokens] = usePersistedField<PlacedReminder[]>(STORAGE_KEY, 'reminderTokens', []);

  const [winnerTeam, setWinnerTeam] = useState<'good' | 'evil' | null>(null);

  const [userRotation, setUserRotation] = useState<number | null>(null);

  const rotationOffset = useMemo(() => {
    if (userRotation !== null) return userRotation;
    const myName = sessionStorage.getItem('joined-name') || localStorage.getItem('botc-joined-name') || '';
    if (!myName) return 0;
    const idx = players.findIndex(p => p.name.trim().toLowerCase() === myName.trim().toLowerCase());
    return idx !== -1 ? idx : 0;
  }, [players, userRotation]);

  const handleIncomingMessage = (data: unknown) => {
    const payload = data as {
      type: string;
      gameType?: 'standard' | 'whale-bucket';
      players?: Player[];
      timeOfDay?: 'night' | 'day';
      dayNumber?: number;
      scriptName?: string;
      scriptAuthor?: string;
      customScriptRoles?: Role[] | null;
      playerId?: string;
    };
    // Only an explicit reset returns a joined game-tracker player to the
    // JoinPage lobby (waiting room for Standard, reset preferences picker for
    // Whale Bucket). A plain setup_update is NOT a reset: the storyteller may
    // just step back to setup to tweak something, and that should leave players
    // on their character / tracker untouched.
    const joinedFromLobby = !!sessionStorage.getItem('joined-code') && !!sessionStorage.getItem('joined-name');
    if (payload.type === 'game_reset') {
      if (joinedFromLobby) {
        window.location.hash = payload.gameType === 'whale-bucket' ? '#/join?returnTo=preferences' : '#/join';
      }
      return;
    }
    if (payload.type === 'setup_update' || payload.type === 'game_started' || payload.type === 'game_update') {
      if (payload.players) {
        setPlayers((currentPlayers) => {
          return payload.players!.map((sp) => {
            const lp = currentPlayers.find(
              (p) => p.id === sp.id || p.name.trim().toLowerCase() === sp.name.trim().toLowerCase()
            );
            if (lp) {
              return {
                ...sp,
                // Preserve local guesses
                roleId: lp.roleId,
                roleIds: lp.roleIds,
                isEvil: lp.isEvil,
                isDrunkOrPoisoned: lp.isDrunkOrPoisoned,
                isTheDrunk: lp.isTheDrunk,
                isTheMarionette: lp.isTheMarionette,
                isTheLunatic: lp.isTheLunatic,
                isTheLilMonsta: lp.isTheLilMonsta,
              };
            }
            return {
              ...sp,
              roleId: sp.roleId || '',
            };
          });
        });
      }
      if (payload.timeOfDay) {
        setTimeOfDay(payload.timeOfDay);
      }
      if (payload.dayNumber !== undefined) {
        setDayNumber(payload.dayNumber);
      }
      if (payload.scriptName) {
        setScriptName(payload.scriptName);
      }
      if (payload.scriptAuthor !== undefined) {
        setScriptAuthor(payload.scriptAuthor);
      }
      if (payload.customScriptRoles !== undefined) {
        setCustomScriptRoles(payload.customScriptRoles);
      }
    } else if (payload.type === 'game_winner') {
      const team = (payload as { type: string; team: string }).team;
      setWinnerTeam(team === 'good' ? 'good' : 'evil');
    } else if (payload.type === 'storyteller_quit') {
      showAlert('The Storyteller has quit the session. Reverting to local tracker.');
      sessionStorage.removeItem('joined-code');
      sessionStorage.removeItem('joined-name');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          delete parsed.code;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        } catch (e) {
          console.error(e);
        }
      }
      setGameCode(null);
    } else if (payload.type === 'booted') {
      const myPlayerId = sessionStorage.getItem('botc-player-id');
      if (payload.playerId === myPlayerId) {
        showAlert('You have been booted from the game room. Reverting to local tracker.');
        sessionStorage.removeItem('joined-code');
        sessionStorage.removeItem('joined-name');
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            delete parsed.code;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          } catch (e) {
            console.error(e);
          }
        }
        setGameCode(null);
      }
    }
  };

  useGameSocket(gameCode || '', handleIncomingMessage);

  // Hand a one-time copy of the initial setup (player names + script) to
  // anyone who opens the share link — not an ongoing sync. The recipient
  // gets their own independent, fully-editable tracker seeded with this
  // data; no characters, status, or notes are ever sent, and nothing here
  // pushes again after the recipient's one request.
  const sendShareMessageRef = useRef<((payload: unknown) => Promise<void>) | null>(null);

  const handleShareSocketMessage = (data: unknown) => {
    const payload = data as { type: string };
    if (payload.type === 'notes_share_sync_request') {
      sendShareMessageRef.current?.({
        type: 'notes_share_state',
        players: players.map(p => ({ id: p.id, name: p.name })),
        scriptName,
        scriptAuthor,
        customScriptRoles,
      });
    }
  };

  const { sendMessage: sendShareMessage } = useGameSocket(!isSynced ? shareCode : '', handleShareSocketMessage);
  useEffect(() => {
    sendShareMessageRef.current = sendShareMessage;
  }, [sendShareMessage]);

  // Receiving side: this device opened someone else's share link. Request
  // their setup once, apply it as our own local (independent, editable)
  // tracker state, then forget the code — this is a one-time import, not a
  // live connection.
  const [incomingShareCode, setIncomingShareCode] = useState<string | null>(() => parseShareCodeFromHash());
  const hasAppliedIncomingShare = useRef(false);

  // A share link often opens in a tab that already has the tracker mounted
  // (e.g. a previously-used browser tab) — the initial-state lookup above
  // only runs once at mount, so it'd otherwise never notice a shareCode
  // that appears later via a plain hash navigation (which doesn't remount
  // this component). Re-check on every hash change too.
  useEffect(() => {
    const onHashChange = () => {
      const code = parseShareCodeFromHash();
      if (code) {
        hasAppliedIncomingShare.current = false;
        setIncomingShareCode(code);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleIncomingShareMessage = (data: unknown) => {
    const payload = data as {
      type: string;
      players?: { id: string; name: string }[];
      scriptName?: string;
      scriptAuthor?: string;
      customScriptRoles?: Role[] | null;
    };
    if (payload.type === 'notes_share_state' && !hasAppliedIncomingShare.current) {
      hasAppliedIncomingShare.current = true;
      if (payload.players) {
        setPlayers(payload.players.map(p => ({ id: p.id, name: p.name, isDead: false })));
      }
      if (payload.scriptName) setScriptName(payload.scriptName);
      if (payload.scriptAuthor !== undefined) setScriptAuthor(payload.scriptAuthor);
      if (payload.customScriptRoles !== undefined) setCustomScriptRoles(payload.customScriptRoles);
      window.history.replaceState(null, '', '#/tracker');
      setIncomingShareCode(null);
    }
  };

  const { sendMessage: sendIncomingShareRequest, isConnected: isIncomingShareConnected } = useGameSocket(incomingShareCode || '', handleIncomingShareMessage);
  useEffect(() => {
    if (!incomingShareCode || !isIncomingShareConnected) return;
    // Ask as soon as our socket is actually subscribed (not on a blind
    // timer — real WebSocket handshakes can take longer than a fixed
    // delay), then keep retrying: the sharer's reply is only delivered to
    // subscribers connected at the moment it's sent, so a single request
    // can go unanswered if either side's socket wasn't fully up yet.
    sendIncomingShareRequest({ type: 'notes_share_sync_request' });
    const retry = setInterval(() => {
      sendIncomingShareRequest({ type: 'notes_share_sync_request' });
    }, 2000);
    return () => clearInterval(retry);
  }, [incomingShareCode, isIncomingShareConnected, sendIncomingShareRequest]);

  const closeDetailsModal = () => {
    setSelectedPlayerId(null);
    setIsSearchingRole(false);
    setModalRoleSearch('');
  };

  const clearSyncSession = () => {
    sessionStorage.removeItem('joined-code');
    sessionStorage.removeItem('joined-name');
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        delete parsed.code;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      } catch (e) {
        console.error(e);
      }
    }
    setGameCode(null);
    setUserRotation(null);
  };

  const disconnectSync = () => {
    showConfirm('Disconnect from this synced session? You\'ll keep your current players and notes locally, but stop receiving updates from the Storyteller.', clearSyncSession, 'Disconnect Sync');
  };

  // Back-button guard: a synced player about to leave to the main menu is
  // asked to confirm first (cancel keeps them in the session).
  const confirmDisconnectAndLeave = () => {
    showConfirm("Disconnect from this synced session and return to the main menu?", () => {
      clearSyncSession();
      window.location.hash = '';
    }, 'Disconnect Sync');
  };

  const resetGame = () => {
    showConfirm('Are you sure you want to reset the tracker? This clears all players and settings.', () => {
      setPlayers([]);
      setPhase('setup');
      setTimeOfDay('night');
      setDayNumber(1);
      setReminderTokens([]);
      setEnableReminders(false);
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem('joined-code');
      sessionStorage.removeItem('joined-name');
      setGameNotes('');
      setGameCode(null);
      const newShareCode = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
      localStorage.setItem('tracker-botc-share-code', newShareCode);
      setShareCode(newShareCode);
      window.location.hash = '#/tracker';
    }, 'Reset Tracker');
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
    hoverSide,
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
      gameNotes,
      code: gameCode || undefined,
      enableReminders,
      reminderTokens,
    }));
  }, [players, phase, timeOfDay, dayNumber, customScriptRoles, scriptName, scriptAuthor, gameNotes, gameCode, enableReminders, reminderTokens]);

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
      id: Math.random().toString(36).substring(2, 11),
      name,
      isDead: false,
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
      id: Math.random().toString(36).substring(2, 11),
      name: newTravelerName.trim(),
      roleId: newTravelerRoleId,
      isDead: false,
    };
    setPlayers([newPlayer, ...players]);
    setNewTravelerName('');
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
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

  const updatePlayerRole = (id: string, roleId: string) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          roleId: roleId || undefined,
          roleIds: roleId ? [roleId] : [],
          isEvil: undefined,
          isTheDrunk: false,
          isTheMarionette: false,
          isTheLunatic: false,
          isTheLilMonsta: false,
        };
      }
      return p;
    }));
  };

  const updatePlayerRoles = (id: string, roleIds: string[]) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          roleId: roleIds[0] || undefined,
          roleIds: roleIds,
          isTheDrunk: false,
          isTheMarionette: false,
          isTheLunatic: false,
          isTheLilMonsta: false,
        };
      }
      return p;
    }));
  };

  const togglePlayerDead = (id: string) => {
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
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, hasDeadVote: !p.hasDeadVote } : p));
  };

  const togglePlayerEvil = (id: string) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === id) {
        const roleObj = selectionRoles.find(r => r.id === p.roleId);
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

  const handleScriptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseScriptFile(file)
      .then(({ name, author, roles, unknownRoles }) => {
        setCustomScriptRoles(roles);
        setScriptName(name);
        setScriptAuthor(author);
        if (unknownRoles.length > 0) {
          const list = unknownRoles.map(r => r.name).join(', ');
          showAlert(`This script includes custom character(s) not recognized by the app: ${list}. They'll still be usable, but their team was inferred from the script file and they won't have official icons or ability text.`);
        }
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

  const isLightModeActive = theme === 'light';

  // Details Modal helpers
  const modalPlayer = selectedPlayerId ? players.find(p => p.id === selectedPlayerId) : null;
  const modalRoleObj = modalPlayer ? (selectionRoles.find(r => r.id === modalPlayer.roleId) || undefined) : undefined;
  const currentIndex = selectedPlayerId ? players.findIndex(p => p.id === selectedPlayerId) : -1;
  const prevPlayerId = currentIndex !== -1 ? players[(currentIndex - 1 + players.length) % players.length].id : null;
  const nextPlayerId = currentIndex !== -1 ? players[(currentIndex + 1) % players.length].id : null;

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

      // Sort by order in script JSON
      const indexA = selectionRoles.findIndex((r) => r.id === a.id);
      const indexB = selectionRoles.findIndex((r) => r.id === b.id);
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <>
    {incomingShareCode && (
      <div className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center space-y-4 backdrop-blur-sm transition-all duration-300",
        isLightModeActive ? "bg-white/95 text-clocktower-night" : "bg-gray-955/95 text-white"
      )}>
        <div className="relative">
          <div className="absolute inset-0 bg-clocktower-demon/15 rounded-full blur-xl scale-125 animate-pulse" />
          <img
            src="/icons/summoner.svg"
            alt="Summoning..."
            className="w-24 h-24 object-contain animate-spin relative z-10"
            style={{ animationDuration: '3s' }}
          />
        </div>
        <p className="font-display text-lg font-bold tracking-widest uppercase animate-pulse relative z-10 mt-2 text-clocktower-blood">
          Summoning...
        </p>
      </div>
    )}
    <PageLayout
      theme={theme}
      toggleTheme={toggleTheme}
      backHref={phase === 'setup' && !isSynced ? "#/" : undefined}
      onBack={
        phase !== 'setup'
          ? () => setPhase('setup')
          : isSynced
            // Synced tracker: confirm before leaving so a stray back press
            // doesn't silently drop the player out of the game.
            ? confirmDisconnectAndLeave
            : undefined
      }
      titleContent={
        <div className="flex items-center justify-center gap-2">
          <h1 className="font-display text-xl font-bold text-clocktower-blood tracking-widest uppercase">
            Game Notes
          </h1>
          {isSynced ? (
            <HeaderCodeBadge
              onClick={disconnectSync}
              title="Click to disconnect from the Storyteller's live game"
              isLightModeActive={isLightModeActive}
            >
              Sync with <span className="text-clocktower-blood font-mono uppercase tracking-wider">{gameCode}</span>
            </HeaderCodeBadge>
          ) : (
            <HeaderCodeBadge
              onClick={() => setShowShareModal(true)}
              title="Share a copy of these player names and script to start someone else's own Game Notes"
              isLightModeActive={isLightModeActive}
            >
              Share Notes
            </HeaderCodeBadge>
          )}
        </div>
      }
      headerExtra={
        isSynced ? (
          <HeaderCodeBadge
            mobile
            onClick={disconnectSync}
            title="Click to disconnect from the Storyteller's live game"
            isLightModeActive={isLightModeActive}
          >
            Sync with <span className="text-clocktower-blood font-mono uppercase tracking-wider">{gameCode}</span>
          </HeaderCodeBadge>
        ) : (
          <HeaderCodeBadge
            mobile
            onClick={() => setShowShareModal(true)}
            title="Share a copy of these player names and script to start someone else's own Game Notes"
            isLightModeActive={isLightModeActive}
          >
            Share Notes
          </HeaderCodeBadge>
        )
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
      contentClassName="px-4 md:px-8 lg:px-12 pt-6 pb-4"
    >

      {phase === 'setup' && (
        <PlayerTrackerSetupPhase
          isLightModeActive={theme === 'light'}
          players={players}
          customScriptRoles={customScriptRoles}
          scriptName={scriptName}
          scriptAuthor={scriptAuthor}
          newPlayerName={newPlayerName}
          setNewPlayerName={setNewPlayerName}
          addPlayer={addPlayer}
          setActiveTrackerPlayerId={setActiveTrackerPlayerId}
          fileInputRef={fileInputRef}
          handleScriptUpload={handleScriptUpload}
          clearCustomScript={clearCustomScript}
          setPhase={setPhase}
          draggedIndex={draggedIndex}
          dragOverIndex={dragOverIndex}
          hoverSide={hoverSide}
          handleMouseDown={handleMouseDown}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleDragEnd={handleDragEnd}
          handleTouchStart={handleTouchStart}
          handleTouchMove={handleTouchMove}
          handleTouchEnd={handleTouchEnd}
          isSynced={isSynced}
          resetGame={resetGame}
        />
      )}

      {/* Player Edit Modal (setup phase) */}
      {activeTrackerPlayerId && (
        <PlayerTrackerNameEditModal
          activePlayerId={activeTrackerPlayerId}
          players={players}
          isLightModeActive={isLightModeActive}
          updatePlayerName={updatePlayerName}
          removePlayer={removePlayer}
          onClose={() => setActiveTrackerPlayerId(null)}
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
          onResetDead={isSynced ? undefined : resetDead}
          onResetTime={isSynced ? undefined : resetTime}
          showNightOrder={false}
          scriptName={scriptName}
          scriptAuthor={scriptAuthor}
          customScriptRoles={customScriptRoles}
          isSynced={isSynced}
          enableReminders={enableReminders}
          includeAllScriptReminders={true}
          reminderTokens={reminderTokens}
          onSetReminderTokens={setReminderTokens}
          showReminderToggle={true}
          onToggleReminders={setEnableReminders}
          notes={gameNotes}
          onNotesChange={setGameNotes}
          rotationOffset={rotationOffset}
          onRotationChange={setUserRotation}
        />
      )}

      {/* Player Details Modal */}
      {selectedPlayerId && modalPlayer && (
        <PlayerDetailsModal
          player={modalPlayer}
          players={players}
          roleObj={modalRoleObj}
          filteredModalRoles={filteredModalRoles}
          allRoles={selectionRoles}
          isSearchingRole={isSearchingRole}
          modalRoleSearch={modalRoleSearch}
          isLightModeActive={isLightModeActive}
          onClose={closeDetailsModal}
          onPrevPlayer={() => prevPlayerId && setSelectedPlayerId(prevPlayerId)}
          onNextPlayer={() => nextPlayerId && setSelectedPlayerId(nextPlayerId)}
          onUpdateName={updatePlayerName}
          onUpdateRole={updatePlayerRole}
          onUpdateNotes={updatePlayerNotes}
          onUpdatePronouns={updatePlayerPronouns}
          onToggleDead={togglePlayerDead}
          onToggleDeadVote={togglePlayerDeadVote}
          onToggleDrunkOrPoisoned={togglePlayerDrunkOrPoisoned}
          onToggleEvil={togglePlayerEvil}
          onToggleLilMonsta={() => {}}
          isLilMonstaGame={false}
          onSetSearchingRole={setIsSearchingRole}
          onSetModalRoleSearch={setModalRoleSearch}
          allowMultipleRoles={true}
          onUpdateRoles={updatePlayerRoles}
          isSynced={isSynced}
        />
      )}
    </PageLayout>
    <DialogModal {...dialogProps} isLightModeActive={isLightModeActive} />
    {showShareModal && (
      <RoomCodeModal
        gameCode={shareCode}
        joinUrl={`${window.location.origin}${window.location.pathname}#/tracker?shareCode=${shareCode}`}
        onClose={() => setShowShareModal(false)}
        isLightModeActive={isLightModeActive}
        shareOnly
      />
    )}

    {/* Winner full-screen overlay */}
    {winnerTeam && (
      <div
        id="winner-overlay"
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-8 cursor-pointer select-none animate-[fadeIn_0.6s_ease-out]"
        style={{
          minHeight: '100dvh',
          background: winnerTeam === 'good'
            ? 'linear-gradient(to bottom, #172554, #1e3a8a, #1e1b4b)'
            : 'linear-gradient(to bottom, #450a0a, #1c0606, #020610)',
        }}
        onClick={() => setWinnerTeam(null)}
      >
        <div className="flex flex-col items-center gap-6 text-center max-w-sm animate-[scaleIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_both]">
          <div className="text-8xl">
            {winnerTeam === 'good' ? '🌟' : '😈'}
          </div>
          <h1 className={cn(
            'text-4xl font-extrabold tracking-tight',
            winnerTeam === 'good' ? 'text-blue-200' : 'text-red-300'
          )}>
            {winnerTeam === 'good' ? 'Good Wins!' : 'Evil Wins!'}
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            {winnerTeam === 'good'
              ? 'Ravenswood Bluff is saved and the Demon will no longer kill again. At least for now…'
              : 'The Townsfolk of Ravenswood Bluff never had a chance.'}
          </p>
          <p className="text-xs text-gray-500 mt-4">Tap to dismiss</p>
        </div>
      </div>
    )}
    </>
  );
}
