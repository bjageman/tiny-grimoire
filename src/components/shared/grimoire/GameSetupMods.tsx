import { Settings, ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { usePersistedDisclosure } from '../../../hooks/usePersistedDisclosure';
import ToggleSwitch from '../ui/ToggleSwitch';

interface GameSetupModsProps {
  sentinelOutsiderDelta: number;
  setSentinelOutsiderDelta: (delta: number) => void;
  popeEnabled: boolean;
  setPopeEnabled: (enabled: boolean) => void;
  isLightModeActive?: boolean;
  persistenceKey?: string;
}

const SENTINEL_OPTIONS = [
  { value: -1, label: '−1' },
  { value: 0, label: '0' },
  { value: 1, label: '+1' },
];

export default function GameSetupMods({
  sentinelOutsiderDelta,
  setSentinelOutsiderDelta,
  popeEnabled,
  setPopeEnabled,
  isLightModeActive = false,
  persistenceKey,
}: GameSetupModsProps) {
  const { isExpanded, toggleExpanded } = usePersistedDisclosure(persistenceKey);

  // Surface active modifiers in the header so a collapsed widget still shows something is set.
  const activeCount = (sentinelOutsiderDelta !== 0 ? 1 : 0) + (popeEnabled ? 1 : 0);

  return (
    <div
      id="game-setup-mods"
      className={cn(
        "border rounded-lg transition-colors duration-300 text-left",
        isLightModeActive
          ? "bg-white border-gray-250 text-clocktower-night shadow-sm"
          : "bg-gray-900/90 border-gray-800"
      )}
    >
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-controls="game-setup-mods-body"
        className="w-full flex items-center gap-1.5 p-3"
      >
        <Settings size={16} className="text-clocktower-traveler" />
        <span className={cn(
          "font-semibold text-xs tracking-wide uppercase",
          isLightModeActive ? "text-gray-700" : "text-gray-300"
        )}>
          Setup Modifiers
        </span>
        {!isExpanded && activeCount > 0 && (
          <span className={cn(
            "text-[9px] border px-1.5 py-0.5 rounded font-medium",
            isLightModeActive
              ? "bg-clocktower-blood/5 border-clocktower-blood/20 text-clocktower-blood"
              : "bg-clocktower-blood/10 border-clocktower-blood/30 text-clocktower-parchment/80"
          )}>
            {activeCount} active
          </span>
        )}
        <ChevronDown
          size={16}
          className={cn(
            "ml-auto text-gray-500 transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {isExpanded && (
        <div id="game-setup-mods-body" className="px-3 pb-3">
          <div className={cn(
            "flex items-center justify-between gap-3 border-t pt-2.5",
            isLightModeActive ? "border-gray-200" : "border-gray-800"
          )}>
            <div>
              <div className={cn(
                "text-[11px] font-bold",
                isLightModeActive ? "text-gray-800" : "text-gray-200"
              )}>
                Sentinel
              </div>
              <div className="text-[9px] text-gray-500 leading-tight">
                1 extra or 1 fewer Outsider
              </div>
            </div>
            <div className={cn(
              "flex rounded-md overflow-hidden border shrink-0",
              isLightModeActive ? "border-gray-300" : "border-gray-700"
            )}>
              {SENTINEL_OPTIONS.map(opt => {
                const active = sentinelOutsiderDelta === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSentinelOutsiderDelta(opt.value)}
                    aria-pressed={active}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-mono font-bold transition-colors",
                      active
                        ? "bg-clocktower-traveler text-white"
                        : isLightModeActive
                          ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          : "bg-gray-955 text-gray-400 hover:bg-gray-800"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <label htmlFor="pope-enabled-toggle" className={cn(
            "flex items-center justify-between gap-3 border-t mt-2.5 pt-2.5 cursor-pointer",
            isLightModeActive ? "border-gray-200" : "border-gray-800"
          )}>
            <div>
              <div className={cn(
                "text-[11px] font-bold",
                isLightModeActive ? "text-gray-800" : "text-gray-200"
              )}>
                Pope
              </div>
              <div className="text-[9px] text-gray-500 leading-tight">
                Allow duplicate Townsfolk and Outsiders
              </div>
            </div>
            <ToggleSwitch
              id="pope-enabled-toggle"
              checked={popeEnabled}
              onChange={setPopeEnabled}
              isLightModeActive={isLightModeActive}
              icon={<img src="/icons/pope.svg" alt="" className="w-3 h-3 object-contain brightness-[0.45] saturate-150" />}
            />
          </label>
        </div>
      )}
    </div>
  );
}
