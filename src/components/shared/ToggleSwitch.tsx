import { cn } from '../../utils/cn';

interface ToggleSwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  isLightModeActive: boolean;
}

/** Checkbox + sliding pill/knob toggle. Render inside a <label> alongside its text. */
export default function ToggleSwitch({ id, checked, onChange, isLightModeActive }: ToggleSwitchProps) {
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
        "w-9 h-5 rounded-full transition-colors relative shrink-0",
        checked ? "bg-clocktower-blood" : (isLightModeActive ? "bg-gray-300" : "bg-gray-700")
      )}>
        <div className={cn(
          "absolute top-[2px] left-[2px] bg-white rounded-full h-4 w-4 transition-transform shadow-sm",
          checked ? "translate-x-4" : "translate-x-0"
        )} />
      </div>
    </>
  );
}
