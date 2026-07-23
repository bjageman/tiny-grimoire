import { cn } from '../../utils/cn';
import type { Role } from '../../types';

interface CharacterTokenProps {
  role?: Role | null;
  isEvil?: boolean;
  size?: number;
  idPrefix: string;
  className?: string;
}

const teamFill = (team: Role['team']) => ({
  townsfolk: 'fill-clocktower-townsfolk',
  outsider: 'fill-clocktower-outsider',
  minion: 'fill-clocktower-minion',
  demon: 'fill-clocktower-demon',
  traveler: 'fill-clocktower-traveler',
}[team] ?? 'fill-gray-500');

export default function CharacterToken({ role, isEvil, size, idPrefix, className }: CharacterTokenProps) {
  const sizeStyle = size !== undefined ? { width: size, height: size } : undefined;

  if (!role) {
    return (
      <div
        className={cn(
          'rounded-full border-2 border-dashed border-gray-800 bg-gray-955/40 flex items-center justify-center text-3xl font-light text-gray-600 shrink-0',
          size === undefined && 'w-full h-full',
          className
        )}
        style={sizeStyle}
      >
        ?
      </div>
    );
  }

  const evil = isEvil ?? (role.team === 'minion' || role.team === 'demon');

  return (
    <div className={cn('relative shrink-0', size === undefined && 'w-full h-full', className)} style={sizeStyle}>
      <svg viewBox="0 0 200 200" className="w-full h-full absolute inset-0 z-0 select-none pointer-events-none">
        <defs>
          <path id={`token-top-${idPrefix}`} d="M 32,100 A 68,68 0 0,1 168,100" fill="none" />
          <path id={`token-bottom-${idPrefix}`} d="M 168,100 A 68,68 0 0,1 32,100" fill="none" />
        </defs>
        <circle cx="100" cy="100" r="90" fill="#ffffff" className={cn('stroke-[6px]', evil ? 'stroke-clocktower-minion' : 'stroke-clocktower-townsfolk')} />
        <circle cx="100" cy="100" r="58" fill="none" stroke="#e4e4e7" strokeWidth="1" strokeDasharray="3 3" />
        <text className={cn('font-bold text-[18px] tracking-wider uppercase', teamFill(role.team))}>
          <textPath href={`#token-top-${idPrefix}`} startOffset="50%" textAnchor="middle">{role.name}</textPath>
        </text>
        <text className={cn('font-bold text-[11px] tracking-widest uppercase', teamFill(role.team))}>
          <textPath href={`#token-bottom-${idPrefix}`} startOffset="50%" textAnchor="middle">{role.team}</textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none select-none">
        <div className="w-[65%] h-[65%] flex items-center justify-center">
          <img
            src={`/icons/${role.id}.svg`}
            alt={role.name}
            className="w-full h-full object-contain opacity-35"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </div>
    </div>
  );
}
