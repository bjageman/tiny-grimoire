import type { ComponentPropsWithoutRef } from 'react';
import type { AnyRole } from '../../../types';
import { roleIconFallback } from '../../../utils/roleIcon';
import { cn } from '../../../utils/cn';

type IconRole = Pick<AnyRole, 'id' | 'name'> & Partial<Pick<AnyRole, 'team' | 'image'>>;

type RoleIconProps = Omit<ComponentPropsWithoutRef<'img'>, 'src' | 'onError' | 'role'> & {
  role: IconRole;
  isEvil?: boolean;
};

export default function RoleIcon({ role, isEvil = role.team === 'minion' || role.team === 'demon', alt = role.name, className, ...props }: RoleIconProps) {
  return (
    <img
      {...props}
      key={`${role.id}:${isEvil}:${role.image?.join('|') ?? ''}`}
      src={`/icons/${role.id}.svg`}
      alt={alt}
      className={cn('object-contain', className)}
      onError={roleIconFallback(role, isEvil)}
    />
  );
}
