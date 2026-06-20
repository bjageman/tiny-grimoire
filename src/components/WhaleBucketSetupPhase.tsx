import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Shuffle, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Player } from '../WhaleBucket';
import type { Role } from '../types';
import { getDistribution } from '../constants';
import { getPreferenceLabel } from '../utils/assignment';

interface ValidationSummary {
  isValid: boolean;
  modifications: string[];
  counts: { townsfolk: number; outsider: number; minion: number; demon: number; traveler: number };
  expected: { townsfolk: number; outsider: number; minion: number; demon: number; traveler: number };
  isTownsfolkValid: boolean;
  isOutsiderValid: boolean;
  isMinionValid: boolean;
  isDemonValid: boolean;
  hasGodfather: boolean;
  jinxWarnings: string[];
}

interface WhaleBucketSetupPhaseProps {
  players: Player[];
  newPlayerName: string;
  setNewPlayerName: (name: string) => void;
  allowTravelers: boolean;
  setAllowTravelers: (allow: boolean) => void;
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
  validationSummary: ValidationSummary | null;
  isLightModeActive: boolean;
}

export default function WhaleBucketSetupPhase({
  players,
  newPlayerName,
  setNewPlayerName,
  allowTravelers,
  setAllowTravelers,
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
  validationSummary,
  isLightModeActive,
}: WhaleBucketSetupPhaseProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[5fr_3fr] md:grid-rows-[auto_1fr] md:items-start animate-fadeIn">
      {/* Section A: Draft Options */}
      <div className="md:col-start-2 md:row-start-1 w-full">
        {/* Draft Options Toggle */}
        <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-800/50 flex flex-col gap-3">
          <div>
            <span className="text-xs font-bold text-gray-300 block uppercase tracking-wider text-left">Draft Options</span>
            <span className="text-[10px] text-gray-500 block text-left">Configure drafting setup rules</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              id="draft-traveler-toggle"
              type="checkbox"
              checked={allowTravelers}
              onChange={(e) => setAllowTravelers(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-clocktower-traveler"></div>
            <span className="ml-2 text-xs font-semibold text-gray-300">Players will pick a traveler</span>
          </label>
        </div>
      </div>

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
      <div className="md:col-start-2 md:row-start-2 space-y-6 w-full">
        {/* Validation Summary */}
        {validationSummary && players.length >= 5 && (
          <div
            id="grimoire-balance-verification"
            className={cn(
              "border rounded-lg p-3 space-y-2.5 transition-colors duration-300 text-left",
              isLightModeActive
                ? "bg-white border-gray-250 text-clocktower-night shadow-sm"
                : "bg-gray-900/90 border-gray-800"
            )}
          >
            <div className="flex items-center gap-1.5">
              {validationSummary.isValid ? (
                <CheckCircle size={16} className="text-clocktower-outsider" />
              ) : (
                <AlertTriangle size={16} className="text-clocktower-minion" />
              )}
              <span className={cn(
                "font-semibold text-xs tracking-wide uppercase",
                isLightModeActive ? "text-gray-700" : "text-gray-300"
              )}>
                Grimoire Balance Verification
              </span>
            </div>

            {validationSummary.modifications.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {validationSummary.modifications.map((m, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      "text-[9px] border px-1.5 py-0.5 rounded font-medium transition-colors duration-300",
                      isLightModeActive
                        ? "bg-clocktower-blood/5 border-clocktower-blood/20 text-clocktower-blood"
                        : "bg-clocktower-blood/10 border-clocktower-blood/30 text-clocktower-parchment/80"
                    )}
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}

            <div className={cn(
              "grid text-center text-[10px] font-mono border-t pt-2.5",
              isLightModeActive ? "border-gray-200" : "border-gray-800",
              validationSummary.expected.traveler > 0 || validationSummary.counts.traveler > 0
                ? "grid-cols-5 gap-1"
                : "grid-cols-4 gap-2"
            )}>
              <div>
                <div className="text-gray-555">TF</div>
                <div className={cn("font-bold text-xs mt-0.5", validationSummary.isTownsfolkValid ? "text-clocktower-townsfolk" : (isLightModeActive ? "text-amber-700" : "text-yellow-500"))}>
                  {validationSummary.counts.townsfolk} / {validationSummary.expected.townsfolk}
                </div>
              </div>
              <div>
                <div className="text-gray-555">OUT</div>
                <div className={cn("font-bold text-xs mt-0.5", validationSummary.isOutsiderValid ? "text-clocktower-outsider" : (isLightModeActive ? "text-amber-700" : "text-yellow-500"))}>
                  {validationSummary.counts.outsider} / {validationSummary.hasGodfather ? `${validationSummary.expected.outsider - 1} or ${validationSummary.expected.outsider + 1}` : validationSummary.expected.outsider}
                </div>
              </div>
              <div>
                <div className="text-gray-555">MIN</div>
                <div className={cn("font-bold text-xs mt-0.5", validationSummary.isMinionValid ? "text-clocktower-minion" : (isLightModeActive ? "text-amber-700" : "text-yellow-500"))}>
                  {validationSummary.counts.minion} / {validationSummary.expected.minion}
                </div>
              </div>
              <div>
                <div className="text-gray-555">DEM</div>
                <div className={cn("font-bold text-xs mt-0.5", validationSummary.isDemonValid ? "text-clocktower-demon" : (isLightModeActive ? "text-amber-700" : "text-yellow-500"))}>
                  {validationSummary.counts.demon} / {validationSummary.expected.demon}
                </div>
              </div>
              {(validationSummary.expected.traveler > 0 || validationSummary.counts.traveler > 0) && (
                <div>
                  <div className="text-gray-555">TRV</div>
                  <div className="font-bold text-xs mt-0.5 text-clocktower-traveler">
                    {validationSummary.counts.traveler} / {validationSummary.expected.traveler}
                  </div>
                </div>
              )}
            </div>

            {validationSummary.jinxWarnings.length > 0 && (
              <div className={cn("border-t pt-2 space-y-1", isLightModeActive ? "border-gray-200" : "border-gray-800")}>
                {validationSummary.jinxWarnings.map((w, idx) => (
                  <div key={idx} className={cn("text-[10px] flex items-center gap-1 font-medium", isLightModeActive ? "text-amber-700" : "text-yellow-500")}>
                    <AlertTriangle size={10} /> {w}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
