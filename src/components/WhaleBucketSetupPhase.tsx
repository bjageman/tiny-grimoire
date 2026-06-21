import { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Shuffle, Sparkles } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Player } from '../WhaleBucket';
import type { Role } from '../types';
import { getDistribution } from '../constants';
import { getPreferenceLabel } from '../utils/assignment';
import rolesData from '../official_roles.json';



interface WhaleBucketSetupPhaseProps {
  players: Player[];
  newPlayerName: string;
  setNewPlayerName: (name: string) => void;
  allowTravelers: boolean;
  draggedIndex: number | null;
  dragOverIndex: number | null;
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;
  handleTouchStart: (e: React.TouchEvent, index: number) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  movePlayer: (index: number, direction: 'up' | 'down') => void;
  addPlayer: () => void;
  removePlayer: (id: string) => void;
  updatePlayerName: (id: string, name: string) => void;
  autoFillPlayerPreferences: (playerId: string) => void;
  autoFillAllPreferences: () => void;
  clearAllPreferences: () => void;
  setActivePrefModal: (val: { playerId: string; team: Role['team'] } | null) => void;
  setPrefSearchTerm: (term: string) => void;
  runAssignment: () => void;
  isLightModeActive: boolean;
  excludedRoleIds: string[];
  setExcludedRoleIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function WhaleBucketSetupPhase({
  players,
  newPlayerName,
  setNewPlayerName,
  allowTravelers,
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
  addPlayer,
  removePlayer,
  updatePlayerName,
  autoFillPlayerPreferences,
  autoFillAllPreferences,
  clearAllPreferences,
  setActivePrefModal,
  setPrefSearchTerm,
  runAssignment,
  isLightModeActive,
  excludedRoleIds,
  setExcludedRoleIds,
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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[5fr_3fr] md:grid-rows-[auto_1fr] md:items-start animate-fadeIn">


      {/* Section B: Seating & Preferences */}
      <div className="md:col-start-1 md:row-start-1 md:row-span-2 space-y-6 w-full">
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-300">1. Seating & Preferences ({players.length})</h2>
            {players.length > 0 && (
              <div className="flex gap-2">
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
              </div>
            )}
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
              disabled={players.length >= 20}
              placeholder={players.length >= 20 ? "Maximum players reached (20)" : "Enter player name in seating order..."}
              autoCapitalize="words"
              className="flex-1 bg-gray-900 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-clocktower-blood text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button 
              onClick={addPlayer} 
              disabled={players.length >= 20}
              className={cn(
                "px-4 py-2 rounded transition-colors text-white",
                players.length >= 20 
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50 border border-gray-800" 
                  : "bg-clocktower-blood hover:bg-red-800 border border-clocktower-blood"
              )}
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {players.map((p, index) => (
              <div
                key={p.id}
                data-drag-index={index}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "bg-gray-900/60 p-3 rounded-lg border border-gray-800/50 space-y-2 transition-all duration-200",
                  draggedIndex === index && "opacity-20 border-2 border-dashed border-clocktower-blood bg-black/40 scale-[0.96]",
                  dragOverIndex === index && draggedIndex !== index && "border-t-4 border-t-clocktower-blood bg-clocktower-blood/10 shadow-[0_4px_12px_rgba(139,0,0,0.15)] translate-y-1"
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    onTouchStart={(e) => handleTouchStart(e, index)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="text-gray-600 cursor-grab active:cursor-grabbing hover:text-gray-400 p-0.5 shrink-0 flex items-center select-none touch-none"
                  >
                    <GripVertical size={14} />
                  </div>
                  <span className="text-xs text-gray-500 font-mono w-5">#{index + 1}</span>
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => updatePlayerName(p.id, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    autoCapitalize="words"
                    className="flex-grow min-w-0 font-semibold text-gray-200 bg-transparent border-b border-transparent hover:border-gray-800/80 focus:border-clocktower-blood focus:outline-none px-1.5 py-0.5 rounded transition-all"
                  />
                  <button
                    onClick={() => autoFillPlayerPreferences(p.id)}
                    className="text-[10px] text-clocktower-townsfolk hover:underline flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-clocktower-townsfolk/5 border border-clocktower-townsfolk/20"
                    title="Auto-fill random preferences for this player"
                  >
                    <Shuffle size={10} /> Auto
                  </button>
                  <div className="flex gap-0.5 items-center bg-gray-955/45 px-1 py-0.5 rounded border border-gray-800">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => movePlayer(index, 'up')}
                      className="text-gray-500 hover:text-gray-200 disabled:opacity-20 disabled:hover:text-gray-500 transition-colors p-0.5"
                      title="Move player up"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={index === players.length - 1}
                      onClick={() => movePlayer(index, 'down')}
                      className="text-gray-500 hover:text-gray-200 disabled:opacity-20 disabled:hover:text-gray-500 transition-colors p-0.5"
                      title="Move player down"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                  <button onClick={() => removePlayer(p.id)} className="text-gray-600 hover:text-red-500 p-1 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                {/* Preference buttons */}
                <div className={cn("grid gap-1.5 pt-1", allowTravelers ? "grid-cols-5" : "grid-cols-4")}>
                  <button
                    onClick={() => {
                      setActivePrefModal({ playerId: p.id, team: 'townsfolk' });
                      setPrefSearchTerm('');
                    }}
                    title={getPreferenceLabel(p.preferences.townsfolk, "No Townsfolk preference")}
                    className={cn(
                      "text-[10px] font-bold py-1.5 px-0.5 rounded border transition-all text-center truncate block w-full whitespace-nowrap",
                      p.preferences.townsfolk.length > 0
                        ? "bg-clocktower-townsfolk/15 border-clocktower-townsfolk/40 text-clocktower-townsfolk"
                        : "bg-gray-950/40 border-gray-800 text-gray-550 hover:border-gray-700"
                    )}
                  >
                    {getPreferenceLabel(p.preferences.townsfolk, "TF")}
                  </button>
                  <button
                    onClick={() => {
                      setActivePrefModal({ playerId: p.id, team: 'outsider' });
                      setPrefSearchTerm('');
                    }}
                    title={getPreferenceLabel(p.preferences.outsider, "No Outsider preference")}
                    className={cn(
                      "text-[10px] font-bold py-1.5 px-0.5 rounded border transition-all text-center truncate block w-full whitespace-nowrap",
                      p.preferences.outsider.length > 0
                        ? "bg-clocktower-outsider/15 border-clocktower-outsider/40 text-clocktower-outsider"
                        : "bg-gray-950/40 border-gray-800 text-gray-550 hover:border-gray-700"
                    )}
                  >
                    {getPreferenceLabel(p.preferences.outsider, "OUT")}
                  </button>
                  <button
                    onClick={() => {
                      setActivePrefModal({ playerId: p.id, team: 'minion' });
                      setPrefSearchTerm('');
                    }}
                    title={getPreferenceLabel(p.preferences.minion, "No Minion preference")}
                    className={cn(
                      "text-[10px] font-bold py-1.5 px-0.5 rounded border transition-all text-center truncate block w-full whitespace-nowrap",
                      p.preferences.minion.length > 0
                        ? "bg-clocktower-minion/15 border-clocktower-minion/40 text-clocktower-minion"
                        : "bg-gray-950/40 border-gray-800 text-gray-550 hover:border-gray-700"
                    )}
                  >
                    {getPreferenceLabel(p.preferences.minion, "MIN")}
                  </button>
                  <button
                    onClick={() => {
                      setActivePrefModal({ playerId: p.id, team: 'demon' });
                      setPrefSearchTerm('');
                    }}
                    title={getPreferenceLabel(p.preferences.demon, "No Demon preference")}
                    className={cn(
                      "text-[10px] font-bold py-1.5 px-0.5 rounded border transition-all text-center truncate block w-full whitespace-nowrap",
                      p.preferences.demon.length > 0
                        ? "bg-clocktower-demon/15 border-clocktower-demon/40 text-clocktower-demon"
                        : "bg-gray-950/40 border-gray-800 text-gray-550 hover:border-gray-700"
                    )}
                  >
                    {getPreferenceLabel(p.preferences.demon, "DEM")}
                  </button>
                  {allowTravelers && (
                    <button
                      onClick={() => {
                        setActivePrefModal({ playerId: p.id, team: 'traveler' });
                        setPrefSearchTerm('');
                      }}
                      title={getPreferenceLabel(p.preferences.traveler || [], "No Traveler preference")}
                      className={cn(
                        "text-[10px] font-bold py-1.5 px-0.5 rounded border transition-all text-center truncate block w-full whitespace-nowrap",
                        p.preferences.traveler && p.preferences.traveler.length > 0
                          ? "bg-clocktower-traveler/15 border-clocktower-traveler/40 text-clocktower-traveler"
                          : "bg-gray-950/40 border-gray-800 text-gray-550 hover:border-gray-700"
                      )}
                    >
                      {getPreferenceLabel(p.preferences.traveler || [], "TRV")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Section C: Distribution & Assign Button */}
      <div className="md:col-start-2 md:row-start-1 md:row-span-2 space-y-6 w-full">
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

        <section id="standard-base-distribution" className="bg-gray-900 p-4 rounded-lg border border-gray-855">
          <h3 className="text-xs font-bold text-gray-555 uppercase tracking-wider mb-2.5 text-left">Standard Base Distribution</h3>
          {players.length >= 5 ? (() => {
            const travelerPlayersCount = players.filter(p => {
              if (allowTravelers && p.preferences.traveler && p.preferences.traveler.length > 0) {
                return true;
              }
              return false;
            }).length;
            const minTravelers = players.length > 15 ? players.length - 15 : 0;
            const actualTravelers = Math.max(travelerPlayersCount, minTravelers);
            const baseCount = players.length - actualTravelers;
            const dist = getDistribution(baseCount);
            return (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
                  <div className="p-2 rounded bg-gray-955/40 border border-gray-800 text-clocktower-townsfolk">
                    TS: {dist.townsfolk}
                  </div>
                  <div className="p-2 rounded bg-gray-955/40 border border-gray-800 text-clocktower-outsider">
                    O: {dist.outsider}
                  </div>
                  <div className="p-2 rounded bg-gray-955/40 border border-gray-800 text-clocktower-minion">
                    M: {dist.minion}
                  </div>
                  <div className="p-2 rounded bg-gray-955/40 border border-gray-800 text-clocktower-demon">
                    D: {dist.demon}
                  </div>
                </div>
                {(dist.traveler > 0 || actualTravelers > 0) && (
                  <div className="text-center text-xs font-semibold p-2 rounded bg-gray-955/40 border border-gray-800 text-clocktower-traveler">
                    Travelers: {actualTravelers > 0 ? actualTravelers : dist.traveler}
                  </div>
                )}
              </div>
            );
          })() : (
            <p className="text-xs text-gray-500 italic text-left">Add at least 5 players to view distribution.</p>
          )}
        </section>


        <button
          id="random-assign-characters-button"
          disabled={players.length < 5}
          onClick={runAssignment}
          className="w-full bg-clocktower-blood hover:bg-red-800 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/40 flex items-center justify-center gap-2"
        >
          <Sparkles size={16} /> Randomly Assign Characters
        </button>
      </div>
    </div>
  );
}
