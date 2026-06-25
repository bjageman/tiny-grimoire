import { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCcw } from 'lucide-react';
import rolesData from './roles.json';
import { cn } from './utils/cn';
import type { Player, Role } from './types';
import { TEAM_ORDER } from './types';
import { parseScriptFile } from './utils/scriptUtils';

import PlayerDetailsModal from './components/PlayerDetailsModal';
import StandardGamePhase from './components/StandardGamePhase';
import PlayerTrackerSetupPhase from './components/PlayerTrackerSetupPhase';
import { usePlayerDragAndDrop } from './hooks/usePlayerDragAndDrop';
import { useGameSocket } from './hooks/useGameSocket';
import PageLayout from './components/PageLayout';
import DialogModal from './components/DialogModal';
import { useDialog } from './hooks/useDialog';

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
      showAlert('The Storyteller has quit the session. Reverting to local tracker.');
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
    showConfirm('Are you sure you want to reset the tracker? This clears all players and settings.', () => {
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
  }, [players, phase, timeOfDay, dayNumber, customScriptRoles, scriptName, gameCode]);

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
    parseScriptFile(file)
      .then(({ name, roles }) => {
        setCustomScriptRoles(roles);
        setScriptName(name);
      })
      .catch(err => showAlert((err as Error).message));
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
  const { dialogProps, showAlert, showConfirm } = useDialog();

  // Details Modal helpers
  const modalPlayer = selectedPlayerId ? players.find(p => p.id === selectedPlayerId) : null;
  const modalRoleObj = modalPlayer ? ((rolesData as Role[]).find(r => r.id === modalPlayer.roleId) || undefined) : undefined;
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
      return a.name.localeCompare(b.name);
    });

  return (
    <>
    <PageLayout
      theme={theme}
      toggleTheme={toggleTheme}
      backHref={phase === 'setup' ? "#/" : undefined}
      onBack={phase !== 'setup' ? () => setPhase('setup') : undefined}
      title="Character Tracker"
      extraControls={
        <button
          id="reset-game-button"
          onClick={resetGame}
          className={cn("p-2 transition-colors", isLightModeActive ? "text-gray-600 hover:text-gray-900" : "text-gray-500 hover:text-white")}
          title="Reset game"
        >
          <RefreshCcw size={20} />
        </button>
      }
      contentClassName="px-4 pt-6 pb-4"
    >

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
    </PageLayout>
    <DialogModal {...dialogProps} isLightModeActive={isLightModeActive} />
    </>
  );
}
