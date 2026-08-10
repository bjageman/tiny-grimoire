import type { ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface ToggleSwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  isLightModeActive: boolean;
  icon?: ReactNode;
}

// Checkbox + sliding pill/knob toggle with optional icon inside knob.
export default function ToggleSwitch({ id, checked, onChange, isLightModeActive, icon }: ToggleSwitchProps) {
  return (
    <>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div className={cn(
        "w-9 h-5 rounded-full transition-colors relative shrink-0 flex items-center",
        checked ? "bg-clocktower-blood" : (isLightModeActive ? "bg-gray-300" : "bg-gray-700")
      )}>
        <div className={cn(
          "absolute top-[2px] left-[2px] bg-white rounded-full h-4 w-4 transition-transform shadow-sm flex items-center justify-center text-gray-800",
          checked ? "translate-x-4" : "translate-x-0"
        )}>
          {icon}
        </div>
      </div>
    </>
  );
}
