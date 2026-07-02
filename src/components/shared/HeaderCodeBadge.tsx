import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface HeaderCodeBadgeProps {
  onClick: () => void;
  title: string;
  isLightModeActive: boolean;
  /** Renders the mobile-only variant (shown below the header) instead of the desktop-only variant (shown inline in the title). */
  mobile?: boolean;
  children: ReactNode;
}

export default function HeaderCodeBadge({ onClick, title, isLightModeActive, mobile = false, children }: HeaderCodeBadgeProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        mobile ? "md:hidden flex" : "hidden md:flex",
        "cursor-pointer text-xs font-bold px-2 py-1.5 rounded border transition-all duration-200 select-none items-baseline gap-1",
        isLightModeActive
          ? "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
          : "bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-850"
      )}
      title={title}
    >
      {children}
    </div>
  );
}
