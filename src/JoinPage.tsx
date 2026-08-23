import { useState, useEffect, useRef, useMemo } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import { useIsMobile } from './hooks/useIsMobile';
import { ALL_ROLES } from './utils/roleData';
import { cn } from './utils/cn';
import { sortByScriptOrder, withInPlayTravelers } from './utils/scriptUtils';
import { RotateCcw } from 'lucide-react';
import type { Role, Player } from './types';
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

// Silent-disconnect fallback: lets the Storyteller drop our connected icon if we vanish without a deliberate leave.
const HEARTBEAT_INTERVAL_MS = 20_000;

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

  const [state, setState] = useState<'join' | 'checking' | 'preferences' | 'waiting' | 'revealed' | 'tracker'>(() => {
    const savedCode = sessionStorage.getItem('joined-code');
    const savedName = sessionStorage.getItem('joined-name');
    if (savedCode && savedName) return returnToPrefs ? 'preferences' : 'waiting';
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
  const [assignedRole, setAssignedRole] = useState<Role | null>(null);
  const [revealed, setRevealed] = useState(false);

  // Dynamic game state synced from Storyteller for the player tracker
  const [players, setPlayers] = useState<Player[]>([]);
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
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [pronouns, setPronouns] = useState(() => localStorage.getItem('joined-pronouns') || '');
  const [showRoomCodeModal, setShowRoomCodeModal] = useState(false);

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
  }

  // Send this player back to the lobby after a reset-but-keep-connected: a direct command, not inferred from UI; Whale Bucket → preferences picker, Standard → waiting room.
  const returnToLobby = (resetGameType: 'standard' | 'whale-bucket' = 'standard') => {
    setAssignedRole(null);
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
      returnToLobby(payload.gameType);
      return;
    }
    if (payload.type === 'setup_update') {
      const me = payload.players?.find(
        (pl) => pl.name.trim().toLowerCase() === name.trim().toLowerCase() || pl.id === playerId
      );
      if (me) {
        if (joinRetryIntervalRef.current) clearInterval(joinRetryIntervalRef.current);
        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
        setGameType(payload.gameType);

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
      }

      if (stateRef.current === 'waiting' || stateRef.current === 'preferences' || stateRef.current === 'checking') {
        setPlayers(payload.players || []);
      }
    } else if (payload.type === 'room_full') {
      if (payload.playerId === playerId || payload.playerName?.trim().toLowerCase() === name.trim().toLowerCase()) {
        if (joinRetryIntervalRef.current) clearInterval(joinRetryIntervalRef.current);
        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
        sessionStorage.removeItem('joined-code');
        sessionStorage.removeItem('joined-name');
        setState('join');
        setErrorMsg('The game room is full.');
      }
    } else if (payload.type === 'code_valid') {
      if (payload.playerId === playerId || payload.playerName?.trim().toLowerCase() === name.trim().toLowerCase()) {
        if (joinRetryIntervalRef.current) clearInterval(joinRetryIntervalRef.current);
        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
        setGameType(payload.gameType);

        if (stateRef.current === 'checking') {
          sessionStorage.setItem('joined-code', code);
          sessionStorage.setItem('joined-name', name);
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
      }
    } else if (payload.type === 'game_started' || payload.type === 'game_update') {
      if (payload.scriptName) {
        setScriptName(payload.scriptName);
      }
      if (payload.scriptAuthor !== undefined) {
        setScriptAuthor(payload.scriptAuthor);
      }
      if (payload.customScriptRoles !== undefined) {
        setCustomScriptRoles(payload.customScriptRoles);
      }
      if (payload.players) {
        setPlayers(payload.players);
        setTimeOfDay(payload.timeOfDay || 'night');
        setDayNumber(payload.dayNumber || 1);

        const me = payload.players.find((pl) => pl.name.trim().toLowerCase() === name.trim().toLowerCase() || pl.id === playerId);
        if (me) {
          if (me.roleId) {
            const effectiveRoles = (payload.customScriptRoles !== undefined ? payload.customScriptRoles : customScriptRoles) || (ALL_ROLES as Role[]);
            // Fall back to the full official role list: travelers under a custom script aren't in effectiveRoles, so without this the token never reveals.
            const rObj = effectiveRoles.find(r => r.id === me.roleId)
              ?? (ALL_ROLES as Role[]).find(r => r.id === me.roleId);
            if (rObj) {
              setAssignedRole(rObj);
              if (stateRef.current === 'waiting' || stateRef.current === 'preferences') {
                setState('revealed');
              }
            }
          }
        }
      }
    } else if (payload.type === 'storyteller_quit') {
      showAlert('The Storyteller has quit the session.');
      sessionStorage.removeItem('joined-code');
      sessionStorage.removeItem('joined-name');
      setState('join');
      setUserRotation(null);
    } else if (payload.type === 'booted') {
      if (payload.playerId === playerId) {
        showAlert('You have been booted from the game room.');
        sessionStorage.removeItem('joined-code');
        sessionStorage.removeItem('joined-name');
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
      if (state === 'waiting' || state === 'revealed' || state === 'tracker' || state === 'preferences') {
        sendMessage({
          type: 'player_join',
          name: name,
          id: playerId,
          pronouns: pronouns || undefined,
        });
      }
    }
  }, [isConnected, code, name, state, playerId, pronouns, sendMessage]);

  // Heartbeat: a periodic ping while present, so the Storyteller can tell a silent disconnect
  // (network drop, backgrounded/killed app) apart from a still-connected player.
  useEffect(() => {
    if (!code) return;
    if (!(state === 'waiting' || state === 'revealed' || state === 'tracker')) return;
    const interval = setInterval(() => {
      sendMessage({ type: 'player_heartbeat', id: playerId });
    }, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [code, state, playerId, sendMessage]);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      setErrorMsg('Please enter a valid 4-letter code and name.');
      return;
    }
    localStorage.setItem('botc-joined-name', name);
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
        type: 'player_join',
        name: name,
        id: playerId
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
    sendMessage({ type: 'player_leave', id: playerId });
    sessionStorage.removeItem('joined-code');
    sessionStorage.removeItem('joined-name');
    setCode('');
    setName(localStorage.getItem('botc-joined-name') || '');
    setState('join');
    setAssignedRole(null);
    setRevealed(false);
    setUserRotation(null);
  };

  const goToTracker = () => {
    const clearedPlayers = players.map(p => ({
      ...p,
      roleId: '',
      roleIds: undefined,
      isTheDrunk: false,
      isTheMarionette: false,
      isTheLunatic: false,
      isTheLilMonsta: false,
      isEvil: undefined
    }));
    localStorage.setItem('player-tracker-botc-game', JSON.stringify({
      players: clearedPlayers,
      phase: 'game',
      timeOfDay,
      dayNumber,
      scriptName,
      customScriptRoles,
      code
    }));
    window.location.hash = '#/tracker';
  };

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
              <button
                onClick={() => setState('revealed')}
                className="text-clocktower-blood hover:underline text-xs flex items-center gap-1"
              >
                <span>Show Token</span>
              </button>
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

    <ScriptCharactersModal
      isOpen={isScriptModalOpen}
      onClose={() => setIsScriptModalOpen(false)}
      scriptName={scriptName}
      roles={sortedRoles}
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
