import { cn } from '../../../utils/cn';
import { useEscapeKey } from '../../../hooks/useEscapeKey';
import { PRESET_SCRIPTS, presetTeamCounts, type PresetScript } from '../../../utils/presetScripts';

interface PresetScriptModalProps {
  onSelect: (preset: PresetScript) => void;
  onCancel: () => void;
  isLightModeActive?: boolean;
}

const TEAM_SUMMARY = [
  { key: 'townsfolk', one: 'Townsfolk', many: 'Townsfolk', color: 'text-clocktower-townsfolk' },
  { key: 'outsider', one: 'Outsider', many: 'Outsiders', color: 'text-clocktower-outsider' },
  { key: 'minion', one: 'Minion', many: 'Minions', color: 'text-clocktower-minion' },
  { key: 'demon', one: 'Demon', many: 'Demons', color: 'text-clocktower-demon' },
  { key: 'traveler', one: 'Traveler', many: 'Travelers', color: 'text-clocktower-traveler' },
] as const;

export default function PresetScriptModal({ onSelect, onCancel, isLightModeActive = false }: PresetScriptModalProps) {
  useEscapeKey(onCancel);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        id="preset-script-modal"
        className={cn(
          'w-full max-w-md rounded-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto overscroll-contain',
          isLightModeActive
            ? 'bg-white border border-clocktower-blood/20 text-gray-800'
            : 'bg-gray-900 border border-gray-800 text-gray-100'
        )}
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h3 className="font-bold text-base mb-1">Select a Preset Script</h3>
          <p className={cn('text-sm leading-relaxed', isLightModeActive ? 'text-gray-600' : 'text-gray-300')}>
            Load one of the three official base scripts without uploading a file.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {PRESET_SCRIPTS.map(preset => {
            const counts = presetTeamCounts(preset);
            return (
              <button
                key={preset.id}
                id={`preset-script-${preset.id}-button`}
                type="button"
                onClick={() => onSelect(preset)}
                className={cn(
                  'w-full py-3 px-3 rounded-md text-left border transition-colors',
                  isLightModeActive
                    ? 'bg-gray-50 border-gray-300 hover:border-clocktower-blood/50 hover:bg-gray-100'
                    : 'bg-gray-955 border-gray-800 hover:border-clocktower-blood hover:bg-gray-900'
                )}
              >
                <span className={cn('block font-bold text-sm', isLightModeActive ? 'text-gray-900' : 'text-white')}>
                  📜 {preset.name}
                </span>
                <span className={cn('block text-[11px] mt-0.5 leading-relaxed', isLightModeActive ? 'text-gray-600' : 'text-gray-400')}>
                  {preset.blurb}
                </span>
                <span className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1.5 text-[10px] font-mono text-gray-500">
                  {TEAM_SUMMARY.map(({ key, one, many, color }) => (
                    <span key={key} className={color}>{counts[key]} {counts[key] === 1 ? one : many}</span>
                  ))}
                </span>
              </button>
            );
          })}
          <button
            id="preset-script-cancel-button"
            type="button"
            onClick={onCancel}
            className={cn(
              'w-full py-2.5 px-3 rounded-md text-sm font-semibold border transition-colors',
              isLightModeActive
                ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            )}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
