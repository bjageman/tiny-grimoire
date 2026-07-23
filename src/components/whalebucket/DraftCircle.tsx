import { Star, Wifi } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Player } from '../../WhaleBucket';
import type { Role } from '../../types';
import CharacterToken from '../shared/CharacterToken';
import { useGrimoireLayout } from '../../hooks/useGrimoireLayout';
import rolesData from '../../official_roles.json';

interface WhaleBucketDraftCircleProps {
  players: Player[];
  isLightModeActive: boolean;
  setActiveDraftPlayerId: (id: string | null) => void;
  remotePlayerIds?: Set<string>;
}

export default function WhaleBucketDraftCircle({
  players,
  isLightModeActive,
  setActiveDraftPlayerId,
  remotePlayerIds,
}: WhaleBucketDraftCircleProps) {
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
          const roleObj = (rolesData as Role[]).find(r => r.id === p.roleId);
          const defaultEvil = roleObj ? (roleObj.team === 'minion' || roleObj.team === 'demon') : false;
          const isEvil = p.isTheLunatic ? false : p.isTheMarionette ? true : defaultEvil;

          const dx = 50 - pos.left;
          const dy = 50 - pos.top;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const inwardDx = dist > 0 ? dx / dist : 0;
          const inwardDy = dist > 0 ? dy / dist : -1;
          const starRotation = Math.atan2(inwardDy, inwardDx) * (180 / Math.PI) + 90;

          return (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
              }}
            >
              <button
                type="button"
                id={`edit-draft-player-button-${p.id}`}
                onClick={() => setActiveDraftPlayerId(p.id)}
                style={btnStyle}
                className="rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-md relative select-none hover:bg-[#fafafa]"
                title="Edit player"
              >
                <CharacterToken role={roleObj} isEvil={isEvil} idPrefix={p.id} className="absolute inset-0" />

                {p.assignedFromPref && (
                  <span
                    className="absolute z-30 pointer-events-none"
                    title="Assigned from preference"
                    style={{
                      left: `calc(50% + ${(inwardDx * 60).toFixed(1)}%)`,
                      top: `calc(50% + ${(inwardDy * 60).toFixed(1)}%)`,
                      transform: `translate(-50%, -50%) rotate(${starRotation.toFixed(1)}deg)`,
                    }}
                  >
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                  </span>
                )}

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

              {!roleObj && (
                <span className="absolute left-1/2 -translate-x-1/2 -bottom-4 text-[9px] text-gray-500 whitespace-nowrap pointer-events-none">
                  Tap to select character
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
