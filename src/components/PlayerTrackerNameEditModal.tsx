import { useEffect, useMemo, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useScrollLock } from '../hooks/useScrollLock';
import type { Player } from '../types';

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
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  const player = players.find(p => p.id === activePlayerId);

  const [editedName, setEditedName] = useState(player?.name ?? '');
  const lastPlayerId = useRef(activePlayerId);
  const lastEditedName = useRef(editedName);

  useEffect(() => {
    lastEditedName.current = editedName;
  }, [editedName]);

  useEffect(() => {
    lastPlayerId.current = activePlayerId;
  }, [activePlayerId]);

  useEffect(() => {
    return () => {
      const currentId = lastPlayerId.current;
      const currentName = lastEditedName.current;
      const currentPlayer = players.find(x => x.id === currentId);
      if (currentPlayer && currentPlayer.name !== currentName) {
        updatePlayerName(currentId, currentName);
      }
    };
  }, [updatePlayerName, players]);

  if (!player) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        id="player-tracker-name-edit-modal"
        className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-lg p-4 space-y-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h3 className="font-display font-bold text-sm text-gray-200 tracking-wider uppercase">
            Edit Player
          </h3>
          <button
            id="remove-tracker-player-button"
            type="button"
            onClick={() => { removePlayer(player.id); onClose(); }}
            className="shrink-0 p-2 rounded border border-gray-800 text-gray-500 hover:text-red-500 hover:border-red-500/40 transition-colors"
            title="Remove player"
          >
            <Trash2 size={16} />
          </button>
          <button id="close-tracker-edit-modal-button" onClick={onClose} className="text-xs text-gray-500 underline">
            Close
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="edit-tracker-player-name-input"
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onFocus={(e) => e.target.select()}
            autoFocus={!isMobile}
            autoCapitalize="words"
            placeholder="Player name"
            className="flex-1 min-w-0 bg-gray-955 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-clocktower-blood text-sm font-semibold"
          />
        </div>
      </div>
    </div>
  );
}
