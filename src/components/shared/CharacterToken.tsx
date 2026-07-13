import { cn } from '../../utils/cn';
import { roleIconFallback } from '../../utils/roleIcon';
import type { Role } from '../../types';

interface CharacterTokenProps {
  role?: Role | null;
  isEvil?: boolean;
  size?: number;
  idPrefix: string;
  className?: string;
  /** Icon size as a percentage of the token, default 85 */
  iconSizePct?: number;
  /** Dims/grayscales the token to reflect a dead player */
  isDead?: boolean;
  /** When there's no role, still draw the colored ring (no text/icon) instead of the dashed "?" placeholder */
  blankRing?: boolean;
}

/**
 * Paint is set with SVG presentation attributes rather than Tailwind's fill-/stroke-
 * utilities: the recap exporter serializes a clone of this tree without the stylesheet,
 * and class-derived fill/stroke is dropped there, leaving rings and role names unpainted.
 * These hexes mirror theme.colors.clocktower in tailwind.config.js.
 */
const TEAM_COLOR: Record<Role['team'], string> = {
  townsfolk: '#2563eb',
  outsider: '#10b981',
  minion: '#ef4444',
  demon: '#7f1d1d',
  traveler: '#a855f7',
};

const teamFill = (team: Role['team']) => TEAM_COLOR[team] ?? '#6b7280';

export default function CharacterToken({ role, isEvil, size, idPrefix, className, iconSizePct = 85, isDead = false, blankRing = false }: CharacterTokenProps) {
  const sizeStyle = size !== undefined ? { width: size, height: size } : undefined;

  if (!role && !blankRing) {
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

  const evil = isEvil ?? (role ? (role.team === 'minion' || role.team === 'demon') : false);

  return (
    <div className={cn('relative shrink-0', size === undefined && 'w-full h-full', className)} style={sizeStyle}>
      <svg
        viewBox="0 0 200 200"
        opacity={isDead ? 0.6 : 1}
        className="w-full h-full absolute inset-0 z-0 select-none pointer-events-none"
      >
        <defs>
          <path id={`token-top-${idPrefix}`} d="M 32,100 A 68,68 0 0,1 168,100" fill="none" />
          <path id={`token-bottom-${idPrefix}`} d="M 168,100 A 68,68 0 0,1 32,100" fill="none" />
        </defs>
        <circle
          cx="100"
          cy="100"
          r="90"
          fill={isDead ? '#e4e4e7' : '#ffffff'}
          stroke={evil ? TEAM_COLOR.minion : TEAM_COLOR.townsfolk}
          strokeWidth={6}
        />
        <circle cx="100" cy="100" r="58" fill="none" stroke="#e4e4e7" strokeWidth="1" strokeDasharray="3 3" />
        {role && (
          <>
            {/* Inline styles, not utility classes, for the same reason as the paint above. */}
            <text
              fill={teamFill(role.team)}
              style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.025em', textTransform: 'uppercase' }}
            >
              <textPath href={`#token-top-${idPrefix}`} startOffset="50%" textAnchor="middle">{role.name}</textPath>
            </text>
            <text
              fill={teamFill(role.team)}
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              <textPath href={`#token-bottom-${idPrefix}`} startOffset="50%" textAnchor="middle">{role.team}</textPath>
            </text>
          </>
        )}
      </svg>
      {role && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none select-none">
          <div style={{ width: `${iconSizePct}%`, height: `${iconSizePct}%` }} className="flex items-center justify-center">
            <img
              key={role.id}
              src={`/icons/${role.id}.svg`}
              alt={role.name}
              className={cn('w-full h-full object-contain', isDead ? 'grayscale opacity-15' : 'opacity-35')}
              onError={roleIconFallback(role, evil)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
