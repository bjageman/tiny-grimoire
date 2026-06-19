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
          ? "bg-white/50 border-gray-300 shadow-gray-200/50"
          : "bg-gray-950/40 border-gray-900/60 shadow-black/45",
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
            ? "bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100/70"
            : "bg-clocktower-night/50 border-clocktower-blood/20 text-clocktower-parchment hover:bg-clocktower-blood/10"
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
                  "rounded-full border-2 flex flex-col items-center justify-center transition-all shadow-md relative",
                  timeOfDay === 'day'
                    ? p.isDead
                      ? "bg-gray-200 border-gray-300 text-gray-400 scale-95 opacity-50"
                      : "bg-white border-gray-300 text-clocktower-night hover:border-gray-400 hover:bg-gray-50"
                    : p.isDead
                      ? "bg-black border-gray-800 text-gray-655 scale-95 opacity-50"
                      : "bg-gray-900 border-gray-700 text-clocktower-parchment hover:border-gray-500"
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

                <span
                  style={grimoireConfig.nameStyle}
                  className={cn(
                    "font-bold font-sans tracking-tighter truncate text-center leading-tight",
                    p.isDead && "line-through",
                    timeOfDay === 'day'
                      ? p.isDead
                        ? "text-gray-400"
                        : "text-clocktower-night font-bold"
                      : p.isDead
                        ? "text-gray-700"
                        : "text-clocktower-parchment"
                  )}
                >
                  {p.name.substring(0, grimoireConfig.charLimit)}
                </span>

                <span
                  style={grimoireConfig.roleStyle}
                  className={cn(
                    "font-semibold truncate leading-none text-gray-400 px-0.5 text-center",
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
                  <span className="absolute bottom-0 bg-yellow-600 text-black text-[7px] font-black px-1 rounded-sm border border-yellow-700 shadow-sm leading-tight translate-y-1/2 z-20">
                    THE DRUNK
                  </span>
                )}
                {p.isTheMarionette && (
                  <span className="absolute bottom-0 bg-clocktower-minion text-white text-[7px] font-black px-1 rounded-sm border border-clocktower-minion/40 shadow-sm leading-tight translate-y-1/2 z-20">
                    THE MARIONETTE
                  </span>
                )}
              </button>

              <div
                className={cn(
                  "absolute scale-0 group-hover:scale-100 bg-gray-900/95 border border-gray-800 p-2 rounded text-center shadow-xl transition-all z-50 pointer-events-none min-w-[100px]",
                  grimoireConfig.tooltipClass
                )}
              >
                <p className="font-bold text-xs text-white">{p.name}</p>
                <p
                  className={cn(
                    "text-[10px] font-medium",
                    roleObj?.team === 'townsfolk' && "text-clocktower-townsfolk",
                    roleObj?.team === 'outsider' && "text-clocktower-outsider",
                    roleObj?.team === 'minion' && "text-clocktower-minion",
                    roleObj?.team === 'demon' && "text-clocktower-demon",
                    roleObj?.team === 'traveler' && "text-clocktower-traveler"
                  )}
                >
                  {roleObj?.name || 'No Role Assigned'}
                </p>
                <p className="text-[8px] text-gray-500 italic mt-0.5">
                  {p.isDead ? 'Dead' : 'Alive'} {p.isTheDrunk ? '(The Drunk)' : ''}{' '}
                  {p.isTheMarionette ? '(The Marionette)' : ''}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
