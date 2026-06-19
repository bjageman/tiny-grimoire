import React from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Player } from '../WhaleBucket';
import type { Role } from '../types';
import rolesData from '../roles.json';
import GrimoireBoard from './GrimoireBoard';

interface WhaleBucketGamePhaseProps {
  players: Player[];
  timeOfDay: 'night' | 'day';
  dayNumber: number;
  newTravelerName: string;
  newTravelerRoleId: string;
  isLightModeActive: boolean;
  draggedIndex: number | null;
  dragOverIndex: number | null;
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;
  setSelectedPlayerId: (id: string | null) => void;
  toggleTimeOfDay: () => void;
  addTravelerGamePhase: () => void;
  setNewTravelerName: (name: string) => void;
  setNewTravelerRoleId: (roleId: string) => void;
  setPhase: (p: 'setup' | 'draft' | 'game') => void;
}

export default function WhaleBucketGamePhase({
  players,
  timeOfDay,
  dayNumber,
  newTravelerName,
  newTravelerRoleId,
  isLightModeActive,
  draggedIndex,
  dragOverIndex,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  setSelectedPlayerId,
  toggleTimeOfDay,
  addTravelerGamePhase,
  setNewTravelerName,
  setNewTravelerRoleId,
  setPhase,
}: WhaleBucketGamePhaseProps) {
  return (
    <div className="space-y-6 animate-fadeIn md:grid md:grid-cols-[3fr_2fr] md:gap-8 md:space-y-0 md:items-start landscape:grid landscape:grid-cols-[3fr_2fr] landscape:gap-6 landscape:space-y-0 landscape:items-start">
      {/* Column 1: Board Visual & Header */}
      <div className="space-y-4">
        <GrimoireBoard
          players={players}
          timeOfDay={timeOfDay}
          dayNumber={dayNumber}
          toggleTimeOfDay={toggleTimeOfDay}
          onSelectPlayer={setSelectedPlayerId}
          rolesData={rolesData as Role[]}
        />
      </div>

      {/* Column 2: Ledger & Controls */}
      <div className="space-y-6 md:pt-10 landscape:pt-10">
        <button
          id="return-to-draft-button"
          onClick={() => setPhase('draft')}
          className={cn(
            "w-full py-3 rounded-lg font-bold transition-all text-sm shadow-md",
            isLightModeActive
              ? "bg-white hover:bg-gray-50 text-clocktower-night border border-gray-300"
              : "bg-gray-800 hover:bg-gray-700 text-gray-300"
          )}
        >
          Return to Draft Screen
        </button>

        <div className={cn(
          "rounded-lg border p-3 space-y-1.5 transition-colors duration-300",
          isLightModeActive
            ? "bg-white/50 border-gray-300 text-clocktower-night"
            : "bg-gray-900/40 border-gray-800/80"
        )}>
          <h4 className={cn(
            "text-[10px] uppercase font-bold tracking-wider",
            isLightModeActive ? "text-gray-600" : "text-gray-500"
          )}>Grimoire Ledger Reference</h4>
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            {players.map((p, index) => {
              const rObj = (rolesData as Role[]).find(r => r.id === p.roleId);
              return (
                <div
                  key={p.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={cn(
                    "flex items-center gap-1.5 py-0.5 px-1.5 rounded border transition-colors min-w-0 cursor-move hover:ring-1 hover:ring-gray-500/50",
                    p.isDead && "opacity-45",
                    draggedIndex === index && "opacity-40 border-dashed border-clocktower-blood/50 scale-[0.98]",
                    dragOverIndex === index && draggedIndex !== index && "border-t-2 border-t-clocktower-blood bg-gray-800/20",
                    isLightModeActive
                      ? "bg-white/40 border-gray-200 hover:bg-white/70"
                      : "bg-gray-955/20 border-gray-900/40 hover:bg-gray-900/60"
                  )}
                >
                  <div className="text-gray-500 cursor-grab active:cursor-grabbing hover:text-gray-400 p-0.5 shrink-0 flex items-center">
                    <GripVertical size={10} />
                  </div>
                  <span className={cn("text-[9px] font-mono w-4 shrink-0", isLightModeActive ? "text-gray-550" : "text-gray-600")}>{index + 1}</span>
                  <span className={cn(
                    "font-medium truncate flex-1 min-w-0",
                    p.isDead && "line-through text-gray-500",
                    isLightModeActive && !p.isDead ? "text-clocktower-night" : "text-gray-200"
                  )}>{p.name}</span>
                  <span className={cn(
                    "font-semibold text-[10px] flex items-center gap-1 shrink-0 max-w-[45%] min-w-0",
                    rObj?.team === 'townsfolk' && "text-clocktower-townsfolk",
                    rObj?.team === 'outsider' && "text-clocktower-outsider",
                    rObj?.team === 'minion' && "text-clocktower-minion",
                    rObj?.team === 'demon' && "text-clocktower-demon",
                    rObj?.team === 'traveler' && "text-clocktower-traveler",
                  )}>
                    {rObj && (
                      <img
                        src={`/icons/${rObj.id}.svg`}
                        alt={rObj.name}
                        className="w-3.5 h-3.5 object-contain shrink-0"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
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

        {/* Add Traveler Card (Late Arrival) */}
        <div className={cn(
          "rounded-lg border p-3.5 space-y-3 transition-colors duration-300",
          isLightModeActive
            ? "bg-white/50 border-gray-300 text-clocktower-night"
            : "bg-gray-900/40 border-gray-800/80"
        )}>
          <h4 className={cn(
            "text-[10px] uppercase font-bold tracking-wider",
            isLightModeActive ? "text-gray-600" : "text-gray-500"
          )}>Add Traveler (Late Arrival)</h4>
          
          <div className="flex flex-col gap-2">
            <input
              id="game-traveler-name-input"
              type="text"
              placeholder="Traveler name..."
              value={newTravelerName}
              onChange={(e) => setNewTravelerName(e.target.value)}
              className={cn(
                "w-full rounded px-2.5 py-1.5 text-xs focus:outline-none border transition-colors",
                isLightModeActive
                  ? "bg-white border-gray-300 text-clocktower-night focus:border-clocktower-blood"
                  : "bg-gray-955 border-gray-800 text-gray-200 focus:border-clocktower-blood"
              )}
            />
            
            <div className="flex gap-2">
              <select
                id="game-traveler-role-select"
                value={newTravelerRoleId}
                onChange={(e) => setNewTravelerRoleId(e.target.value)}
                className={cn(
                  "flex-1 rounded px-2 py-1.5 text-xs focus:outline-none border transition-colors",
                  isLightModeActive
                    ? "bg-white border-gray-300 text-clocktower-night focus:border-clocktower-blood"
                    : "bg-gray-955 border-gray-800 text-gray-200 focus:border-clocktower-blood"
                )}
              >
                {(rolesData as Role[]).filter(r => r.team === 'traveler').map(r => (
                  <option
                    key={r.id}
                    value={r.id}
                    className={isLightModeActive ? "bg-white text-clocktower-night" : "bg-gray-950 text-gray-200"}
                  >
                    {r.name}
                  </option>
                ))}
              </select>
              
              <button
                id="game-add-traveler-button"
                onClick={addTravelerGamePhase}
                disabled={players.length >= 20}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-40 text-white shadow-sm",
                  isLightModeActive
                    ? "bg-purple-600 hover:bg-purple-700 active:bg-purple-800"
                    : "bg-clocktower-traveler hover:bg-purple-400 active:bg-purple-600"
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
