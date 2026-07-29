import { useState, useRef, useEffect } from 'react';
import { Menu, Sun, Moon, RotateCcw } from 'lucide-react';
import { cn } from '../../../utils/cn';
import ToggleSwitch from './ToggleSwitch';

interface HeaderMenuProps {
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onResetGame?: () => void;
  isLightModeActive?: boolean;
  isSecondary?: boolean;
  alwaysShowNotes?: boolean;
  onToggleAlwaysShowNotes?: (alwaysShow: boolean) => void;
}

export default function HeaderMenu({
  theme,
  onToggleTheme,
  onResetGame,
  isLightModeActive: isLightProp,
  isSecondary = false,
  alwaysShowNotes,
  onToggleAlwaysShowNotes,
}: HeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLightModeActive = theme ? theme === 'light' : !!isLightProp;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
            <label
              id="theme-toggle-label"
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm",
                "font-semibold rounded-md transition-colors select-none cursor-pointer text-left",
                isLightModeActive
                  ? "text-gray-700 hover:bg-amber-500/10 hover:text-amber-900"
                  : "text-gray-200 hover:bg-slate-800 hover:text-white"
              )}
            >
              <span className="truncate pr-2">Theme:</span>
              <ToggleSwitch
                id="theme-toggle-button"
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
            </label>
          )}

          {onToggleAlwaysShowNotes && (
            <label
              id="always-show-notes-toggle"
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm",
                "font-semibold rounded-md transition-colors select-none cursor-pointer text-left",
                isLightModeActive
                  ? "text-gray-700 hover:bg-amber-500/10 hover:text-amber-900"
                  : "text-gray-200 hover:bg-slate-800 hover:text-white"
              )}
            >
              <span className="truncate pr-2">Show Labels</span>
              <ToggleSwitch
                id="always-show-notes-checkbox"
                checked={!!alwaysShowNotes}
                onChange={(checked) => onToggleAlwaysShowNotes(checked)}
                isLightModeActive={isLightModeActive}
              />
            </label>
          )}

          {((onToggleTheme || onToggleAlwaysShowNotes) && onResetGame) && (
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
