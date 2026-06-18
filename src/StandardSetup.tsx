import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Search, RefreshCcw, AlertTriangle, CheckCircle } from 'lucide-react';
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
  roleId?: string;
  isDead: boolean;
  isDrunk: boolean;
}

type Phase = 'setup' | 'game';

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

export default function StandardSetup() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [phase, setPhase] = useState<Phase>('setup');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<'night' | 'day'>('night');
  const [dayNumber, setDayNumber] = useState<number>(1);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('standard-botc-game');
    if (saved) {
      try {
        const { players: p, phase: ph, timeOfDay: tod, dayNumber: dn } = JSON.parse(saved);
        setPlayers(p || []);
        setPhase(ph || 'setup');
        setTimeOfDay(tod || 'night');
        setDayNumber(dn || 1);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('standard-botc-game', JSON.stringify({ players, phase, timeOfDay, dayNumber }));
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
    const name = newPlayerName.trim() || `Player #${players.length + 1}`;
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      isDead: false,
      isDrunk: false,
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

  const updatePlayerRole = (id: string, roleId: string) => {
    setPlayers(players.map(p => {
      if (p.id === id) {
        return { ...p, roleId: roleId || undefined };
      }
      return p;
    }));
  };

  const togglePlayerDead = (id: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, isDead: !p.isDead } : p));
  };

  const togglePlayerDrunk = (id: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, isDrunk: !p.isDrunk } : p));
  };

  const resetGame = () => {
    if (confirm('Are you sure you want to reset the game? This clears all players and roles.')) {
      setPlayers([]);
      setPhase('setup');
      setActivePlayerId(null);
      setSearchTerm('');
      setTimeOfDay('night');
      setDayNumber(1);
      localStorage.removeItem('standard-botc-game');
    }
  };

  const validationSummary = useMemo(() => {
    if (players.length === 0) return null;

    const N = players.length;
    const base = DISTRIBUTION[N] || { townsfolk: 0, outsider: 0, minion: 0, demon: 0 };

    const counts = players.reduce((acc, p) => {
      if (p.roleId) {
        const role = (rolesData as Role[]).find(r => r.id === p.roleId);
        if (role) acc[role.team]++;
      }
      return acc;
    }, { townsfolk: 0, outsider: 0, minion: 0, demon: 0 });

    const assignedRoles = players.map(p => (rolesData as Role[]).find(r => r.id === p.roleId)).filter(Boolean) as Role[];
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
        modifications.push("Lil' Monsta (+1 Minion)");
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

    let isOutsiderValid = false;
    if (hasGodfather && !hasLegion && !hasRiot) {
      isOutsiderValid = (counts.outsider === expectedOutsider + 1 || counts.outsider === expectedOutsider - 1);
    } else {
      isOutsiderValid = counts.outsider === expectedOutsider;
    }

    let isTownsfolkValid = false;
    if (hasGodfather && !hasLegion && !hasRiot) {
      isTownsfolkValid = (counts.townsfolk === N - expectedDemon - expectedMinion - (expectedOutsider + 1) ||
                           counts.townsfolk === N - expectedDemon - expectedMinion - (expectedOutsider - 1));
    } else {
      isTownsfolkValid = counts.townsfolk === expectedTownsfolk;
    }

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
  }, [players]);

  const filteredRoles = useMemo(() => {
    return (rolesData as Role[]).filter(r =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const grimoireConfig = useMemo(() => {
    const count = players.length;
    if (count <= 6) {
      return {
        boardClass: "max-w-[350px] rounded-[32px]",
        radiusPercent: 34,
        btnClass: "w-20 h-20",
        nameClass: "text-xs font-bold font-sans tracking-tighter mt-2 truncate max-w-[70px] text-center leading-tight",
        roleClass: "text-[9.5px] font-semibold truncate max-w-[70px] leading-none text-gray-400 mt-0.5 px-0.5 text-center",
        charLimit: 16,
        drunkClass: "-bottom-2 text-[8px] px-1.5 scale-95",
        tooltipClass: "top-18",
      };
    } else if (count <= 10) {
      return {
        boardClass: "max-w-[400px] rounded-[38px]",
        radiusPercent: 36,
        btnClass: "w-[72px] h-[72px]",
        nameClass: "text-[11px] font-bold font-sans tracking-tighter mt-2 truncate max-w-[64px] text-center leading-tight",
        roleClass: "text-[8.5px] font-semibold truncate max-w-[64px] leading-none text-gray-400 mt-0.5 px-0.5 text-center",
        charLimit: 14,
        drunkClass: "-bottom-1.5 text-[7.5px] px-1 scale-90",
        tooltipClass: "top-16",
      };
    } else {
      return {
        boardClass: "max-w-[450px] rounded-[48px]",
        radiusPercent: 38,
        btnClass: "w-16 h-16",
        nameClass: "text-[10px] font-bold font-sans tracking-tighter mt-1.5 truncate max-w-[58px] text-center leading-tight",
        roleClass: "text-[8px] font-semibold truncate max-w-[58px] leading-none text-gray-400 mt-0.5 px-0.5 text-center",
        charLimit: 12,
        drunkClass: "-bottom-1 text-[7px] px-1 scale-90",
        tooltipClass: "top-14",
      };
    }
  }, [players.length]);

  const allAssigned = players.length >= 5 && players.every(p => p.roleId);

  return (
    <div className={cn(
      "min-h-screen p-4 font-sans max-w-xl mx-auto transition-colors duration-300",
      phase === 'game' && timeOfDay === 'day'
        ? "bg-clocktower-parchment text-clocktower-night"
        : "bg-clocktower-night text-clocktower-parchment"
    )}>
      <header className={cn(
        "flex justify-between items-center mb-6 border-b pb-2",
        phase === 'game' && timeOfDay === 'day' ? "border-clocktower-blood/20" : "border-clocktower-blood"
      )}>
        <div className="flex items-center gap-3">
          <a href="#/" className={cn("transition-colors text-sm", phase === 'game' && timeOfDay === 'day' ? "text-gray-600 hover:text-gray-800" : "text-gray-500 hover:text-gray-300")}>← Home</a>
          <h1 className="text-2xl font-bold text-clocktower-blood tracking-wide">Standard Setup</h1>
        </div>
        <button onClick={resetGame} className={cn("p-2 transition-colors", phase === 'game' && timeOfDay === 'day' ? "text-gray-600 hover:text-gray-900" : "text-gray-500 hover:text-white")} title="Reset game">
          <RefreshCcw size={20} />
        </button>
      </header>

      {phase === 'setup' && (
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-300 mb-4">Players & Roles ({players.length})</h2>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                placeholder="Enter player name in seating order..."
                className="flex-1 bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-clocktower-blood text-sm"
              />
              <button onClick={addPlayer} className="bg-clocktower-blood hover:bg-red-800 px-4 py-2 rounded transition-colors text-white">
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-2.5">
              {players.map((p, index) => {
                const roleObj = (rolesData as Role[]).find(r => r.id === p.roleId);
                return (
                  <div key={p.id} className="bg-gray-900/60 p-3 rounded-lg border border-gray-800/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-mono w-5">#{index + 1}</span>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => updatePlayerName(p.id, e.target.value)}
                        className="flex-grow font-semibold text-gray-200 bg-transparent border-b border-transparent hover:border-gray-800/80 focus:border-clocktower-blood focus:outline-none px-1.5 py-0.5 rounded transition-all"
                      />
                      <button onClick={() => removePlayer(p.id)} className="text-gray-600 hover:text-red-500 p-1 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {p.roleId ? (
                      <div className="flex items-center justify-between bg-gray-950/40 px-3 py-2 rounded border border-gray-800">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border",
                            roleObj?.team === 'townsfolk' && "text-clocktower-townsfolk border-clocktower-townsfolk/40 bg-clocktower-townsfolk/5",
                            roleObj?.team === 'outsider' && "text-clocktower-outsider border-clocktower-outsider/40 bg-clocktower-outsider/5",
                            roleObj?.team === 'minion' && "text-clocktower-minion border-clocktower-minion/40 bg-clocktower-minion/5",
                            roleObj?.team === 'demon' && "text-clocktower-demon border-clocktower-demon/40 bg-clocktower-demon/5",
                          )}>
                            {roleObj?.team || 'N/A'}
                          </span>
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
                        <button
                          onClick={() => { setActivePlayerId(p.id); setSearchTerm(''); }}
                          className="text-gray-500 hover:text-gray-300 text-xs underline font-medium"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => { setActivePlayerId(p.id); setSearchTerm(''); }}
                        className="flex items-center bg-gray-800/50 rounded px-3 py-1.5 border border-gray-700/60 cursor-pointer text-sm text-gray-400 hover:border-gray-600 transition-colors"
                      >
                        <Search size={14} className="mr-2 text-gray-500" />
                        Tap to select role...
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Distribution Card */}
          <section className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Standard Base Distribution</h3>
            {players.length >= 5 ? (
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
                <div className="p-2 rounded bg-gray-950/40 border border-gray-800 text-clocktower-townsfolk">
                  TF: {(DISTRIBUTION[players.length] || { townsfolk: 0 }).townsfolk}
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

          {/* Validation Summary */}
          {validationSummary && players.some(p => p.roleId) && (
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

          <button
            disabled={!allAssigned}
            onClick={() => setPhase('game')}
            className="w-full bg-clocktower-blood hover:bg-red-800 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/40 flex items-center justify-center gap-2"
          >
            Open Grimoire
          </button>
        </div>
      )}

      {phase === 'game' && (
        <div className="space-y-6 animate-fadeIn">
          <div className={cn(
            "flex justify-between items-center border-b pb-2",
            timeOfDay === 'day' ? "border-clocktower-night/10" : "border-gray-800/85"
          )}>
            <h2 className={cn("text-lg font-semibold", timeOfDay === 'day' ? "text-clocktower-night" : "text-gray-300")}>Circular Grimoire</h2>
            <div className="flex gap-2.5 text-[9px] font-bold tracking-wider text-gray-500">
              <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-clocktower-townsfolk" /> Townsfolk</span>
              <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-clocktower-outsider" /> Outsider</span>
              <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-clocktower-minion" /> Minion</span>
              <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-clocktower-demon" /> Demon</span>
            </div>
          </div>

          <div className={cn(
            "relative w-full aspect-square border shadow-inner flex items-center justify-center overflow-visible my-4 mx-auto transition-colors duration-300",
            timeOfDay === 'day'
              ? "bg-white/50 border-gray-300 shadow-gray-200/50"
              : "bg-gray-950/40 border-gray-900/60 shadow-black/45",
            grimoireConfig.boardClass
          )}>
            <button
              onClick={toggleTimeOfDay}
              className={cn(
                "absolute w-20 h-20 rounded-full border flex flex-col items-center justify-center transition-all cursor-pointer z-20 select-none shadow-md",
                timeOfDay === 'day'
                  ? "bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100/70"
                  : "bg-clocktower-night/50 border-clocktower-blood/20 text-clocktower-parchment hover:bg-clocktower-blood/10"
              )}
              title="Click to toggle Day/Night"
            >
              <span className={cn(
                "text-[10px] font-serif tracking-widest font-bold transition-colors",
                timeOfDay === 'day' ? "text-yellow-600" : "text-clocktower-blood/60"
              )}>BOTC</span>
              <span className="text-[9px] font-bold font-mono mt-0.5 uppercase tracking-wide">
                {timeOfDay} {dayNumber}
              </span>
            </button>

            {players.map((p, index) => {
              const total = players.length;
              const angle = (index * (360 / total) - 90) * (Math.PI / 180);

              const radiusPercent = grimoireConfig.radiusPercent;
              const leftPos = 50 + radiusPercent * Math.cos(angle);
              const topPos = 50 + radiusPercent * Math.sin(angle);

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
                      onClick={() => togglePlayerDead(p.id)}
                      className={cn(
                        "rounded-full border-2 flex flex-col items-center justify-center transition-all shadow-md relative",
                        grimoireConfig.btnClass,
                        timeOfDay === 'day'
                          ? p.isDead
                            ? "bg-gray-200 border-gray-300 text-gray-400 scale-95 opacity-50"
                            : "bg-white border-gray-300 text-clocktower-night hover:border-gray-400 hover:bg-gray-50"
                          : p.isDead
                            ? "bg-black border-gray-800 text-gray-600 scale-95 opacity-50"
                            : "bg-gray-900 border-gray-700 text-clocktower-parchment hover:border-gray-500"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-1.5 h-1.5 rounded-full",
                        roleObj?.team === 'townsfolk' && "bg-clocktower-townsfolk",
                        roleObj?.team === 'outsider' && "bg-clocktower-outsider",
                        roleObj?.team === 'minion' && "bg-clocktower-minion",
                        roleObj?.team === 'demon' && "bg-clocktower-demon",
                      )} />

                      <span className={cn(
                        grimoireConfig.nameClass,
                        p.isDead && "line-through",
                        timeOfDay === 'day'
                          ? p.isDead ? "text-gray-400" : "text-clocktower-night font-bold"
                          : p.isDead ? "text-gray-700" : "text-clocktower-parchment"
                      )}>
                        {p.name.substring(0, grimoireConfig.charLimit)}
                      </span>

                      <span className={cn(
                        grimoireConfig.roleClass,
                        roleObj?.team === 'townsfolk' && "text-clocktower-townsfolk/85",
                        roleObj?.team === 'outsider' && "text-clocktower-outsider/85",
                        roleObj?.team === 'minion' && "text-clocktower-minion/85",
                        roleObj?.team === 'demon' && "text-clocktower-demon/85",
                        p.isDead && "line-through opacity-50"
                      )}>
                        {roleObj?.name.substring(0, grimoireConfig.charLimit)}
                      </span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlayerDrunk(p.id);
                      }}
                      className={cn(
                        "absolute border transition-all z-20",
                        grimoireConfig.drunkClass,
                        p.isDrunk
                          ? "bg-yellow-600 border-yellow-700 text-black font-black"
                          : timeOfDay === 'day'
                            ? "bg-gray-100 border-gray-300 text-gray-400 hover:text-gray-600"
                            : "bg-gray-900/90 border-gray-800 text-gray-600 hover:text-gray-400"
                      )}
                    >
                      DRK
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
                      <p className="text-[8px] text-gray-500 italic mt-0.5">{p.isDead ? 'Dead' : 'Alive'} {p.isDrunk ? '(Drunk)' : ''}</p>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          <div className={cn(
            "rounded-lg border p-3 space-y-1.5 max-h-48 overflow-y-auto transition-colors duration-300",
            timeOfDay === 'day'
              ? "bg-white/50 border-gray-300 text-clocktower-night"
              : "bg-gray-900/40 border-gray-800/80"
          )}>
            <h4 className={cn(
              "text-[10px] uppercase font-bold tracking-wider",
              timeOfDay === 'day' ? "text-gray-600" : "text-gray-500"
            )}>Grimoire Ledger Reference</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {players.map((p, index) => {
                const rObj = (rolesData as Role[]).find(r => r.id === p.roleId);
                return (
                  <div key={p.id} className={cn(
                    "flex items-center gap-1.5 py-0.5 px-1 rounded border transition-colors",
                    p.isDead && "opacity-45",
                    timeOfDay === 'day'
                      ? "bg-white/40 border-gray-200"
                      : "bg-gray-950/20 border-gray-900/40"
                  )}>
                    <span className={cn("text-[9px] font-mono w-4", timeOfDay === 'day' ? "text-gray-500" : "text-gray-600")}>{index + 1}</span>
                    <span className={cn(
                      "font-medium truncate flex-1",
                      p.isDead && "line-through text-gray-500",
                      timeOfDay === 'day' && !p.isDead ? "text-clocktower-night" : "text-gray-200"
                    )}>{p.name}</span>
                    <span className={cn(
                      "font-semibold text-[10px]",
                      rObj?.team === 'townsfolk' && "text-clocktower-townsfolk",
                      rObj?.team === 'outsider' && "text-clocktower-outsider",
                      rObj?.team === 'minion' && "text-clocktower-minion",
                      rObj?.team === 'demon' && "text-clocktower-demon",
                    )}>{rObj?.name.substring(0, 6)}..</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setPhase('setup')}
            className={cn(
              "w-full py-3 rounded-lg font-bold transition-all text-sm shadow-md",
              timeOfDay === 'day'
                ? "bg-white hover:bg-gray-50 text-clocktower-night border border-gray-300"
                : "bg-gray-800 hover:bg-gray-700 text-gray-300"
            )}
          >
            Return to Setup
          </button>
        </div>
      )}

      {/* Role Selection Modal */}
      {activePlayerId && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-lg p-4 space-y-3 max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-gray-300">
                Select Role for {players.find(p => p.id === activePlayerId)?.name}
              </h3>
              <button onClick={() => { setActivePlayerId(null); setSearchTerm(''); }} className="text-xs text-gray-500 underline">
                Close
              </button>
            </div>

            <div className="flex items-center bg-gray-950 border border-gray-800 rounded px-3 py-2 text-sm">
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

            <div className="overflow-y-auto flex-1 border border-gray-800 rounded bg-gray-950/40 divide-y divide-gray-800/60 pr-1">
              {filteredRoles.map(role => (
                <button
                  key={role.id}
                  onClick={() => {
                    updatePlayerRole(activePlayerId, role.id);
                    setActivePlayerId(null);
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
                  <span className="text-[10px] uppercase font-mono text-gray-600">{role.team[0]}</span>
                </button>
              ))}
              {filteredRoles.length === 0 && (
                <div className="p-3 text-xs text-gray-500 italic text-center">No matching roles found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
