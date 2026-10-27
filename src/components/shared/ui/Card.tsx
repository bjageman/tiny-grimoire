import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '../../../utils/cn';

type CardProps = ComponentPropsWithoutRef<'div'> & {
  isLightModeActive: boolean;
  variant?: 'muted' | 'solid';
};

export default function Card({ isLightModeActive, variant = 'muted', className, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        'rounded-lg border p-3.5 space-y-2.5 transition-colors duration-300',
        variant === 'solid'
          ? isLightModeActive ? 'bg-white border-gray-250 text-clocktower-night shadow-sm' : 'bg-gray-900/90 border-gray-800'
          : isLightModeActive ? 'bg-white/50 border-gray-300' : 'bg-gray-900/40 border-gray-800/80',
        className
      )}
    />
  );
}
