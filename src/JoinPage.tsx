import { useState, useEffect, useRef, useMemo } from 'react';
import { useScrollLock } from './hooks/useScrollLock';
import { useGameSocket } from './hooks/useGameSocket';
import { useIsMobile } from './hooks/useIsMobile';
import rolesData from './official_roles.json';
import { cn } from './utils/cn';
import { roleIconFallback } from './utils/roleIcon';
import { ShieldAlert, Sparkles, ArrowRight, Eye, EyeOff, Settings, CheckCircle2, RotateCcw, Plus, Search, Moon, Scroll, QrCode } from 'lucide-react';
import type { Role, Player } from './types';
import ScriptCharactersModal from './components/shared/ScriptCharactersModal';
import GrimoireBoard from './components/shared/GrimoireBoard';
import PageLayout from './components/shared/PageLayout';
import DialogModal from './components/shared/DialogModal';
import { useDialog } from './hooks/useDialog';
import RoomCodeModal from './components/shared/RoomCodeModal';

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

  // A Whale Bucket player who reset from the game tracker is routed here as
  // `#/join?returnTo=preferences` — land them straight on the (fresh) picker.
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

  // Mirror `state` in a ref so the socket message handler always reads the
  // latest committed value rather than a stale closure — realtime messages can
  // arrive between a render and the effect that re-binds the handler.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Strip the one-shot ?returnTo param so a later refresh doesn't force the
  // player back onto the preferences screen after they've moved on.
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

  const [activePrefSelect, setActivePrefSelect] = useState<{ team: 'townsfolk' | 'outsider' | 'minion' | 'demon' } | null>(null);
  useScrollLock(!!activePrefSelect);
  const [prefSearchTerm, setPrefSearchTerm] = useState('');
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
    const baseRoles = customScriptRoles || (rolesData as Role[]);
    return [...baseRoles].sort((a, b) => a.name.localeCompare(b.name));
  }, [customScriptRoles]);

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

  // Send this player back to the lobby after the storyteller resets the game
  // but keeps everyone connected. Unconditional by design: it's a direct
  // command, not something inferred from the current UI state, which is what
  // makes it reliable. Whale Bucket players return to the preferences picker
  // (with a fresh, empty selection); Standard players return to the waiting
  // room.
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
      // Explicit "storyteller reset, stay connected" signal. Always obey it,
      // regardless of what screen this player is currently on.
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
          // Persist the session as soon as we're in the room (both modes) so a
          // later game tracker / reset can reliably resume the join.
          sessionStorage.setItem('joined-code', code);
          sessionStorage.setItem('joined-name', name);
          setState(payload.gameType === 'whale-bucket' ? 'preferences' : 'waiting');
        }
        // NB: a plain setup_update is NOT treated as a reset. The storyteller
        // may simply step back to setup to tweak something without wanting to
        // boot everyone off their character. Only the explicit `game_reset`
        // command (handled above) returns players to the lobby.
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
            const effectiveRoles = (payload.customScriptRoles !== undefined ? payload.customScriptRoles : customScriptRoles) || (rolesData as Role[]);
            const rObj = effectiveRoles.find(r => r.id === me.roleId);
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

  // Keep player entry in the storyteller list synchronized on connection/reconnection.
  // 'preferences' is included so a Whale Bucket player who lands on the picker
  // after a reset re-announces and receives the current excludedRoleIds/script.
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
    {showLoading && (
      <div className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center space-y-4 backdrop-blur-sm transition-all duration-300",
        isLight ? "bg-white/95 text-clocktower-night" : "bg-gray-950/95 text-white"
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
    <PageLayout theme={theme} toggleTheme={toggleTheme} title="Join Game" backHref="#/">
      <div className="w-full max-w-md mx-auto">

        {/* 1. JOIN SCREEN */}
        {state === 'join' && (
          <form onSubmit={handleJoinSubmit} className={cn(
            "border rounded-lg p-6 space-y-4 shadow-xl transition-all duration-300",
            isLight ? "bg-white border-gray-200" : "bg-gray-900/60 border-gray-800"
          )}>
            <h2 className="text-center font-display text-base font-bold tracking-wider uppercase">Enter Game Room</h2>

            {errorMsg && (
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold flex items-center gap-2">
                <ShieldAlert size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Room Code</label>
              <input
                type="text"
                placeholder="e.g. KVTQ"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
                className={cn(
                  "w-full text-center text-xl font-bold rounded-lg border py-2.5 focus:outline-none tracking-widest uppercase",
                  isLight ? "bg-gray-50 border-gray-300 focus:border-clocktower-blood" : "bg-gray-900 border-gray-700 focus:border-clocktower-blood text-white"
                )}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Name</label>
              <input
                type="text"
                placeholder="Enter your name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={cn(
                  "w-full rounded-lg border px-4 py-2.5 focus:outline-none text-center font-semibold",
                  isLight ? "bg-gray-50 border-gray-300 focus:border-clocktower-blood" : "bg-gray-900 border-gray-700 focus:border-clocktower-blood text-white"
                )}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-clocktower-blood text-white rounded-lg py-3 font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 mt-2 shadow-md shadow-clocktower-blood/20"
            >
              <span>Join Game Room</span>
              <ArrowRight size={16} />
            </button>
          </form>
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
          <div className={cn(
            "border rounded-lg p-6 space-y-5 shadow-xl w-full max-w-md",
            isLight ? "bg-white border-gray-200" : "bg-gray-900/60 border-gray-800"
          )}>
            <div>
              <h2 className="font-display text-base font-bold text-center tracking-wider uppercase">Submit Your Preferences</h2>
              <p className="text-xs text-gray-500 text-center mt-0.5">Select one character in each category (optional)</p>
            </div>

            {/* Render selectors for each category */}
            <div className="space-y-3.5">
              {(['townsfolk', 'outsider', 'minion', 'demon'] as const).map((team) => {
                const selectedRoleId = prefs[team][0];
                const selectedRole = selectedRoleId ? (rolesData as Role[]).find(r => r.id === selectedRoleId) : null;
                return (
                  <div key={team} className="space-y-1.5">
                    <label className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      team === 'townsfolk' && "text-clocktower-townsfolk",
                      team === 'outsider' && "text-clocktower-outsider",
                      team === 'minion' && "text-clocktower-minion",
                      team === 'demon' && "text-clocktower-demon"
                    )}>
                      {team} Preference
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setActivePrefSelect({ team });
                        setPrefSearchTerm('');
                      }}
                      className={cn(
                        "w-full flex items-center justify-between border px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.01]",
                        selectedRole 
                          ? isLight 
                            ? "bg-white border-gray-300 shadow-sm"
                            : "bg-gray-900 border-gray-800 shadow-sm"
                          : isLight
                            ? "bg-gray-50 border-dashed border-gray-300 hover:bg-gray-100 text-gray-400"
                            : "bg-gray-950 border-dashed border-gray-800 hover:bg-gray-900/50 text-gray-500"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {selectedRole ? (
                          <>
                            <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center shrink-0 border border-gray-200 shadow-sm">
                              <img src={`/icons/${selectedRole.id}.svg`} alt={selectedRole.name} className="w-4 h-4 object-contain" />
                            </span>
                            <span className={cn(
                              "font-bold text-sm truncate",
                              team === 'townsfolk' && "text-clocktower-townsfolk",
                              team === 'outsider' && "text-clocktower-outsider",
                              team === 'minion' && "text-clocktower-minion",
                              team === 'demon' && "text-clocktower-demon"
                            )}>
                              {selectedRole.name}
                            </span>
                          </>
                        ) : (
                          <>
                            <Plus size={16} className="shrink-0" />
                            <span className="text-xs font-semibold">Select {team} preference...</span>
                          </>
                        )}
                      </div>
                      {selectedRole ? (
                        <span className="text-[10px] text-gray-400 hover:underline uppercase font-bold shrink-0">Change</span>
                      ) : (
                        <Search size={14} className="shrink-0" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handlePrefsSubmit}
              className="w-full bg-clocktower-blood text-white rounded-lg py-3 font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 mt-2 shadow-sm"
            >
              <Sparkles size={16} />
              <span>Submit Character Preferences</span>
            </button>
          </div>
        )}

        {/* 3b. SELECT MODAL (Whale Bucket only) */}
        {activePrefSelect && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={cn(
              "border w-full max-w-sm rounded-lg p-4 space-y-4 max-h-[80vh] flex flex-col shadow-2xl transition-all duration-300",
              isLight ? "bg-white border-gray-250 text-gray-800" : "bg-gray-900 border-gray-800 text-gray-100"
            )}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={cn(
                    "font-bold text-base font-serif",
                    isLight ? "text-clocktower-night" : "text-white"
                  )}>
                    Select {activePrefSelect.team === 'townsfolk' ? 'Townsfolk' : activePrefSelect.team === 'outsider' ? 'Outsiders' : activePrefSelect.team === 'minion' ? 'Minions' : 'Demons'}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                    For your {activePrefSelect.team} preference
                  </p>
                </div>
                <button
                  onClick={() => setActivePrefSelect(null)}
                  className="text-xs text-clocktower-blood hover:underline font-bold"
                >
                  Done
                </button>
              </div>

              <div className={cn(
                "flex items-center border rounded-lg px-2.5 text-xs py-1",
                isLight ? "bg-gray-50 border-gray-300 focus-within:border-clocktower-blood" : "bg-gray-950 border-gray-800 focus-within:border-clocktower-blood"
              )}>
                <Search size={14} className="text-gray-500 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  autoFocus={!isMobile}
                  placeholder="Search character name..."
                  className="bg-transparent flex-1 outline-none text-xs placeholder-gray-500 h-8 w-full"
                  value={prefSearchTerm}
                  onChange={(e) => setPrefSearchTerm(e.target.value)}
                />
              </div>

              <div className={cn(
                "overflow-y-auto overscroll-contain flex-1 border rounded bg-gray-955/20 divide-y pr-1",
                isLight ? "border-gray-200 divide-gray-150" : "border-gray-855 divide-gray-800/60"
              )}>
                {(rolesData as Role[])
                  .filter(r => r.team === activePrefSelect.team && !excludedRoleIds.includes(r.id) && r.name.toLowerCase().includes(prefSearchTerm.toLowerCase()))
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(role => {
                    const isSelected = prefs[activePrefSelect.team].includes(role.id);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          togglePreference(activePrefSelect.team, role.id);
                          setActivePrefSelect(null);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2.5 text-xs transition-colors flex justify-between items-center",
                          isSelected
                            ? isLight ? "bg-red-50/50" : "bg-clocktower-blood/10"
                            : isLight ? "hover:bg-gray-50" : "hover:bg-gray-850"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0 border border-gray-100 shadow-sm">
                            <img
                              src={`/icons/${role.id}.svg`}
                              alt={role.name}
                              className="w-3.5 h-3.5 object-contain"
                              onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
                            />
                          </span>
                          <span className={cn(
                            "font-bold text-xs truncate",
                            role.team === 'townsfolk' && "text-clocktower-townsfolk",
                            role.team === 'outsider' && "text-clocktower-outsider",
                            role.team === 'minion' && "text-clocktower-minion",
                            role.team === 'demon' && "text-clocktower-demon",
                          )}>
                            {role.name}
                          </span>
                        </div>
                        {isSelected ? (
                          <span className="text-[9px] bg-clocktower-blood/10 text-clocktower-blood border border-clocktower-blood/20 px-1.5 py-0.5 rounded font-black">
                            ✓ SELECTED
                          </span>
                        ) : (
                          <span className="text-[9px] text-gray-400 font-bold">+ SELECT</span>
                        )}
                      </button>
                    );
                  })}
              </div>

              <div className="flex justify-between items-center pt-2.5 border-t border-gray-250 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setPrefs(prev => ({ ...prev, [activePrefSelect.team]: [] }));
                    setActivePrefSelect(null);
                  }}
                  className="text-xs text-gray-500 hover:text-red-500 hover:underline"
                >
                  Clear Selection
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const available = (rolesData as Role[]).filter(r => r.team === activePrefSelect.team);
                    if (available.length > 0) {
                      const randIdx = Math.floor(Math.random() * available.length);
                      setPrefs(prev => ({ ...prev, [activePrefSelect.team]: [available[randIdx].id] }));
                    }
                    setActivePrefSelect(null);
                  }}
                  className="text-xs text-clocktower-townsfolk hover:underline font-semibold"
                >
                  Select Random
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. WAITING SCREEN */}
        {state === 'waiting' && (
          <div
            id="waiting-screen"
            className={cn(
              "border rounded-lg p-6 text-center space-y-6 shadow-xl relative",
              isLight ? "bg-white border-gray-200" : "bg-gray-900/60 border-gray-800"
            )}
          >
            <button
              id="waiting-screen-qr-button"
              type="button"
              onClick={() => setShowRoomCodeModal(true)}
              className={cn(
                "absolute top-4 right-4 p-1.5 rounded-full transition-colors",
                isLight ? "text-gray-500 hover:text-gray-900 hover:bg-black/5" : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
              title="Show Room QR Code"
            >
              <QrCode size={36} />
            </button>
            <div className="flex flex-col items-center space-y-2">
              <CheckCircle2 size={42} className="text-emerald-500 animate-pulse" />
              <h3 className="font-display text-base font-bold tracking-wider uppercase">Joined Room {code}</h3>
              <p className="text-sm font-semibold text-gray-500">Registered as <span className="text-clocktower-blood">{name}</span></p>
            </div>

            <div className="space-y-2">
              <p className={cn("text-[10px] uppercase font-bold tracking-wider text-center", isLight ? "text-gray-400" : "text-gray-500")}>Pronouns (optional)</p>
              <div className="flex justify-center gap-1.5">
                {['He/Him', 'She/Her', 'They/Them', 'Ask Me'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      const next = pronouns === p ? '' : p;
                      setPronouns(next);
                      localStorage.setItem('joined-pronouns', next);
                      sendMessage({ type: 'player_join', name, id: playerId, pronouns: next || undefined });
                    }}
                    className={cn(
                      "px-2 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap",
                      pronouns === p
                        ? "bg-clocktower-blood text-white border-clocktower-blood"
                        : isLight
                          ? "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                          : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="game-script-button"
              type="button"
              onClick={() => setIsScriptModalOpen(true)}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all shadow-sm hover:opacity-90 active:scale-[0.98]",
                isLight
                  ? "bg-clocktower-night text-white hover:bg-gray-800"
                  : "bg-gray-800 border border-gray-700 text-white hover:bg-gray-700"
              )}
            >
              <Scroll size={15} />
              <span>View Script: {scriptName}</span>
            </button>
            <div className={cn("p-4 rounded-xl border text-xs leading-relaxed", isLight ? "bg-gray-50 border-gray-200" : "bg-gray-950 border-gray-800")}>
              {gameType === 'whale-bucket' ? (
                <p>Your character preferences have been successfully sent to the Storyteller. Wait until everyone has joined and the Storyteller starts the game.</p>
              ) : (
                <p>Wait until everyone has joined and the storyteller has assigned roles. Your assigned character token will automatically reveal here when the Grimoire is opened.</p>
              )}
            </div>

            <button
              onClick={handleLeaveGame}
              className="text-gray-500 hover:text-gray-300 text-xs underline font-semibold flex items-center gap-1.5 mx-auto"
            >
              <RotateCcw size={12} />
              <span>Leave Game Room</span>
            </button>
          </div>
        )}

        {/* 5. REVEALED TOKEN SCREEN */}
        {state === 'revealed' && assignedRole && (
          <div className="space-y-6 text-center">
            {/* Reveal Card Wrapper */}
            <div
              onClick={() => goToTracker()}
              className={cn(
                "w-full h-80 rounded-lg border cursor-pointer perspective-1000 transform-style-3d transition-all duration-700 relative shadow-2xl border-clocktower-blood/50",
                revealed ? "rotate-y-180" : ""
              )}
            >
              {/* Card Front: Mystery Shroud */}
              <div className={cn(
                "absolute inset-0 rounded-lg flex flex-col items-center justify-center p-6 backface-hidden",
                isLight ? "bg-gray-100 text-clocktower-night" : "bg-gray-900 text-gray-200"
              )}>
                <div className="w-20 h-20 bg-clocktower-blood/10 border border-clocktower-blood/30 rounded-full flex items-center justify-center mb-4 text-clocktower-blood animate-pulse shadow-[0_0_15px_rgba(139,0,0,0.3)]">
                  <Moon size={36} />
                </div>
                <h3 className="font-display text-xl font-bold tracking-wider uppercase">Your Character Token</h3>
                <p className="text-xs text-gray-500 font-semibold mt-2 uppercase tracking-widest flex items-center gap-1">
                  <span>Tap to Reveal</span>
                  {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
                </p>
              </div>

              {/* Card Back: Assigned Character Token */}
              <div className={cn(
                "absolute inset-0 rounded-lg flex flex-col items-center justify-center p-6 rotate-y-180 backface-hidden",
                isLight ? "bg-white" : "bg-gray-950"
              )}>
                {/* Character Color Rim */}
                <div className={cn(
                  "w-28 h-28 rounded-full border-4 flex items-center justify-center bg-white shadow-lg shadow-black/20 mb-4 animate-scaleUp",
                  assignedRole.team === 'townsfolk' && "border-clocktower-townsfolk",
                  assignedRole.team === 'outsider' && "border-clocktower-outsider",
                  assignedRole.team === 'minion' && "border-clocktower-minion",
                  assignedRole.team === 'demon' && "border-clocktower-demon",
                  assignedRole.team === 'traveler' && "border-clocktower-traveler"
                )}>
                  <img key={assignedRole.id} src={`/icons/${assignedRole.id}.svg`} alt={assignedRole.name} className="w-20 h-20 object-contain" onError={roleIconFallback(assignedRole, assignedRole.team === 'minion' || assignedRole.team === 'demon')} />
                </div>

                <div className="flex gap-2 justify-center items-center mb-3">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border",
                    assignedRole.team === 'townsfolk' && "text-clocktower-townsfolk border-clocktower-townsfolk/40 bg-clocktower-townsfolk/5",
                    assignedRole.team === 'outsider' && "text-clocktower-outsider border-clocktower-outsider/40 bg-clocktower-outsider/5",
                    assignedRole.team === 'minion' && "text-clocktower-minion border-clocktower-minion/40 bg-clocktower-minion/5",
                    assignedRole.team === 'demon' && "text-clocktower-demon border-clocktower-demon/40 bg-clocktower-demon/5",
                    assignedRole.team === 'traveler' && "text-clocktower-traveler border-clocktower-traveler/40 bg-clocktower-traveler/5"
                  )}>
                    {assignedRole.team}
                  </span>
                </div>

                <h3 className={cn(
                  "font-display text-2xl font-bold tracking-wider",
                  assignedRole.team === 'townsfolk' && "text-clocktower-townsfolk",
                  assignedRole.team === 'outsider' && "text-clocktower-outsider",
                  assignedRole.team === 'minion' && "text-clocktower-minion",
                  assignedRole.team === 'demon' && "text-clocktower-demon",
                  assignedRole.team === 'traveler' && "text-clocktower-traveler"
                )}>
                  {assignedRole.name}
                </h3>

                {/* Role ability summary */}
                <p className="text-xs text-gray-400 mt-3 max-w-[90%] leading-relaxed">
                  {assignedRole.ability ?? (rolesData as Array<{ id: string; ability: string }>).find((r) => r.id === assignedRole.id)?.ability}
                </p>
              </div>
            </div>

            <button
              onClick={goToTracker}
              className="w-full bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-gray-800 text-white rounded-lg py-3 font-bold transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-black/10 hover:scale-101"
            >
              <Settings size={16} />
              <span>Open Player Game Tracker</span>
            </button>
          </div>
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
                toggleTimeOfDay={() => {}}
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
