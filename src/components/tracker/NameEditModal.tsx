import { useState } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useBufferedField } from '../../hooks/useBufferedField';
import { cn } from '../../utils/cn';
import PlayerEditHeader from '../shared/ui/PlayerEditHeader';
import PlayerNameField from '../shared/ui/PlayerNameField';
import type { Player } from '../../types';
import PronounSelect from '../shared/ui/PronounSelect';

interface PlayerTrackerNameEditModalProps {
  activePlayerId: string;
  players: Player[];
  isLightModeActive: boolean;
  updatePlayerName: (id: string, name: string) => void;
  removePlayer: (id: string) => void;
  onUpdatePronouns?: (id: string, pronouns: string) => void;
  onClose: () => void;
}

export default function PlayerTrackerNameEditModal({
  activePlayerId,
  players,
  isLightModeActive,
  updatePlayerName,
  removePlayer,
  onUpdatePronouns,
  onClose,
}: PlayerTrackerNameEditModalProps) {
  useScrollLock();
  const isMobile = useIsMobile();
  const [pronounsOpen, setPronounsOpen] = useState(false);

  // Close the pronoun dropdown first, so Escape doesn't discard the whole modal out from under it.
  useEscapeKey(() => {
    if (pronounsOpen) setPronounsOpen(false);
    else onClose();
  });

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
        className={cn(
          "w-full max-w-sm rounded-lg p-4 space-y-3 shadow-2xl",
          isLightModeActive
            ? "bg-[#fdfaf2] border border-clocktower-blood/30 text-clocktower-night"
            : "bg-gray-900 border border-gray-800"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <PlayerEditHeader
          isLightModeActive={isLightModeActive}
          onRemove={() => removePlayer(player.id)}
          onClose={onClose}
          removeButtonId="remove-tracker-player-button"
          closeButtonId="close-tracker-edit-modal-button"
        />

        <div className="flex items-center gap-2">
          {onUpdatePronouns && (
            <PronounSelect
              id="tracker-player-pronouns-select"
              pronouns={player.pronouns}
              onChange={(pronouns) => onUpdatePronouns(player.id, pronouns)}
              isLightModeActive={isLightModeActive}
              open={pronounsOpen}
              onOpenChange={setPronounsOpen}
            />
          )}
          <PlayerNameField
            id="edit-tracker-player-name-input"
            value={editedName}
            onChange={setEditedName}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
