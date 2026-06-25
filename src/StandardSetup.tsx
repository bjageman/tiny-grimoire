import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { RefreshCcw } from 'lucide-react';
import rolesData from './roles.json';
import { cn } from './utils/cn';
import type { Player, Role } from './types';
import { TEAM_ORDER } from './types';
import { parseScriptFile } from './utils/scriptUtils';

import { performStandardAssignment } from './utils/standardAssignment';
import { getValidationSummary } from './utils/whaleBucketValidation';
import PlayerDetailsModal from './components/PlayerDetailsModal';
import StandardGamePhase from './components/StandardGamePhase';
import StandardSetupPhase from './components/StandardSetupPhase';
import StandardRoleSelectionModal from './components/StandardRoleSelectionModal';
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

export default function StandardSetup({ theme, toggleTheme }: SetupProps) {
  const [gameCode, setGameCode] = useState<string>(() => {
    const saved = localStorage.getItem('standard-botc-game-code');
    if (saved) return saved;
    const newCode = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    localStorage.setItem('standard-botc-game-code', newCode);
    return newCode;
  });

  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('standard-botc-game');
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
  const [isLilMonstaGame, setIsLilMonstaGame] = useState<boolean>(() => {
    const saved = localStorage.getItem('standard-botc-game');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.isLilMonstaGame || false;
      } catch (e) {
        console.error(e);
      }
    }
    return false;
  });
  const [phase, setPhase] = useState<Phase>(() => {
    const saved = localStorage.getItem('standard-botc-game');
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
  const [searchTerm, setSearchTerm] = useState('');
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<'night' | 'day'>(() => {
    const saved = localStorage.getItem('standard-botc-game');
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
    const saved = localStorage.getItem('standard-botc-game');
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
    const saved = localStorage.getItem('standard-botc-game');
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
    const saved = localStorage.getItem('standard-botc-game');
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
          players: listToBroadcast,
          scriptName,
          customScriptRoles
        });
      }
    }, 1000);
  }, [scriptName, customScriptRoles]);

  const closeDetailsModal = () => {
    setSelectedPlayerId(null);
    setIsSearchingRole(false);
    setModalRoleSearch('');
  };

  const resetGame = () => {
    showConfirm('Are you sure you want to reset the game? This clears all players and settings.', async () => {
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
      setScriptName("All Roles (Default)");
      setCustomScriptRoles(null);
      localStorage.removeItem('standard-botc-game');
      const newCode = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
      localStorage.setItem('standard-botc-game-code', newCode);
      window.location.hash = '';
      setGameCode(newCode);
    }, 'Reset Game');
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

  const handleIncomingMessage = (data: unknown) => {
    const payload = data as {
      type: string;
      id: string;
      name: string;
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
          customScriptRoles
        });
      }

      if (!payload.checkOnly) {
        setPlayers(prev => {
          const exists = prev.some(p => p.name.trim().toLowerCase() === payload.name.trim().toLowerCase() || p.id === payload.id);
          if (exists) return prev;
          return [
            ...prev,
            {
              id: payload.id,
              name: payload.name,
              isDead: false,
              roleId: '',
            }
          ];
        });
      }

      if (phase === 'setup') {
        const updatedPlayers = isExistingPlayer ? players : (
          payload.checkOnly ? players : [
            ...players,
            {
              id: payload.id,
              name: payload.name,
              isDead: false,
              roleId: '',
            }
          ]
        );
        broadcastSetupUpdate(updatedPlayers);
      }

      if (phase === 'game' && sendMessageRef.current) {
        sendMessageRef.current({
          type: 'game_update',
          players,
          timeOfDay,
          dayNumber,
          scriptName,
          customScriptRoles
        });
      }
    }
  };

  const { sendMessage } = useGameSocket(gameCode, handleIncomingMessage);

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  // Sync game state to players when in game phase
  useEffect(() => {
    if (phase === 'game') {
      sendMessage({
        type: 'game_update',
        players,
        timeOfDay,
        dayNumber,
        scriptName,
        customScriptRoles
      });
    }
  }, [phase, players, timeOfDay, dayNumber, scriptName, customScriptRoles, sendMessage]);

  // Broadcast player list to players during setup phase
  useEffect(() => {
    if (phase === 'setup') {
      // Only broadcast standard setup updates on initial mount or phase change
      // rather than on every players list alteration to prevent loop storm
      const initialTimer = setTimeout(() => {
        broadcastSetupUpdate(players);
      }, 500);
      return () => clearTimeout(initialTimer);
    }
  }, [phase, players, broadcastSetupUpdate]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('standard-botc-game', JSON.stringify({
      players,
      phase,
      timeOfDay,
      dayNumber,
      customScriptRoles,
      scriptName,
      isLilMonstaGame
    }));
  }, [players, phase, timeOfDay, dayNumber, customScriptRoles, scriptName, isLilMonstaGame]);

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
      id: Math.random().toString(36).substring(2, 11),
      name: newTravelerName.trim(),
      roleId: newTravelerRoleId,
      isDead: false,
      isTheDrunk: false,
      isTheMarionette: false,
      isTheLilMonsta: false,
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

  const updatePlayerRoles = (id: string, roleIds: string[]) => {
    setPlayers(players.map(p => p.id === id ? { ...p, roleIds } : p));
  };

  const updatePlayerRole = (id: string, roleId: string) => {
    let newPlayers = players.map(p => {
      if (p.id === id) {
        return {
          ...p,
          roleId: roleId || undefined,
          isEvil: undefined,
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

  const togglePlayerTheDrunk = (id: string) => {
    setPlayers(players.map(p => {
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
    setPlayers(players.map(p => {
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
    setPlayers(players.map(p => {
      if (p.id === id) {
        const nextVal = !p.isTheLunatic;
        return {
          ...p,
          isTheLunatic: nextVal,
          isTheDrunk: nextVal ? false : p.isTheDrunk,
          isTheMarionette: nextVal ? false : p.isTheMarionette,
          isTheLilMonsta: nextVal ? false : p.isTheLilMonsta,
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
    setPlayers(players.map(p => {
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



  const validationSummary = useMemo(() => {
    return getValidationSummary(players);
  }, [players]);

  const allAssigned = players.length >= 5 && players.every(p => p.roleId);
  const isLightModeActive = theme === 'light';
  const { dialogProps, showAlert, showConfirm } = useDialog();

  // Modal logic details
  const modalPlayer = selectedPlayerId ? players.find(x => x.id === selectedPlayerId) : null;
  const modalRoleObj = modalPlayer ? (rolesData as Role[]).find(r => r.id === modalPlayer.roleId) : undefined;
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
      backHref={phase === 'setup' ? "#/host" : undefined}
      onBack={phase !== 'setup' ? () => setPhase('setup') : undefined}
      titleContent={
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-xl font-bold text-clocktower-blood tracking-wide">
            Standard
          </h1>
          <div
            onClick={() => {
              const joinUrl = `${window.location.origin}${window.location.pathname}#/join?code=${gameCode}`;
              navigator.clipboard.writeText(joinUrl);
              showAlert(`Copied link to clipboard: ${joinUrl}`, 'Copied!');
            }}
            className={cn(
              "hidden md:flex cursor-pointer text-xs font-bold px-2 py-0.5 rounded border transition-all duration-200 select-none items-baseline gap-1",
              isLightModeActive
                ? "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                : "bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-850"
            )}
            title="Click to copy join link"
          >
            Room: <span className="text-clocktower-blood font-mono uppercase tracking-wider">{gameCode}</span>
          </div>
        </div>
      }
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
      headerExtra={
        <div
          onClick={() => {
            const joinUrl = `${window.location.origin}${window.location.pathname}#/join?code=${gameCode}`;
            navigator.clipboard.writeText(joinUrl);
            alert(`Copied link to clipboard: ${joinUrl}`);
          }}
          className={cn(
            "md:hidden cursor-pointer text-xs font-bold px-2 py-0.5 rounded border transition-all duration-200 select-none flex items-baseline gap-1",
            isLightModeActive
              ? "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
              : "bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-850"
          )}
          title="Click to copy join link"
        >
          Room: <span className="text-clocktower-blood font-mono uppercase tracking-wider">{gameCode}</span>
        </div>
      }
      contentClassName="px-4 pt-6 pb-4"
    >

      {phase === 'setup' && (
        <StandardSetupPhase
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
          randomlyAssignRoles={randomlyAssignRoles}
          setActivePlayerId={setActivePlayerId}
          setSearchTerm={setSearchTerm}
          togglePlayerTheDrunk={togglePlayerTheDrunk}
          togglePlayerTheMarionette={togglePlayerTheMarionette}
          togglePlayerTheLunatic={togglePlayerTheLunatic}
          togglePlayerTheLilMonsta={togglePlayerTheLilMonsta}
          validationSummary={validationSummary}
          isLightModeActive={isLightModeActive}
          allAssigned={allAssigned}
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
          onResetDead={resetDead}
          onResetTime={resetTime}
          scriptName={scriptName}
          customScriptRoles={customScriptRoles}
        />
      )}

      {/* Role Selection Modal */}
      {activePlayerId && (
        <StandardRoleSelectionModal
          activePlayerId={activePlayerId}
          players={players}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          updatePlayerRole={updatePlayerRole}
          setActivePlayerId={setActivePlayerId}
          isLightModeActive={isLightModeActive}
          selectionRoles={selectionRoles}
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
          onUpdateRoles={updatePlayerRoles}
          onToggleDead={togglePlayerDead}
          onToggleDeadVote={togglePlayerDeadVote}
          onToggleDrunkOrPoisoned={togglePlayerDrunkOrPoisoned}
          onToggleEvil={togglePlayerEvil}
          onToggleLilMonsta={togglePlayerTheLilMonsta}
          isLilMonstaGame={isLilMonstaGame}
          onSetSearchingRole={setIsSearchingRole}
          onSetModalRoleSearch={setModalRoleSearch}
        />
      )}
    </PageLayout>
    <DialogModal {...dialogProps} isLightModeActive={isLightModeActive} />
    </>
  );
}
