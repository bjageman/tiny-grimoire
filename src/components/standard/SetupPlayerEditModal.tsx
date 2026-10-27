import { useState } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useBufferedField } from '../../hooks/useBufferedField';
import { PLAYABLE_ROLES } from '../../utils/roleData';
import { cn } from '../../utils/cn';
import CharacterModifierButton from '../shared/ui/CharacterModifierButton';
import SearchInput from '../shared/ui/SearchInput';
import PlayerEditHeader from '../shared/ui/PlayerEditHeader';
import PlayerNameField from '../shared/ui/PlayerNameField';
import { roleIconFallback } from '../../utils/roleIcon';
import type { Player, Role } from '../../types';
import PronounSelect from '../shared/ui/PronounSelect';
import { isMarionetteEligible } from '../../utils/marionetteEligibility';

interface SetupPlayerEditModalProps {
  activePlayerId: string;
  players: Player[];
  customScriptRoles: Role[] | null;
  selectionRoles: Role[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isLightModeActive: boolean;
  updatePlayerName: (id: string, name: string) => void;
  updatePlayerRole: (id: string, roleId: string) => void;
  removePlayer: (id: string) => void;
  togglePlayerTheDrunk: (id: string) => void;
  togglePlayerTheMarionette: (id: string) => void;
  togglePlayerTheLunatic: (id: string) => void;
  togglePlayerTheLilMonsta: (id: string) => void;
  onUpdatePronouns?: (id: string, pronouns: string) => void;
  selectedCharacterIds?: Set<string>;
  bagOnly?: boolean;
  setBagOnly?: (value: boolean) => void;
  isSecondary?: boolean;
  onClose: () => void;
}

const TEAM_ORDER: Record<string, number> = {
  townsfolk: 1,
  outsider: 2,
  minion: 3,
  demon: 4,
  traveler: 5,
};

export default function SetupPlayerEditModal({
  activePlayerId,
  players,
  customScriptRoles,
  selectionRoles,
  searchTerm,
  setSearchTerm,
  isLightModeActive,
  updatePlayerName,
  updatePlayerRole,
  removePlayer,
  togglePlayerTheDrunk,
  togglePlayerTheMarionette,
  togglePlayerTheLunatic,
  togglePlayerTheLilMonsta,
  onUpdatePronouns,
  selectedCharacterIds,
  bagOnly,
  setBagOnly,
  onClose,
  isSecondary,
}: SetupPlayerEditModalProps) {
  useScrollLock();
  const [pronounsOpen, setPronounsOpen] = useState(false);

  // Close the pronoun dropdown first, so Escape doesn't discard the whole modal out from under it.
  useEscapeKey(() => {
    if (pronounsOpen) setPronounsOpen(false);
    else onClose();
  });

  const player = players.find(p => p.id === activePlayerId);

  const [editedName, setEditedName] = useBufferedField(activePlayerId, player?.name ?? '', updatePlayerName);

  if (!player) return null;

  const roleObj = selectionRoles.find(r => r.id === player.roleId) || PLAYABLE_ROLES.find(r => r.id === player.roleId);

  const hasDrunkInScript = !customScriptRoles || customScriptRoles.some(r => r.id === 'drunk');
  const hasMarionetteInScript = !customScriptRoles || customScriptRoles.some(r => r.id === 'marionette');
  const hasLunaticInScript = !customScriptRoles || customScriptRoles.some(r => r.id === 'lunatic');
  const hasLilMonstaInScript = !customScriptRoles || customScriptRoles.some(r => r.id === 'lilmonsta');

  const canBeDrunk = player.isTheDrunk || (roleObj?.team === 'townsfolk' && hasDrunkInScript);
  const canBeMarionette = player.isTheMarionette || (hasMarionetteInScript && isMarionetteEligible(
    players,
    player.id,
    player.roleId,
    roleId => selectionRoles.find(r => r.id === roleId) || PLAYABLE_ROLES.find(r => r.id === roleId)
  ));
  const canBeLunatic = player.isTheLunatic || (roleObj?.team === 'demon' && hasLunaticInScript);
  const canBeLilMonsta = player.isTheLilMonsta || (roleObj?.team === 'minion' && hasLilMonstaInScript);

  const isDrunkSelectedElsewhere = players.some(pl => pl.id !== player.id && pl.isTheDrunk);
  const isMarionetteSelectedElsewhere = players.some(pl => pl.id !== player.id && pl.isTheMarionette);
  const isLunaticSelectedElsewhere = players.some(pl => pl.id !== player.id && pl.isTheLunatic);

  const canFilterByBag = !!setBagOnly && !!selectedCharacterIds && selectedCharacterIds.size > 0;
  const isBagOnly = canFilterByBag && !!bagOnly;

  const filteredRoles = selectionRoles
    .filter(r =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.team.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(r => !isBagOnly || selectedCharacterIds!.has(r.id) || r.id === player.roleId)
    .sort((a, b) => {
      const isCurrentA = a.id === player.roleId;
      const isCurrentB = b.id === player.roleId;
      if (isCurrentA && !isCurrentB) return -1;
      if (!isCurrentA && isCurrentB) return 1;

      const orderA = TEAM_ORDER[a.team] || 99;
      const orderB = TEAM_ORDER[b.team] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        id="setup-player-edit-modal"
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
          removeButtonId="remove-player-button"
          closeButtonId="close-player-edit-modal-button"
        />

        <div className="flex items-center gap-2">
          {onUpdatePronouns && (
            <PronounSelect
              id="setup-player-pronouns-select"
              pronouns={player.pronouns}
              onChange={(pronouns) => onUpdatePronouns(player.id, pronouns)}
              isLightModeActive={isLightModeActive}
              open={pronounsOpen}
              onOpenChange={setPronounsOpen}
            />
          )}
          <PlayerNameField
            id="edit-player-name-input"
            value={editedName}
            onChange={setEditedName}
            onClose={onClose}
          />
        </div>

        {(canFilterByBag || canBeDrunk || canBeMarionette || canBeLunatic || canBeLilMonsta) && (
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {canFilterByBag && (
              <label
                id="bag-only-filter"
                title="Only show characters selected in the setup bag"
                className={cn(
                  "mr-auto flex items-center gap-1.5 cursor-pointer text-[11px] font-medium select-none",
                  isLightModeActive ? "text-gray-600" : "text-gray-400"
                )}
              >
                <input
                  id="bag-only-filter-checkbox"
                  type="checkbox"
                  checked={isBagOnly}
                  onChange={(e) => setBagOnly!(e.target.checked)}
                  className="shrink-0 w-3.5 h-3.5"
                />
                Bag only
              </label>
            )}
            {canBeDrunk && (
              <CharacterModifierButton
                modifier="drunk"
                active={!!player.isTheDrunk}
                onClick={() => togglePlayerTheDrunk(player.id)}
                disabled={isDrunkSelectedElsewhere}
                id={`toggle-drunk-button-${player.id}`}
              />
            )}
            {canBeMarionette && (
              <CharacterModifierButton
                modifier="marionette"
                active={!!player.isTheMarionette}
                onClick={() => togglePlayerTheMarionette(player.id)}
                disabled={isMarionetteSelectedElsewhere}
                id={`toggle-marionette-button-${player.id}`}
              />
            )}
            {canBeLunatic && (
              <CharacterModifierButton
                modifier="lunatic"
                active={!!player.isTheLunatic}
                onClick={() => togglePlayerTheLunatic(player.id)}
                disabled={isLunaticSelectedElsewhere}
                id={`toggle-lunatic-button-${player.id}`}
              />
            )}
            {canBeLilMonsta && (
              <CharacterModifierButton
                modifier="lilmonsta"
                active={!!player.isTheLilMonsta}
                onClick={() => togglePlayerTheLilMonsta(player.id)}
                id={`toggle-lilmonsta-button-${player.id}`}
              />
            )}
          </div>
        )}

        <div className="border-t border-gray-800/80" />

        <SearchInput
          id="role-search-input"
          label="Search characters"
          placeholder="Search character name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          containerId="role-search-wrapper"
        />

        <div id="role-list" className="overflow-y-auto overscroll-contain flex-1 border border-gray-800 rounded bg-gray-955/40 divide-y divide-gray-800/60 pr-1">
          {filteredRoles.map(role => {
            const selectedByPlayer = players.find(pl => pl.roleId === role.id && pl.id !== activePlayerId);
            const isCurrent = role.id === player.roleId;
            return (
              <button
                id={`role-option-${role.id}`}
                key={role.id}
                onClick={() => { updatePlayerRole(activePlayerId, isCurrent ? '' : role.id); onClose(); }}
                className={cn(
                  "w-full text-left px-3 py-2.5 hover:bg-gray-800 text-xs transition-colors flex justify-between items-center",
                  isCurrent && (isLightModeActive ? "bg-amber-100/80 border-l-2 border-l-amber-600" : "bg-amber-500/10 border-l-2 border-l-amber-500")
                )}
              >
                <div className="flex items-center min-w-0 flex-1 gap-1.5 mr-2">
                  <span className="w-5 h-5 bg-white rounded-full overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      key={role.id}
                      src={`/icons/${role.id}.svg`}
                      alt={role.name}
                      className="w-3.5 h-3.5 object-contain"
                      onError={roleIconFallback(role, role.team === 'minion' || role.team === 'demon')}
                    />
                  </span>
                  <span className={cn(
                    "font-semibold text-xs truncate",
                    isCurrent
                      ? (isLightModeActive ? "text-gray-950 font-bold" : "text-white font-bold")
                      : (
                        (role.team === 'townsfolk' && "text-clocktower-townsfolk") ||
                        (role.team === 'outsider' && "text-clocktower-outsider") ||
                        (role.team === 'minion' && "text-clocktower-minion") ||
                        (role.team === 'demon' && "text-clocktower-demon")
                      )
                  )}>
                    {role.name} {isCurrent && "✓"}
                  </span>
                  {selectedByPlayer && (
                    <span className={cn(
                      "text-[8px] px-1 py-0.5 rounded shrink-0 font-medium border",
                      isLightModeActive
                        ? "bg-gray-100 border-gray-200 text-gray-655"
                        : "bg-gray-800/40 border-gray-700/30 text-gray-400"
                    )}>
                      {selectedByPlayer.name}
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase font-mono text-gray-650">{role.team[0]}</span>
              </button>
            );
          })}
          {filteredRoles.length === 0 && (
            <div className="p-3 text-xs text-gray-500 italic text-center">No matching roles found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
