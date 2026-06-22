import { useMemo, useState } from 'react';
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
  const [hoveredOrder, setHoveredOrder] = useState<string[]>([]);

  const teamFill = (team: Role['team']) => ({
    townsfolk: 'fill-clocktower-townsfolk',
    outsider: 'fill-clocktower-outsider',
    minion: 'fill-clocktower-minion',
    demon: 'fill-clocktower-demon',
    traveler: 'fill-clocktower-traveler',
  }[team] ?? 'fill-gray-500');

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
          style={grimoireConfig.centerText2Style}
          className="font-bold font-mono uppercase tracking-wide"
        >
          {timeOfDay} {dayNumber}
        </span>
        <span
          style={grimoireConfig.centerText2Style}
          className="font-semibold font-sans uppercase tracking-widest mt-0.5 opacity-80"
        >
          {players.filter(p => !p.isDead).length} Alive
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

        // Calculate dynamic font size and split name by space to prevent overflow
        const baseFontSizeVal = parseFloat(grimoireConfig.nameStyle.fontSize as string);
        const baseFontSizeUnit = (grimoireConfig.nameStyle.fontSize as string).replace(/[0-9.]/g, '');
        const nameLength = p.name.length;
        const longestWordLength = Math.max(...p.name.split(' ').map(w => w.length));

        let scaleFactor = 1.0;
        
        // Shrink based on the longest word
        if (longestWordLength > 12) scaleFactor = 0.55;
        else if (longestWordLength > 10) scaleFactor = 0.65;
        else if (longestWordLength > 8) scaleFactor = 0.75;
        else if (longestWordLength > 6) scaleFactor = 0.86;
        
        // Shrink based on total length
        if (nameLength > 18) scaleFactor = Math.min(scaleFactor, 0.55);
        else if (nameLength > 14) scaleFactor = Math.min(scaleFactor, 0.65);
        else if (nameLength > 10) scaleFactor = Math.min(scaleFactor, 0.78);
        else if (nameLength > 8) scaleFactor = Math.min(scaleFactor, 0.9);

        const dynamicFontSize = `${baseFontSizeVal * scaleFactor}${baseFontSizeUnit}`;

        const orderIndex = hoveredOrder.indexOf(p.id);
        const zIndex = orderIndex !== -1 ? 10 + orderIndex : 10;

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${leftPos}%`,
              top: `${topPos}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: zIndex,
            }}
            onMouseEnter={() => {
              setHoveredOrder((prev) => {
                const filtered = prev.filter((id) => id !== p.id);
                return [...filtered, p.id];
              });
            }}
            className="hover:z-50 group"
          >
            <div className="relative flex flex-col items-center">
              <button
                id={`grimoire-player-${p.id}`}
                onClick={() => onSelectPlayer(p.id)}
                style={grimoireConfig.btnStyle}
                className={cn(
                  "rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-md relative group-hover:scale-125 group-hover:shadow-lg select-none",
                  p.isDead ? "scale-95" : "hover:bg-[#fafafa]"
                )}
              >
                {/* SVG representing the token */}
                <svg viewBox="0 0 200 200" className={cn("w-full h-full absolute inset-0 z-0 select-none pointer-events-none", p.isDead && "opacity-60")}>
                  <defs>
                    <path id={`topTextPath-${p.id}`} d="M 32,100 A 68,68 0 0,1 168,100" fill="none" />
                    <path id={`bottomTextPath-${p.id}`} d="M 168,100 A 68,68 0 0,1 32,100" fill="none" />
                  </defs>
                  
                  {/* Token background circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill={p.isDead ? "#e4e4e7" : "#ffffff"}
                    className={cn(
                      "stroke-[6px]",
                      isEvil ? "stroke-clocktower-minion" : "stroke-clocktower-townsfolk"
                    )}
                  />
                  
                  {/* Inner ring */}
                  <circle
                    cx="100"
                    cy="100"
                    r="58"
                    fill="none"
                    stroke="#e4e4e7"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  
                  {roleObj && (
                    <>
                      {/* Curved Character Name */}
                      <text className={cn("font-bold text-[18px] tracking-wider uppercase", teamFill(roleObj.team))}>
                        <textPath href={`#topTextPath-${p.id}`} startOffset="50%" textAnchor="middle">
                          {roleObj.name}
                        </textPath>
                      </text>
                      
                      {/* Curved Character Type */}
                      <text className={cn("font-bold text-[11px] tracking-widest uppercase", teamFill(roleObj.team))}>
                        <textPath href={`#bottomTextPath-${p.id}`} startOffset="50%" textAnchor="middle">
                          {roleObj.team}
                        </textPath>
                      </text>
                    </>
                  )}
                </svg>

                {/* Centered character icon */}
                {roleObj && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none select-none">
                    <div className="w-[50%] h-[50%] flex items-center justify-center">
                      <img
                        src={`/icons/${roleObj.id}.svg`}
                        alt={roleObj.name}
                        className={cn(
                          "w-full h-full object-contain transition-all duration-200 select-none",
                          p.isDead ? "grayscale opacity-15" : "opacity-35"
                        )}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  </div>
                )}

                {/* Player Name Overlay */}
                <span
                  style={{
                    ...grimoireConfig.nameStyle,
                    fontSize: dynamicFontSize,
                    textShadow: p.isDead
                      ? 'none'
                      : '0 1.5px 3px rgba(255,255,255,1.0), 0 0 5px rgba(255,255,255,1.0), 0 0 8px rgba(255,255,255,0.9)'
                  }}
                  className={cn(
                    "font-bold font-sans tracking-tighter text-center leading-[1.05] z-20 relative pointer-events-none select-none break-words whitespace-normal max-w-[82%] inline-block align-middle",
                    p.isDead ? "line-through text-[#1a1a1a] opacity-75" : "text-[#1a1a1a] font-bold"
                  )}
                >
                  {p.name}
                </span>

                {p.isTheDrunk && (
                  <span
                    style={{ fontSize: '1.9cqw', padding: '0.3cqw 1cqw', borderRadius: '0.4cqw', borderWidth: '0.15cqw' }}
                    className="absolute bottom-0 bg-yellow-600 text-black font-black border-yellow-700 shadow-sm leading-none translate-y-1/2 z-30 whitespace-nowrap"
                  >
                    THE DRUNK
                  </span>
                )}
                {p.isTheMarionette && (
                  <span
                    style={{ fontSize: '1.9cqw', padding: '0.3cqw 1cqw', borderRadius: '0.4cqw', borderWidth: '0.15cqw' }}
                    className="absolute bottom-0 bg-clocktower-minion text-white font-black border-clocktower-minion/40 shadow-sm leading-none translate-y-1/2 z-30 whitespace-nowrap"
                  >
                    THE MARIONETTE
                  </span>
                )}
                {p.isTheLunatic && (
                  <span
                    style={{ fontSize: '1.9cqw', padding: '0.3cqw 1cqw', borderRadius: '0.4cqw', borderWidth: '0.15cqw' }}
                    className="absolute bottom-0 bg-clocktower-outsider text-white font-black border-clocktower-outsider/40 shadow-sm leading-none translate-y-1/2 z-30 whitespace-nowrap"
                  >
                    THE LUNATIC
                  </span>
                )}
                {p.isTheLilMonsta && (
                  <span
                    style={{ fontSize: '1.9cqw', padding: '0.3cqw 1cqw', borderRadius: '0.4cqw', borderWidth: '0.15cqw' }}
                    className="absolute bottom-0 bg-clocktower-demon text-white font-black border-clocktower-demon/40 shadow-sm leading-none translate-y-1/2 z-30 whitespace-nowrap"
                  >
                    LIL' MONSTA
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
                {p.isDead && p.hasDeadVote && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '25%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '4.0cqw',
                      lineHeight: 1,
                      zIndex: 30,
                    }}
                    title="Vote Token Active"
                  >
                    🗳️
                  </div>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
