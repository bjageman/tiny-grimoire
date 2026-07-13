import React, { useEffect, useState } from 'react';
import { Wifi, RotateCcw, RotateCw } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Player, Role } from '../../types';
import rolesData from '../../roles.json';
import CharacterToken from '../shared/CharacterToken';
import { useGrimoireLayout } from '../../hooks/useGrimoireLayout';

interface CharacterAssignmentCircleProps {
  players: Player[];
  rotationOffset?: number;
  onRotationChange?: (offset: number) => void;
  isLightModeActive: boolean;
  setActivePlayerId: (id: string | null) => void;
  setSearchTerm: (term: string) => void;
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
  remotePlayerIds?: Set<string>;
  selectionRoles?: Role[];
}

export default function CharacterAssignmentCircle({
  players,
  rotationOffset = 0,
  onRotationChange,
  isLightModeActive,
  setActivePlayerId,
  setSearchTerm,
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
  remotePlayerIds,
  selectionRoles,
}: CharacterAssignmentCircleProps) {
  const { boardRef, isMeasured, boardClass, btnStyle, nameStyle, positions, getDynamicFontSize } = useGrimoireLayout(players.length);

  const [seatsReady, setSeatsReady] = useState(false);
  useEffect(() => {
    if (!isMeasured || seatsReady) return;
    const frame = requestAnimationFrame(() => setSeatsReady(true));
    return () => cancelAnimationFrame(frame);
  }, [isMeasured, seatsReady]);

  const n = players.length;
  const offset = n > 0 ? ((rotationOffset % n) + n) % n : 0;
  const seatOf = (playerIndex: number) => (n > 0 ? ((playerIndex - offset) % n + n) % n : 0);

  return (
    <div className="w-full flex flex-col items-center">
      <div
        id="character-assignment-board"
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
          const seatIndex = seatOf(index);
          const pos = positions[seatIndex] ?? { left: 50, top: 50 };
          let roleObj = selectionRoles?.find(r => r.id === p.roleId);
          if (!roleObj) {
            roleObj = (rolesData as Role[]).find(r => r.id === p.roleId);
          }
          const defaultEvil = roleObj ? (roleObj.team === 'minion' || roleObj.team === 'demon') : false;
          const isEvil = p.isTheLunatic ? false : p.isTheMarionette ? true : defaultEvil;
          const isDropTarget = dragOverIndex === index && draggedIndex !== index;

          let rotateDeg = 0;
          if (isDropTarget && hoverSide) {
            const neighborSeat = hoverSide === 'before' ? (seatIndex - 1 + n) % n : (seatIndex + 1) % n;
            const neighborPos = positions[neighborSeat];
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
              draggable={true}
              onMouseDown={handleMouseDown}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => {
                e.preventDefault();
                const boardElement = boardRef.current;
                if (!boardElement) return;
                const boardRect = boardElement.getBoundingClientRect();
                const cursorX = ((e.clientX - boardRect.left) / boardRect.width) * 100;
                const cursorY = ((e.clientY - boardRect.top) / boardRect.height) * 100;

                const prevPos = positions[(seatIndex - 1 + n) % n];
                const nextPos = positions[(seatIndex + 1) % n];

                if (prevPos && nextPos) {
                  const dPrev = Math.pow(cursorX - prevPos.left, 2) + Math.pow(cursorY - prevPos.top, 2);
                  const dNext = Math.pow(cursorX - nextPos.left, 2) + Math.pow(cursorY - nextPos.top, 2);
                  const side = dPrev < dNext ? 'before' : 'after';
                  handleDragOver(e, index, side);
                }
              }}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchMove={(e) => {
                handleTouchMove(e, (clientX, clientY, targetIdx) => {
                  const boardElement = boardRef.current;
                  if (!boardElement) return 'before';
                  const boardRect = boardElement.getBoundingClientRect();
                  const cursorX = ((clientX - boardRect.left) / boardRect.width) * 100;
                  const cursorY = ((clientY - boardRect.top) / boardRect.height) * 100;

                  const targetSeat = seatOf(targetIdx);
                  const prevPos = positions[(targetSeat - 1 + n) % n];
                  const nextPos = positions[(targetSeat + 1) % n];

                  if (prevPos && nextPos) {
                    const dPrev = Math.pow(cursorX - prevPos.left, 2) + Math.pow(cursorY - prevPos.top, 2);
                    const dNext = Math.pow(cursorX - nextPos.left, 2) + Math.pow(cursorY - nextPos.top, 2);
                    return dPrev < dNext ? 'before' : 'after';
                  }
                  return 'before';
                });
              }}
              onTouchEnd={handleTouchEnd}
              style={{
                position: 'absolute',
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: draggedIndex === index ? 40 : dragOverIndex === index ? 35 : 10,
                transition: seatsReady
                  ? 'left 250ms ease-in-out, top 250ms ease-in-out, opacity 200ms ease-in-out'
                  : 'none',
              }}
              className={cn(
                "drag-handle cursor-grab active:cursor-grabbing touch-none",
                draggedIndex === index && "opacity-30 scale-95",
                isDropTarget && "scale-110"
              )}
            >
              <button
                type="button"
                id={`edit-player-button-${p.id}`}
                onClick={() => { setActivePlayerId(p.id); setSearchTerm(''); }}
                style={btnStyle}
                className={cn(
                  "rounded-full flex flex-col items-center justify-center shadow-md relative select-none hover:bg-[#fafafa]",
                  seatsReady && "transition-all duration-200"
                )}
                title="Edit player"
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
                <CharacterToken role={roleObj} isEvil={isEvil} idPrefix={p.id} className="absolute inset-0" />

                <span
                  style={{
                    ...nameStyle,
                    fontSize: getDynamicFontSize(p.name),
                    textShadow: roleObj
                      ? '0 1.5px 3px rgba(255,255,255,1.0), 0 0 5px rgba(255,255,255,1.0), 0 0 8px rgba(255,255,255,0.9)'
                      : '0 1px 2px rgba(0,0,0,0.9), 0 -1px 2px rgba(0,0,0,0.9), 1px 0 2px rgba(0,0,0,0.9), -1px 0 2px rgba(0,0,0,0.9)',
                  }}
                  className={cn(
                    "font-bold font-sans tracking-tighter text-center leading-[1.05] z-20 relative select-none max-w-[82%] inline-flex items-center justify-center gap-1 align-middle",
                    roleObj ? "text-[#1a1a1a]" : "text-white"
                  )}
                >
                  {remotePlayerIds?.has(p.id) && (
                    <Wifi size={10} className="shrink-0" strokeWidth={3} />
                  )}
                  <span className="break-words whitespace-normal">{p.name}</span>
                </span>

                {p.pronouns && (
                  <span
                    style={{
                      fontSize: `${parseFloat(getDynamicFontSize(p.name)) * 0.75}${getDynamicFontSize(p.name).replace(/[0-9.]/g, '')}`,
                    }}
                    className="text-[#555] font-medium leading-none select-none z-20 relative"
                  >
                    {p.pronouns}
                  </span>
                )}

                {p.isTheDrunk && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-30 px-1.5 py-0.5 rounded text-[9px] font-black bg-yellow-600 text-black border border-yellow-700 shadow-sm leading-none whitespace-nowrap">
                    DRUNK
                  </span>
                )}
                {p.isTheMarionette && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-30 px-1.5 py-0.5 rounded text-[9px] font-black bg-clocktower-minion text-white border border-clocktower-minion/40 shadow-sm leading-none whitespace-nowrap">
                    MARIONETTE
                  </span>
                )}
                {p.isTheLunatic && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-30 px-1.5 py-0.5 rounded text-[9px] font-black bg-clocktower-outsider text-white border border-clocktower-outsider/40 shadow-sm leading-none whitespace-nowrap">
                    LUNATIC
                  </span>
                )}
                {p.isTheLilMonsta && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-30 px-1.5 py-0.5 rounded text-[9px] font-black bg-clocktower-demon text-white border border-clocktower-demon/40 shadow-sm leading-none whitespace-nowrap">
                    LIL' MONSTA
                  </span>
                )}
              </button>
            </div>
          );
        })}

        {onRotationChange && n > 1 && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                type="button"
                id="setup-rotate-ccw-button"
                onClick={() => onRotationChange(rotationOffset + 1)}
                className={cn(
                  "p-2 rounded-full border transition-all shadow-sm active:scale-95",
                  isLightModeActive
                    ? "bg-white/80 border-gray-300 text-gray-500 hover:text-gray-800 hover:bg-white"
                    : "bg-gray-900/80 border-gray-700 text-gray-500 hover:text-gray-200 hover:bg-gray-800"
                )}
                title="Rotate counter-clockwise"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                id="setup-rotate-cw-button"
                onClick={() => onRotationChange(rotationOffset - 1)}
                className={cn(
                  "p-2 rounded-full border transition-all shadow-sm active:scale-95",
                  isLightModeActive
                    ? "bg-white/80 border-gray-300 text-gray-500 hover:text-gray-800 hover:bg-white"
                    : "bg-gray-900/80 border-gray-700 text-gray-500 hover:text-gray-200 hover:bg-gray-800"
                )}
                title="Rotate clockwise"
              >
                <RotateCw size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
