import { useState, useEffect, useRef, useMemo } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import { useIsMobile } from './hooks/useIsMobile';
import { ALL_ROLES } from './utils/roleData';
import { cn } from './utils/cn';
import { syncTrackerPlayers } from './utils/syncTrackerPlayers';
import { sortByScriptOrder, withInPlayTravelers } from './utils/scriptUtils';
import { RotateCcw } from 'lucide-react';
import type { AnyRole, LoricRole, Role, Player } from './types';
import ScriptCharactersModal from './components/shared/modals/ScriptCharactersModal';
import GrimoireBoard from './components/shared/grimoire/GrimoireBoard';
import PageLayout from './components/shared/ui/PageLayout';
import DialogModal from './components/shared/modals/DialogModal';
import { useDialog } from './hooks/useDialog';
import RoomCodeModal from './components/shared/modals/RoomCodeModal';
import LoadingScreen from './components/shared/ui/LoadingScreen';
import PreferencesScreen from './components/join/PreferencesScreen';
import RevealedScreen from './components/join/RevealedScreen';
import WaitingScreen from './components/join/WaitingScreen';
import JoinForm from './components/join/JoinForm';
import SpectatorResetModal from './components/shared/modals/SpectatorResetModal';

export default function JoinPage({ theme, toggleTheme }: { theme: 'light' | 'dark'; toggleTheme: () => void }) {
  const [code, setCode] = useState(() => {
    const savedCode = sessionStorage.getItem('joined-code');
    if (savedCode) return savedCode.toUpperCase();
    const params = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : window.location.search);
    const urlCode = params.get('code');
    if (urlCode && urlCode.length === 4) {
      return urlCode.toUpperCase();
    }
    return '';
  });
  const [name, setName] = useState(() => {
    return sessionStorage.getItem('joined-name') || localStorage.getItem('botc-joined-name') || '';
  });
  const [playerId] = useState(() => {
    const saved = sessionStorage.getItem('botc-player-id');
    if (saved) return saved;
    const newId = 'p-' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('botc-player-id', newId);
    return newId;
  });

  // A Whale Bucket player who reset from the tracker arrives as #/join?returnTo=preferences — land them on the fresh picker.
  const [returnToPrefs] = useState(() => {
    const params = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
    return params.get('returnTo') === 'preferences';
  });

  const [state, setState] = useState<'join' | 'checking' | 'in-session' | 'preferences' | 'waiting' | 'revealed' | 'tracker'>(() => {
    const savedCode = sessionStorage.getItem('joined-code');
    const savedName = sessionStorage.getItem('joined-name');
    if (savedCode && savedName) {
      if (sessionStorage.getItem('joined-spectator-pending') === 'true') return 'in-session';
      if (sessionStorage.getItem('joined-spectator') === 'true') return 'tracker';
      return returnToPrefs ? 'preferences' : 'waiting';
    }
    return 'join';
  });

  // Mirror state in a ref so the socket handler reads the latest value, not a stale closure (messages can arrive between render and re-bind).
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Strip the one-shot ?returnTo param so a later refresh doesn't force the player back to preferences.
  useEffect(() => {
    if (returnToPrefs) {
      window.history.replaceState(null, '', '#/join');
    }
  }, [returnToPrefs]);

  const [gameType, setGameType] = useState<'standard' | 'whale-bucket'>(() => returnToPrefs ? 'whale-bucket' : 'standard');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [assignedRole, setAssignedRole] = useState<AnyRole | null>(null);
  const [revealed, setRevealed] = useState(false);

  // Dynamic game state synced from Storyteller for the player tracker
  const [players, setPlayers] = useState<Player[]>([]);
  const [torEnabled, setTorEnabled] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<'night' | 'day'>('night');
  const [dayNumber, setDayNumber] = useState(1);

  // Preferences selected by the player for Whale Bucket
  const [prefs, setPrefs] = useState({
    townsfolk: [] as string[],
    outsider: [] as string[],
    minion: [] as string[],
    demon: [] as string[],
  });

  const [excludedRoleIds, setExcludedRoleIds] = useState<string[]>([]);
  const [scriptName, setScriptName] = useState("All Roles");
  const [scriptAuthor, setScriptAuthor] = useState("");
  const { dialogProps, showAlert } = useDialog();
  const [customScriptRoles, setCustomScriptRoles] = useState<Role[] | null>(null);
  const [scriptLoricRoles, setScriptLoricRoles] = useState<LoricRole[]>([]);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [pronouns, setPronouns] = useState(() => localStorage.getItem('joined-pronouns') || '');
  const [showRoomCodeModal, setShowRoomCodeModal] = useState(false);
  const [isSpectator, setIsSpectator] = useState(() => sessionStorage.getItem('joined-spectator') === 'true' || sessionStorage.getItem('joined-spectator-pending') === 'true');
  const [wasMadeSpectator, setWasMadeSpectator] = useState(false);
  const [showSpectatorReset, setShowSpectatorReset] = useState(false);

  useEffect(() => {
    if (isSpectator && state === 'tracker') {
      window.location.hash = '#/tracker';
    }
  }, [isSpectator, state]);

  const [userRotation, setUserRotation] = useState<number | null>(null);

  const rotationOffset = useMemo(() => {
    if (userRotation !== null) return userRotation;
    const myName = name;
    if (!myName) return 0;
    const idx = players.findIndex(p => p.name.trim().toLowerCase() === myName.trim().toLowerCase());
    return idx !== -1 ? idx : 0;
  }, [players, name, userRotation]);

  const sortedRoles = useMemo(() => {
    const baseRoles = customScriptRoles || (ALL_ROLES as Role[]);
    return sortByScriptOrder(withInPlayTravelers(baseRoles, players), baseRoles);
  }, [customScriptRoles, players]);

  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const joinRetryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const connTimeout = connectionTimeoutRef.current;
    const retryInterval = joinRetryIntervalRef.current;
    return () => {
      if (connTimeout) clearTimeout(connTimeout);
      if (retryInterval) clearInterval(retryInterval);
    };
  }, []);

  interface GamePayload {
    type: string;
    gameType: 'standard' | 'whale-bucket';
    playerId?: string;
    playerName?: string;
    players?: Player[];
    timeOfDay?: 'night' | 'day';
    dayNumber?: number;
    excludedRoleIds?: string[];
    scriptName?: string;
    scriptAuthor?: string;
    customScriptRoles?: Role[];
    scriptLoricRoles?: LoricRole[];
    torEnabled?: boolean;
    spectator?: boolean;
  }

  // Send this player back to the lobby after a reset-but-keep-connected: a direct command, not inferred from UI; Whale Bucket → preferences picker, Standard → waiting room.
  const returnToLobby = (resetGameType: 'standard' | 'whale-bucket' = 'standard') => {
    setAssignedRole(null);
    setTorEnabled(false);
    setRevealed(false);
    sessionStorage.setItem('joined-code', code);
    sessionStorage.setItem('joined-name', name);
    if (resetGameType === 'whale-bucket') {
      setPrefs({ townsfolk: [], outsider: [], minion: [], demon: [] });
      setGameType('whale-bucket');
      setState('preferences');
    } else {
      setState('waiting');
    }
  };

  const handleMessage = (data: unknown) => {
    const payload = data as GamePayload;
    if (payload.type === 'game_reset') {
      // Explicit "storyteller reset, stay connected" signal — always obey it regardless of current screen.
      if (isSpectator) {
        if (payload.gameType) setGameType(payload.gameType);
        setShowSpectatorReset(true);
        setPlayers([]);
        setTimeOfDay('night');
        setDayNumber(1);
        return;
      }
      returnToLobby(payload.gameType);
      return;
    }
    if (payload.type === 'setup_update') {
      if (payload.torEnabled !== undefined) setTorEnabled(payload.torEnabled);
      const me = payload.players?.find(
        (pl) => pl.id === playerId || (!isSpectator && pl.name.trim().toLowerCase() === name.trim().toLowerCase())
      );
      if (me) {
        if (joinRetryIntervalRef.current) clearInterval(joinRetryIntervalRef.current);
        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
        setGameType(payload.gameType);

        if (isSpectator && !payload.spectator) {
          sessionStorage.removeItem('joined-spectator');
          sessionStorage.removeItem('joined-spectator-pending');
          setIsSpectator(false);
          setState('waiting');
        }
        if (stateRef.current === 'checking') {
          // Persist the session as soon as we're in the room (both modes) so a later tracker/reset can resume the join.
          sessionStorage.setItem('joined-code', code);
          sessionStorage.setItem('joined-name', name);
          setState(payload.gameType === 'whale-bucket' ? 'preferences' : 'waiting');
        }
        // A plain setup_update is NOT a reset (storyteller may just tweak setup); only the explicit game_reset command returns players to the lobby.
      }

      if (payload.excludedRoleIds) {
        setExcludedRoleIds(payload.excludedRoleIds);
      }
      if (payload.scriptName) {
        setScriptName(payload.scriptName);
      }
      if (payload.scriptAuthor !== undefined) {
        setScriptAuthor(payload.scriptAuthor);
      }
      if (payload.customScriptRoles !== undefined) {
        setCustomScriptRoles(payload.customScriptRoles);
        setScriptLoricRoles(payload.scriptLoricRoles ?? []);
      }

      if (stateRef.current === 'waiting' || stateRef.current === 'preferences' || stateRef.current === 'checking' || stateRef.current === 'in-session') {
        setPlayers(payload.players || []);
      }
    } else if (payload.type === 'room_full') {
      if (payload.playerId === playerId || payload.playerName?.trim().toLowerCase() === name.trim().toLowerCase()) {
        if (joinRetryIntervalRef.current) clearInterval(joinRetryIntervalRef.current);
        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
        sessionStorage.removeItem('joined-code');
        sessionStorage.removeItem('joined-name');
        sessionStorage.removeItem('joined-spectator');
        sessionStorage.removeItem('joined-spectator-pending');
        setState('join');
        setErrorMsg('The game room is full.');
      }
    } else if (payload.type === 'duplicate_name') {
      if (payload.playerId === playerId) {
        if (joinRetryIntervalRef.current) clearInterval(joinRetryIntervalRef.current);
        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
        sessionStorage.removeItem('joined-code');
        sessionStorage.removeItem('joined-name');
        setState('join');
        setErrorMsg('That name is already in use in this room. Please choose another.');
      }
    } else if (payload.type === 'code_valid') {
      if (payload.playerId !== playerId) return;
      if (payload.torEnabled !== undefined) setTorEnabled(payload.torEnabled);
      if (joinRetryIntervalRef.current) clearInterval(joinRetryIntervalRef.current);
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      setGameType(payload.gameType);

      if (isSpectator && !payload.spectator) {
        sessionStorage.removeItem('joined-spectator');
        sessionStorage.removeItem('joined-spectator-pending');
        setIsSpectator(false);
        setState('waiting');
      }
      if (stateRef.current === 'checking' || (payload.spectator && !isSpectator)) {
        sessionStorage.setItem('joined-code', code);
        sessionStorage.setItem('joined-name', name);
        if (payload.spectator) {
          setWasMadeSpectator(stateRef.current !== 'checking');
          sessionStorage.setItem('joined-spectator-pending', 'true');
          setIsSpectator(true);
          setAssignedRole(null);
          setRevealed(false);
          if (payload.players) setPlayers(payload.players);
          if (payload.timeOfDay) setTimeOfDay(payload.timeOfDay);
          if (payload.dayNumber !== undefined) setDayNumber(payload.dayNumber);
          setState('in-session');
        } else {
          setState(payload.gameType === 'whale-bucket' ? 'preferences' : 'waiting');
        }
      }

      if (payload.excludedRoleIds) {
        setExcludedRoleIds(payload.excludedRoleIds);
      }
      if (payload.scriptName) {
        setScriptName(payload.scriptName);
      }
      if (payload.scriptAuthor !== undefined) {
        setScriptAuthor(payload.scriptAuthor);
      }
      if (payload.customScriptRoles !== undefined) {
        setCustomScriptRoles(payload.customScriptRoles);
        setScriptLoricRoles(payload.scriptLoricRoles ?? []);
      }
    } else if (payload.type === 'game_started' || payload.type === 'game_update') {
      const torMode = payload.torEnabled ?? torEnabled;
      if (payload.torEnabled !== undefined) setTorEnabled(payload.torEnabled);
      if (payload.scriptName) {
        setScriptName(payload.scriptName);
      }
      if (payload.scriptAuthor !== undefined) {
        setScriptAuthor(payload.scriptAuthor);
      }
      if (payload.customScriptRoles !== undefined) {
        setCustomScriptRoles(payload.customScriptRoles);
        setScriptLoricRoles(payload.scriptLoricRoles ?? []);
      }
      if (payload.players) {
        setPlayers(payload.players);
        setTimeOfDay(payload.timeOfDay || 'night');
        setDayNumber(payload.dayNumber || 1);

        const me = payload.players.find(pl => pl.id === playerId || (!isSpectator && pl.name.trim().toLowerCase() === name.trim().toLowerCase()));
        if (isSpectator && me) {
          sessionStorage.removeItem('joined-spectator');
          sessionStorage.removeItem('joined-spectator-pending');
          setIsSpectator(false);
        }
        if (me) {
          if (me.roleId) {
            const effectiveRoles = (payload.customScriptRoles !== undefined ? payload.customScriptRoles : customScriptRoles) || (ALL_ROLES as Role[]);
            // Fall back to the full official role list: travelers under a custom script aren't in effectiveRoles, so without this the token never reveals.
            const rObj = effectiveRoles.find(r => r.id === me.roleId)
              ?? (ALL_ROLES as Role[]).find(r => r.id === me.roleId);
            if (rObj) {
              const displayedRole = torMode
                ? (ALL_ROLES as AnyRole[]).find(role => role.id === 'tor') ?? rObj
                : rObj;
              setAssignedRole(displayedRole);
              if (isSpectator || stateRef.current === 'waiting' || stateRef.current === 'preferences') {
                setState('revealed');
                setRevealed(torMode);
              }
            }
          }
        }
      }
    } else if (payload.type === 'storyteller_quit') {
      showAlert('The Storyteller has quit the session.');
      sessionStorage.removeItem('joined-code');
      sessionStorage.removeItem('joined-name');
      sessionStorage.removeItem('joined-spectator');
      sessionStorage.removeItem('joined-spectator-pending');
      setIsSpectator(false);
      setState('join');
      setUserRotation(null);
    } else if (payload.type === 'booted' || payload.type === 'banned') {
      if (payload.playerId === playerId) {
        if (joinRetryIntervalRef.current) clearInterval(joinRetryIntervalRef.current);
        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
        const message = 'You have been removed from the game by the storyteller';
        showAlert(message);
        setErrorMsg(message);
        sessionStorage.removeItem('joined-code');
        sessionStorage.removeItem('joined-name');
        sessionStorage.removeItem('joined-spectator');
        sessionStorage.removeItem('joined-spectator-pending');
        setIsSpectator(false);
        setAssignedRole(null);
        setRevealed(false);
        window.location.hash = '#/join';
        setState('join');
        setUserRotation(null);
      }
    }
  };

  const { isConnected, sendMessage } = useGameSocket(code, handleMessage);

  // Keep this player synced in the storyteller list on connect/reconnect; 'preferences' included so a reset Whale Bucket player re-announces and gets current excludedRoleIds/script.
  useEffect(() => {
    if (isConnected && code && name) {
      if (state === 'waiting' || state === 'revealed' || state === 'tracker' || state === 'preferences' || state === 'in-session') {
        sendMessage({
          type: isSpectator ? 'spectator_join' : 'player_join',
          name: name,
          id: playerId,
          pronouns: pronouns || undefined,
        });
      }
    }
  }, [isConnected, code, name, state, playerId, pronouns, sendMessage, isSpectator]);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      setErrorMsg('Please enter a valid 4-letter code and name.');
      return;
    }
    localStorage.setItem('botc-joined-name', name);
    setWasMadeSpectator(false);
    setErrorMsg(null);
    setState('checking');

    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }
    if (joinRetryIntervalRef.current) {
      clearInterval(joinRetryIntervalRef.current);
    }

    let attempts = 0;
    const sendJoinMessage = () => {
      console.log(`[Join] Sending player_join attempt ${attempts + 1} for ${name} (ID: ${playerId})`);
      sendMessage({
        type: isSpectator ? 'spectator_join' : 'player_join',
        name: name,
        id: playerId,
        pronouns: pronouns || undefined,
      });
      attempts++;
      if (attempts >= 5) {
        if (joinRetryIntervalRef.current) {
          clearInterval(joinRetryIntervalRef.current);
        }
        setState('join');
        setErrorMsg('Could not reach Storyteller. Double check the code and ensure their setup screen is open.');
      }
    };

    sendJoinMessage();
    joinRetryIntervalRef.current = setInterval(sendJoinMessage, 1500);
  };

  const handlePrefsSubmit = () => {
    sendMessage({
      type: 'player_join',
      name: name,
      id: playerId,
      pronouns: pronouns || undefined,
      preferences: {
        townsfolk: prefs.townsfolk,
        outsider: prefs.outsider,
        minion: prefs.minion,
        demon: prefs.demon,
        traveler: []
      }
    });

    sessionStorage.setItem('joined-code', code);
    sessionStorage.setItem('joined-name', name);
    setState('waiting');
  };

  const handleLeaveGame = () => {
    sessionStorage.removeItem('joined-code');
    sessionStorage.removeItem('joined-name');
    sessionStorage.removeItem('joined-spectator');
    sessionStorage.removeItem('joined-spectator-pending');
    setCode('');
    setName(localStorage.getItem('botc-joined-name') || '');
    setState('join');
    setAssignedRole(null);
    setTorEnabled(false);
    setRevealed(false);
    setUserRotation(null);
    setIsSpectator(false);
  };

  const openSpectatorNotes = () => {
    sessionStorage.removeItem('joined-spectator-pending');
    sessionStorage.setItem('joined-spectator', 'true');
    goToTracker();
  };

  const keepWatching = () => {
    sessionStorage.removeItem('joined-spectator-pending');
    sessionStorage.setItem('joined-spectator', 'true');
    setShowSpectatorReset(false);
    goToTracker();
  };

  const joinNextSession = () => {
    setShowSpectatorReset(false);
    sessionStorage.removeItem('joined-spectator');
    sessionStorage.removeItem('joined-spectator-pending');
    setIsSpectator(false);
    if (gameType === 'whale-bucket') {
      setPrefs({ townsfolk: [], outsider: [], minion: [], demon: [] });
      setState('preferences');
    } else {
      setState('waiting');
    }
  };

  function goToTracker() {
    const clearedPlayers = syncTrackerPlayers(players);
    localStorage.setItem('player-tracker-botc-game', JSON.stringify({
      players: clearedPlayers,
      phase: 'game',
      timeOfDay,
      dayNumber,
      scriptName,
      scriptAuthor,
      customScriptRoles,
      scriptLoricRoles,
      torEnabled,
      code
    }));
    window.location.hash = '#/tracker';
  }

  // Helper to toggle a single preference selection (max 1 character per type)
  const togglePreference = (team: 'townsfolk' | 'outsider' | 'minion' | 'demon', roleId: string) => {
    setPrefs(prev => {
      const list = prev[team];
      const isSelected = list.includes(roleId);
      return {
        ...prev,
        [team]: isSelected ? [] : [roleId]
      };
    });
  };

  const isMobile = useIsMobile();
  const isLight = theme === 'light';
  const showLoading = state === 'checking' || (state !== 'join' && !isConnected);

  return (
    <>
    {showLoading && <LoadingScreen isLight={isLight} />}
    <PageLayout theme={theme} toggleTheme={toggleTheme} title="Join Game" backHref="#/">
      <div className="w-full max-w-md mx-auto">

        {/* 1. JOIN SCREEN */}
        {state === 'join' && (
          <JoinForm
            isLight={isLight}
            code={code}
            onCodeChange={setCode}
            name={name}
            onNameChange={setName}
            isSpectator={isSpectator}
            onSpectatorChange={setIsSpectator}
            errorMsg={errorMsg}
            onSubmit={handleJoinSubmit}
          />
        )}

        {/* 2. CHECKING SCREEN */}
        {state === 'checking' && (
          <div className={cn(
            "border rounded-lg p-8 text-center space-y-4 shadow-xl",
            isLight ? "bg-white border-gray-200" : "bg-gray-900/60 border-gray-800"
          )}>
            <div className="w-12 h-12 border-4 border-clocktower-blood border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h3 className="font-display font-bold text-base tracking-wider uppercase">Connecting to Room {code}</h3>
            <p className="text-xs text-gray-500">Exchanging credentials with the Storyteller's browser.</p>
          </div>
        )}

        {state === 'in-session' && (
          <div className={cn(
            'space-y-4 rounded-lg border p-8 text-center shadow-xl',
            isLight ? 'border-gray-200 bg-white' : 'border-gray-800 bg-gray-900/60'
          )}>
            <h3 className="font-display text-base font-bold uppercase tracking-wider">Spectator View</h3>
            <p role="status" className="text-sm text-gray-500">
              {wasMadeSpectator
                ? 'The storyteller made you a spectator. You can keep following the game in Game Notes.'
                : 'View the synced game notes without taking a seat in the grimoire.'}
            </p>
            <button
              type="button"
              onClick={openSpectatorNotes}
              className="w-full rounded-md bg-clocktower-blood px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-800"
            >
              View Game Notes
            </button>
          </div>
        )}

        {/* 3. PREFERENCES SCREEN (Whale Bucket only) */}
        {state === 'preferences' && (
          <PreferencesScreen
            isLight={isLight}
            isMobile={isMobile}
            prefs={prefs}
            setPrefs={setPrefs}
            togglePreference={togglePreference}
            excludedRoleIds={excludedRoleIds}
            onSubmit={handlePrefsSubmit}
          />
        )}

        {/* 4. WAITING SCREEN */}
        {state === 'waiting' && (
          <WaitingScreen
            isLight={isLight}
            code={code}
            name={name}
            pronouns={pronouns}
            onSelectPronoun={(next) => { setPronouns(next); localStorage.setItem('joined-pronouns', next); sendMessage({ type: 'player_join', name, id: playerId, pronouns: next || undefined }); }}
            scriptName={scriptName}
            gameType={gameType}
            onShowQr={() => setShowRoomCodeModal(true)}
            onViewScript={() => setIsScriptModalOpen(true)}
            onLeave={handleLeaveGame}
          />
        )}

        {/* 5. REVEALED TOKEN SCREEN */}
        {state === 'revealed' && assignedRole && (
          <RevealedScreen isLight={isLight} assignedRole={assignedRole} revealed={revealed} onOpenTracker={goToTracker} />
        )}

        {/* 6. PLAYER SIMPLIFIED GAME TRACKER SCREEN */}
        {state === 'tracker' && (
          <div className="space-y-6 w-full animate-fadeIn">
            {/* Header info */}
            <div className={cn(
              "border rounded-xl p-3 flex justify-between items-center text-xs shadow-sm font-semibold",
              isLight ? "bg-white border-gray-250" : "bg-gray-900/60 border-gray-800"
            )}>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>Active Code: <span className="text-clocktower-blood font-bold">{code}</span></span>
              </span>
              <span className="uppercase tracking-wider font-bold">
                {timeOfDay === 'night' ? '🌙 Night' : '☀️ Day'} {dayNumber}
              </span>
              {!isSpectator && (
                <button
                  onClick={() => setState('revealed')}
                  className="text-clocktower-blood hover:underline text-xs flex items-center gap-1"
                >
                  <span>Show Token</span>
                </button>
              )}
            </div>

            {/* Circular Grimoire Board (without role tokens) */}
            <div className={cn(
              "border rounded-lg p-4 shadow-xl",
              isLight ? "bg-white border-gray-200" : "bg-gray-900/40 border-gray-800"
            )}>
              <h4 className="text-[10px] uppercase font-bold tracking-wider text-gray-500 text-center mb-3">Grimoire Board Layout</h4>
              <GrimoireBoard
                players={players.map(p => ({
                  ...p,
                  roleId: undefined, // Hide the role from other players
                  roleIds: undefined,
                  isTheDrunk: false,
                  isTheMarionette: false,
                  isTheLunatic: false,
                  isTheLilMonsta: false,
                  isEvil: undefined // Hide alignment too
                }))}
                timeOfDay={timeOfDay}
                dayNumber={dayNumber}
                onSelectPlayer={() => {}}
                rolesData={[]}
                isLightModeActive={isLight}
                rotationOffset={rotationOffset}
                onRotationChange={setUserRotation}
              />
            </div>

            {/* Players status list */}
            <div className={cn(
              "border rounded-lg p-4 space-y-2 shadow-xl",
              isLight ? "bg-white border-gray-200" : "bg-gray-900/40 border-gray-800"
            )}>
              <h4 className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-2">Players Status List</h4>
              <div className="divide-y divide-gray-800/40 space-y-1.5">
                {players.map((p, index) => {
                  const isMe = p.name.trim().toLowerCase() === name.trim().toLowerCase() || p.id === playerId;
                  return (
                    <div key={p.id} className="flex justify-between items-center py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="text-gray-500 font-mono text-2xs">#{index + 1}</span>
                        <span className={cn(
                          "font-bold",
                          p.isDead && "line-through text-gray-500",
                          isMe && "text-clocktower-blood"
                        )}>
                          {p.name} {isMe && "(You)"}
                        </span>
                      </span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded font-bold uppercase",
                        p.isDead
                          ? "bg-gray-800/80 text-gray-400"
                          : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      )}>
                        {p.isDead ? 'Dead' : 'Alive'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleLeaveGame}
              className="text-gray-500 hover:text-gray-300 text-xs underline font-semibold flex items-center gap-1.5 mx-auto justify-center"
            >
              <RotateCcw size={12} />
              <span>Leave Game Room</span>
            </button>
          </div>
        )}
      </div>
    </PageLayout>
    <DialogModal {...dialogProps} isLightModeActive={isLight} />

    <SpectatorResetModal
      isOpen={showSpectatorReset}
      isLightModeActive={isLight}
      onJoin={joinNextSession}
      onKeepWatching={keepWatching}
    />

    <ScriptCharactersModal
      isOpen={isScriptModalOpen}
      onClose={() => setIsScriptModalOpen(false)}
      scriptName={scriptName}
      roles={sortedRoles}
      scriptLoricRoles={scriptLoricRoles}
      scriptAuthor={scriptAuthor}
      isLightModeActive={isLight}
    />

    {showRoomCodeModal && (
      <RoomCodeModal
        gameCode={code}
        joinUrl={`${window.location.origin}${window.location.pathname}#/join?code=${code}`}
        onClose={() => setShowRoomCodeModal(false)}
        isLightModeActive={isLight}
      />
    )}
    </>
  );
}
