import { useState, useEffect, useMemo } from 'react';
import { Sun, Moon, RefreshCcw } from 'lucide-react';
import rolesData from './roles.json';
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
    movePlayer,
  } = usePlayerDragAndDrop(players, setPlayers);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('whale-bucket-game');
    if (saved) {
      try {
        const { players: p, phase: ph, timeOfDay: tod, dayNumber: dn, allowTravelers: at } = JSON.parse(saved);
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
        if (at !== undefined) setAllowTravelers(!!at);

      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save to localStorage and update document theme
  useEffect(() => {
    localStorage.setItem('whale-bucket-game', JSON.stringify({ players, phase, timeOfDay, dayNumber, allowTravelers }));
    
    const isLightMode = theme === 'light';
    if (isLightMode) {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }
    
    return () => {
      document.documentElement.classList.remove('theme-light');
    };
  }, [players, phase, timeOfDay, dayNumber, allowTravelers, theme]);

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
          const available = allRoles.filter(r => r.team === team);
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

      if (assigned && assigned.role.id === 'lunatic') {
        isTheLunatic = true;
        const demons = (rolesData as Role[]).filter(r => r.team === 'demon');
        const chosenDemon = demons[Math.floor(Math.random() * demons.length)] || { id: 'imp' };
        roleId = chosenDemon.id;
      }

      return {
        ...p,
        roleId,
        assignedFromPref: assigned?.fromPref || false,
        isTheDrunk: false,
        isTheMarionette: false,
        isTheLunatic,
      };
    });
    setPlayers(updatedPlayers);
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
        };
      }
      return p;
    }));
  };

  const togglePlayerDead = (id: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, isDead: !p.isDead } : p));
  };

  const togglePlayerDrunkOrPoisoned = (id: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, isDrunkOrPoisoned: !p.isDrunkOrPoisoned } : p));
  };

  const togglePlayerTheDrunk = (id: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, isTheDrunk: !p.isTheDrunk, isTheMarionette: false } : p));
  };

  const togglePlayerTheMarionette = (id: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, isTheMarionette: !p.isTheMarionette, isTheDrunk: false } : p));
  };

  const togglePlayerTheLunatic = (id: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, isTheLunatic: !p.isTheLunatic, isTheDrunk: false, isTheMarionette: false } : p));
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
  const filteredModalRoles = (rolesData as Role[]).filter(r =>
    r.name.toLowerCase().includes(modalRoleSearch.toLowerCase())
  );
  const currentIndex = selectedPlayerId ? players.findIndex(x => x.id === selectedPlayerId) : -1;
  const prevPlayerId = selectedPlayerId && currentIndex !== -1 ? players[(currentIndex - 1 + players.length) % players.length].id : null;
  const nextPlayerId = selectedPlayerId && currentIndex !== -1 ? players[(currentIndex + 1) % players.length].id : null;

  return (
    <div className={cn(
      "min-h-screen p-4 font-sans mx-auto transition-colors duration-300",
      phase === 'game' 
        ? "max-w-xl md:max-w-6xl landscape:max-w-6xl" 
        : "max-w-xl md:max-w-4xl",
      isLightModeActive
        ? "bg-clocktower-parchment text-clocktower-night"
        : "bg-clocktower-night text-clocktower-parchment"
    )}>
      <header className={cn(
        "flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 border-b pb-2 gap-3 sm:gap-0",
        isLightModeActive ? "border-clocktower-blood/20" : "border-clocktower-blood"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative flex justify-center items-center w-full sm:w-auto sm:justify-start sm:gap-3">
            <a href="#/" className={cn("absolute left-0 transition-colors text-sm sm:static", isLightModeActive ? "text-gray-600 hover:text-gray-800" : "text-gray-500 hover:text-gray-300")}>← Home</a>
            <h1 className="text-2xl font-bold text-clocktower-blood tracking-wide text-center sm:text-left">Whale Bucket</h1>
            <div className="absolute right-0 flex items-center gap-1 sm:hidden">
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
          <div id="character-type-legend" className="flex justify-center sm:justify-start gap-2.5 text-[9px] font-bold tracking-wider text-gray-500 w-full sm:w-auto">
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-clocktower-townsfolk" /> Townsfolk</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-clocktower-outsider" /> Outsider</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-clocktower-minion" /> Minion</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-clocktower-demon" /> Demon</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className={cn("p-2 transition-colors", isLightModeActive ? "text-gray-600 hover:text-gray-900" : "text-gray-500 hover:text-white")}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            id="reset-game-button-desktop"
            onClick={resetGame}
            className={cn("p-2 transition-colors", isLightModeActive ? "text-gray-600 hover:text-gray-900" : "text-gray-500 hover:text-white")}
            title="Reset game"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </header>

      {phase === 'setup' && (
        <WhaleBucketSetupPhase
          players={players}
          newPlayerName={newPlayerName}
          setNewPlayerName={setNewPlayerName}
          allowTravelers={allowTravelers}
          setAllowTravelers={setAllowTravelers}
          draggedIndex={draggedIndex}
          dragOverIndex={dragOverIndex}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleDragEnd={handleDragEnd}
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
          validationSummary={validationSummary}
          isLightModeActive={isLightModeActive}
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
          setSelectedPlayerId={setSelectedPlayerId}
          toggleTimeOfDay={toggleTimeOfDay}
          addTravelerGamePhase={addTravelerGamePhase}
          setNewTravelerName={setNewTravelerName}
          setNewTravelerRoleId={setNewTravelerRoleId}
          setPhase={setPhase}
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
          onToggleDrunkOrPoisoned={togglePlayerDrunkOrPoisoned}
          onSetSearchingRole={setIsSearchingRole}
          onSetModalRoleSearch={setModalRoleSearch}
        />
      )}
    </div>
  );
}
