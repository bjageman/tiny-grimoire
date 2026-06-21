import { useState, useEffect, useMemo } from 'react';
import { Sun, Moon, RefreshCcw, ArrowLeft } from 'lucide-react';
import rolesData from './official_roles.json';
import { cn } from './utils/cn';
import type { Role, Player as BasePlayer, PlayerPreferences } from './types';
import { assignCharacters } from './utils/assignment';
import { getValidationSummary } from './utils/whaleBucketValidation';
import PlayerDetailsModal from './components/PlayerDetailsModal';
import WhaleBucketSetupPhase from './components/WhaleBucketSetupPhase';
import WhaleBucketDraftPhase from './components/WhaleBucketDraftPhase';
import WhaleBucketGamePhase from './components/WhaleBucketGamePhase';
import PreferenceSelectionModal from './components/PreferenceSelectionModal';
import ManualOverrideModal from './components/ManualOverrideModal';
import { usePlayerDragAndDrop } from './hooks/usePlayerDragAndDrop';

export type Player = Omit<BasePlayer, 'preferences'> & {
  preferences: PlayerPreferences;
};

type Phase = 'setup' | 'draft' | 'game';

interface SetupProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function WhaleBucket({ theme, toggleTheme }: SetupProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLilMonstaGame, setIsLilMonstaGame] = useState(false);
  const [phase, setPhase] = useState<Phase>('setup');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDraftPlayerId, setActiveDraftPlayerId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<'night' | 'day'>('night');
  const [dayNumber, setDayNumber] = useState<number>(1);

  // Traveler states
  const [allowTravelers, setAllowTravelers] = useState<boolean>(false);
  const [newTravelerName, setNewTravelerName] = useState('');
  const [newTravelerRoleId, setNewTravelerRoleId] = useState('beggar');

  // Exclusion states
  const [excludedRoleIds, setExcludedRoleIds] = useState<string[]>(['drunk', 'marionette', 'lunatic']);

  // Preference modal states
  const [activePrefModal, setActivePrefModal] = useState<{ playerId: string; team: Role['team'] } | null>(null);
  const [prefSearchTerm, setPrefSearchTerm] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isSearchingRole, setIsSearchingRole] = useState(false);
  const [modalRoleSearch, setModalRoleSearch] = useState('');

  // Drag and drop states
  const {
    draggedIndex,
    dragOverIndex,
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

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('whale-bucket-game');
    if (saved) {
      try {
        const { players: p, phase: ph, timeOfDay: tod, dayNumber: dn, allowTravelers: at, isLilMonstaGame: lmg, excludedRoleIds: er } = JSON.parse(saved);
        type SavedPlayer = Omit<Player, 'preferences'> & { preferences?: Partial<Player['preferences']> };
        const validatedPlayers = (p || []).map((player: SavedPlayer) => ({
          ...player,
          preferences: {
            townsfolk: player.preferences?.townsfolk || [],
            outsider: player.preferences?.outsider || [],
            minion: player.preferences?.minion || [],
            demon: player.preferences?.demon || [],
            traveler: player.preferences?.traveler || []
          }
        }));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPlayers(validatedPlayers);
        setPhase(ph || 'setup');
        setTimeOfDay(tod || 'night');
        setDayNumber(dn || 1);
        if (at !== undefined) setAllowTravelers(false); // Force traveler selection off
        if (lmg !== undefined) setIsLilMonstaGame(lmg);
        if (er !== undefined) setExcludedRoleIds(er);

      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save to localStorage and update document theme
  useEffect(() => {
    localStorage.setItem('whale-bucket-game', JSON.stringify({ players, phase, timeOfDay, dayNumber, allowTravelers, isLilMonstaGame, excludedRoleIds }));
    
    const isLightMode = theme === 'light';
    if (isLightMode) {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }
    
    return () => {
      document.documentElement.classList.remove('theme-light');
    };
  }, [players, phase, timeOfDay, dayNumber, allowTravelers, theme, isLilMonstaGame, excludedRoleIds]);

  const toggleTimeOfDay = () => {
    if (timeOfDay === 'night') {
      setTimeOfDay('day');
    } else {
      setTimeOfDay('night');
      setDayNumber(prev => prev + 1);
    }
  };

  const createNewPlayer = (name: string, roleId?: string): Player => ({
    id: Math.random().toString(36).substr(2, 9),
    name: name.trim(),
    roleId,
    preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] },
    isDead: false,
    isTheDrunk: false,
    isTheMarionette: false,
    isTheLilMonsta: false,
  });

  const addPlayer = () => {
    if (players.length >= 20) return;
    const name = newPlayerName.trim() || `Player #${players.length + 1}`;
    setPlayers([...players, createNewPlayer(name)]);
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
    setPlayers([...players, createNewPlayer(newTravelerName, newTravelerRoleId)]);
    setNewTravelerName('');
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const updatePlayerName = (id: string, name: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, name } : p));
  };

  const togglePreference = (playerId: string, team: Role['team'], roleId: string) => {
    setPlayers(players.map(p => {
      if (p.id !== playerId) return p;
      const current = p.preferences[team] || [];
      const newPrefs = current.includes(roleId) ? [] : [roleId];
      return {
        ...p,
        preferences: {
          ...p.preferences,
          [team]: newPrefs
        }
      };
    }));
  };

  const autoFillPreferences = (playerId?: string) => {
    const allRoles = rolesData as Role[];
    setPlayers(players.map(p => {
      if (playerId !== undefined && p.id !== playerId) return p;
      const newPrefs = {
        townsfolk: p.preferences.townsfolk.length > 0 ? [...p.preferences.townsfolk] : [],
        outsider: p.preferences.outsider.length > 0 ? [...p.preferences.outsider] : [],
        minion: p.preferences.minion.length > 0 ? [...p.preferences.minion] : [],
        demon: p.preferences.demon.length > 0 ? [...p.preferences.demon] : [],
        traveler: p.preferences.traveler?.length > 0 ? [...p.preferences.traveler] : []
      };
      
      const teams: ('townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler')[] = ['townsfolk', 'outsider', 'minion', 'demon'];
      if (allowTravelers) {
        teams.push('traveler');
      }
      for (const team of teams) {
        if (newPrefs[team].length === 0) {
          const available = allRoles.filter(r => r.team === team && !excludedRoleIds.includes(r.id));
          if (available.length > 0) {
            const randIdx = Math.floor(Math.random() * available.length);
            newPrefs[team] = [available[randIdx].id];
          }
        }
      }
      
      return { ...p, preferences: newPrefs };
    }));
  };

  const autoFillPlayerPreferences = (playerId: string) => autoFillPreferences(playerId);
  const autoFillAllPreferences = () => autoFillPreferences();

  const clearAllPreferences = () => {
    if (confirm('Clear preferences for all players?')) {
      setPlayers(players.map(p => ({
        ...p,
        preferences: { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] }
      })));
    }
  };

  const runAssignment = () => {
    const result = assignCharacters(players, rolesData as Role[], allowTravelers);
    if (!result) {
      alert('Could not find a valid assignment matching standard/modified player counts. Try adding more preference options.');
      return;
    }
    
    const updatedPlayers = players.map(p => {
      const assigned = result.find(r => r.player.id === p.id);
      let roleId = assigned?.fromPref ? assigned?.role.id : undefined;
      let isTheLunatic = false;
      let isTheLilMonsta = false;

      if (assigned && assigned.role.id === 'lunatic') {
        isTheLunatic = true;
        const demons = (rolesData as Role[]).filter(r => r.team === 'demon');
        const chosenDemon = demons[Math.floor(Math.random() * demons.length)] || { id: 'imp' };
        roleId = chosenDemon.id;
      } else if (assigned && assigned.role.id === 'lilmonsta') {
        isTheLilMonsta = true;
        const minions = (rolesData as Role[]).filter(r => r.team === 'minion');
        const chosenMinion = minions[Math.floor(Math.random() * minions.length)] || { id: 'poisoner' };
        roleId = chosenMinion.id;
      }

      return {
        ...p,
        roleId,
        assignedFromPref: assigned?.fromPref || false,
        isTheDrunk: false,
        isTheMarionette: false,
        isTheLunatic,
        isTheLilMonsta,
        isEvil: assigned?.player.isEvil,
      };
    });
    setPlayers(updatedPlayers);
    setIsLilMonstaGame(updatedPlayers.some(p => p.isTheLilMonsta));
    setPhase('draft');
  };

  const updatePlayerRole = (id: string, roleId: string) => {
    setPlayers(players.map(p => {
      if (p.id === id) {
        const role = (rolesData as Role[]).find(r => r.id === roleId);
        const isPref = role ? (p.preferences[role.team] || []).includes(roleId) : false;
        return {
          ...p,
          roleId: roleId || undefined,
          assignedFromPref: isPref,
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

  const togglePlayerTheDrunk = (id: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, isTheDrunk: !p.isTheDrunk, isTheMarionette: false, isTheLilMonsta: false } : p));
  };

  const togglePlayerTheMarionette = (id: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, isTheMarionette: !p.isTheMarionette, isTheDrunk: false, isTheLilMonsta: false } : p));
  };

  const togglePlayerTheLunatic = (id: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, isTheLunatic: !p.isTheLunatic, isTheDrunk: false, isTheMarionette: false, isTheLilMonsta: false } : p));
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
          isTheDrunk: false,
          isTheMarionette: false,
          isTheLunatic: false
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

  const closeDetailsModal = () => {
    setSelectedPlayerId(null);
    setIsSearchingRole(false);
    setModalRoleSearch('');
  };

  const resetGame = () => {
    if (confirm('Are you sure you want to reset the game? This clears all players and preferences.')) {
      setPlayers([]);
      setPhase('setup');
      setActiveDraftPlayerId(null);
      setSearchTerm('');
      setTimeOfDay('night');
      setDayNumber(1);
      setIsLilMonstaGame(false);
      localStorage.removeItem('whale-bucket-game');
    }
  };

  const validationSummary = useMemo(() => {
    return getValidationSummary(players);
  }, [players]);

  const isLightModeActive = theme === 'light';

  // Details Modal variables
  const modalPlayer = selectedPlayerId ? players.find(x => x.id === selectedPlayerId) : null;
  const modalRoleObj = modalPlayer ? (rolesData as Role[]).find(r => r.id === modalPlayer.roleId) : undefined;
  const filteredModalRoles = (rolesData as Role[])
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
  const currentIndex = selectedPlayerId ? players.findIndex(x => x.id === selectedPlayerId) : -1;
  const prevPlayerId = selectedPlayerId && currentIndex !== -1 ? players[(currentIndex - 1 + players.length) % players.length].id : null;
  const nextPlayerId = selectedPlayerId && currentIndex !== -1 ? players[(currentIndex + 1) % players.length].id : null;

  return (
    <div className={cn(
      "min-h-screen p-4 font-sans mx-auto transition-colors duration-300 max-w-xl md:max-w-5xl landscape:max-w-5xl",
      isLightModeActive
        ? "bg-clocktower-parchment text-clocktower-night"
        : "bg-clocktower-night text-clocktower-parchment"
    )}>
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
              onClick={() => {
                if (phase === 'game') {
                  setPhase('draft');
                } else {
                  setPhase('setup');
                }
              }}
              className={cn(
                "absolute left-0 transition-all p-1.5 rounded-full flex items-center justify-center",
                isLightModeActive 
                  ? "text-gray-700 hover:text-gray-900 hover:bg-black/5" 
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
              title="Back to previous phase"
            >
              <ArrowLeft size={24} />
            </button>
          )}

          <h1 className="text-2xl font-bold text-clocktower-blood tracking-wide text-center">
            Whale Bucket
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
        <WhaleBucketSetupPhase
          players={players}
          newPlayerName={newPlayerName}
          setNewPlayerName={setNewPlayerName}
          allowTravelers={allowTravelers}
          draggedIndex={draggedIndex}
          dragOverIndex={dragOverIndex}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleDragEnd={handleDragEnd}
          handleTouchStart={handleTouchStart}
          handleTouchMove={handleTouchMove}
          handleTouchEnd={handleTouchEnd}
          movePlayer={movePlayer}
          addPlayer={addPlayer}
          removePlayer={removePlayer}
          updatePlayerName={updatePlayerName}
          autoFillPlayerPreferences={autoFillPlayerPreferences}
          autoFillAllPreferences={autoFillAllPreferences}
          clearAllPreferences={clearAllPreferences}
          setActivePrefModal={setActivePrefModal}
          setPrefSearchTerm={setPrefSearchTerm}
          runAssignment={runAssignment}
          isLightModeActive={isLightModeActive}
          excludedRoleIds={excludedRoleIds}
          setExcludedRoleIds={setExcludedRoleIds}
        />
      )}

      {phase === 'draft' && (
        <WhaleBucketDraftPhase
          players={players}
          validationSummary={validationSummary}
          isLightModeActive={isLightModeActive}
          setPhase={setPhase}
          runAssignment={runAssignment}
          setActiveDraftPlayerId={setActiveDraftPlayerId}
          togglePlayerTheDrunk={togglePlayerTheDrunk}
          togglePlayerTheMarionette={togglePlayerTheMarionette}
          togglePlayerTheLunatic={togglePlayerTheLunatic}
          togglePlayerTheLilMonsta={togglePlayerTheLilMonsta}
        />
      )}

      {phase === 'game' && (
        <WhaleBucketGamePhase
          players={players}
          timeOfDay={timeOfDay}
          dayNumber={dayNumber}
          newTravelerName={newTravelerName}
          newTravelerRoleId={newTravelerRoleId}
          isLightModeActive={isLightModeActive}
          draggedIndex={draggedIndex}
          dragOverIndex={dragOverIndex}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleDragEnd={handleDragEnd}
          handleTouchStart={handleTouchStart}
          handleTouchMove={handleTouchMove}
          handleTouchEnd={handleTouchEnd}
          setSelectedPlayerId={setSelectedPlayerId}
          toggleTimeOfDay={toggleTimeOfDay}
          addTravelerGamePhase={addTravelerGamePhase}
          setNewTravelerName={setNewTravelerName}
          setNewTravelerRoleId={setNewTravelerRoleId}
        />
      )}

      {/* Preference Selection Modal */}
      {activePrefModal && (
        <PreferenceSelectionModal
          activePrefModal={activePrefModal}
          players={players}
          prefSearchTerm={prefSearchTerm}
          setPrefSearchTerm={setPrefSearchTerm}
          togglePreference={togglePreference}
          setPlayers={setPlayers}
          setActivePrefModal={setActivePrefModal}
          excludedRoleIds={excludedRoleIds}
        />
      )}

      {/* Manual Override Modal */}
      {activeDraftPlayerId && (
        <ManualOverrideModal
          activeDraftPlayerId={activeDraftPlayerId}
          players={players}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          updatePlayerRole={updatePlayerRole}
          setActiveDraftPlayerId={setActiveDraftPlayerId}
          isLightModeActive={isLightModeActive}
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
          onToggleLilMonsta={togglePlayerTheLilMonsta}
          isLilMonstaGame={isLilMonstaGame}
          onSetSearchingRole={setIsSearchingRole}
          onSetModalRoleSearch={setModalRoleSearch}
        />
      )}
    </div>
  );
}
