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
  hoverSide: 'before' | 'after' | null;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number, side: 'before' | 'after') => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;
  handleTouchStart: (e: React.TouchEvent, index: number) => void;
  handleTouchMove: (e: React.TouchEvent, getTouchSide?: (clientX: number, clientY: number, targetIndex: number) => 'before' | 'after') => void;
  handleTouchEnd: () => void;
}

export default function PlayerTrackerCircle({
  players,
  isLightModeActive,
  isSynced,
  setActiveTrackerPlayerId,
  draggedIndex,
  dragOverIndex,
  hoverSide,
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

          let rotateDeg = 0;
          if (isDropTarget && hoverSide) {
            const n = players.length;
            const neighborIdx = hoverSide === 'before' ? (index - 1 + n) % n : (index + 1) % n;
            const neighborPos = positions[neighborIdx];
            if (neighborPos) {
              const dy = neighborPos.top - pos.top;
              const dx = neighborPos.left - pos.left;
              const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
              rotateDeg = angleDeg - 180;
            }
          }

          return (
            <div
              key={p.id}
              data-drag-index={index}
              draggable={!isSynced}
              onMouseDown={isSynced ? undefined : handleMouseDown}
              onDragStart={isSynced ? undefined : (e) => handleDragStart(e, index)}
              onDragOver={isSynced ? undefined : (e) => {
                e.preventDefault();
                const boardElement = boardRef.current;
                if (!boardElement) return;
                const boardRect = boardElement.getBoundingClientRect();
                const cursorX = ((e.clientX - boardRect.left) / boardRect.width) * 100;
                const cursorY = ((e.clientY - boardRect.top) / boardRect.height) * 100;
                
                const n = players.length;
                const prevIdx = (index - 1 + n) % n;
                const nextIdx = (index + 1) % n;
                const prevPos = positions[prevIdx];
                const nextPos = positions[nextIdx];
                
                if (prevPos && nextPos) {
                  const dPrev = Math.pow(cursorX - prevPos.left, 2) + Math.pow(cursorY - prevPos.top, 2);
                  const dNext = Math.pow(cursorX - nextPos.left, 2) + Math.pow(cursorY - nextPos.top, 2);
                  const side = dPrev < dNext ? 'before' : 'after';
                  handleDragOver(e, index, side);
                }
              }}
              onDragLeave={isSynced ? undefined : handleDragLeave}
              onDrop={isSynced ? undefined : (e) => handleDrop(e, index)}
              onDragEnd={isSynced ? undefined : handleDragEnd}
              onTouchStart={isSynced ? undefined : (e) => handleTouchStart(e, index)}
              onTouchMove={isSynced ? undefined : (e) => {
                handleTouchMove(e, (clientX, clientY, targetIdx) => {
                  const boardElement = boardRef.current;
                  if (!boardElement) return 'before';
                  const boardRect = boardElement.getBoundingClientRect();
                  const cursorX = ((clientX - boardRect.left) / boardRect.width) * 100;
                  const cursorY = ((clientY - boardRect.top) / boardRect.height) * 100;
                  
                  const n = players.length;
                  const prevIdx = (targetIdx - 1 + n) % n;
                  const nextIdx = (targetIdx + 1) % n;
                  const prevPos = positions[prevIdx];
                  const nextPos = positions[nextIdx];
                  
                  if (prevPos && nextPos) {
                    const dPrev = Math.pow(cursorX - prevPos.left, 2) + Math.pow(cursorY - prevPos.top, 2);
                    const dNext = Math.pow(cursorX - nextPos.left, 2) + Math.pow(cursorY - nextPos.top, 2);
                    return dPrev < dNext ? 'before' : 'after';
                  }
                  return 'before';
                });
              }}
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
                  isSynced ? "cursor-default" : "hover:bg-[#fafafa]"
                )}
                title={isSynced ? p.name : "Edit player"}
              >
                {isDropTarget && hoverSide && (
                  <div
                    className="absolute -inset-1 border-[4px] border-transparent border-l-red-500 rounded-full z-30 pointer-events-none"
                    style={{
                      transform: `rotate(${rotateDeg}deg)`,
                      filter: 'drop-shadow(0 0 3px rgba(239, 68, 68, 0.8))'
                    }}
                  />
                )}
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
