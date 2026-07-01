import { Trash2 } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useBufferedField } from '../../hooks/useBufferedField';
import { cn } from '../../utils/cn';
import type { Player } from '../../types';

interface PlayerTrackerNameEditModalProps {
  activePlayerId: string;
  players: Player[];
  updatePlayerName: (id: string, name: string) => void;
  removePlayer: (id: string) => void;
  onClose: () => void;
}

export default function PlayerTrackerNameEditModal({
  activePlayerId,
  players,
  updatePlayerName,
  removePlayer,
  onClose,
}: PlayerTrackerNameEditModalProps) {
  useScrollLock();
  const isMobile = useIsMobile();

  const player = players.find(p => p.id === activePlayerId);

  const [editedName, setEditedName] = useBufferedField(activePlayerId, player?.name ?? '', updatePlayerName);

  if (!player) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 bg-black/70 z-50 flex justify-center p-4 backdrop-blur-sm",
        isMobile ? "items-start pt-16" : "items-center"
      )}
      onClick={onClose}
    >
      <div
        id="player-tracker-name-edit-modal"
        className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-lg p-4 space-y-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h3 className="font-display font-bold text-sm text-gray-200 tracking-wider uppercase">
            Edit Player
          </h3>
          <div className="flex items-center gap-3">
            
            <button id="close-tracker-edit-modal-button" onClick={onClose} className="text-xs text-gray-500 underline">
              Close
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
              id="remove-tracker-player-button"
              type="button"
              onClick={() => { removePlayer(player.id); onClose(); }}
              className="shrink-0 p-2 rounded border border-gray-800 text-gray-500 hover:text-red-500 hover:border-red-500/40 transition-colors"
              title="Remove player"
            >
              <Trash2 size={16} />
            </button>
          <input
            id="edit-tracker-player-name-input"
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); onClose(); } }}
            autoFocus
            autoCapitalize="words"
            placeholder="Player name"
            className="flex-1 min-w-0 bg-gray-955 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-clocktower-blood text-sm font-semibold"
          />
        </div>
      </div>
    </div>
  );
}
