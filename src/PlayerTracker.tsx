import { useState, useEffect, useMemo, useRef } from 'react';
import { Sun, Moon, ArrowLeft, RefreshCcw } from 'lucide-react';
import rolesData from './roles.json';
import officialRoles from './official_roles.json';
import { cn } from './utils/cn';
import type { Player, Role } from './types';

import PlayerDetailsModal from './components/PlayerDetailsModal';
import StandardGamePhase from './components/StandardGamePhase';
import PlayerTrackerSetupPhase from './components/PlayerTrackerSetupPhase';
import { usePlayerDragAndDrop } from './hooks/usePlayerDragAndDrop';
import { useGameSocket } from './hooks/useGameSocket';

type Phase = 'setup' | 'game';

interface SetupProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function PlayerTracker({ theme, toggleTheme }: SetupProps) {
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('player-tracker-botc-game');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.players || [];
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });
  const [phase, setPhase] = useState<Phase>(() => {
    const saved = localStorage.getItem('player-tracker-botc-game');
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
  const [newPlayerName, setNewPlayerName] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<'night' | 'day'>(() => {
    const saved = localStorage.getItem('player-tracker-botc-game');
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
    const saved = localStorage.getItem('player-tracker-botc-game');
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
  const [newTravelerName, setNewTravelerName] = useState('');
  const [newTravelerRoleId, setNewTravelerRoleId] = useState('beggar');

  // Details modal states
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isSearchingRole, setIsSearchingRole] = useState(false);
  const [modalRoleSearch, setModalRoleSearch] = useState('');

  // Script states
  const [scriptName, setScriptName] = useState<string>(() => {
    const saved = localStorage.getItem('player-tracker-botc-game');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.scriptName || "All Roles (Default)";
      } catch (e) {
        console.error(e);
      }
    }
    return "All Roles (Default)";
  });
  const [customScriptRoles, setCustomScriptRoles] = useState<Role[] | null>(() => {
    const saved = localStorage.getItem('player-tracker-botc-game');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.customScriptRoles || null;
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [gameCode, setGameCode] = useState<string | null>(() => {
    const saved = localStorage.getItem('player-tracker-botc-game');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.code) return parsed.code;
      } catch (e) {
        console.error(e);
      }
    }
    return sessionStorage.getItem('joined-code') || null;
  });

  const isSynced = !!gameCode;

  const handleIncomingMessage = (data: unknown) => {
    const payload = data as {
      type: string;
      players?: Player[];
      timeOfDay?: 'night' | 'day';
      dayNumber?: number;
      scriptName?: string;
      customScriptRoles?: Role[] | null;
    };
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
      if (payload.customScriptRoles !== undefined) {
        setCustomScriptRoles(payload.customScriptRoles);
      }
    } else if (payload.type === 'storyteller_quit') {
      alert('The Storyteller has quit the session. Reverting to local tracker.');
      sessionStorage.removeItem('joined-code');
      sessionStorage.removeItem('joined-name');
      const saved = localStorage.getItem('player-tracker-botc-game');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          delete parsed.code;
          localStorage.setItem('player-tracker-botc-game', JSON.stringify(parsed));
        } catch (e) {
          console.error(e);
        }
      }
      setGameCode(null);
    }
  };

  useGameSocket(gameCode || '', handleIncomingMessage);

  const closeDetailsModal = () => {
    setSelectedPlayerId(null);
    setIsSearchingRole(false);
    setModalRoleSearch('');
  };

  const resetGame = () => {
    if (confirm('Are you sure you want to reset the tracker? This clears all players and settings.')) {
      setPlayers([]);
      setPhase('setup');
      setTimeOfDay('night');
      setDayNumber(1);
      setScriptName("All Roles (Default)");
      setCustomScriptRoles(null);
      localStorage.removeItem('player-tracker-botc-game');
      sessionStorage.removeItem('joined-code');
      sessionStorage.removeItem('joined-name');
      setGameCode(null);
      window.location.hash = '';
    }
  };

  const resetDead = () => {
    if (confirm('Mark all players as alive?')) {
      setPlayers(prev => prev.map(p => ({ ...p, isDead: false, hasDeadVote: false })));
    }
  };

  const resetTime = () => {
    if (confirm('Reset back to Night 1?')) {
      setDayNumber(1);
      setTimeOfDay('night');
    }
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
    movePlayer,
  } = usePlayerDragAndDrop(players, setPlayers);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('player-tracker-botc-game', JSON.stringify({ 
      players, 
      phase, 
      timeOfDay, 
      dayNumber,
      customScriptRoles,
      scriptName,
      code: gameCode || undefined,
    }));

    const isLightMode = theme === 'light';
    if (isLightMode) {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }

    return () => {
      document.documentElement.classList.remove('theme-light');
    };
  }, [players, phase, timeOfDay, dayNumber, customScriptRoles, scriptName, theme, gameCode]);

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
      isDead: false,
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
      isDead: false,
    };
    setPlayers([newPlayer, ...players]);
    setNewTravelerName('');
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
    setPlayers(players.map(p => {
      if (p.id === id) {
        return {
          ...p,
          roleId: roleIds[0] || undefined,
          roleIds: roleIds,
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

  const togglePlayerDead = (id: string) => {
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

  const handleScriptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!Array.isArray(parsed)) {
          alert("Invalid script format. Expected a JSON array of roles.");
          return;
        }

        const metaObj = parsed.find((item: unknown): item is { id: string; name?: string } => 
          !!item && typeof item === 'object' && 'id' in item && item.id === '_meta'
        ) as { id: string; name?: string } | undefined;
        const name = metaObj?.name || file.name.replace('.json', '');

        const parsedRoles = parsed
          .map((item: unknown) => {
            if (typeof item === 'string') {
              return { id: item.replace(/_/g, '') };
            }
            if (item && typeof item === 'object' && 'id' in item && typeof (item as { id: unknown }).id === 'string') {
              return { 
                ...(item as Record<string, unknown>), 
                id: (item as { id: string }).id.replace(/_/g, '') 
              } as { id: string };
            }
            return null;
          })
          .filter((item: { id: string } | null): item is { id: string } => {
            if (!item || item.id === '_meta' || item.id === 'meta') return false;
            
            const officialMatch = (officialRoles as { id: string; name: string; team: string }[]).find(r => r.id.toLowerCase() === item.id.toLowerCase());
            if (officialMatch && (officialMatch.team === 'fabled' || officialMatch.team === 'loric')) {
              return false;
            }

            const itemObj = item as Record<string, unknown>;
            if (typeof itemObj.team === 'string' && (itemObj.team.toLowerCase() === 'fabled' || itemObj.team.toLowerCase() === 'loric')) {
              return false;
            }

            return true;
          })
          .map((item: { id: string }) => {
            const matched = (rolesData as Role[]).find(r => r.id.toLowerCase() === item.id.toLowerCase());
            if (matched) return matched;
            return {
              id: item.id.toLowerCase(),
              name: item.id.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
              team: 'townsfolk'
            } as Role;
          });

        if (parsedRoles.length === 0) {
          alert("No valid roles found in the uploaded script.");
          return;
        }

        setCustomScriptRoles(parsedRoles);
        setScriptName(name);
      } catch {
        alert("Failed to parse JSON script file.");
      }
    };
    reader.readAsText(file);
  };

  const clearCustomScript = () => {
    setCustomScriptRoles(null);
    setScriptName("All Roles (Default)");
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

  const isLightModeActive = theme === 'light';

  // Details Modal helpers
  const modalPlayer = selectedPlayerId ? players.find(p => p.id === selectedPlayerId) : null;
  const modalRoleObj = modalPlayer ? ((rolesData as Role[]).find(r => r.id === modalPlayer.roleId) || undefined) : undefined;
  const currentIndex = selectedPlayerId ? players.findIndex(p => p.id === selectedPlayerId) : -1;
  const prevPlayerId = currentIndex > 0 ? players[currentIndex - 1].id : null;
  const nextPlayerId = currentIndex >= 0 && currentIndex < players.length - 1 ? players[currentIndex + 1].id : null;

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

      const TEAM_ORDER: Record<string, number> = {
        townsfolk: 1,
        outsider: 2,
        minion: 3,
        demon: 4,
        traveler: 5
      };
      const orderA = TEAM_ORDER[a.team] || 99;
      const orderB = TEAM_ORDER[b.team] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className={cn(
      "min-h-screen p-4 font-sans mx-auto transition-colors duration-300 max-w-xl md:max-w-5xl landscape:max-w-5xl",
      isLightModeActive
        ? "bg-clocktower-parchment text-clocktower-night"
        : "bg-clocktower-night text-clocktower-parchment"
    )}>
      {/* Header */}
      <header className={cn(
        "relative flex flex-col items-center justify-center mb-6 border-b pb-3 gap-2.5 w-full",
        isLightModeActive ? "border-clocktower-blood/20" : "border-clocktower-blood"
      )}>
        {/* Navigation & Controls Row */}
        <div className="relative flex justify-center items-center w-full min-h-[36px]">
          {phase === 'setup' ? (
            <a
              href="#/"
              className={cn(
                "absolute left-0 transition-all p-1.5 rounded-full flex items-center justify-center",
                isLightModeActive 
                  ? "text-gray-700 hover:text-gray-900 hover:bg-black/5" 
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
              title="Back to home"
            >
              <ArrowLeft size={24} />
            </a>
          ) : (
            <button
              onClick={() => setPhase('setup')}
              className={cn(
                "absolute left-0 transition-all p-1.5 rounded-full flex items-center justify-center",
                isLightModeActive 
                  ? "text-gray-700 hover:text-gray-900 hover:bg-black/5" 
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
              title="Back to setup"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          
          <h1 className="text-xl md:text-2xl font-bold text-clocktower-blood tracking-wide text-center pr-20 pl-10 flex-1 min-w-0 truncate">
            Character Tracker
          </h1>

          <div className="absolute right-0 flex items-center gap-1">
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
      </header>

      {phase === 'setup' && (
        <PlayerTrackerSetupPhase
          isLightModeActive={theme === 'light'}
          players={players}
          customScriptRoles={customScriptRoles}
          scriptName={scriptName}
          newPlayerName={newPlayerName}
          setNewPlayerName={setNewPlayerName}
          addPlayer={addPlayer}
          removePlayer={removePlayer}
          updatePlayerName={updatePlayerName}
          fileInputRef={fileInputRef}
          handleScriptUpload={handleScriptUpload}
          clearCustomScript={clearCustomScript}
          setPhase={setPhase}
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
          isSynced={isSynced}
        />
      )}

      {phase === 'game' && (
        <StandardGamePhase
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
          customScriptRoles={customScriptRoles}
          isSynced={isSynced}
        />
      )}

      {/* Player Details Modal */}
      {selectedPlayerId && modalPlayer && (
        <PlayerDetailsModal
          player={modalPlayer}
          players={players}
          currentIndex={currentIndex}
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
    </div>
  );
}
