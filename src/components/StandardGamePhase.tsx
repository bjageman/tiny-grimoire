import React, { useState } from 'react';
import { GripVertical, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Player, Role } from '../types';
import rolesData from '../roles.json';
import GrimoireBoard from './GrimoireBoard';

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

interface Props {
  players: Player[];
  timeOfDay: 'night' | 'day';
  dayNumber: number;
  newTravelerName: string;
  newTravelerRoleId: string;
  isLightModeActive: boolean;
  selectionRoles: Role[];
  draggedIndex: number | null;
  dragOverIndex: number | null;
  setSelectedPlayerId: (id: string) => void;
  toggleTimeOfDay: () => void;
  addTravelerGamePhase: () => void;
  setNewTravelerName: (v: string) => void;
  setNewTravelerRoleId: (v: string) => void;
  setPhase: (p: 'setup' | 'game') => void;
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;
  handleTouchStart: (e: React.TouchEvent, index: number) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  validationSummary: ValidationSummary | null;
}

export default function StandardGamePhase({
  players, timeOfDay, dayNumber, newTravelerName, newTravelerRoleId,
  isLightModeActive, selectionRoles, draggedIndex, dragOverIndex,
  setSelectedPlayerId, toggleTimeOfDay, addTravelerGamePhase,
  setNewTravelerName, setNewTravelerRoleId, setPhase,
  handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd,
  handleTouchStart, handleTouchMove, handleTouchEnd,
  validationSummary,
}: Props) {
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  return (
    <div className="space-y-6 animate-fadeIn md:grid md:grid-cols-[3fr_2fr] md:gap-8 md:space-y-0 md:items-start landscape:grid landscape:grid-cols-[3fr_2fr] landscape:gap-6 landscape:space-y-0 landscape:items-start">
      {/* Column 1: Board */}
      <div id="grimoire-board-container" className="space-y-4">
        <GrimoireBoard
          players={players}
          timeOfDay={timeOfDay}
          dayNumber={dayNumber}
          toggleTimeOfDay={toggleTimeOfDay}
          onSelectPlayer={setSelectedPlayerId}
          rolesData={selectionRoles}
        />
      </div>

      {/* Column 2: Controls */}
      <div id="grimoire-controls-container" className="space-y-6 md:pt-10 landscape:pt-10">
        <button
          id="return-to-setup-button"
          onClick={() => setPhase('setup')}
          className={cn(
            'w-full py-3 rounded-lg font-bold transition-all text-sm shadow-md',
            isLightModeActive
              ? 'bg-white hover:bg-gray-50 text-clocktower-night border border-gray-300'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          )}
        >
          Return to Setup
        </button>

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
                <div className="text-gray-550">TF</div>
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

        {/* Ledger */}
        <div id="grimoire-ledger-container" className={cn(
          'rounded-lg border p-3 space-y-1.5 transition-colors duration-300',
          isLightModeActive
            ? 'bg-white/50 border-gray-300 text-clocktower-night'
            : 'bg-gray-900/40 border-gray-800/80'
        )}>
          <div className="flex justify-between items-center mb-1">
            <h4 className={cn(
              'text-[10px] uppercase font-bold tracking-wider',
              isLightModeActive ? 'text-gray-600' : 'text-gray-500'
            )}>Grimoire Ledger Reference</h4>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDragEnabled}
                onChange={(e) => setIsDragEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-350 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-clocktower-blood"></div>
              <span className="ml-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">Drag to Reorder</span>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            {players.map((p, index) => {
              const rObj = (rolesData as Role[]).find(r => r.id === p.roleId);
              return (
                <div
                  id={`ledger-player-${p.id}`}
                  key={p.id}
                  data-drag-index={index}
                  draggable={isDragEnabled}
                  onDragStart={isDragEnabled ? (e) => handleDragStart(e, index) : undefined}
                  onDragOver={isDragEnabled ? (e) => handleDragOver(e, index) : undefined}
                  onDragLeave={isDragEnabled ? handleDragLeave : undefined}
                  onDrop={isDragEnabled ? (e) => handleDrop(e, index) : undefined}
                  onDragEnd={isDragEnabled ? handleDragEnd : undefined}
                  onTouchStart={isDragEnabled ? (e) => handleTouchStart(e, index) : undefined}
                  onTouchMove={isDragEnabled ? handleTouchMove : undefined}
                  onTouchEnd={isDragEnabled ? handleTouchEnd : undefined}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={cn(
                    'flex items-center gap-1.5 py-2.5 px-1.5 rounded border transition-all duration-200 min-w-0 hover:ring-1 hover:ring-gray-500/50 select-none',
                    isDragEnabled ? 'cursor-move touch-none' : 'cursor-pointer touch-auto',
                    p.isDead && 'opacity-45',
                    isDragEnabled && draggedIndex === index && 'opacity-20 border-2 border-dashed border-clocktower-blood bg-black/40 scale-[0.96]',
                    isDragEnabled && dragOverIndex === index && draggedIndex !== index && 'border-t-4 border-t-clocktower-blood bg-clocktower-blood/10 shadow-[0_4px_12px_rgba(139,0,0,0.15)] translate-y-0.5',
                    isLightModeActive
                      ? 'bg-white/40 border-gray-200 hover:bg-white/70'
                      : 'bg-gray-955/20 border-gray-900/40 hover:bg-gray-900/60'
                  )}
                >
                  <div className={cn(
                    "text-gray-500 p-0.5 shrink-0 flex items-center transition-opacity duration-200",
                    isDragEnabled ? "opacity-100" : "opacity-25"
                  )}>
                    <GripVertical size={10} />
                  </div>
                  <span className={cn('text-[9px] font-mono w-4 shrink-0', isLightModeActive ? 'text-gray-505' : 'text-gray-600')}>{index + 1}</span>
                  <span className={cn(
                    'font-medium truncate flex-1 min-w-0',
                    p.isDead && 'line-through text-gray-500',
                    isLightModeActive && !p.isDead ? 'text-clocktower-night' : 'text-gray-200'
                  )}>{p.name}</span>
                  <span className={cn(
                    'font-semibold text-[10px] flex items-center gap-1 shrink-0 max-w-[45%] min-w-0',
                    rObj?.team === 'townsfolk' && 'text-clocktower-townsfolk',
                    rObj?.team === 'outsider' && 'text-clocktower-outsider',
                    rObj?.team === 'minion' && 'text-clocktower-minion',
                    rObj?.team === 'demon' && 'text-clocktower-demon',
                    rObj?.team === 'traveler' && 'text-clocktower-traveler',
                  )}>
                    {rObj && (
                      <img src={`/icons/${rObj.id}.svg`} alt={rObj.name} className="w-3.5 h-3.5 object-contain shrink-0"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    )}
                    <span className="truncate">{rObj?.name ?? '—'}</span>
                    {p.isTheDrunk && <span className="text-[8px] bg-yellow-600 text-black px-0.5 rounded leading-none shrink-0">DK</span>}
                    {p.isTheMarionette && <span className="text-[8px] bg-clocktower-minion text-white px-0.5 rounded leading-none shrink-0">MN</span>}
                    {p.isTheLunatic && <span className="text-[8px] bg-clocktower-outsider text-white px-0.5 rounded leading-none shrink-0">LN</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Traveler */}
        <div className={cn(
          'rounded-lg border p-3.5 space-y-3 transition-colors duration-300',
          isLightModeActive
            ? 'bg-white/50 border-gray-300 text-clocktower-night'
            : 'bg-gray-900/40 border-gray-800/80'
        )}>
          <h4 className={cn(
            'text-[10px] uppercase font-bold tracking-wider',
            isLightModeActive ? 'text-gray-600' : 'text-gray-500'
          )}>Add Traveler (Late Arrival)</h4>
          <div className="flex flex-col gap-2">
            <input
              id="game-traveler-name-input"
              type="text"
              placeholder="Traveler name..."
              value={newTravelerName}
              onChange={(e) => setNewTravelerName(e.target.value)}
              autoCapitalize="words"
              className={cn(
                'w-full rounded px-2.5 py-1.5 text-xs focus:outline-none border transition-colors',
                isLightModeActive
                  ? 'bg-white border-gray-300 text-clocktower-night focus:border-clocktower-blood'
                  : 'bg-gray-950 border-gray-800 text-gray-200 focus:border-clocktower-blood'
              )}
            />
            <div className="flex gap-2">
              <select
                id="game-traveler-role-select"
                value={newTravelerRoleId}
                onChange={(e) => setNewTravelerRoleId(e.target.value)}
                className={cn(
                  'flex-1 rounded px-2 py-1.5 text-xs focus:outline-none border transition-colors',
                  isLightModeActive
                    ? 'bg-white border-gray-300 text-clocktower-night focus:border-clocktower-blood'
                    : 'bg-gray-950 border-gray-800 text-gray-200 focus:border-clocktower-blood'
                )}
              >
                {(rolesData as Role[]).filter(r => r.team === 'traveler').map(r => (
                  <option key={r.id} value={r.id} className={isLightModeActive ? 'bg-white text-clocktower-night' : 'bg-gray-950 text-gray-200'}>
                    {r.name}
                  </option>
                ))}
              </select>
              <button
                id="game-add-traveler-button"
                onClick={addTravelerGamePhase}
                disabled={players.length >= 20}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-40 text-white shadow-sm',
                  isLightModeActive
                    ? 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
                    : 'bg-clocktower-traveler hover:bg-purple-400 active:bg-purple-600'
                )}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
