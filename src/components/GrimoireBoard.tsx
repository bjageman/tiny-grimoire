import { useMemo, useState, useRef, useEffect } from 'react';
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
  onResetDead?: () => void;
  onResetTime?: () => void;
}

export default function GrimoireBoard({
  players,
  timeOfDay,
  dayNumber,
  toggleTimeOfDay,
  onSelectPlayer,
  rolesData,
  onResetDead,
  onResetTime,
}: GrimoireBoardProps) {
  const [hoveredOrder, setHoveredOrder] = useState<string[]>([]);
  const [playerTopIndex, setPlayerTopIndex] = useState<Record<string, number>>({});
  const [fannedPlayerId, setFannedPlayerId] = useState<string | null>(null);
  const [boardAspect, setBoardAspect] = useState<number>(1.3);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const boardElement = boardRef.current;
    if (!boardElement) return;

    const updateAspect = () => {
      const rect = boardElement.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setBoardAspect(rect.height / rect.width);
      }
    };

    updateAspect();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateAspect);
      return () => {
        window.removeEventListener('resize', updateAspect);
      };
    }

    const observer = new ResizeObserver(() => {
      updateAspect();
    });
    observer.observe(boardElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  const touchStartedFannedRef = useRef<boolean>(false);
  const touchStartTimeRef = useRef<number>(0);

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
        boardClass: "w-[88vw] h-[112vw] max-w-[560px] max-h-[700px] md:max-h-[500px] landscape:max-h-[500px] rounded-[28px]",
        radiusX: 34,
        radiusY: 36,
        btnStyle: { width: '30cqw', height: '30cqw' } as CSSProperties,
        btnClass: "md:max-w-[150px] md:max-h-[150px]",
        dotStyle: { top: '6%', width: '2.0cqw', height: '2.0cqw' } as CSSProperties,
        nameStyle: { fontSize: '4.8cqw', maxWidth: '28cqw', marginTop: '0.5cqw' } as CSSProperties,
        roleStyle: { fontSize: '3.8cqw', maxWidth: '28cqw', marginTop: '0cqw' } as CSSProperties,
        charLimit: 16,
        tooltipClass: "top-18",
        centerBtnStyle: { width: '30cqw', height: '30cqw' } as CSSProperties,
        centerText1Style: { fontSize: '4.8cqw' } as CSSProperties,
        centerText2Style: { fontSize: '3.8cqw', marginTop: '0.2cqw' } as CSSProperties,
      };
    } else if (count <= 10) {
      return {
        boardClass: "w-[90vw] h-[118vw] max-w-[620px] max-h-[760px] md:max-h-[500px] landscape:max-h-[500px] rounded-[34px]",
        radiusX: 36,
        radiusY: 38,
        btnStyle: { width: '26cqw', height: '26cqw' } as CSSProperties,
        btnClass: "md:max-w-[130px] md:max-h-[130px]",
        dotStyle: { top: '6%', width: '1.7cqw', height: '1.7cqw' } as CSSProperties,
        nameStyle: { fontSize: '4.3cqw', maxWidth: '24cqw', marginTop: '0.4cqw' } as CSSProperties,
        roleStyle: { fontSize: '3.4cqw', maxWidth: '24cqw', marginTop: '0cqw' } as CSSProperties,
        charLimit: 14,
        tooltipClass: "top-16",
        centerBtnStyle: { width: '26cqw', height: '26cqw' } as CSSProperties,
        centerText1Style: { fontSize: '4.0cqw' } as CSSProperties,
        centerText2Style: { fontSize: '3.2cqw', marginTop: '0.2cqw' } as CSSProperties,
      };
    } else {
      return {
        boardClass: "w-[92vw] h-[124vw] max-w-[680px] max-h-[820px] md:max-h-[500px] landscape:max-h-[500px] rounded-[40px]",
        radiusX: 38,
        radiusY: 40,
        btnStyle: { width: '21cqw', height: '21cqw' } as CSSProperties,
        btnClass: "md:max-w-[105px] md:max-h-[105px]",
        dotStyle: { top: '6%', width: '1.4cqw', height: '1.4cqw' } as CSSProperties,
        nameStyle: { fontSize: '3.7cqw', maxWidth: '19cqw', marginTop: '0.3cqw' } as CSSProperties,
        roleStyle: { fontSize: '2.8cqw', maxWidth: '19cqw', marginTop: '0cqw' } as CSSProperties,
        charLimit: 12,
        tooltipClass: "top-14",
        centerBtnStyle: { width: '21cqw', height: '21cqw' } as CSSProperties,
        centerText1Style: { fontSize: '3.1cqw' } as CSSProperties,
        centerText2Style: { fontSize: '2.5cqw', marginTop: '0.2cqw' } as CSSProperties,
      };
    }
  }, [players.length]);

  const dynamicRadiusX = useMemo(() => {
    if (boardAspect < 1.15) {
      return grimoireConfig.radiusX * 0.98; // Very slight reduction with smaller tokens
    }
    return grimoireConfig.radiusX;
  }, [grimoireConfig.radiusX, boardAspect]);

  const dynamicRadiusY = useMemo(() => {
    if (boardAspect < 1.15) {
      return grimoireConfig.radiusY * 0.94; // Mild vertical reduction for 10% smaller tokens
    }
    return grimoireConfig.radiusY;
  }, [grimoireConfig.radiusY, boardAspect]);

  const evenAngles = useMemo(() => {
    const total = players.length;
    if (total <= 1) return [0];

    const rx = dynamicRadiusX;
    const ry = dynamicRadiusY * boardAspect;

    const n = 3.6;
    const p = 2 / n;

    const steps = 360;
    const arcLengths = new Float32Array(steps + 1);
    let totalLength = 0;
    arcLengths[0] = 0;

    for (let i = 1; i <= steps; i++) {
      const theta1 = ((i - 1) * (360 / steps)) * (Math.PI / 180);
      const theta2 = (i * (360 / steps)) * (Math.PI / 180);
      const midTheta = (theta1 + theta2) / 2;
      
      const dt = 0.0001;
      const tA = midTheta - dt / 2;
      const tB = midTheta + dt / 2;
      
      const xA = rx * Math.sign(Math.cos(tA)) * Math.pow(Math.abs(Math.cos(tA)), p);
      const yA = ry * Math.sign(Math.sin(tA)) * Math.pow(Math.abs(Math.sin(tA)), p);
      
      const xB = rx * Math.sign(Math.cos(tB)) * Math.pow(Math.abs(Math.cos(tB)), p);
      const yB = ry * Math.sign(Math.sin(tB)) * Math.pow(Math.abs(Math.sin(tB)), p);
      
      const dx = (xB - xA) / dt;
      const dy = (yB - yA) / dt;
      const ds = Math.sqrt(dx * dx + dy * dy) * (2 * Math.PI / steps);
      totalLength += ds;
      arcLengths[i] = totalLength;
    }

    const startIdx = Math.round(steps / 4);
    const startLength = arcLengths[startIdx];

    const angles: number[] = [];
    const targetStep = totalLength / total;

    for (let i = 0; i < total; i++) {
      const targetLength = (startLength + i * targetStep) % totalLength;
      let idx = 0;
      while (idx < steps && arcLengths[idx + 1] < targetLength) {
        idx++;
      }
      const l1 = arcLengths[idx];
      const l2 = arcLengths[idx + 1];
      const fraction = (l2 - l1) > 0 ? (targetLength - l1) / (l2 - l1) : 0;
      const t1 = (idx * (360 / steps)) * (Math.PI / 180);
      const t2 = ((idx + 1) * (360 / steps)) * (Math.PI / 180);
      const angle = t1 + fraction * (t2 - t1);
      angles.push(angle);
    }

    return angles;
  }, [players.length, dynamicRadiusX, dynamicRadiusY, boardAspect]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Mobile Reset Buttons Row */}
      <div className="flex justify-between w-full px-4 md:hidden mb-2 max-w-[450px]">
        {onResetTime ? (
          <button
            onClick={onResetTime}
            className={cn(
              "px-3.5 py-1.5 rounded-md text-[10px] md:text-xs font-bold tracking-wider uppercase transition-all shadow-sm border cursor-pointer select-none",
              timeOfDay === 'day'
                ? "bg-white border-gray-300 text-gray-750 hover:bg-gray-50 active:bg-gray-100"
                : "bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-850 active:bg-gray-800"
            )}
            title="Reset back to Night 1"
          >
            Reset Time
          </button>
        ) : <div />}

        {onResetDead ? (
          <button
            onClick={onResetDead}
            className={cn(
              "px-3.5 py-1.5 rounded-md text-[10px] md:text-xs font-bold tracking-wider uppercase transition-all shadow-sm border cursor-pointer select-none",
              timeOfDay === 'day'
                ? "bg-white border-gray-300 text-gray-750 hover:bg-gray-50 active:bg-gray-100"
                : "bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-850 active:bg-gray-800"
            )}
            title="Mark everyone as alive"
          >
            Reset Dead
          </button>
        ) : <div />}
      </div>

      <div
        id="grimoire-circle-board"
        ref={boardRef}
        className={cn(
          "relative border shadow-inner flex items-center justify-center overflow-visible my-4 mx-auto transition-colors duration-300",
          timeOfDay === 'day'
            ? "bg-[#f5f3eb] border-[#d4d4d8] shadow-gray-200/50"
            : "bg-[#141416] border-[#27272a] shadow-black/45",
          grimoireConfig.boardClass
        )}
        style={{ containerType: 'size' }}
      >
        {onResetTime && (
          <button
            onClick={onResetTime}
            className={cn(
              "hidden md:block absolute top-4 left-4 z-30 px-3.5 py-1.5 rounded-md text-[10px] md:text-xs font-bold tracking-wider uppercase transition-all shadow-sm border cursor-pointer select-none",
              timeOfDay === 'day'
                ? "bg-[#ffffff]/80 border-[#d4d4d8] text-[#3f3f46] hover:bg-[#ffffff] hover:text-[#18181b]"
                : "bg-[#1f1f23]/80 border-[#27272a] text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#f4f4f5]"
            )}
            title="Reset back to Night 1"
          >
            Reset Time
          </button>
        )}

        {onResetDead && (
          <button
            onClick={onResetDead}
            className={cn(
              "hidden md:block absolute top-4 right-4 z-30 px-3.5 py-1.5 rounded-md text-[10px] md:text-xs font-bold tracking-wider uppercase transition-all shadow-sm border cursor-pointer select-none",
              timeOfDay === 'day'
                ? "bg-[#ffffff]/80 border-[#d4d4d8] text-[#3f3f46] hover:bg-[#ffffff] hover:text-[#18181b]"
                : "bg-[#1f1f23]/80 border-[#27272a] text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#f4f4f5]"
            )}
            title="Mark everyone as alive"
          >
            Reset Dead
          </button>
        )}
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
          const angle = evenAngles[index] !== undefined ? evenAngles[index] : 0;

          const cosVal = Math.cos(angle);
          const sinVal = Math.sin(angle);
          
          const n = 3.6;
          const pExponent = 2 / n;

          const leftPos = 50 + dynamicRadiusX * Math.sign(cosVal) * Math.pow(Math.abs(cosVal), pExponent);
          const topPos = 50 + dynamicRadiusY * Math.sign(sinVal) * Math.pow(Math.abs(sinVal), pExponent);

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

          const isFanned = fannedPlayerId === p.id;

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
                setFannedPlayerId(p.id);
                setHoveredOrder((prev) => {
                  const filtered = prev.filter((id) => id !== p.id);
                  return [...filtered, p.id];
                });
              }}
              onMouseLeave={() => {
                setFannedPlayerId(null);
              }}
              onTouchStart={() => {
                touchStartTimeRef.current = Date.now();
                touchStartedFannedRef.current = (fannedPlayerId === p.id);
                if (fannedPlayerId !== p.id) {
                  setFannedPlayerId(p.id);
                }
              }}
              className="hover:z-50 group"
            >
              <div className="relative flex flex-col items-center">
                <button
                  id={`grimoire-player-${p.id}`}
                  onClick={(e) => {
                    if (touchStartTimeRef.current > 0) {
                      const duration = Date.now() - touchStartTimeRef.current;
                      touchStartTimeRef.current = 0;
                      if (duration > 200) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                      }
                    }
                    onSelectPlayer(p.id);
                  }}
                  style={grimoireConfig.btnStyle}
                  className={cn(
                    "rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-md relative select-none",
                    grimoireConfig.btnClass,
                    isFanned ? "group-hover:scale-125 group-hover:shadow-lg" : "",
                    p.isDead ? "scale-95" : "hover:bg-[#fafafa]"
                  )}
                >
                  {/* Render fanned character tokens */}
                  {(() => {
                    const displayRoles = p.roleIds && p.roleIds.length > 0 ? p.roleIds : (p.roleId ? [p.roleId] : [null]);
                    return displayRoles.map((roleId, idx) => {
                      const roleObj = roleId ? rolesData.find((r) => r.id === roleId) : null;
                      const defaultEvil = roleObj ? (roleObj.team === 'minion' || roleObj.team === 'demon') : false;
                      const isEvil = p.isEvil !== undefined ? p.isEvil : defaultEvil;

                      let transformClass = "absolute inset-0 transition-all duration-300 ease-out hover:z-20";
                      if (displayRoles.length > 1) {
                        if (displayRoles.length === 2) {
                          transformClass += idx === 0 
                            ? ` -rotate-3 -translate-x-1 ${isFanned ? "group-hover:-translate-x-6 group-hover:-rotate-12" : ""}` 
                            : ` rotate-3 translate-x-1 ${isFanned ? "group-hover:translate-x-6 group-hover:rotate-12" : ""}`;
                        } else if (displayRoles.length === 3) {
                          if (idx === 0) {
                            transformClass += ` -rotate-6 -translate-x-2 translate-y-0.5 ${isFanned ? "group-hover:-translate-x-10 group-hover:translate-y-1.5 group-hover:-rotate-12" : ""}`;
                          } else if (idx === 1) {
                            transformClass += ` translate-y-[-1px] ${isFanned ? "group-hover:-translate-y-8 group-hover:scale-105" : ""}`;
                          } else if (idx === 2) {
                            transformClass += ` rotate-6 translate-x-2 translate-y-0.5 ${isFanned ? "group-hover:translate-x-10 group-hover:translate-y-1.5 group-hover:rotate-12" : ""}`;
                          }
                        }
                      }

                      const isTop = playerTopIndex[p.id] !== undefined
                        ? playerTopIndex[p.id] === idx
                        : idx === displayRoles.length - 1;

                      return (
                        <div
                          key={idx}
                          className={transformClass}
                          style={{ zIndex: isTop ? 10 : idx }}
                          onMouseEnter={() => {
                            setPlayerTopIndex((prev) => ({ ...prev, [p.id]: idx }));
                          }}
                          onClick={(e) => {
                            if (touchStartedFannedRef.current) {
                              e.stopPropagation();
                            }
                            setPlayerTopIndex((prev) => ({ ...prev, [p.id]: idx }));
                            setFannedPlayerId(null);
                            touchStartedFannedRef.current = false;
                          }}
                        >
                          {/* SVG representing the token */}
                          <svg viewBox="0 0 200 200" className={cn("w-full h-full absolute inset-0 z-0 select-none pointer-events-none", p.isDead && "opacity-60")}>
                            <defs>
                              <path id={`topTextPath-${p.id}-${idx}`} d="M 32,100 A 68,68 0 0,1 168,100" fill="none" />
                              <path id={`bottomTextPath-${p.id}-${idx}`} d="M 168,100 A 68,68 0 0,1 32,100" fill="none" />
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
                                  <textPath href={`#topTextPath-${p.id}-${idx}`} startOffset="50%" textAnchor="middle">
                                    {roleObj.name}
                                  </textPath>
                                </text>
                                
                                {/* Curved Character Type */}
                                <text className={cn("font-bold text-[11px] tracking-widest uppercase", teamFill(roleObj.team))}>
                                  <textPath href={`#bottomTextPath-${p.id}-${idx}`} startOffset="50%" textAnchor="middle">
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
                        </div>
                      );
                    });
                  })()}

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
    </div>
  );
}
