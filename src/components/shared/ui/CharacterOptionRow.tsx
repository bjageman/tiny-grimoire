import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { Role } from '../../../types';
import { cn } from '../../../utils/cn';
import RoleIcon from './RoleIcon';

const TEAM_TEXT: Record<Role['team'], string> = {
  townsfolk: 'text-clocktower-townsfolk',
  outsider: 'text-clocktower-outsider',
  minion: 'text-clocktower-minion',
  demon: 'text-clocktower-demon',
  traveler: 'text-clocktower-traveler',
};

type CharacterOptionRowProps = Omit<ComponentPropsWithoutRef<'button'>, 'children' | 'role'> & {
  role: Role;
  selected: boolean;
  isLightModeActive: boolean;
  variant?: 'assignment' | 'preference';
  children?: ReactNode;
  trailing?: ReactNode;
  nameClassName?: string;
  contentClassName?: string;
  iconWrapperClassName?: string;
  iconClassName?: string;
};

export default function CharacterOptionRow({ role, selected, isLightModeActive, variant = 'assignment', children, trailing, nameClassName, contentClassName, iconWrapperClassName, iconClassName, className, ...props }: CharacterOptionRowProps) {
  const assignment = variant === 'assignment';

  return (
    <button
      {...props}
      type="button"
      aria-pressed={selected}
      className={cn(
        'w-full text-left px-3 py-2.5 text-xs transition-colors flex justify-between items-center',
        assignment && 'hover:bg-gray-800',
        className,
        assignment && selected && (isLightModeActive ? 'bg-amber-100/80 border-l-2 border-l-amber-600' : 'bg-amber-500/10 border-l-2 border-l-amber-500')
      )}
    >
      <div className={cn('flex items-center min-w-0 flex-1 gap-1.5 mr-2', contentClassName)}>
        <span className={cn('w-5 h-5 bg-white rounded-full overflow-hidden flex items-center justify-center shrink-0', iconWrapperClassName)}>
          <RoleIcon role={role} className={cn("w-3.5 h-3.5", iconClassName)} />
        </span>
        <span className={cn(
          'font-semibold text-xs truncate',
          assignment && selected ? (isLightModeActive ? 'text-gray-950 font-bold' : 'text-white font-bold') : TEAM_TEXT[role.team],
          nameClassName
        )}>
          {role.name}{assignment && selected && ' ✓'}
        </span>
        {children}
      </div>
      {trailing}
    </button>
  );
}
