import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface DisclosureHeaderProps {
  label: string;
  isExpanded: boolean;
  onToggle: () => void;
  controlsId: string;
  isLightModeActive: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  variant?: 'subtle' | 'prominent';
  chevronAtEnd?: boolean;
}

export default function DisclosureHeader({ label, isExpanded, onToggle, controlsId, isLightModeActive, icon, children, className, variant = 'subtle', chevronAtEnd = true }: DisclosureHeaderProps) {
  const prominent = variant === 'prominent';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      aria-controls={controlsId}
      className={cn(
        'flex w-full items-center gap-1.5',
        !prominent && 'text-xs font-bold uppercase tracking-wider',
        !prominent && (isLightModeActive ? 'text-gray-600' : 'text-gray-500'),
        className
      )}
    >
      {icon}
      <span className={cn(prominent && 'font-semibold text-xs tracking-wide uppercase', prominent && (isLightModeActive ? 'text-gray-700' : 'text-gray-300'))}>{label}</span>
      {children}
      <ChevronDown
        size={prominent ? 16 : 14}
        aria-hidden="true"
        className={cn('transition-transform duration-200', chevronAtEnd && 'ml-auto', prominent && 'text-gray-500', isExpanded && 'rotate-180')}
      />
    </button>
  );
}
