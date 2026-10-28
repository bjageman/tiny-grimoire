import { useState } from 'react';
import { Plus, Edit } from 'lucide-react';
import { cn } from '../../utils/cn';
import AddPlayerForm from '../shared/ui/AddPlayerForm';
import type { Player } from '../../WhaleBucket';
import type { Role } from '../../types';
import { getDistribution } from '../../constants';
import WhaleBucketPreferenceCircle from './PreferenceCircle';
import BaseDistributionCard from '../shared/grimoire/BaseDistributionCard';
import { ALL_ROLES } from '../../utils/roleData';
import GameSetupMods from '../shared/grimoire/GameSetupMods';
import SearchSuggestionInput from '../shared/ui/SearchSuggestionInput';



interface WhaleBucketSetupPhaseProps {
  players: Player[];
  newPlayerName: string;
  setNewPlayerName: (name: string) => void;
  allowTravelers: boolean;
  draggedIndex: number | null;
  dragOverIndex: number | null;
  hoverSide: 'before' | 'after' | null;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number, side: 'before' | 'after') => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;
  handleTouchStart: (e: React.TouchEvent, index: number) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  addPlayer: () => void;
  autoFillAllPreferences: () => void;
  clearAllPreferences: () => void;
  resetGame: () => void;
  setActivePreferencePlayerId: (id: string | null) => void;
  onManuallyAssign: () => void;
  isLightModeActive: boolean;
  excludedRoleIds: string[];
  setExcludedRoleIds: React.Dispatch<React.SetStateAction<string[]>>;
  sentinelOutsiderDelta: number;
  setSentinelOutsiderDelta: (delta: number) => void;
  popeEnabled: boolean;
  setPopeEnabled: (enabled: boolean) => void;
  torEnabled: boolean;
  setTorEnabled: (enabled: boolean) => void;
  remotePlayerIds?: Set<string>;
  isSecondary?: boolean;
}

export default function WhaleBucketSetupPhase({
  players,
  newPlayerName,
  setNewPlayerName,
  allowTravelers,
  draggedIndex,
  dragOverIndex,
  hoverSide,
  handleMouseDown,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  addPlayer,
  autoFillAllPreferences,
  clearAllPreferences,
  resetGame,
  setActivePreferencePlayerId,
  onManuallyAssign,
  isLightModeActive,
  excludedRoleIds,
  setExcludedRoleIds,
  sentinelOutsiderDelta,
  setSentinelOutsiderDelta,
  popeEnabled,
  setPopeEnabled,
  torEnabled,
  setTorEnabled,
  remotePlayerIds,
  isSecondary,
}: WhaleBucketSetupPhaseProps) {
  const [excludeSearchTerm, setExcludeSearchTerm] = useState('');
  const handleExcludeRole = (roleId: string) => {
    if (!excludedRoleIds.includes(roleId)) {
      setExcludedRoleIds(prev => [...prev, roleId]);
    }
  };

  const handleRemoveExcludedRole = (roleId: string) => {
    setExcludedRoleIds(prev => prev.filter(id => id !== roleId));
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[5fr_3fr] xl:grid-cols-[2fr_1fr] md:grid-rows-[auto_1fr] md:items-start animate-fadeIn">


      {/* Section B: Players & Role Preferences */}
      <div className="md:col-start-1 md:row-start-1 md:row-span-2 space-y-6 w-full">
        <section>
          <div className="flex flex-col items-center gap-3 mb-4 sm:flex-row sm:justify-between sm:items-center sm:gap-0">
            <h2 className="text-center font-display text-lg font-bold tracking-wider uppercase text-gray-300 sm:text-left">Setup <span>({players.length} Players)</span></h2>
            <div className="flex justify-center gap-2">
              {players.length > 0 && (
                <>
                  <button
                    onClick={autoFillAllPreferences}
                    className="text-sm sm:text-[10px] bg-clocktower-townsfolk/10 text-clocktower-townsfolk border border-clocktower-townsfolk/20 px-3 sm:px-2 py-1.5 sm:py-1 rounded hover:bg-clocktower-townsfolk/25 transition-all"
                  >
                    Auto-Fill All
                  </button>
                  <button
                    onClick={clearAllPreferences}
                    className="text-sm sm:text-[10px] bg-gray-800 text-gray-400 border border-gray-700 px-3 sm:px-2 py-1.5 sm:py-1 rounded hover:bg-gray-700 transition-all"
                  >
                    Clear All
                  </button>
                </>
              )}
              <button
                id="setup-reset-button"
                onClick={resetGame}
                disabled={isSecondary}
                className={cn(
                  "text-sm sm:text-[10px] bg-clocktower-blood/10 text-red-400 border border-clocktower-blood/30 px-3 sm:px-2 py-1.5 sm:py-1 rounded hover:bg-clocktower-blood/25 transition-all",
                  isSecondary && "opacity-40 cursor-not-allowed"
                )}
                title={isSecondary ? "Resetting the game is disabled on secondary devices." : "Reset game"}
              >
                Reset
              </button>
            </div>
          </div>

          <AddPlayerForm
            value={newPlayerName}
            onChange={setNewPlayerName}
            onAdd={addPlayer}
            playerCount={players.length}
            maxPlayers={15}
          />

          <WhaleBucketPreferenceCircle
            players={players}
            allowTravelers={allowTravelers}
            isLightModeActive={isLightModeActive}
            setActivePreferencePlayerId={setActivePreferencePlayerId}
            draggedIndex={draggedIndex}
            dragOverIndex={dragOverIndex}
            hoverSide={hoverSide}
            handleMouseDown={handleMouseDown}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            handleDragEnd={handleDragEnd}
            handleTouchStart={handleTouchStart}
            handleTouchMove={handleTouchMove}
            handleTouchEnd={handleTouchEnd}
            remotePlayerIds={remotePlayerIds}
          />
        </section>
      </div>

      {/* Section C: Distribution & Assign Button */}
      <div id="whalebucket-setup-controls-container" className="md:col-start-2 md:row-start-1 md:row-span-2 space-y-6 w-full">
        <GameSetupMods
          sentinelOutsiderDelta={sentinelOutsiderDelta}
          setSentinelOutsiderDelta={setSentinelOutsiderDelta}
          popeEnabled={popeEnabled}
          setPopeEnabled={setPopeEnabled}
          torEnabled={torEnabled}
          setTorEnabled={setTorEnabled}
          isLightModeActive={isLightModeActive}
          persistenceKey="whale-bucket-setup-modifiers-expanded"
        />
        {/* Exclude Characters Widget */}
        <div className={cn(
          "p-4 rounded-lg border flex flex-col gap-3 transition-colors duration-300",
          isLightModeActive
            ? "bg-white border-gray-250 text-clocktower-night shadow-sm"
            : "bg-gray-900/60 border-gray-800/50"
        )}>
          <div>
            <span className={cn("text-xs font-bold block uppercase tracking-wider text-left", isLightModeActive ? "text-gray-700" : "text-gray-300")}>Exclude Characters</span>
            <span className="text-[10px] text-gray-500 block text-left">These characters will be hidden in selection screens</span>
          </div>

          <SearchSuggestionInput
            id="exclude-characters-search"
            label="Exclude characters"
            placeholder="Search to exclude..."
            value={excludeSearchTerm}
            onChange={setExcludeSearchTerm}
            options={(ALL_ROLES as Role[])
              .filter(role => !excludedRoleIds.includes(role.id))
              .map(role => ({ id: role.id, label: role.name, description: role.team }))}
            onSelect={id => {
              handleExcludeRole(id);
              setExcludeSearchTerm('');
            }}
            closeOnSelect={false}
            showAllOnFocus={false}
            emptyMessage="No matching characters"
            isLightModeActive={isLightModeActive}
          />

          {/* Excluded Pills list */}
          {excludedRoleIds.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {excludedRoleIds.map(id => {
                const r = (ALL_ROLES as Role[]).find(x => x.id === id);
                if (!r) return null;
                return (
                  <span
                    key={id}
                    className={cn(
                      "flex w-full min-w-0 items-center justify-between gap-1 text-xs font-bold pl-2 pr-1 py-0.5 rounded border",
                      isLightModeActive
                        ? "bg-gray-100 border-gray-200 text-gray-700"
                        : "bg-gray-955 border-gray-800 text-gray-400"
                    )}
                  >
                    <span className="min-w-0 truncate">{r.name}</span>
                    <button
                      aria-label={`Stop excluding ${r.name}`}
                      onClick={() => handleRemoveExcludedRole(id)}
                      className="shrink-0 hover:text-red-500 p-0.5 transition-colors"
                    >
                      <Plus className="w-3 h-3 rotate-45" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {(() => {
          const travelerPlayersCount = players.filter(p => {
            if (allowTravelers && p.preferences?.traveler && p.preferences.traveler.length > 0) {
              return true;
            }
            return false;
          }).length;
          const minTravelers = players.length > 15 ? players.length - 15 : 0;
          const actualTravelers = Math.max(travelerPlayersCount, minTravelers);
          const baseCount = players.length - actualTravelers;
          const dist = getDistribution(baseCount);
          return (
            <BaseDistributionCard
              playerCount={players.length}
              dist={dist}
              isLightModeActive={isLightModeActive}
            />
          );
        })()}


        <div className="flex flex-col gap-3">
          <button
            id="manual-assign-characters-button"
            disabled={players.length === 0}
            onClick={onManuallyAssign}
            className="w-full bg-clocktower-blood hover:bg-red-800 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/40 flex items-center justify-center gap-2"
          >
            <Edit size={16} /> Assign Roles
          </button>
        </div>
      </div>
    </div>
  );
}
