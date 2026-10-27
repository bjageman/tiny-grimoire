import type { ComponentPropsWithoutRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../utils/cn';

type CloseButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'children'> & {
  isLightModeActive: boolean;
  iconSize?: number;
};

export default function CloseButton({
  isLightModeActive,
  iconSize = 18,
  className,
  'aria-label': ariaLabel = 'Close',
  title = ariaLabel,
  ...props
}: CloseButtonProps) {
  return (
    <button
      {...props}
      type="button"
      aria-label={ariaLabel}
      title={title}
      className={cn(
        'shrink-0 p-1.5 rounded border transition-colors',
        isLightModeActive
          ? 'border-gray-300 text-gray-500 hover:bg-gray-200 hover:text-gray-800'
          : 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white',
        className
      )}
    >
      <X size={iconSize} aria-hidden="true" />
    </button>
  );
}
