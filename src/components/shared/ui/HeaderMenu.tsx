import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Menu, Sun, Moon, RotateCcw } from 'lucide-react';
import { cn } from '../../../utils/cn';
import ToggleSwitch from './ToggleSwitch';

interface HeaderMenuProps {
  theme: 'light' | 'dark';
  onToggleTheme?: () => void;
  onResetGame?: () => void;
  isSecondary?: boolean;
  alwaysShowNotes?: boolean;
  onToggleAlwaysShowNotes?: (alwaysShow: boolean) => void;
  fullNightOrder?: boolean;
  onToggleFullNightOrder?: (fullOrder: boolean) => void;
  allReminders?: boolean;
  onToggleAllReminders?: (allReminders: boolean) => void;
  showReminders?: boolean;
  onToggleShowReminders?: (showReminders: boolean) => void;
}

interface MenuToggleProps {
  id: string;
  toggleId: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  isLightModeActive: boolean;
  icon?: ReactNode;
}

// One labelled row in the dropdown wrapping a ToggleSwitch, so clicking anywhere on the row toggles.
function MenuToggle({ id, toggleId, label, checked, onChange, isLightModeActive, icon }: MenuToggleProps) {
  return (
    <label
      id={id}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 text-sm",
        "font-semibold rounded-md transition-colors select-none cursor-pointer text-left",
        isLightModeActive
          ? "text-gray-700 hover:bg-amber-500/10 hover:text-amber-900"
          : "text-gray-200 hover:bg-slate-800 hover:text-white"
      )}
    >
      <span className="truncate pr-2">{label}</span>
      <ToggleSwitch
        id={toggleId}
        checked={checked}
        onChange={onChange}
        isLightModeActive={isLightModeActive}
        icon={icon}
      />
    </label>
  );
}

export default function HeaderMenu({
  theme,
  onToggleTheme,
  onResetGame,
  isSecondary = false,
  alwaysShowNotes,
  onToggleAlwaysShowNotes,
  fullNightOrder,
  onToggleFullNightOrder,
  allReminders,
  onToggleAllReminders,
  showReminders,
  onToggleShowReminders,
}: HeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLightModeActive = theme === 'light';
  const hasToggles = !!(onToggleTheme || onToggleAlwaysShowNotes || onToggleFullNightOrder || onToggleAllReminders || onToggleShowReminders);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        id="header-menu-button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "p-2 transition-colors rounded-md flex items-center justify-center",
          isLightModeActive
            ? "text-gray-600 hover:text-gray-900 hover:bg-black/5"
            : "text-gray-400 hover:text-white hover:bg-white/10"
        )}
        title="Menu"
        aria-label="Menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls="header-menu-dropdown"
      >
        <Menu size={20} />
      </button>

      {isOpen && (
        <div
          id="header-menu-dropdown"
          className={cn(
            "absolute right-0 top-full mt-2 w-52 rounded-lg shadow-xl border p-1.5 z-50 animate-fadeIn space-y-0.5",
            isLightModeActive
              ? "bg-white border-clocktower-blood/20 text-gray-800"
              : "bg-gray-900 border-gray-800 text-gray-100"
          )}
        >
          {onToggleTheme && (
            <MenuToggle
              id="theme-toggle-label"
              toggleId="theme-toggle-button"
              label="Theme:"
              checked={isLightModeActive}
              onChange={() => onToggleTheme()}
              isLightModeActive={isLightModeActive}
              icon={
                isLightModeActive ? (
                  <Sun size={11} className="text-amber-500 fill-amber-500" />
                ) : (
                  <Moon size={11} className="text-indigo-600 fill-indigo-600" />
                )
              }
            />
          )}

          {onToggleAlwaysShowNotes && (
            <MenuToggle
              id="always-show-notes-toggle"
              toggleId="always-show-notes-checkbox"
              label="Show Labels"
              checked={!!alwaysShowNotes}
              onChange={onToggleAlwaysShowNotes}
              isLightModeActive={isLightModeActive}
            />
          )}

          {onToggleFullNightOrder && (
            <MenuToggle
              id="full-night-order-toggle"
              toggleId="full-night-order-checkbox"
              label="Full Night Order"
              checked={!!fullNightOrder}
              onChange={onToggleFullNightOrder}
              isLightModeActive={isLightModeActive}
            />
          )}

          {onToggleShowReminders && (
            <MenuToggle
              id="show-reminders-toggle"
              toggleId="show-reminders-checkbox"
              label="Show Reminders"
              checked={!!showReminders}
              onChange={onToggleShowReminders}
              isLightModeActive={isLightModeActive}
            />
          )}

          {onToggleAllReminders && (
            <MenuToggle
              id="all-reminders-toggle"
              toggleId="all-reminders-checkbox"
              label="All Reminders"
              checked={!!allReminders}
              onChange={onToggleAllReminders}
              isLightModeActive={isLightModeActive}
            />
          )}

          {hasToggles && onResetGame && (
            <div className={cn("my-1 h-px", isLightModeActive ? "bg-gray-200" : "bg-gray-800")} />
          )}

          {onResetGame && (
            <button
              id="reset-game-button"
              onClick={() => {
                setIsOpen(false);
                onResetGame();
              }}
              disabled={isSecondary}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-md transition-colors text-left",
                isLightModeActive
                  ? "text-red-700 hover:bg-red-50 hover:text-red-800"
                  : "text-red-400 hover:bg-red-950/40 hover:text-red-300",
                isSecondary && "opacity-40 cursor-not-allowed hover:bg-transparent"
              )}
              title={
                isSecondary
                  ? "This action is disabled on secondary devices to prevent sync issues."
                  : "Reset Game"
              }
            >
              <RotateCcw size={16} className="shrink-0 text-red-500" />
              <span>Reset Game</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
