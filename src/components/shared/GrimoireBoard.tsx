import { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, RotateCcw, RotateCw } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { Player, Role, PlacedReminder } from '../../types';
import { cn } from '../../utils/cn';
import officialRoles from '../../official_roles.json';
import ReminderPickerModal from './ReminderPickerModal';
import ReminderTokenModal from './ReminderTokenModal';
import DayNightLabel from './DayNightLabel';

interface GrimoireBoardProps {
  players: Player[];
  timeOfDay: 'night' | 'day';
  dayNumber: number;
  toggleTimeOfDay?: () => void;
  onSelectPlayer: (playerId: string) => void;
  rolesData: Role[];
  onResetDead?: () => void;
  onResetTime?: () => void;
  isSynced?: boolean;
  isLightModeActive?: boolean;
  reminderTokens?: PlacedReminder[];
  onAddReminder?: (targetPlayerId: string, sourceCharId: string, text: string) => void;
  onRemoveReminder?: (reminderId: string) => void;
  onRemoveAllReminders?: () => void;
  rotationOffset?: number;
  onRotationChange?: (offset: number) => void;
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
  isSynced = false,
  isLightModeActive = false,
  reminderTokens = [],
  onAddReminder,
  onRemoveReminder,
  onRemoveAllReminders,
  rotationOffset: controlledRotation,
  onRotationChange,
}: GrimoireBoardProps) {
  const [internalRotation, setInternalRotation] = useState(0);
  // Ref accumulates rapid clicks before the parent re-render delivers the new prop
  const rotationRef = useRef(controlledRotation ?? 0);
  const rotationOffset = controlledRotation !== undefined ? controlledRotation : internalRotation;
  // Keep ref in sync when the controlled prop is updated by the parent
  useEffect(() => {
    if (controlledRotation !== undefined) rotationRef.current = controlledRotation;
  }, [controlledRotation]);
  const handleRotate = (delta: number) => {
    rotationRef.current += delta;
    const next = rotationRef.current;
    setInternalRotation(next);
    onRotationChange?.(next);
  };
  const [hoveredOrder, setHoveredOrder] = useState<string[]>([]);
  const [playerTopIndex, setPlayerTopIndex] = useState<Record<string, number>>({});
  const [fannedPlayerId, setFannedPlayerId] = useState<string | null>(null);
  const [boardAspect, setBoardAspect] = useState<number>(1.3);
  const [pickerPlayerId, setPickerPlayerId] = useState<string | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<PlacedReminder | null>(null);
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

  useEffect(() => {
    if (pickerPlayerId !== null || selectedReminder !== null) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [pickerPlayerId, selectedReminder]);

  const activeCharIds = useMemo(() => {
    const ids = new Set<string>();
    players.forEach(p => {
      if (p.roleId) ids.add(p.roleId);
      p.roleIds?.forEach(id => ids.add(id));
      if (p.isTheDrunk) ids.add('drunk');
      if (p.isTheMarionette) ids.add('marionette');
      if (p.isTheLunatic) ids.add('lunatic');
      if (p.isTheLilMonsta) ids.add('lilmonsta');
    });
    return [...ids];
  }, [players]);

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
    const isDesktop = boardAspect < 1.15;

    if (count <= 6) {
      return {
        boardClass: "w-[88vw] h-[112vw] max-w-[560px] max-h-[700px] md:w-[560px] md:h-[500px] landscape:max-h-[500px] rounded-[28px]",
        radiusX: 38,
        radiusY: 36,
        btnStyle: isDesktop
          ? { width: '140px', height: '140px' } as CSSProperties
          : { width: '30cqw', height: '30cqw' } as CSSProperties,
        dotStyle: { top: '6%', width: '1.8cqw', height: '1.8cqw' } as CSSProperties,
        nameStyle: isDesktop
          ? { fontSize: '23.5px', maxWidth: '130px', marginTop: '2.8px' } as CSSProperties
          : { fontSize: '4.8cqw', maxWidth: '28cqw', marginTop: '0.5cqw' } as CSSProperties,
        roleStyle: isDesktop
          ? { fontSize: '18.5px', maxWidth: '130px', marginTop: '0px' } as CSSProperties
          : { fontSize: '3.8cqw', maxWidth: '28cqw', marginTop: '0cqw' } as CSSProperties,
        charLimit: 16,
        tooltipClass: "top-18",
        centerBtnStyle: isDesktop
          ? { width: '140px', height: '140px' } as CSSProperties
          : { width: '30cqw', height: '30cqw' } as CSSProperties,
        centerText1Style: isDesktop
          ? { fontSize: '23.5px' } as CSSProperties
          : { fontSize: '4.8cqw' } as CSSProperties,
        centerText2Style: isDesktop
          ? { fontSize: '18.5px', marginTop: '1px' } as CSSProperties
          : { fontSize: '3.8cqw', marginTop: '0.2cqw' } as CSSProperties,
      };
    } else if (count <= 10) {
      return {
        boardClass: "w-[90vw] h-[118vw] max-w-[680px] max-h-[760px] md:w-[680px] md:h-[500px] landscape:max-h-[500px] rounded-[34px]",
        radiusX: 40,
        radiusY: 38,
        btnStyle: isDesktop
          ? { width: '130px', height: '130px' } as CSSProperties
          : { width: '26cqw', height: '26cqw' } as CSSProperties,
        dotStyle: { top: '6%', width: '1.5cqw', height: '1.5cqw' } as CSSProperties,
        nameStyle: isDesktop
          ? { fontSize: '22.3px', maxWidth: '118px', marginTop: '2.5px' } as CSSProperties
          : { fontSize: '4.3cqw', maxWidth: '24cqw', marginTop: '0.4cqw' } as CSSProperties,
        roleStyle: isDesktop
          ? { fontSize: '17.3px', maxWidth: '118px', marginTop: '0px' } as CSSProperties
          : { fontSize: '3.4cqw', maxWidth: '24cqw', marginTop: '0cqw' } as CSSProperties,
        charLimit: 14,
        tooltipClass: "top-16",
        centerBtnStyle: isDesktop
          ? { width: '130px', height: '130px' } as CSSProperties
          : { width: '26cqw', height: '26cqw' } as CSSProperties,
        centerText1Style: isDesktop
          ? { fontSize: '22.3px' } as CSSProperties
          : { fontSize: '4.0cqw' } as CSSProperties,
        centerText2Style: isDesktop
          ? { fontSize: '17.8px', marginTop: '1px' } as CSSProperties
          : { fontSize: '3.2cqw', marginTop: '0.2cqw' } as CSSProperties,
      };
    } else {
      return {
        boardClass: "w-[92vw] h-[124vw] max-w-[680px] max-h-[820px] md:w-[680px] md:h-[500px] landscape:max-h-[500px] rounded-[40px]",
        radiusX: 42,
        radiusY: 40,
        btnStyle: isDesktop
          ? { width: '112px', height: '112px' } as CSSProperties
          : { width: '21cqw', height: '21cqw' } as CSSProperties,
        dotStyle: { top: '6%', width: '1.2cqw', height: '1.2cqw' } as CSSProperties,
        nameStyle: isDesktop
          ? { fontSize: '20.4px', maxWidth: '102px', marginTop: '2.0px' } as CSSProperties
          : { fontSize: '3.7cqw', maxWidth: '19cqw', marginTop: '0.3cqw' } as CSSProperties,
        roleStyle: isDesktop
          ? { fontSize: '15.6px', maxWidth: '102px', marginTop: '0px' } as CSSProperties
          : { fontSize: '2.8cqw', maxWidth: '19cqw', marginTop: '0cqw' } as CSSProperties,
        charLimit: 12,
        tooltipClass: "top-14",
        centerBtnStyle: isDesktop
          ? { width: '115px', height: '115px' } as CSSProperties
          : { width: '21cqw', height: '21cqw' } as CSSProperties,
        centerText1Style: isDesktop
          ? { fontSize: '21.0px' } as CSSProperties
          : { fontSize: '3.1cqw' } as CSSProperties,
        centerText2Style: isDesktop
          ? { fontSize: '17.0px', marginTop: '1px' } as CSSProperties
          : { fontSize: '2.5cqw', marginTop: '0.2cqw' } as CSSProperties,
      };
    }
  }, [players.length, boardAspect]);

  const dynamicRadiusX = useMemo(() => {
    return grimoireConfig.radiusX;
  }, [grimoireConfig.radiusX]);

  const dynamicRadiusY = useMemo(() => {
    if (boardAspect < 1.15) {
      return grimoireConfig.radiusY * 0.92; // Gentle vertical reduction to avoid overflowing top/bottom
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

  const rotatedPlayers = useMemo(() => {
    if (rotationOffset === 0 || players.length === 0) return players;
    const n = players.length;
    const off = ((rotationOffset % n) + n) % n;
    return [...players.slice(off), ...players.slice(0, off)];
  }, [players, rotationOffset]);

  return (
    <>
    <div className="w-full flex flex-col items-center">
      {/* Row 1: buttons, in their own fixed-proportion grid so their width never depends on badge content */}
      <div className="w-full px-4 mb-1.5 max-w-[450px] md:max-w-none grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-3">
        {onResetTime ? (
          <button
            id="grimoire-reset-time-button"
            onClick={onResetTime}
            className={cn(
              "w-full inline-flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-md text-[10px] md:text-xs font-bold tracking-wider uppercase transition-all shadow-sm border cursor-pointer select-none whitespace-nowrap",
              isLightModeActive
                ? "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                : "bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-850 active:bg-gray-800"
            )}
            title="Reset back to Night 1"
          >
            <RotateCcw className="w-3 h-3" /> Time
          </button>
        ) : <div />}

        <div className="flex justify-center items-center gap-2">
          {!isSynced && onRemoveAllReminders && reminderTokens.length > 0 && (
            <button
              id="grimoire-reset-reminders-button"
              onClick={onRemoveAllReminders}
              className={cn(
                "w-full inline-flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-md text-[10px] md:text-xs font-bold tracking-wider uppercase transition-all shadow-sm border cursor-pointer select-none whitespace-nowrap",
                isLightModeActive
                  ? "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                  : "bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-850 active:bg-gray-800"
              )}
            >
              <RotateCcw className="w-3 h-3 shrink-0" /> <span className="text-[9px] md:text-[11px]">Reminders</span>
            </button>
          )}
        </div>

        {onResetDead ? (
          <button
            id="grimoire-reset-dead-button"
            onClick={onResetDead}
            className={cn(
              "w-full inline-flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-md text-[10px] md:text-xs font-bold tracking-wider uppercase transition-all shadow-sm border cursor-pointer select-none whitespace-nowrap",
              isLightModeActive
                ? "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                : "bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-850 active:bg-gray-800"
            )}
            title="Mark everyone as alive"
          >
            <RotateCcw className="w-3 h-3" /> Dead
          </button>
        ) : <div />}
      </div>

      {/* Row 2: info badges — mobile only. Independent flex row so label width is sized to its
          own content, not tied to the button row's fixed column widths. */}
      <div className="md:hidden w-full px-4 mb-2 max-w-[450px] flex items-center justify-between gap-3">
        <div
          id="grimoire-info-row"
          onClick={!isSynced && toggleTimeOfDay ? toggleTimeOfDay : undefined}
          className={cn(
            "group flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wider uppercase select-none border whitespace-nowrap",
            !isSynced && toggleTimeOfDay ? "cursor-pointer active:opacity-60" : "",
            timeOfDay === 'day'
              ? "bg-white border-[#d4d4d8] text-[#3f3f46]"
              : "bg-[#1f1f23]/80 border-[#27272a] text-[#a1a1aa]"
          )}
        >
          <DayNightLabel timeOfDay={timeOfDay} dayNumber={dayNumber} />
          {!isSynced && toggleTimeOfDay && (
            <ChevronRight size={10} className="opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
          )}
        </div>

        <div
          id="grimoire-alive-badge-mobile"
          onClick={onResetDead}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wider uppercase select-none border transition-opacity whitespace-nowrap",
            onResetDead ? "cursor-pointer hover:opacity-70 active:opacity-50" : "",
            isLightModeActive
              ? "bg-[#ffffff]/80 border-[#d4d4d8] text-[#3f3f46]"
              : "bg-[#1f1f23]/80 border-[#27272a] text-[#a1a1aa]"
          )}
        >
          {players.filter(p => !p.isDead).length} Alive
        </div>
      </div>

      <div
        id="grimoire-circle-board"
        ref={boardRef}
        className={cn(
          "relative border shadow-inner flex items-center justify-center overflow-visible my-4 mx-auto",
          isLightModeActive
            ? "bg-[rgb(245_243_235)] border-[#d4d4d8] shadow-gray-200/50"
            : "bg-[#141416] border-[#27272a] shadow-black/45",
          grimoireConfig.boardClass
        )}
        style={{ containerType: 'size' }}
      >
        {/* Night/Day count — upper left, desktop only */}
        <div
          id="grimoire-time-badge"
          onClick={!isSynced && toggleTimeOfDay ? toggleTimeOfDay : undefined}
          className={cn(
            "group hidden md:flex absolute top-4 left-4 z-30 items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wider uppercase select-none border min-w-[90px] justify-center whitespace-nowrap",
            !isSynced && toggleTimeOfDay ? "cursor-pointer active:opacity-60" : "",
            timeOfDay === 'day'
              ? "bg-white border-[#d4d4d8] text-[#3f3f46]"
              : "bg-[#1f1f23]/80 border-[#27272a] text-[#a1a1aa]"
          )}
        >
          <DayNightLabel timeOfDay={timeOfDay} dayNumber={dayNumber} />
          {!isSynced && toggleTimeOfDay && (
            <ChevronRight size={10} className="opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
          )}
        </div>

        {/* Alive count — upper right, desktop only */}
        <div
          id="grimoire-alive-badge"
          onClick={onResetDead}
          className={cn(
            "hidden md:block absolute top-4 right-4 z-30 px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wider uppercase select-none border transition-opacity",
            onResetDead ? "cursor-pointer hover:opacity-70 active:opacity-50" : "",
            isLightModeActive
              ? "bg-[#ffffff]/80 border-[#d4d4d8] text-[#3f3f46]"
              : "bg-[#1f1f23]/80 border-[#27272a] text-[#a1a1aa]"
          )}
        >
          {players.filter(p => !p.isDead).length} Alive
        </div>

        {/* Rotate buttons — center of board */}
        {players.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                type="button"
                onClick={() => handleRotate(1)}
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
                onClick={() => handleRotate(-1)}
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

        {rotatedPlayers.map((p, index) => {
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
          const dynamicPronounFontSize = `${baseFontSizeVal * scaleFactor * 0.75}${baseFontSizeUnit}`;

          const orderIndex = hoveredOrder.indexOf(p.id);
          const zIndex = orderIndex !== -1 ? 10 + orderIndex : 10;

          const isFanned = fannedPlayerId === p.id;

          const dx = 50 - leftPos;
          const dy = 50 - topPos;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const inwardDx = dist > 0 ? dx / dist : 0;
          const inwardDy = dist > 0 ? dy / dist : 0;
          const playerReminders = reminderTokens.filter(r => r.targetPlayerId === p.id);

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
              {/* "+" add-reminder — at anchor when empty, shifted inward when reminders exist */}
              {!isSynced && onAddReminder && playerReminders.length < 5 && (
                <button
                  style={{
                    position: 'absolute',
                    left: `calc(50% + ${(inwardDx * (playerReminders.length > 0 ? 100 : 70)).toFixed(1)}%)`,
                    top: `calc(50% + ${(inwardDy * (playerReminders.length > 0 ? 100 : 70)).toFixed(1)}%)`,
                    transform: 'translate(-50%, -50%)',
                    width: '23%',
                    height: '23%',
                    zIndex: 55,
                  }}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPickerPlayerId(p.id);
                  }}
                  className="rounded-full bg-gray-400/70 text-white font-bold flex items-center justify-center border border-gray-500/50 shadow hover:bg-gray-500/80 active:bg-gray-600 transition-colors leading-none text-[10px]"
                  title={`Add reminder to ${p.name}`}
                >
                  +
                </button>
              )}

              {/* Placed reminder token circles — last at anchor, earlier ones arc around it */}
              {playerReminders.map((reminder, ri) => {
                const n = playerReminders.length;
                const isLast = ri === n - 1;
                const arcN = n - 1;
                const totalAngle = Math.PI;
                const startAngle = -totalAngle / 2;
                const theta = startAngle + (arcN > 1 ? (ri / (arcN - 1)) * totalAngle : 0);
                const arcRadius = 30;
                const rx = inwardDx * Math.cos(theta) - inwardDy * Math.sin(theta);
                const ry = inwardDx * Math.sin(theta) + inwardDy * Math.cos(theta);
                const reminderLeft = isLast ? inwardDx * 70 : inwardDx * 70 + rx * arcRadius;
                const reminderTop = isLast ? inwardDy * 70 : inwardDy * 70 + ry * arcRadius;

                return (
                <div
                  key={reminder.id}
                  style={{
                    position: 'absolute',
                    left: `calc(50% + ${reminderLeft.toFixed(1)}%)`,
                    top: `calc(50% + ${reminderTop.toFixed(1)}%)`,
                    transform: 'translate(-50%, -50%)',
                    width: '23%',
                    height: '23%',
                    zIndex: 55,
                  }}
                >
                <button
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedReminder(reminder);
                  }}
                  className="w-full h-full rounded-full bg-gray-200 border-2 border-gray-400 overflow-hidden flex items-center justify-center shadow-sm hover:bg-gray-300 active:bg-gray-400 transition-all duration-150 hover:scale-125 hover:shadow-md"
                  title={reminder.text}
                >
                  <img
                    src={`/icons/${reminder.sourceCharId}.svg`}
                    alt={reminder.text}
                    className="w-full h-full object-contain opacity-80"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                </button>
                </div>
                );
              })}

              <div className="relative flex flex-col items-center">
                {p.notes && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 invisible group-hover:visible pointer-events-none z-[200] bg-gray-900/95 text-white text-[9px] font-medium rounded-lg px-2.5 py-1.5 shadow-xl max-w-[140px] text-center leading-relaxed break-words whitespace-pre-wrap border border-white/10">
                    {p.notes}
                  </div>
                )}
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
                    isFanned ? "group-hover:scale-125 group-hover:shadow-lg" : "",
                    p.isDead ? "scale-95" : "hover:bg-[#fafafa]"
                  )}
                >
                  {/* Render fanned character tokens */}
                  {(() => {
                    const displayRoles = p.roleIds && p.roleIds.length > 0
                      ? p.roleIds
                      : (p.roleId
                          ? [p.roleId]
                          : p.isTheDrunk
                            ? ['drunk']
                            : p.isTheMarionette
                              ? ['marionette']
                              : p.isTheLunatic
                                ? ['lunatic']
                                : p.isTheLilMonsta
                                  ? ['lilmonsta']
                                  : [null]);
                    return displayRoles.map((roleId, idx) => {
                      const roleObj = roleId 
                        ? (rolesData.find((r) => r.id === roleId) || (officialRoles as Role[]).find((r) => r.id === roleId))
                        : null;
                      const defaultEvil = roleObj ? (roleObj.team === 'minion' || roleObj.team === 'demon') : false;
                      const isEvil = p.isEvil !== undefined
                        ? p.isEvil
                        : p.isTheLunatic
                        ? false
                        : p.isTheMarionette
                        ? true
                        : defaultEvil;

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
                              <div className="w-[65%] h-[65%] flex items-center justify-center">
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

                  {p.pronouns && (
                    <span
                      style={{
                        fontSize: dynamicPronounFontSize,
                        textShadow: '0 1px 2px rgba(255,255,255,1.0), 0 0 4px rgba(255,255,255,0.9)'
                      }}
                      className="text-[#555] font-medium leading-none pointer-events-none select-none z-20 relative"
                    >
                      {p.pronouns}
                    </span>
                  )}

                  {p.isTheDrunk && (
                    <span
                      style={{ fontSize: '1.7cqw', padding: '0.3cqw 0.8cqw', borderRadius: '0.4cqw', borderWidth: '0.12cqw' }}
                      className="absolute bottom-0 bg-yellow-600 text-black font-black border-yellow-700 shadow-sm leading-none translate-y-1/2 z-30 whitespace-nowrap"
                    >
                      DRUNK
                    </span>
                  )}
                  {p.isTheMarionette && (
                    <span
                      style={{ fontSize: '1.7cqw', padding: '0.3cqw 0.8cqw', borderRadius: '0.4cqw', borderWidth: '0.12cqw' }}
                      className="absolute bottom-0 bg-clocktower-minion text-white font-black border-clocktower-minion/40 shadow-sm leading-none translate-y-1/2 z-30 whitespace-nowrap"
                    >
                      MARIONETTE
                    </span>
                  )}
                  {p.isTheLunatic && (
                    <span
                      style={{ fontSize: '1.7cqw', padding: '0.3cqw 0.8cqw', borderRadius: '0.4cqw', borderWidth: '0.12cqw' }}
                      className="absolute bottom-0 bg-clocktower-outsider text-white font-black border-clocktower-outsider/40 shadow-sm leading-none translate-y-1/2 z-30 whitespace-nowrap"
                    >
                      LUNATIC
                    </span>
                  )}
                  {p.isTheLilMonsta && (
                    <span
                      style={{ fontSize: '1.7cqw', padding: '0.3cqw 0.8cqw', borderRadius: '0.4cqw', borderWidth: '0.12cqw' }}
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

    {pickerPlayerId && createPortal(
      <ReminderPickerModal
        targetPlayerName={players.find(p => p.id === pickerPlayerId)?.name ?? ''}
        activeRoleIds={activeCharIds}
        rolesData={rolesData}
        onSelect={(sourceCharId, text) => {
          onAddReminder?.(pickerPlayerId, sourceCharId, text);
          setPickerPlayerId(null);
        }}
        onClose={() => setPickerPlayerId(null)}
        isLightModeActive={isLightModeActive}
      />,
      document.body
    )}

    {selectedReminder && createPortal(
      <ReminderTokenModal
        reminder={selectedReminder}
        rolesData={rolesData}
        onRemove={() => {
          onRemoveReminder?.(selectedReminder.id);
          setSelectedReminder(null);
        }}
        onClose={() => setSelectedReminder(null)}
        isLightModeActive={isLightModeActive}
      />,
      document.body
    )}
    </>
  );
}
