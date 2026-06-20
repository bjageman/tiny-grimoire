import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { Player, Role } from '../types';
import { cn } from '../utils/cn';

interface GrimoireBoardProps {
  players: Player[];
  timeOfDay: 'night' | 'day';
  dayNumber: number;
  toggleTimeOfDay: () => void;
  onSelectPlayer: (playerId: string) => void;
  rolesData: Role[];
}

export default function GrimoireBoard({
  players,
  timeOfDay,
  dayNumber,
  toggleTimeOfDay,
  onSelectPlayer,
  rolesData,
}: GrimoireBoardProps) {
  const grimoireConfig = useMemo(() => {
    const count = players.length;
    if (count <= 6) {
      return {
        boardClass: "w-[88vw] h-[84vw] max-w-[560px] max-h-[620px] md:max-h-[500px] landscape:max-h-[500px] rounded-[28px]",
        radiusX: 38,
        radiusY: 36,
        btnStyle: { width: '25cqw', height: '25cqw' } as CSSProperties,
        dotStyle: { top: '6%', width: '1.8cqw', height: '1.8cqw' } as CSSProperties,
        nameStyle: { fontSize: '4.2cqw', maxWidth: '23cqw', marginTop: '0.5cqw' } as CSSProperties,
        roleStyle: { fontSize: '3.3cqw', maxWidth: '23cqw', marginTop: '0cqw' } as CSSProperties,
        charLimit: 16,
        tooltipClass: "top-18",
        centerBtnStyle: { width: '25cqw', height: '25cqw' } as CSSProperties,
        centerText1Style: { fontSize: '3.5cqw' } as CSSProperties,
        centerText2Style: { fontSize: '2.8cqw', marginTop: '0.1cqw' } as CSSProperties,
      };
    } else if (count <= 10) {
      return {
        boardClass: "w-[90vw] h-[86vw] max-w-[620px] max-h-[680px] md:max-h-[500px] landscape:max-h-[500px] rounded-[34px]",
        radiusX: 40,
        radiusY: 37,
        btnStyle: { width: '21cqw', height: '21cqw' } as CSSProperties,
        dotStyle: { top: '6%', width: '1.5cqw', height: '1.5cqw' } as CSSProperties,
        nameStyle: { fontSize: '3.6cqw', maxWidth: '19cqw', marginTop: '0.4cqw' } as CSSProperties,
        roleStyle: { fontSize: '2.8cqw', maxWidth: '19cqw', marginTop: '0cqw' } as CSSProperties,
        charLimit: 14,
        tooltipClass: "top-16",
        centerBtnStyle: { width: '21cqw', height: '21cqw' } as CSSProperties,
        centerText1Style: { fontSize: '2.9cqw' } as CSSProperties,
        centerText2Style: { fontSize: '2.3cqw', marginTop: '0.1cqw' } as CSSProperties,
      };
    } else {
      return {
        boardClass: "w-[92vw] h-[88vw] max-w-[680px] max-h-[740px] md:max-h-[500px] landscape:max-h-[500px] rounded-[40px]",
        radiusX: 42,
        radiusY: 38,
        btnStyle: { width: '16.5cqw', height: '16.5cqw' } as CSSProperties,
        dotStyle: { top: '6%', width: '1.2cqw', height: '1.2cqw' } as CSSProperties,
        nameStyle: { fontSize: '3.0cqw', maxWidth: '15cqw', marginTop: '0.3cqw' } as CSSProperties,
        roleStyle: { fontSize: '2.3cqw', maxWidth: '15cqw', marginTop: '0cqw' } as CSSProperties,
        charLimit: 12,
        tooltipClass: "top-14",
        centerBtnStyle: { width: '17cqw', height: '17cqw' } as CSSProperties,
        centerText1Style: { fontSize: '2.4cqw' } as CSSProperties,
        centerText2Style: { fontSize: '1.9cqw', marginTop: '0.1cqw' } as CSSProperties,
      };
    }
  }, [players.length]);

  return (
    <div
      id="grimoire-circle-board"
      className={cn(
        "relative border shadow-inner flex items-center justify-center overflow-visible my-4 mx-auto transition-colors duration-300",
        timeOfDay === 'day'
          ? "bg-[#f5f3eb] border-[#d4d4d8] shadow-gray-200/50"
          : "bg-[#141416] border-[#27272a] shadow-black/45",
        grimoireConfig.boardClass
      )}
      style={{ containerType: 'size' }}
    >
      <button
        id="grimoire-time-toggle-button"
        onClick={toggleTimeOfDay}
        style={grimoireConfig.centerBtnStyle}
        className={cn(
          "absolute rounded-full border flex flex-col items-center justify-center transition-all cursor-pointer z-20 select-none shadow-md",
          timeOfDay === 'day'
            ? "bg-[#fefce8] border-[#fef08a] text-[#854d0e] hover:bg-[#fef9c3]"
            : "bg-[#1a1a1a]/80 border-[#8b0000]/30 text-[#f4e4bc] hover:bg-[#27272a]"
        )}
        title="Click to toggle Day/Night"
      >
        <span
          style={grimoireConfig.centerText1Style}
          className={cn(
            "font-serif tracking-widest font-bold transition-colors",
            timeOfDay === 'day' ? "text-yellow-600" : "text-clocktower-blood/60"
          )}
        >
          BOTC
        </span>
        <span
          style={grimoireConfig.centerText2Style}
          className="font-bold font-mono uppercase tracking-wide"
        >
          {timeOfDay} {dayNumber}
        </span>
      </button>

      {players.map((p, index) => {
        const total = players.length;
        const angle = (index * (360 / total) - 90) * (Math.PI / 180);

        const leftPos = 50 + grimoireConfig.radiusX * Math.cos(angle);
        const topPos = 50 + grimoireConfig.radiusY * Math.sin(angle);

        const roleObj = rolesData.find((r) => r.id === p.roleId);
        const defaultEvil = roleObj ? (roleObj.team === 'minion' || roleObj.team === 'demon') : false;
        const isEvil = p.isEvil !== undefined ? p.isEvil : defaultEvil;

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${leftPos}%`,
              top: `${topPos}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="z-10 hover:z-50 group"
          >
            <div className="relative flex flex-col items-center">
              <button
                id={`grimoire-player-${p.id}`}
                onClick={() => onSelectPlayer(p.id)}
                style={grimoireConfig.btnStyle}
                className={cn(
                  "rounded-full border-2 flex flex-col items-center justify-center transition-all duration-200 shadow-md relative group-hover:scale-125 group-hover:shadow-lg",
                  p.isDead
                    ? "bg-[#e4e4e7] text-[#71717a] scale-95 opacity-60"
                    : "bg-[#ffffff] text-[#1a1a1a] hover:bg-[#fafafa]",
                  isEvil
                    ? "border-clocktower-minion/80 hover:border-clocktower-minion"
                    : "border-clocktower-townsfolk/80 hover:border-clocktower-townsfolk"
                )}
              >
                <div
                  style={grimoireConfig.dotStyle}
                  className={cn(
                    "absolute rounded-full shadow-xs",
                    roleObj?.team === 'townsfolk' && "bg-clocktower-townsfolk",
                    roleObj?.team === 'outsider' && "bg-clocktower-outsider",
                    roleObj?.team === 'minion' && "bg-clocktower-minion",
                    roleObj?.team === 'demon' && "bg-clocktower-demon",
                    roleObj?.team === 'traveler' && "bg-clocktower-traveler"
                  )}
                />

                {roleObj && (
                  <img
                    src={`/icons/${roleObj.id}.svg`}
                    alt={roleObj.name}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      padding: '4%',
                      opacity: p.isDead ? 0.08 : 0.18,
                      pointerEvents: 'none',
                    }}
                    className={cn(
                      "select-none transition-all duration-200 z-0 group-hover:scale-105",
                      p.isDead && "grayscale"
                    )}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}

                <span
                  style={{
                    ...grimoireConfig.nameStyle,
                    textShadow: '0 1px 2px rgba(255,255,255,0.95), 0 0 3px rgba(255,255,255,0.9)'
                  }}
                  className={cn(
                    "font-bold font-sans tracking-tighter truncate text-center leading-tight z-10 relative",
                    p.isDead ? "line-through text-[#71717a]" : "text-[#1a1a1a] font-bold"
                  )}
                >
                  {p.name.substring(0, grimoireConfig.charLimit)}
                </span>

                <span
                  style={{
                    ...grimoireConfig.roleStyle,
                    textShadow: '0 1px 2px rgba(255,255,255,0.95), 0 0 3px rgba(255,255,255,0.9)'
                  }}
                  className={cn(
                    "font-semibold truncate leading-none text-gray-400 px-0.5 text-center z-10 relative",
                    roleObj?.team === 'townsfolk' && "text-clocktower-townsfolk/85",
                    roleObj?.team === 'outsider' && "text-clocktower-outsider/85",
                    roleObj?.team === 'minion' && "text-clocktower-minion/85",
                    roleObj?.team === 'demon' && "text-clocktower-demon/85",
                    roleObj?.team === 'traveler' && "text-clocktower-traveler/85",
                    p.isDead && "line-through opacity-50"
                  )}
                >
                  {roleObj?.name.substring(0, grimoireConfig.charLimit)}
                </span>
                {p.isTheDrunk && (
                  <span
                    style={{ fontSize: '1.9cqw', padding: '0.3cqw 1cqw', borderRadius: '0.4cqw', borderWidth: '0.15cqw' }}
                    className="absolute bottom-0 bg-yellow-600 text-black font-black border-yellow-700 shadow-sm leading-none translate-y-1/2 z-20 whitespace-nowrap"
                  >
                    THE DRUNK
                  </span>
                )}
                {p.isTheMarionette && (
                  <span
                    style={{ fontSize: '1.9cqw', padding: '0.3cqw 1cqw', borderRadius: '0.4cqw', borderWidth: '0.15cqw' }}
                    className="absolute bottom-0 bg-clocktower-minion text-white font-black border-clocktower-minion/40 shadow-sm leading-none translate-y-1/2 z-20 whitespace-nowrap"
                  >
                    THE MARIONETTE
                  </span>
                )}
                {p.isTheLunatic && (
                  <span
                    style={{ fontSize: '1.9cqw', padding: '0.3cqw 1cqw', borderRadius: '0.4cqw', borderWidth: '0.15cqw' }}
                    className="absolute bottom-0 bg-clocktower-outsider text-white font-black border-clocktower-outsider/40 shadow-sm leading-none translate-y-1/2 z-20 whitespace-nowrap"
                  >
                    THE LUNATIC
                  </span>
                )}
                {p.isDrunkOrPoisoned && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '14%',
                      right: '14%',
                      fontSize: '4.0cqw',
                      lineHeight: 1,
                      zIndex: 30,
                    }}
                    title="Drunk/Poisoned"
                  >
                    🤢
                  </div>
                )}
                {(() => {
                  const defaultEvil = roleObj ? (roleObj.team === 'minion' || roleObj.team === 'demon') : false;
                  const isEvil = p.isEvil !== undefined ? p.isEvil : defaultEvil;
                  const isAlignmentShifted = p.isEvil !== undefined && p.isEvil !== defaultEvil;
                  if (!isAlignmentShifted) return null;
                  return (
                    <div
                      style={{
                        position: 'absolute',
                        top: '14%',
                        left: '14%',
                        fontSize: '4.0cqw',
                        lineHeight: 1,
                        zIndex: 30,
                      }}
                      title={isEvil ? "Secretly Evil" : "Secretly Good"}
                    >
                      {isEvil ? '👿' : '😇'}
                    </div>
                  );
                })()}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
