import { useState, useEffect, useRef } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import rolesData from './official_roles.json';
import { cn } from './utils/cn';
import { ShieldAlert, Sparkles, Moon, Sun, ArrowRight, Eye, EyeOff, Settings, CheckCircle2, RotateCcw } from 'lucide-react';
import type { Role } from './types';
import GrimoireBoard from './components/GrimoireBoard';

export default function JoinPage({ theme, toggleTheme }: { theme: 'light' | 'dark'; toggleTheme: () => void }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [playerId] = useState(() => {
    const saved = sessionStorage.getItem('botc-player-id');
    if (saved) return saved;
    const newId = 'p-' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('botc-player-id', newId);
    return newId;
  });

  const [state, setState] = useState<'join' | 'checking' | 'preferences' | 'waiting' | 'revealed' | 'tracker'>(() => {
    const savedCode = sessionStorage.getItem('joined-code');
    const savedName = sessionStorage.getItem('joined-name');
    if (savedCode && savedName) return 'waiting';
    return 'join';
  });

  const [gameType, setGameType] = useState<'standard' | 'whale-bucket'>('standard');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [assignedRole, setAssignedRole] = useState<Role | null>(null);
  const [revealed, setRevealed] = useState(false);

  // Dynamic game state synced from Storyteller for the player tracker
  const [players, setPlayers] = useState<any[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<'night' | 'day'>('night');
  const [dayNumber, setDayNumber] = useState(1);

  // Preferences selected by the player for Whale Bucket
  const [prefs, setPrefs] = useState({
    townsfolk: [] as string[],
    outsider: [] as string[],
    minion: [] as string[],
    demon: [] as string[],
  });

  const connectionTimeoutRef = useRef<any>(null);
  const joinRetryIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      clearTimeout(connectionTimeoutRef.current);
      clearInterval(joinRetryIntervalRef.current);
    };
  }, []);

  // Restore session if possible
  useEffect(() => {
    const savedCode = sessionStorage.getItem('joined-code');
    const savedName = sessionStorage.getItem('joined-name');
    if (savedCode && savedName) {
      setCode(savedCode.toUpperCase());
      setName(savedName);
    }
  }, []);

  const handleMessage = (payload: any) => {
    if (payload.type === 'setup_update') {
      const isMyNameInList = payload.players?.some(
        (pl: any) => pl.name.trim().toLowerCase() === name.trim().toLowerCase() || pl.id === playerId
      );

      if (isMyNameInList) {
        clearInterval(joinRetryIntervalRef.current);
        clearTimeout(connectionTimeoutRef.current);
        setGameType(payload.gameType);

        if (state === 'checking') {
          if (payload.gameType === 'whale-bucket') {
            setState('preferences');
          } else {
            setState('waiting');
            sessionStorage.setItem('joined-code', code);
            sessionStorage.setItem('joined-name', name);
          }
        }
      }

      if (state === 'waiting' || state === 'preferences' || state === 'checking') {
        setPlayers(payload.players || []);
      }
    } else if (payload.type === 'code_valid') {
      if (payload.playerId === playerId || payload.playerName?.trim().toLowerCase() === name.trim().toLowerCase()) {
        clearInterval(joinRetryIntervalRef.current);
        clearTimeout(connectionTimeoutRef.current);
        setGameType(payload.gameType);

        if (state === 'checking') {
          if (payload.gameType === 'whale-bucket') {
            setState('preferences');
          } else {
            setState('waiting');
            sessionStorage.setItem('joined-code', code);
            sessionStorage.setItem('joined-name', name);
          }
        }
      }
    } else if (payload.type === 'game_started' || payload.type === 'game_update') {
      if (payload.players) {
        setPlayers(payload.players);
        setTimeOfDay(payload.timeOfDay || 'night');
        setDayNumber(payload.dayNumber || 1);

        // Check if I am in the player list and find my assigned role
        const me = payload.players.find((pl: any) => pl.name.trim().toLowerCase() === name.trim().toLowerCase() || pl.id === playerId);
        if (me && me.roleId) {
          const rObj = (rolesData as Role[]).find(r => r.id === me.roleId);
          if (rObj) {
            setAssignedRole(rObj);
            if (state === 'waiting' || state === 'preferences') {
              setState('revealed');
            }
          }
        }
      }
    }
  };

  const { isConnected, sendMessage } = useGameSocket(code, handleMessage);

  // Keep player entry in the storyteller list synchronized on connection/reconnection
  useEffect(() => {
    if (isConnected && code && name) {
      if (state === 'waiting' || state === 'revealed' || state === 'tracker') {
        sendMessage({
          type: 'player_join',
          name: name,
          id: playerId
        });
      }
    }
  }, [isConnected, code, name, state, playerId, sendMessage]);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      setErrorMsg('Please enter a valid 4-letter code and name.');
      return;
    }
    setErrorMsg(null);
    setState('checking');

    clearTimeout(connectionTimeoutRef.current);
    clearInterval(joinRetryIntervalRef.current);

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
        clearInterval(joinRetryIntervalRef.current);
        setState('join');
        setErrorMsg('Could not reach Storyteller. Double check the code and ensure their setup screen is open.');
      }
    };

    sendJoinMessage();
    joinRetryIntervalRef.current = setInterval(sendJoinMessage, 1500);
  };

  const handlePrefsSubmit = () => {
    // Send joined message with preferences
    sendMessage({
      type: 'player_join',
      name: name,
      id: playerId,
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
    setName('');
    setState('join');
    setAssignedRole(null);
    setRevealed(false);
  };

  // Helper to toggle a single preference selection
  const togglePreference = (team: 'townsfolk' | 'outsider' | 'minion' | 'demon', roleId: string) => {
    setPrefs(prev => {
      const list = prev[team];
      const isSelected = list.includes(roleId);
      let updated: string[];
      if (isSelected) {
        updated = list.filter(id => id !== roleId);
      } else {
        // Limit to 3 preferences per category to keep it clean
        if (list.length >= 3) return prev;
        updated = [...list, roleId];
      }
      return { ...prev, [team]: updated };
    });
  };

  // Auto-fill code from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : window.location.search);
    const urlCode = params.get('code');
    if (urlCode && urlCode.length === 4) {
      setCode(urlCode.toUpperCase());
    }
  }, []);

  const isLight = theme === 'light';

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300 font-sans p-4 flex flex-col items-center justify-center",
      isLight ? "bg-[#fcfbf9] text-[#1c1c1e]" : "bg-gray-950 text-gray-100"
    )}>
      {/* Top Header Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className={cn(
            "p-2.5 rounded-full border transition-all duration-300 hover:scale-105 shadow-sm",
            isLight ? "bg-white border-gray-250 text-clocktower-night hover:bg-gray-50" : "bg-gray-900 border-gray-800 text-amber-400 hover:bg-gray-850"
          )}
        >
          {isLight ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Main Brand Logo */}
        <div className="text-center mb-6">
          <h1 className={cn(
            "text-3xl font-extrabold tracking-wide uppercase font-serif",
            isLight ? "text-clocktower-night" : "text-white"
          )}>
            Grimoire <span className="text-clocktower-blood">Join</span>
          </h1>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Connect to the Storyteller's Grimoire Room
          </p>
        </div>

        {/* 1. JOIN SCREEN */}
        {state === 'join' && (
          <form onSubmit={handleJoinSubmit} className={cn(
            "border rounded-2xl p-6 space-y-4 shadow-xl transition-all duration-300",
            isLight ? "bg-white border-gray-200" : "bg-gray-900/60 border-gray-850"
          )}>
            <h2 className="text-center font-serif text-lg font-bold">Enter Game Room Details</h2>

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
                  isLight ? "bg-gray-50 border-gray-300 focus:border-clocktower-blood" : "bg-gray-950 border-gray-800 focus:border-clocktower-blood text-white"
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
                  isLight ? "bg-gray-50 border-gray-300 focus:border-clocktower-blood" : "bg-gray-950 border-gray-800 focus:border-clocktower-blood text-white"
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
            "border rounded-2xl p-8 text-center space-y-4 shadow-xl",
            isLight ? "bg-white border-gray-200" : "bg-gray-900/60 border-gray-850"
          )}>
            <div className="w-12 h-12 border-4 border-clocktower-blood border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h3 className="font-semibold text-lg">Connecting to Room {code}...</h3>
            <p className="text-xs text-gray-500">Exchanging credentials with the Storyteller's browser.</p>
          </div>
        )}

        {/* 3. PREFERENCES SCREEN (Whale Bucket only) */}
        {state === 'preferences' && (
          <div className={cn(
            "border rounded-2xl p-6 space-y-5 shadow-xl",
            isLight ? "bg-white border-gray-200" : "bg-gray-900/60 border-gray-850"
          )}>
            <div>
              <h2 className="font-serif text-lg font-bold text-center">Submit Your Role Preferences</h2>
              <p className="text-xs text-gray-500 text-center mt-0.5">Select up to 3 characters in each category (optional)</p>
            </div>

            {/* Render selectors for each category */}
            {(['townsfolk', 'outsider', 'minion', 'demon'] as const).map((team) => {
              const teamRoles = (rolesData as Role[]).filter(r => r.team === team);
              return (
                <div key={team} className="space-y-1.5">
                  <label className={cn(
                    "text-xs font-bold uppercase tracking-wider",
                    team === 'townsfolk' && "text-clocktower-townsfolk",
                    team === 'outsider' && "text-clocktower-outsider",
                    team === 'minion' && "text-clocktower-minion",
                    team === 'demon' && "text-clocktower-demon"
                  )}>
                    {team} ({prefs[team].length}/3 Selected)
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-gray-950/20 rounded border border-gray-800/40">
                    {teamRoles.map(r => {
                      const isSelected = prefs[team].includes(r.id);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => togglePreference(team, r.id)}
                          className={cn(
                            "px-2.5 py-1 rounded text-2xs font-semibold border transition-all flex items-center gap-1",
                            isSelected
                              ? "bg-clocktower-blood text-white border-clocktower-blood font-bold scale-102"
                              : isLight
                                ? "bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-600"
                                : "bg-gray-800 border-gray-700 hover:bg-gray-750 text-gray-300"
                          )}
                        >
                          <span className="w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shrink-0">
                            <img src={`/icons/${r.id}.svg`} alt={r.name} className="w-2.5 h-2.5 object-contain" />
                          </span>
                          <span>{r.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <button
              onClick={handlePrefsSubmit}
              className="w-full bg-clocktower-blood text-white rounded-lg py-3 font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 mt-2 shadow-sm"
            >
              <Sparkles size={16} />
              <span>Submit Character Preferences</span>
            </button>
          </div>
        )}

        {/* 4. WAITING SCREEN */}
        {state === 'waiting' && (
          <div className={cn(
            "border rounded-2xl p-6 text-center space-y-6 shadow-xl",
            isLight ? "bg-white border-gray-200" : "bg-gray-900/60 border-gray-850"
          )}>
            <div className="flex flex-col items-center space-y-2">
              <CheckCircle2 size={42} className="text-emerald-500 animate-pulse" />
              <h3 className="font-serif text-lg font-bold">Joined Room {code}</h3>
              <p className="text-sm font-semibold text-gray-500">Registered as <span className="text-clocktower-blood">{name}</span></p>
            </div>

            <div className={cn("p-4 rounded-xl border text-xs leading-relaxed", isLight ? "bg-gray-50 border-gray-200" : "bg-gray-950 border-gray-850")}>
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
              onClick={() => setRevealed(!revealed)}
              className={cn(
                "w-full h-80 rounded-2xl border cursor-pointer perspective-1000 transform-style-3d transition-all duration-700 relative shadow-2xl border-clocktower-blood/50",
                revealed ? "rotate-y-180" : ""
              )}
            >
              {/* Card Front: Mystery Shroud */}
              <div className={cn(
                "absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6 backface-hidden",
                isLight ? "bg-gray-100 text-clocktower-night" : "bg-gray-900 text-gray-200"
              )}>
                <div className="w-20 h-20 bg-clocktower-blood/10 border border-clocktower-blood/30 rounded-full flex items-center justify-center mb-4 text-clocktower-blood animate-pulse shadow-[0_0_15px_rgba(139,0,0,0.3)]">
                  <Moon size={36} />
                </div>
                <h3 className="font-serif text-xl font-bold">Your Character Token</h3>
                <p className="text-xs text-gray-500 font-semibold mt-2 uppercase tracking-widest flex items-center gap-1">
                  <span>Tap to Reveal</span>
                  {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
                </p>
              </div>

              {/* Card Back: Assigned Character Token */}
              <div className={cn(
                "absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6 rotate-y-180 backface-hidden",
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
                  <img src={`/icons/${assignedRole.id}.svg`} alt={assignedRole.name} className="w-20 h-20 object-contain" />
                </div>

                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border mb-2",
                  assignedRole.team === 'townsfolk' && "text-clocktower-townsfolk border-clocktower-townsfolk/40 bg-clocktower-townsfolk/5",
                  assignedRole.team === 'outsider' && "text-clocktower-outsider border-clocktower-outsider/40 bg-clocktower-outsider/5",
                  assignedRole.team === 'minion' && "text-clocktower-minion border-clocktower-minion/40 bg-clocktower-minion/5",
                  assignedRole.team === 'demon' && "text-clocktower-demon border-clocktower-demon/40 bg-clocktower-demon/5",
                  assignedRole.team === 'traveler' && "text-clocktower-traveler border-clocktower-traveler/40 bg-clocktower-traveler/5"
                )}>
                  {assignedRole.team}
                </span>

                <h3 className={cn(
                  "font-serif text-2xl font-bold",
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
                  {(rolesData as any).find((r: any) => r.id === assignedRole.id)?.ability}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const clearedPlayers = players.map(p => ({
                  ...p,
                  roleId: '', // Hide characters
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
                  scriptName: "All Roles (Default)",
                  customScriptRoles: null
                }));
                window.location.hash = '#/tracker';
              }}
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
              isLight ? "bg-white border-gray-250" : "bg-gray-900/60 border-gray-850"
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
              "border rounded-2xl p-4 shadow-xl",
              isLight ? "bg-white border-gray-200" : "bg-gray-900/40 border-gray-850"
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
              />
            </div>

            {/* Players status list */}
            <div className={cn(
              "border rounded-2xl p-4 space-y-2 shadow-xl",
              isLight ? "bg-white border-gray-200" : "bg-gray-900/40 border-gray-850"
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
    </div>
  );
}
