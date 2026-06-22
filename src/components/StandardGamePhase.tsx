import React, { useState } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Player, Role } from '../types';
import rolesData from '../roles.json';
import GrimoireBoard from './GrimoireBoard';
import NightOrderWidget from './NightOrderWidget';

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
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;
  handleTouchStart: (e: React.TouchEvent, index: number) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  onResetDead?: () => void;
  onResetDay?: () => void;
}

export default function StandardGamePhase({
  players, timeOfDay, dayNumber, newTravelerName, newTravelerRoleId,
  isLightModeActive, selectionRoles, draggedIndex, dragOverIndex,
  setSelectedPlayerId, toggleTimeOfDay, addTravelerGamePhase,
  setNewTravelerName, setNewTravelerRoleId,
  handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd,
  handleTouchStart, handleTouchMove, handleTouchEnd,
  onResetDead, onResetDay,
}: Props) {
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  return (
    <div className="space-y-6 animate-fadeIn md:grid md:grid-cols-[3fr_2fr] md:gap-8 md:space-y-0 md:items-start landscape:grid landscape:grid-cols-[3fr_2fr] landscape:gap-6 landscape:space-y-0 landscape:items-start">
      {/* Column 1: Board & Night Order */}
      <div className="space-y-6">
        <div id="grimoire-board-container" className="space-y-4">
          <GrimoireBoard
            players={players}
            timeOfDay={timeOfDay}
            dayNumber={dayNumber}
            toggleTimeOfDay={toggleTimeOfDay}
            onSelectPlayer={setSelectedPlayerId}
            rolesData={selectionRoles}
            onResetDead={onResetDead}
            onResetDay={onResetDay}
          />
        </div>
        <NightOrderWidget
          players={players}
          timeOfDay={timeOfDay}
          dayNumber={dayNumber}
          isLightModeActive={isLightModeActive}
        />
      </div>

      {/* Column 2: Controls */}
      <div id="grimoire-controls-container" className="space-y-6 md:pt-10 landscape:pt-10">

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
              <div className="relative w-7 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-clocktower-blood"></div>
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
                    'font-medium truncate flex-1 min-w-0 flex items-center gap-1',
                    p.isDead && 'line-through text-gray-500',
                    isLightModeActive && !p.isDead ? 'text-clocktower-night' : 'text-gray-200'
                  )}>
                    <span className="truncate">{p.name}</span>
                    {(() => {
                      const defaultEvil = rObj ? (rObj.team === 'minion' || rObj.team === 'demon') : false;
                      const isEvil = p.isEvil !== undefined ? p.isEvil : defaultEvil;
                      const hasAlignmentShift = p.isEvil !== undefined && p.isEvil !== defaultEvil;
                      return hasAlignmentShift ? (isEvil ? '👿' : '😇') : null;
                    })()}
                  </span>
                  <span className={cn(
                    'font-semibold text-[10px] flex items-center gap-1 shrink-0 max-w-[45%] min-w-0',
                    rObj?.team === 'townsfolk' && 'text-clocktower-townsfolk',
                    rObj?.team === 'outsider' && 'text-clocktower-outsider',
                    rObj?.team === 'minion' && 'text-clocktower-minion',
                    rObj?.team === 'demon' && 'text-clocktower-demon',
                    rObj?.team === 'traveler' && 'text-clocktower-traveler',
                  )}>
                    {rObj && (
                      <span className="w-4.5 h-4.5 bg-white rounded-full flex items-center justify-center shrink-0">
                        <img src={`/icons/${rObj.id}.svg`} alt={rObj.name} className="w-3.5 h-3.5 object-contain"
                          onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }} />
                      </span>
                    )}
                    <span className="truncate">{rObj?.name ?? '—'}</span>
                    {p.isTheDrunk && <span className="text-[8px] bg-yellow-600 text-black px-0.5 rounded leading-none shrink-0">DK</span>}
                    {p.isTheMarionette && <span className="text-[8px] bg-clocktower-minion text-white px-0.5 rounded leading-none shrink-0">MN</span>}
                    {p.isTheLunatic && <span className="text-[8px] bg-clocktower-outsider text-white px-0.5 rounded leading-none shrink-0">LN</span>}
                    {p.isTheLilMonsta && <span className="text-[8px] bg-clocktower-demon text-white px-0.5 rounded leading-none shrink-0">LM</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
