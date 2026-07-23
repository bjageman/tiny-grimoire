import React from 'react';
import { cn } from '../../utils/cn';
import type { Player } from '../../types';
import CharacterToken from '../shared/CharacterToken';
import { useGrimoireLayout } from '../../hooks/useGrimoireLayout';

interface PlayerTrackerCircleProps {
  players: Player[];
  isLightModeActive: boolean;
  isSynced: boolean;
  setActiveTrackerPlayerId: (id: string | null) => void;
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
}

export default function PlayerTrackerCircle({
  players,
  isLightModeActive,
  isSynced,
  setActiveTrackerPlayerId,
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
}: PlayerTrackerCircleProps) {
  const { boardRef, boardClass, btnStyle, nameStyle, positions, getDynamicFontSize } = useGrimoireLayout(players.length);

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
          const isDropTarget = !isSynced && dragOverIndex === index && draggedIndex !== index;

          return (
            <div
              key={p.id}
              data-drag-index={index}
              draggable={!isSynced}
              onMouseDown={isSynced ? undefined : handleMouseDown}
              onDragStart={isSynced ? undefined : (e) => handleDragStart(e, index)}
              onDragOver={isSynced ? undefined : (e) => handleDragOver(e, index)}
              onDragLeave={isSynced ? undefined : handleDragLeave}
              onDrop={isSynced ? undefined : (e) => handleDrop(e, index)}
              onDragEnd={isSynced ? undefined : handleDragEnd}
              onTouchStart={isSynced ? undefined : (e) => handleTouchStart(e, index)}
              onTouchMove={isSynced ? undefined : handleTouchMove}
              onTouchEnd={isSynced ? undefined : handleTouchEnd}
              style={{
                position: 'absolute',
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: draggedIndex === index ? 40 : isDropTarget ? 35 : 10,
              }}
              className={cn(
                "transition-all duration-200",
                !isSynced && "drag-handle cursor-grab active:cursor-grabbing touch-none",
                draggedIndex === index && "opacity-30 scale-95",
                isDropTarget && "scale-110"
              )}
            >
              <button
                type="button"
                id={`edit-tracker-player-button-${p.id}`}
                onClick={isSynced ? undefined : () => setActiveTrackerPlayerId(p.id)}
                style={btnStyle}
                className={cn(
                  "rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-md relative select-none",
                  isSynced ? "cursor-default" : "hover:bg-[#fafafa]",
                  isDropTarget && "ring-4 ring-clocktower-blood shadow-[0_0_16px_rgba(139,0,0,0.5)]"
                )}
                title={isSynced ? p.name : "Edit player"}
              >
                <CharacterToken role={null} idPrefix={p.id} className="absolute inset-0" />

                <span
                  style={{
                    ...nameStyle,
                    fontSize: getDynamicFontSize(p.name),
                    textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 -1px 2px rgba(0,0,0,0.9), 1px 0 2px rgba(0,0,0,0.9), -1px 0 2px rgba(0,0,0,0.9)',
                  }}
                  className="font-bold font-sans tracking-tighter text-center leading-[1.05] z-20 relative select-none break-words whitespace-normal max-w-[82%] inline-block align-middle text-white"
                >
                  {p.name}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
