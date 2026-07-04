import { cn } from '../../utils/cn';

interface ResetGameModalProps {
  remotePlayerCount: number;
  onKeepPlayers: () => void;
  onDisconnect: () => void;
  onCancel: () => void;
  isLightModeActive?: boolean;
}

export default function ResetGameModal({
  remotePlayerCount,
  onKeepPlayers,
  onDisconnect,
  onCancel,
  isLightModeActive = false,
}: ResetGameModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        id="reset-game-modal"
        className={cn(
          'w-full max-w-sm rounded-lg p-6 shadow-2xl space-y-4',
          isLightModeActive
            ? 'bg-white border border-clocktower-blood/20 text-gray-800'
            : 'bg-gray-900 border border-gray-800 text-gray-100'
        )}
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h3 className="font-bold text-base mb-1">Reset Game?</h3>
          <p className={cn('text-sm leading-relaxed', isLightModeActive ? 'text-gray-600' : 'text-gray-300')}>
            {remotePlayerCount === 1
              ? '1 player is connected.'
              : `${remotePlayerCount} players are connected.`}
            {' '}Choose what happens to them.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            id="reset-keep-players-button"
            type="button"
            onClick={onKeepPlayers}
            className="w-full py-2.5 px-3 rounded-md text-left bg-clocktower-townsfolk hover:bg-blue-600 text-white transition-colors"
          >
            <span className="block font-bold text-sm">Keep Players</span>
            <span className="block text-[11px] opacity-80 font-normal">Clear characters, send everyone back to setup</span>
          </button>
          <button
            id="reset-disconnect-button"
            type="button"
            onClick={onDisconnect}
            className="w-full py-2.5 px-3 rounded-md text-left bg-clocktower-blood hover:bg-red-800 text-white transition-colors"
          >
            <span className="block font-bold text-sm">Disconnect</span>
            <span className="block text-[11px] opacity-80 font-normal">Disconnect and return to the Main Menu</span>
          </button>
          <button
            id="reset-cancel-button"
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
