import React, { useState } from 'react';
import { Dices } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useBufferedField } from '../../hooks/useBufferedField';
import { cn } from '../../utils/cn';
import RoleIcon from '../shared/ui/RoleIcon';
import CharacterOptionRow from '../shared/ui/CharacterOptionRow';
import CloseButton from '../shared/ui/CloseButton';
import SearchInput from '../shared/ui/SearchInput';
import PlayerEditHeader from '../shared/ui/PlayerEditHeader';
import PlayerNameField from '../shared/ui/PlayerNameField';
import type { Player } from '../../WhaleBucket';
import type { Role } from '../../types';
import { ALL_ROLES } from '../../utils/roleData';
import { getWhaleBucketPreferenceTeam } from '../../utils/whaleBucketPreferences';
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


const TEAM_LABELS: Record<Role['team'], string> = {
  townsfolk: 'Townsfolk',
  outsider: 'Outsider',
  minion: 'Minion',
  demon: 'Demon',
  traveler: 'Traveler',
};

const teamTextClass = (team: Role['team']) => ({
  townsfolk: 'text-clocktower-townsfolk',
  outsider: 'text-clocktower-outsider',
  minion: 'text-clocktower-minion',
  demon: 'text-clocktower-demon',
  traveler: 'text-clocktower-traveler',
}[team]);

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
  const [searchTerm, setSearchTerm] = useState('');
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
    const filteredRoles = (ALL_ROLES as Role[])
      .filter(r =>
        getWhaleBucketPreferenceTeam(r) === pickingTeam &&
        !excludedRoleIds.includes(r.id) &&
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    const currentRoleId = player.preferences?.[pickingTeam]?.[0];

    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
        <div
          className={cn(
            "w-full max-w-sm rounded-lg p-4 space-y-3 max-h-[85vh] flex flex-col shadow-2xl",
            isLightModeActive
              ? "bg-[#fdfaf2] border border-clocktower-blood/30 text-clocktower-night"
              : "bg-gray-900 border border-gray-800"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center">
            <div>
              <button onClick={() => setPickingTeam(null)} className="text-xs text-gray-500 hover:underline">&larr; Back</button>
              <h3 className="font-display font-bold text-sm text-white tracking-wider uppercase mt-1">
                Select {TEAM_LABELS[pickingTeam]}
              </h3>
            </div>
            <CloseButton onClick={onClose} isLightModeActive={isLightModeActive} />
          </div>

          <SearchInput
            label="Search characters"
            placeholder="Search character name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus={!isMobile}
            containerClassName="px-2.5"
          />

          <div className="overflow-y-auto overscroll-contain flex-1 border border-gray-800 rounded bg-gray-955/40 divide-y divide-gray-800/60 pr-1">
            {filteredRoles.map(role => {
              const isSelected = role.id === currentRoleId;
              return (
                <CharacterOptionRow
                  key={role.id}
                  role={role}
                  selected={isSelected}
                  variant="preference"
                  isLightModeActive={isLightModeActive}
                  onClick={() => {
                    togglePreference(player.id, pickingTeam, role.id);
                    setPickingTeam(null);
                  }}
                  className={cn('hover:bg-gray-800', isSelected && 'bg-gray-800/30')}
                  trailing={isSelected ? (
                    <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-550/20 px-1.5 py-0.5 rounded font-black">
                      ✓ ACTIVE
                    </span>
                  ) : (
                    <span className="text-[9px] text-gray-650 font-mono">+ ADD</span>
                  )}
                />
              );
            })}
            {filteredRoles.length === 0 && (
              <div className="p-4 text-xs text-gray-500 italic text-center">No characters found.</div>
            )}
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-gray-800">
            <button
              onClick={() => {
                setPlayers(prev => prev.map(x => x.id === player.id ? {
                  ...x,
                  preferences: { ...x.preferences, [pickingTeam]: [] }
                } : x));
                setPickingTeam(null);
              }}
              className="text-xs text-gray-500 hover:text-red-400 hover:underline"
            >
              Clear Selection
            </button>
            <button
              onClick={() => {
                const available = (ALL_ROLES as Role[]).filter(r => getWhaleBucketPreferenceTeam(r) === pickingTeam && !excludedRoleIds.includes(r.id));
                if (available.length > 0) {
                  const r = available[Math.floor(Math.random() * available.length)];
                  setPlayers(prev => prev.map(x => x.id === player.id ? {
                    ...x,
                    preferences: { ...x.preferences, [pickingTeam]: [r.id] }
                  } : x));
                }
                setPickingTeam(null);
              }}
              className="text-xs text-clocktower-townsfolk hover:underline font-semibold"
            >
              Select Random
            </button>
          </div>
        </div>
      </div>
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

        <div className="overflow-y-auto overscroll-contain flex-1 space-y-2">
          {visibleTeams.map(team => {
            const roleId = player.preferences?.[team]?.[0];
            const roleObj = roleId ? (ALL_ROLES as Role[]).find(r => r.id === roleId) : undefined;
            return (
              <button
                key={team}
                type="button"
                onClick={() => { setPickingTeam(team); setSearchTerm(''); }}
                className="w-full flex items-center justify-between bg-gray-955/40 px-3 py-2 rounded border border-gray-855 hover:bg-gray-900/40 hover:border-gray-800 transition-all"
              >
                <span className={cn("text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border", teamTextClass(team), `border-current/30`)}>
                  {TEAM_LABELS[team]}
                </span>
                <span className="flex items-center gap-1.5 min-w-0">
                  {roleObj ? (
                    <>
                      <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0">
                        <RoleIcon
                          role={roleObj}
                          className="w-3.5 h-3.5"
                        />
                      </span>
                      <span className={cn("text-xs font-semibold truncate", teamTextClass(team))}>{roleObj.name}</span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-500 italic">No preference</span>
                  )}
                  <span className="text-gray-550 text-[10px] underline ml-1 shrink-0">Change</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
