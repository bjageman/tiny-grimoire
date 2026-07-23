import { useState } from 'react';
import { Plus, Sparkles, Edit } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Player } from '../../WhaleBucket';
import type { Role } from '../../types';
import { getDistribution } from '../../constants';
import WhaleBucketPreferenceCircle from './PreferenceCircle';
import BaseDistributionCard from '../shared/BaseDistributionCard';
import rolesData from '../../official_roles.json';



interface WhaleBucketSetupPhaseProps {
  players: Player[];
  newPlayerName: string;
  setNewPlayerName: (name: string) => void;
  allowTravelers: boolean;
  draggedIndex: number | null;
  dragOverIndex: number | null;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
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
  runAssignment: () => void;
  onManuallyAssign: () => void;
  isLightModeActive: boolean;
  excludedRoleIds: string[];
  setExcludedRoleIds: React.Dispatch<React.SetStateAction<string[]>>;
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
  runAssignment,
  onManuallyAssign,
  isLightModeActive,
  excludedRoleIds,
  setExcludedRoleIds,
  remotePlayerIds,
  isSecondary,
}: WhaleBucketSetupPhaseProps) {
  const [excludeSearchTerm, setExcludeSearchTerm] = useState('');
  const [isExcludeFocused, setIsExcludeFocused] = useState(false);

  const excludeSuggestions = (rolesData as Role[]).filter(r =>
    !excludedRoleIds.includes(r.id) &&
    (excludeSearchTerm
      ? (r.name.toLowerCase().includes(excludeSearchTerm.toLowerCase()) ||
         r.team.toLowerCase().includes(excludeSearchTerm.toLowerCase()))
      : true)
  );

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
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-base font-bold tracking-wider uppercase text-gray-300">Setup ({players.length} Players)</h2>
            <div className="flex gap-2">
              {players.length > 0 && (
                <>
                  <button
                    onClick={autoFillAllPreferences}
                    className="text-[10px] bg-clocktower-townsfolk/10 text-clocktower-townsfolk border border-clocktower-townsfolk/20 px-2 py-1 rounded hover:bg-clocktower-townsfolk/25 transition-all"
                  >
                    Auto-Fill All
                  </button>
                  <button
                    onClick={clearAllPreferences}
                    className="text-[10px] bg-gray-800 text-gray-400 border border-gray-700 px-2 py-1 rounded hover:bg-gray-700 transition-all"
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
                  "text-[10px] bg-clocktower-blood/10 text-red-400 border border-clocktower-blood/30 px-2 py-1 rounded hover:bg-clocktower-blood/25 transition-all",
                  isSecondary && "opacity-40 cursor-not-allowed"
                )}
                title={isSecondary ? "Resetting the game is disabled on secondary devices." : "Reset game"}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              id="new-player-input"
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
              disabled={players.length >= 15}
              placeholder={
                players.length >= 15 
                  ? "Maximum players reached (15)" 
                  : "Enter player name in seating order..."
              }
              autoCapitalize="words"
              className="flex-1 bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-clocktower-blood text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={addPlayer}
              disabled={players.length >= 15}
              className={cn(
                "px-4 py-2 rounded transition-colors text-white",
                players.length >= 15
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50 border border-gray-800" 
                  : "bg-clocktower-blood hover:bg-red-800 border border-clocktower-blood"
              )}
            >
              <Plus size={20} />
            </button>
          </div>

          <WhaleBucketPreferenceCircle
            players={players}
            allowTravelers={allowTravelers}
            isLightModeActive={isLightModeActive}
            setActivePreferencePlayerId={setActivePreferencePlayerId}
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
            remotePlayerIds={remotePlayerIds}
          />
        </section>
      </div>

      {/* Section C: Distribution & Assign Button */}
      <div id="whalebucket-setup-controls-container" className="md:col-start-2 md:row-start-1 md:row-span-2 space-y-6 w-full">
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

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search to exclude..."
              value={excludeSearchTerm}
              onChange={(e) => setExcludeSearchTerm(e.target.value)}
              onFocus={() => setIsExcludeFocused(true)}
              onBlur={() => setTimeout(() => setIsExcludeFocused(false), 200)}
              className={cn(
                "w-full rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-clocktower-blood border",
                isLightModeActive
                  ? "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                  : "bg-gray-955 border-gray-800 text-white placeholder-gray-650"
              )}
            />
            {isExcludeFocused && (
              <div className={cn(
                "absolute left-0 right-0 mt-1 border rounded-md shadow-xl z-20 max-h-48 overflow-y-auto",
                isLightModeActive ? "bg-white border-gray-200" : "bg-gray-900 border-gray-800"
              )}>
                {excludeSuggestions.length === 0 ? (
                  <div className="p-2 text-xs text-gray-500 italic">No matching characters</div>
                ) : (
                  excludeSuggestions.map(r => (
                    <button
                      key={r.id}
                      onClick={() => {
                        handleExcludeRole(r.id);
                        setExcludeSearchTerm('');
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-xs flex justify-between items-center transition-colors",
                        isLightModeActive 
                          ? "text-gray-700 hover:bg-gray-100 hover:text-gray-950" 
                          : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                      )}
                    >
                      <span>{r.name}</span>
                      <span className={cn(
                        "text-[8px] font-bold px-1 py-0.5 rounded border uppercase tracking-wider",
                        isLightModeActive
                          ? "bg-gray-100 text-gray-500 border-gray-200"
                          : "bg-gray-955 text-gray-500 border-gray-800"
                      )}>
                        {r.team}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Excluded Pills list */}
          {excludedRoleIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {excludedRoleIds.map(id => {
                const r = (rolesData as Role[]).find(x => x.id === id);
                if (!r) return null;
                return (
                  <span
                    key={id}
                    className={cn(
                      "flex items-center gap-1 text-[10px] font-bold pl-2 pr-1 py-0.5 rounded border",
                      isLightModeActive
                        ? "bg-gray-100 border-gray-200 text-gray-700"
                        : "bg-gray-955 border-gray-800 text-gray-400"
                    )}
                  >
                    {r.name}
                    <button
                      onClick={() => handleRemoveExcludedRole(id)}
                      className="hover:text-red-500 p-0.5 transition-colors"
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
            id="random-assign-characters-button"
            disabled={players.length < 5}
            onClick={runAssignment}
            className="w-full bg-clocktower-blood hover:bg-red-800 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/40 flex items-center justify-center gap-2"
          >
            <Sparkles size={16} /> Randomly Assign Characters
          </button>
          <button
            id="manual-assign-characters-button"
            disabled={players.length === 0}
            onClick={onManuallyAssign}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/40 flex items-center justify-center gap-2"
          >
            <Edit size={16} /> Manually Assign
          </button>
        </div>
      </div>
    </div>
  );
}
