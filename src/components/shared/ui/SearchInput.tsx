import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../../utils/cn';

type SearchInputProps = Omit<ComponentPropsWithRef<'input'>, 'children'> & {
  label: string;
  containerId?: string;
  containerClassName?: string;
  iconSize?: number;
  children?: ReactNode;
};

export default function SearchInput({ label, containerId, containerClassName, iconSize = 14, className, children, ...props }: SearchInputProps) {
  return (
    <div
      id={containerId}
      className={cn('flex items-center bg-white border border-gray-300 rounded px-3 py-2 text-sm shrink-0 focus-within:border-clocktower-blood', containerClassName)}
    >
      <Search size={iconSize} className="text-gray-400 mr-2 shrink-0" aria-hidden="true" />
      <input
        type="text"
        aria-label={label}
        {...props}
        className={cn('bg-transparent flex-1 min-w-0 outline-none text-xs text-gray-900 placeholder-gray-400', className)}
      />
      {children}
    </div>
  );
}
