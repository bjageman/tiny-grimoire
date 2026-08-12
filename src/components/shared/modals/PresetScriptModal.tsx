import { cn } from '../../../utils/cn';
import { useEscapeKey } from '../../../hooks/useEscapeKey';
import { PRESET_SCRIPTS, type PresetScript } from '../../../utils/presetScripts';

interface PresetScriptModalProps {
  onSelect: (preset: PresetScript) => void;
  onCancel: () => void;
  isLightModeActive?: boolean;
}

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
        <h3 className="font-bold text-base text-center">Select a Preset Script</h3>

        <div className="flex flex-col gap-2">
          {PRESET_SCRIPTS.map(preset => (
            <button
              key={preset.id}
              id={`preset-script-${preset.id}-button`}
              type="button"
              onClick={() => onSelect(preset)}
              className={cn(
                'w-full py-2.5 px-3 rounded-md text-center border transition-colors',
                isLightModeActive
                  ? 'bg-gray-50 border-gray-300 text-gray-900 hover:border-clocktower-blood/50 hover:bg-gray-100'
                  : 'bg-gray-955 border-gray-800 text-white hover:border-clocktower-blood hover:bg-gray-900'
              )}
            >
              <span className="block font-bold text-sm">{preset.name}</span>
              <span className="block text-[10px] text-gray-500 font-medium mt-0.5">by {preset.author}</span>
            </button>
          ))}
          <button
            id="preset-script-cancel-button"
            type="button"
            onClick={onCancel}
            className={cn(
              'w-full py-2.5 px-3 rounded-md text-center text-sm font-semibold border transition-colors',
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
