import React from 'react';
import { Wifi } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Player, Role } from '../../types';
import rolesData from '../../roles.json';
import CharacterToken from '../shared/CharacterToken';
import { useGrimoireLayout } from '../../hooks/useGrimoireLayout';

interface CharacterAssignmentCircleProps {
  players: Player[];
  isLightModeActive: boolean;
  setActivePlayerId: (id: string | null) => void;
  setSearchTerm: (term: string) => void;
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
  selectionRoles?: Role[];
}

export default function CharacterAssignmentCircle({
  players,
  isLightModeActive,
  setActivePlayerId,
  setSearchTerm,
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
  selectionRoles,
}: CharacterAssignmentCircleProps) {
  const { boardRef, boardClass, btnStyle, nameStyle, positions, getDynamicFontSize } = useGrimoireLayout(players.length);

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
          const pos = positions[index] ?? { left: 50, top: 50 };
          const roleObj = (selectionRoles ?? (rolesData as Role[])).find(r => r.id === p.roleId);
          const defaultEvil = roleObj ? (roleObj.team === 'minion' || roleObj.team === 'demon') : false;
          const isEvil = p.isTheLunatic ? false : p.isTheMarionette ? true : defaultEvil;
          const isDropTarget = dragOverIndex === index && draggedIndex !== index;

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
                zIndex: draggedIndex === index ? 40 : dragOverIndex === index ? 35 : 10,
              }}
              className={cn(
                "drag-handle cursor-grab active:cursor-grabbing touch-none transition-all duration-200",
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
                  "rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-md relative select-none hover:bg-[#fafafa]",
                  isDropTarget && "ring-4 ring-clocktower-blood shadow-[0_0_16px_rgba(139,0,0,0.5)]"
                )}
                title="Edit player"
              >
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
      </div>
    </div>
  );
}
