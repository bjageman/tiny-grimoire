import type { ChangeEvent, RefObject } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '../../../utils/cn';
import ScriptHelpButton from './ScriptHelpButton';

interface ScriptSelectionPanelProps {
  scriptName: string;
  scriptAuthor: string;
  hasCustomScript: boolean;
  isLightModeActive: boolean;
  isSynced?: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onSelectPreset: () => void;
  onViewScript: () => void;
  uploadInputId?: string;
  uploadButtonId?: string;
  emptyScriptIcon?: string;
  uploadHint?: string;
}

export default function ScriptSelectionPanel({ scriptName, scriptAuthor, hasCustomScript, isLightModeActive, isSynced = false, fileInputRef, onUpload, onClear, onSelectPreset, onViewScript, uploadInputId, uploadButtonId, emptyScriptIcon = '📜', uploadHint = 'Click to upload .json' }: ScriptSelectionPanelProps) {
  const scriptIcon = hasCustomScript ? '📜' : emptyScriptIcon;
  const actionClassName = cn(
    'w-full text-center bg-transparent border py-2.5 rounded text-xs font-semibold transition-all',
    isLightModeActive
      ? 'hover:bg-gray-200/50 border-gray-300 text-black hover:text-black'
      : 'hover:bg-gray-800 border-gray-800 text-white hover:text-white'
  );

  return (
    <>
      <input id={uploadInputId} ref={fileInputRef} type="file" accept=".json" onChange={onUpload} className="hidden" />
      {isSynced ? (
        <div className={cn(
          'w-full border py-3.5 px-4 rounded-lg flex flex-col items-center justify-center gap-1 text-center',
          isLightModeActive ? 'bg-gray-100 border-gray-300 text-gray-800' : 'bg-gray-955 border-gray-800 text-gray-300'
        )}>
          <span className={cn('flex items-center gap-1.5 text-base font-extrabold', isLightModeActive ? 'text-gray-900' : 'text-white')}>
            {scriptIcon} {scriptName}
          </span>
          <span className={cn('text-[10px] font-medium', isLightModeActive ? 'text-black' : 'text-white')}>
            {scriptAuthor ? `by ${scriptAuthor} — Synced from Storyteller` : hasCustomScript ? 'Custom script — Synced from Storyteller' : 'Active Script (Synced from Storyteller)'}
          </span>
        </div>
      ) : (
        <>
          <div className="relative">
            <button
              id={uploadButtonId}
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'w-full border py-3.5 px-4 rounded-lg transition-all flex flex-col items-center justify-center gap-1 group text-center cursor-pointer',
                isLightModeActive
                  ? 'bg-gray-100/80 border-gray-300 hover:border-clocktower-blood/60 hover:bg-gray-150'
                  : 'bg-gray-955 border-gray-800 hover:border-clocktower-blood'
              )}
              title="Click to upload script JSON"
            >
              <span className={cn('flex items-center gap-1.5 text-base font-extrabold transition-colors group-hover:text-clocktower-blood', isLightModeActive ? 'text-gray-900' : 'text-white')}>
                {scriptIcon} {scriptName}
              </span>
              <span className={cn('text-[10px] font-medium flex items-center gap-1', isLightModeActive ? 'text-black' : 'text-white')}>
                <Upload size={12} aria-hidden="true" />
                {hasCustomScript ? `${scriptAuthor ? `by ${scriptAuthor}` : 'Custom script'} — Click to change` : uploadHint}
              </span>
            </button>
            <ScriptHelpButton isLightModeActive={isLightModeActive} />
          </div>
          {hasCustomScript ? (
            <button
              type="button"
              onClick={onClear}
              className={cn(
                'w-full text-center bg-transparent border py-2.5 rounded text-xs font-semibold transition-all',
                isLightModeActive
                  ? 'hover:bg-red-50 border-gray-300 text-red-600 hover:text-red-700'
                  : 'hover:bg-gray-800 border-gray-800 text-red-400 hover:text-red-300'
              )}
            >
              Clear Script
            </button>
          ) : (
            <button id="preset-script-button" type="button" onClick={onSelectPreset} className={actionClassName}>
              Select a Preset Script
            </button>
          )}
        </>
      )}
      <button id="game-script-button" type="button" onClick={onViewScript} className={actionClassName}>
        {hasCustomScript ? 'View Script' : 'View All Roles'}
      </button>
    </>
  );
}
