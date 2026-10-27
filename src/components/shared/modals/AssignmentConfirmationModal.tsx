import { AlertTriangle } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface AssignmentConfirmationModalProps {
  remotePlayerCount: number;
  isLightModeActive: boolean;
  confirmButtonId: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function AssignmentConfirmationModal({ remotePlayerCount, isLightModeActive, confirmButtonId, onCancel, onConfirm }: AssignmentConfirmationModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className={cn(
          'w-full max-w-sm rounded-lg p-6 shadow-2xl space-y-4',
          isLightModeActive
            ? 'bg-white border border-clocktower-blood/20 text-gray-800'
            : 'bg-gray-900 border border-gray-800 text-gray-100'
        )}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-base mb-1">Send character assignments?</h3>
            <p className={cn('text-sm leading-relaxed', isLightModeActive ? 'text-gray-600' : 'text-gray-300')}>
              {remotePlayerCount === 1
                ? '1 player has joined your session.'
                : `${remotePlayerCount} players have joined your session.`}
              {' '}Opening the grimoire will send everyone their character. This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-semibold border transition-colors',
              isLightModeActive
                ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            )}
          >
            Cancel
          </button>
          <button
            id={confirmButtonId}
            onClick={onConfirm}
            className="px-4 py-2 rounded-md text-sm font-display font-bold tracking-wider uppercase bg-clocktower-blood text-white hover:bg-red-800 transition-colors"
          >
            Open Grimoire
          </button>
        </div>
      </div>
    </div>
  );
}
