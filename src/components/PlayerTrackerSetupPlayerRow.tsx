import React from 'react';
import { Trash2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Player } from '../types';

interface PlayerTrackerSetupPlayerRowProps {
  player: Player;
  index: number;
  players: Player[];
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
  movePlayer: (index: number, direction: 'up' | 'down') => void;
  removePlayer: (id: string) => void;
  updatePlayerName: (id: string, name: string) => void;
  isSynced?: boolean;
}

export default function PlayerTrackerSetupPlayerRow({
  player: p,
  index,
  players,
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
  movePlayer,
  removePlayer,
  updatePlayerName,
  isSynced = false,
}: PlayerTrackerSetupPlayerRowProps) {
  return (
    <div
      data-drag-index={index}
      draggable={!isSynced}
      onMouseDown={isSynced ? undefined : handleMouseDown}
      onDragStart={isSynced ? undefined : (e) => handleDragStart(e, index)}
      onDragOver={isSynced ? undefined : (e) => handleDragOver(e, index)}
      onDragLeave={isSynced ? undefined : handleDragLeave}
      onDrop={isSynced ? undefined : (e) => handleDrop(e, index)}
      onDragEnd={isSynced ? undefined : handleDragEnd}
      className={cn(
        "bg-gray-900/60 p-3 rounded-lg border border-gray-800/50 space-y-2 transition-all duration-200",
        draggedIndex === index && "opacity-20 border-2 border-dashed border-clocktower-blood bg-black/40 scale-[0.96]",
        dragOverIndex === index && draggedIndex !== index && "border-t-4 border-t-clocktower-blood bg-clocktower-blood/10 shadow-[0_4px_12px_rgba(139,0,0,0.15)] translate-y-1"
      )}
    >
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        {!isSynced && (
          <div
            onTouchStart={(e) => handleTouchStart(e, index)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="text-gray-600 cursor-grab active:cursor-grabbing hover:text-gray-400 p-0.5 shrink-0 flex items-center select-none touch-none drag-handle"
            title="Drag to seat player"
          >
            <GripVertical size={14} />
          </div>
        )}

        {/* Index indicator */}
        <span className="text-xs text-gray-500 font-mono w-5 select-none">
          #{index + 1}
        </span>

        {/* Player Name Input */}
        <input
          type="text"
          value={p.name}
          disabled={isSynced}
          onChange={(e) => updatePlayerName(p.id, e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder="Player Name"
          autoCapitalize="words"
          className={cn(
            "flex-grow min-w-0 font-semibold px-1.5 py-0.5 rounded transition-all",
            isSynced 
              ? "text-gray-400 bg-transparent border-none cursor-default focus:outline-none" 
              : "text-gray-200 bg-transparent border-b border-transparent hover:border-gray-800/80 focus:border-clocktower-blood focus:outline-none"
          )}
        />

        {/* Reordering buttons pill */}
        {!isSynced && (
          <div className="flex gap-0.5 items-center bg-gray-955/45 px-1 py-0.5 rounded border border-gray-850 shrink-0">
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
        )}

        {/* Delete button */}
        {!isSynced && (
          <button
            type="button"
            onClick={() => removePlayer(p.id)}
            className="text-gray-600 hover:text-red-500 p-1 transition-colors shrink-0"
            title="Remove Player"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
