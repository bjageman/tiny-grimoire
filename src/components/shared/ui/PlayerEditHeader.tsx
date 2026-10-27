import { Trash2 } from 'lucide-react';
import { cn } from '../../../utils/cn';
import CloseButton from './CloseButton';

interface PlayerEditHeaderProps {
  isLightModeActive: boolean;
  onRemove: () => void;
  onClose: () => void;
  removeButtonId: string;
  closeButtonId: string;
  isSecondary?: boolean;
}

export default function PlayerEditHeader({ isLightModeActive, onRemove, onClose, removeButtonId, closeButtonId, isSecondary = false }: PlayerEditHeaderProps) {
  return (
    <div className="flex justify-between items-center gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <h3 className="font-display font-bold text-lg text-gray-200 tracking-wider uppercase truncate">
          Edit Player
        </h3>
        <button
          id={removeButtonId}
          type="button"
          disabled={isSecondary}
          onClick={() => { if (!isSecondary) { onRemove(); onClose(); } }}
          className={cn(
            'shrink-0 p-1.5 rounded border transition-colors',
            isSecondary
              ? 'text-gray-700 border-gray-800/45 cursor-not-allowed opacity-40'
              : isLightModeActive
                ? 'text-red-700 border-red-700/40 bg-red-50 hover:text-red-800 hover:bg-red-100'
                : 'text-red-400 border-red-500/40 hover:text-red-300'
          )}
          title={isSecondary ? 'This action is disabled on secondary devices.' : 'Remove player'}
        >
          <Trash2 size={16} />
        </button>
      </div>
      <CloseButton id={closeButtonId} onClick={onClose} isLightModeActive={isLightModeActive} />
    </div>
  );
}
