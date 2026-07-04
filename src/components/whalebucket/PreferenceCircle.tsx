import React from 'react';
import { Wifi } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Player } from '../../WhaleBucket';
import CharacterToken from '../shared/CharacterToken';
import { useGrimoireLayout } from '../../hooks/useGrimoireLayout';

interface WhaleBucketPreferenceCircleProps {
  players: Player[];
  allowTravelers: boolean;
  isLightModeActive: boolean;
  setActivePreferencePlayerId: (id: string | null) => void;
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
  remotePlayerIds?: Set<string>;
}

export default function WhaleBucketPreferenceCircle({
  players,
  allowTravelers,
  isLightModeActive,
  setActivePreferencePlayerId,
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
  remotePlayerIds,
}: WhaleBucketPreferenceCircleProps) {
  const { boardRef, boardClass, btnStyle, nameStyle, positions, getDynamicFontSize } = useGrimoireLayout(players.length);
  const totalTeams = allowTravelers ? 5 : 4;

  return (
    <div className="w-full flex flex-col items-center">
      <div
        ref={boardRef}
        className={cn(
          "relative border shadow-inner overflow-visible mx-auto",
          isLightModeActive
            ? "bg-[rgb(245_243_235)] border-[#d4d4d8] shadow-gray-200/50"
            : "bg-[#141416] border-[#27272a] shadow-black/45",
          boardClass
        )}
        style={{ containerType: 'size' }}
      >
        {players.map((p, index) => {
          const pos = positions[index] ?? { left: 50, top: 50 };
          const isDropTarget = dragOverIndex === index && draggedIndex !== index;
          const prefs = p.preferences || { townsfolk: [], outsider: [], minion: [], demon: [], traveler: [] };
          const filledCount = [
            prefs.townsfolk,
            prefs.outsider,
            prefs.minion,
            prefs.demon,
            ...(allowTravelers ? [prefs.traveler || []] : []),
          ].filter(arr => arr.length > 0).length;

          return (
            <div
              key={p.id}
              data-drag-index={index}
              draggable={true}
              onMouseDown={handleMouseDown}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                position: 'absolute',
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: draggedIndex === index ? 40 : isDropTarget ? 35 : 10,
              }}
              className={cn(
                "drag-handle cursor-grab active:cursor-grabbing touch-none transition-all duration-200",
                draggedIndex === index && "opacity-30 scale-95",
                isDropTarget && "scale-110"
              )}
            >
              <button
                type="button"
                id={`edit-preferences-button-${p.id}`}
                onClick={() => setActivePreferencePlayerId(p.id)}
                style={btnStyle}
                className={cn(
                  "rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-md relative select-none hover:bg-[#fafafa]",
                  isDropTarget && "ring-4 ring-clocktower-blood shadow-[0_0_16px_rgba(139,0,0,0.5)]"
                )}
                title="Edit preferences"
              >
                <CharacterToken role={null} idPrefix={p.id} className="absolute inset-0" />

                <span
                  style={{
                    ...nameStyle,
                    fontSize: getDynamicFontSize(p.name),
                    textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 -1px 2px rgba(0,0,0,0.9), 1px 0 2px rgba(0,0,0,0.9), -1px 0 2px rgba(0,0,0,0.9)',
                  }}
                  className="font-bold font-sans tracking-tighter text-center leading-[1.05] z-20 relative select-none max-w-[82%] inline-flex items-center justify-center gap-1 align-middle text-white"
                >
                  {remotePlayerIds?.has(p.id) && (
                    <Wifi size={10} className="shrink-0" strokeWidth={3} />
                  )}
                  <span className="break-words whitespace-normal">{p.name}</span>
                </span>

                <span
                  className={cn(
                    "absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-30 px-1.5 py-0.5 rounded text-[9px] font-black border shadow-sm leading-none whitespace-nowrap",
                    filledCount === 0 && "bg-gray-800 border-gray-700 text-gray-400",
                    filledCount > 0 && filledCount < totalTeams && "bg-amber-600 border-amber-700 text-black",
                    filledCount === totalTeams && "bg-clocktower-townsfolk border-clocktower-townsfolk/40 text-white"
                  )}
                >
                  {filledCount}/{totalTeams} PREFS
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
