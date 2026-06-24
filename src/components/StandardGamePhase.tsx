import React from 'react';
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
  handleMouseDown: (e: React.MouseEvent) => void;
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;
  handleTouchStart: (e: React.TouchEvent, index: number) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  onResetDead?: () => void;
  onResetTime?: () => void;
  showNightOrder?: boolean;
  scriptName?: string;
  customScriptRoles?: Role[] | null;
}

export default function StandardGamePhase({
  players, timeOfDay, dayNumber, newTravelerName, newTravelerRoleId,
  isLightModeActive, selectionRoles, draggedIndex, dragOverIndex,
  setSelectedPlayerId, toggleTimeOfDay, addTravelerGamePhase,
  setNewTravelerName, setNewTravelerRoleId,
  handleMouseDown, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd,
  handleTouchStart, handleTouchMove, handleTouchEnd,
  onResetDead, onResetTime,
  showNightOrder = true,
  scriptName = "All Roles (Default)",
  customScriptRoles = null,
}: Props) {
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
            onResetTime={onResetTime}
          />
        </div>
        {showNightOrder && (
          <NightOrderWidget
            players={players}
            timeOfDay={timeOfDay}
            dayNumber={dayNumber}
            isLightModeActive={isLightModeActive}
          />
        )}
      </div>

      {/* Column 2: Controls */}
      <div id="grimoire-controls-container" className="space-y-6 md:pt-10 landscape:pt-10">

        {/* Active Script Display */}
        <div className={cn(
          'rounded-lg border p-3.5 space-y-2 transition-colors duration-300',
          isLightModeActive
            ? 'bg-white/50 border-gray-300 text-clocktower-night'
            : 'bg-gray-900/40 border-gray-800/80'
        )}>
          <h4 className={cn(
            'text-[10px] uppercase font-bold tracking-wider',
            isLightModeActive ? 'text-gray-600' : 'text-gray-500'
          )}>Active Script</h4>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5",
              customScriptRoles 
                ? "bg-clocktower-blood/10 border-clocktower-blood/40 text-clocktower-blood" 
                : isLightModeActive
                  ? "bg-gray-150 border-gray-300 text-gray-700"
                  : "bg-gray-955 border-gray-800 text-gray-400"
            )}>
              {customScriptRoles ? "📜" : "🌐"} {scriptName}
            </span>
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
          </div>
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            {players.map((p, index) => {
              const rObj = (rolesData as Role[]).find(r => r.id === p.roleId);
              return (
                 <div
                  id={`ledger-player-${p.id}`}
                  key={p.id}
                  data-drag-index={index}
                  draggable={true}
                  onMouseDown={handleMouseDown}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={cn(
                    'flex items-center gap-1.5 py-2.5 px-1.5 rounded border transition-all duration-200 min-w-0 hover:ring-1 hover:ring-gray-500/50 select-none cursor-pointer touch-auto',
                    p.isDead && 'opacity-45',
                    draggedIndex === index && 'opacity-20 border-2 border-dashed border-clocktower-blood bg-black/40 scale-[0.96]',
                    dragOverIndex === index && draggedIndex !== index && 'border-t-4 border-t-clocktower-blood bg-clocktower-blood/10 shadow-[0_4px_12px_rgba(139,0,0,0.15)] translate-y-0.5',
                    isLightModeActive
                      ? 'bg-white/40 border-gray-200 hover:bg-white/70'
                      : 'bg-gray-955/20 border-gray-900/40 hover:bg-gray-900/60'
                  )}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={(e) => handleTouchStart(e, index)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="text-gray-500 p-0.5 shrink-0 flex items-center transition-opacity duration-200 drag-handle opacity-60 hover:opacity-100 cursor-move touch-none"
                  >
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
                  <div className="flex items-center gap-1.5 shrink-0 max-w-[55%] min-w-0 ml-auto justify-end flex-wrap">
                    {(() => {
                      const displayRoles = p.roleIds && p.roleIds.length > 0 ? p.roleIds : (p.roleId ? [p.roleId] : []);
                      if (displayRoles.length === 0) {
                        return <span className="text-gray-500 font-semibold text-[10px]">—</span>;
                      }
                      return displayRoles.map((roleId) => {
                        const rObj = (rolesData as Role[]).find(r => r.id === roleId);
                        if (!rObj) return null;
                        return (
                          <span
                            key={roleId}
                            className={cn(
                              'font-semibold text-[10px] flex items-center gap-1 shrink-0',
                              rObj.team === 'townsfolk' && 'text-clocktower-townsfolk',
                              rObj.team === 'outsider' && 'text-clocktower-outsider',
                              rObj.team === 'minion' && 'text-clocktower-minion',
                              rObj.team === 'demon' && 'text-clocktower-demon',
                              rObj.team === 'traveler' && 'text-clocktower-traveler',
                            )}
                          >
                            <span className="w-4.5 h-4.5 bg-white rounded-full flex items-center justify-center shrink-0">
                              <img src={`/icons/${rObj.id}.svg`} alt={rObj.name} className="w-3.5 h-3.5 object-contain"
                                onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }} />
                            </span>
                            <span className="truncate">{rObj.name}</span>
                          </span>
                        );
                      });
                    })()}
                    {p.isTheDrunk && <span className="text-[8px] bg-yellow-600 text-black px-0.5 rounded leading-none shrink-0">DK</span>}
                    {p.isTheMarionette && <span className="text-[8px] bg-clocktower-minion text-white px-0.5 rounded leading-none shrink-0">MN</span>}
                    {p.isTheLunatic && <span className="text-[8px] bg-clocktower-outsider text-white px-0.5 rounded leading-none shrink-0">LN</span>}
                    {p.isTheLilMonsta && <span className="text-[8px] bg-clocktower-demon text-white px-0.5 rounded leading-none shrink-0">LM</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
