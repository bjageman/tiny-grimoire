import React, { useState } from 'react';
import { Dices } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useBufferedField } from '../../hooks/useBufferedField';
import { cn } from '../../utils/cn';
import WhaleBucketPreferencePicker, { PreferenceSelectButton } from '../shared/ui/WhaleBucketPreferenceSelect';
import PlayerEditHeader from '../shared/ui/PlayerEditHeader';
import PlayerNameField from '../shared/ui/PlayerNameField';
import type { Player } from '../../WhaleBucket';
import type { Role } from '../../types';
import { ALL_ROLES } from '../../utils/roleData';
import PronounSelect from '../shared/ui/PronounSelect';

interface WhaleBucketPlayerPreferenceModalProps {
  activePlayerId: string;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  allowTravelers: boolean;
  excludedRoleIds: string[];
  isLightModeActive: boolean;
  updatePlayerName: (id: string, name: string) => void;
  removePlayer: (id: string) => void;
  togglePreference: (playerId: string, team: Role['team'], roleId: string) => void;
  autoFillPlayerPreferences: (playerId: string) => void;
  onUpdatePronouns?: (id: string, pronouns: string) => void;
  isSecondary?: boolean;
  onClose: () => void;
}


export default function WhaleBucketPlayerPreferenceModal({
  activePlayerId,
  players,
  setPlayers,
  allowTravelers,
  excludedRoleIds,
  isLightModeActive,
  updatePlayerName,
  removePlayer,
  togglePreference,
  autoFillPlayerPreferences,
  onUpdatePronouns,
  isSecondary,
  onClose,
}: WhaleBucketPlayerPreferenceModalProps) {
  useScrollLock();
  const isMobile = useIsMobile();

  const [pickingTeam, setPickingTeam] = useState<Role['team'] | null>(null);
  const [pronounsOpen, setPronounsOpen] = useState(false);

  // Close the pronoun dropdown first, so Escape doesn't discard the whole modal out from under it.
  useEscapeKey(() => {
    if (pronounsOpen) setPronounsOpen(false);
    else onClose();
  });

  const player = players.find(p => p.id === activePlayerId);

  const [editedName, setEditedName] = useBufferedField(activePlayerId, player?.name ?? '', updatePlayerName);

  if (!player) return null;

  const visibleTeams: Role['team'][] = allowTravelers
    ? ['townsfolk', 'outsider', 'minion', 'demon', 'traveler']
    : ['townsfolk', 'outsider', 'minion', 'demon'];

  if (pickingTeam) {
    const setChoice = (roleId: string | undefined) => {
      setPlayers(prev => prev.map(current => current.id === player.id ? {
        ...current,
        preferences: { ...current.preferences, [pickingTeam]: roleId ? [roleId] : [] },
      } : current));
    };
    return (
      <WhaleBucketPreferencePicker
        team={pickingTeam}
        currentRoleId={player.preferences?.[pickingTeam]?.[0]}
        roles={ALL_ROLES as Role[]}
        excludedRoleIds={excludedRoleIds}
        isLightModeActive={isLightModeActive}
        isMobile={isMobile}
        onBack={() => setPickingTeam(null)}
        onClose={onClose}
        onSelect={roleId => togglePreference(player.id, pickingTeam, roleId)}
        onClear={() => setChoice(undefined)}
        onRandom={setChoice}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        id="whalebucket-player-preference-modal"
        className={cn(
          "w-full max-w-sm rounded-lg p-4 space-y-3 max-h-[85vh] flex flex-col shadow-2xl",
          isLightModeActive
            ? "bg-[#fdfaf2] border border-clocktower-blood/30 text-clocktower-night"
            : "bg-gray-900 border border-gray-800"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <PlayerEditHeader
          isLightModeActive={isLightModeActive}
          isSecondary={isSecondary}
          onRemove={() => removePlayer(player.id)}
          onClose={onClose}
          removeButtonId="remove-preference-player-button"
          closeButtonId="close-preference-modal-button"
        />

        <div className="flex items-center gap-2">
          {onUpdatePronouns && (
            <PronounSelect
              id="preference-player-pronouns-select"
              pronouns={player.pronouns}
              onChange={(pronouns) => onUpdatePronouns(player.id, pronouns)}
              isLightModeActive={isLightModeActive}
              open={pronounsOpen}
              onOpenChange={setPronounsOpen}
            />
          )}
          <PlayerNameField
            id="edit-preference-player-name-input"
            value={editedName}
            onChange={setEditedName}
            onClose={onClose}
            className="border-gray-855"
          />
          <button
            id="auto-fill-preferences-button"
            type="button"
            onClick={() => autoFillPlayerPreferences(player.id)}
            className="shrink-0 p-2 rounded border border-gray-855 text-gray-500 hover:text-clocktower-townsfolk hover:border-clocktower-townsfolk/40 transition-colors"
            title="Auto-fill remaining preferences"
          >
            <Dices size={16} />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain flex-1 space-y-3 sm:space-y-2">
          {visibleTeams.map(team => {
            const roleId = player.preferences?.[team]?.[0];
            const roleObj = roleId ? (ALL_ROLES as Role[]).find(r => r.id === roleId) : undefined;
            return (
              <PreferenceSelectButton
                key={team}
                team={team}
                selectedRole={roleObj}
                onClick={() => setPickingTeam(team)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
