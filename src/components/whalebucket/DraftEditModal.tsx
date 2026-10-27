import { useState } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useIsMobile } from '../../hooks/useIsMobile';
import { cn } from '../../utils/cn';
import CharacterModifierButton from '../shared/ui/CharacterModifierButton';
import SearchInput from '../shared/ui/SearchInput';
import CloseButton from '../shared/ui/CloseButton';
import type { Player } from '../../WhaleBucket';
import type { Role } from '../../types';
import { TEAM_ORDER } from '../../types';
import { PLAYABLE_ROLES } from '../../utils/roleData';
import PronounSelect from '../shared/ui/PronounSelect';
import { isMarionetteEligible } from '../../utils/marionetteEligibility';

interface WhaleBucketDraftEditModalProps {
  activeDraftPlayerId: string;
  players: Player[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  updatePlayerRole: (playerId: string, roleId: string) => void;
  togglePlayerTheDrunk: (id: string) => void;
  togglePlayerTheMarionette: (id: string) => void;
  togglePlayerTheLunatic: (id: string) => void;
  togglePlayerTheLilMonsta: (id: string) => void;
  onUpdatePronouns?: (id: string, pronouns: string) => void;
  isLightModeActive: boolean;
  onClose: () => void;
}


export default function WhaleBucketDraftEditModal({
  activeDraftPlayerId,
  players,
  searchTerm,
  setSearchTerm,
  updatePlayerRole,
  togglePlayerTheDrunk,
  togglePlayerTheMarionette,
  togglePlayerTheLunatic,
  togglePlayerTheLilMonsta,
  onUpdatePronouns,
  isLightModeActive,
  onClose,
}: WhaleBucketDraftEditModalProps) {
  useScrollLock();
  const isMobile = useIsMobile();
  const [pronounsOpen, setPronounsOpen] = useState(false);

  // Close the pronoun dropdown first, so Escape doesn't discard the whole modal out from under it.
  useEscapeKey(() => {
    if (pronounsOpen) setPronounsOpen(false);
    else onClose();
  });

  const index = players.findIndex(p => p.id === activeDraftPlayerId);
  const player = players[index];
  if (!player) return null;

  const roleObj = PLAYABLE_ROLES.find(r => r.id === player.roleId);
  const isTownsfolk = roleObj?.team === 'townsfolk';
  const canBeDrunk = player.isTheDrunk || isTownsfolk;
  const canBeMarionette = player.isTheMarionette || isMarionetteEligible(
    players,
    player.id,
    player.roleId,
    roleId => PLAYABLE_ROLES.find(r => r.id === roleId)
  );
  const canBeLunatic = player.isTheLunatic || roleObj?.team === 'demon';
  const canBeLilMonsta = player.isTheLilMonsta || roleObj?.team === 'minion';

  const isDrunkSelectedElsewhere = players.some(pl => pl.id !== player.id && pl.isTheDrunk);
  const isMarionetteSelectedElsewhere = players.some(pl => pl.id !== player.id && pl.isTheMarionette);
  const isLunaticSelectedElsewhere = players.some(pl => pl.id !== player.id && pl.isTheLunatic);

  const preferredIds = [
    ...(player.preferences?.townsfolk || []),
    ...(player.preferences?.outsider || []),
    ...(player.preferences?.minion || []),
    ...(player.preferences?.demon || []),
  ];

  const filteredRoles = PLAYABLE_ROLES.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortRoles = (a: Role, b: Role) => {
    const isCurrentA = a.id === player.roleId;
    const isCurrentB = b.id === player.roleId;
    if (isCurrentA && !isCurrentB) return -1;
    if (!isCurrentA && isCurrentB) return 1;

    const orderA = TEAM_ORDER[a.team] ?? 99;
    const orderB = TEAM_ORDER[b.team] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  };

  const preferredRoles = filteredRoles.filter(r => preferredIds.includes(r.id)).sort(sortRoles);
  const otherRoles = filteredRoles.filter(r => !preferredIds.includes(r.id)).sort(sortRoles);

  const renderRoleButton = (role: Role, isPreferred: boolean) => {
    const selectedByPlayer = players.find(pl => pl.roleId === role.id && pl.id !== activeDraftPlayerId);
    const isCurrent = role.id === player.roleId;
    return (
      <button
        key={role.id}
        id={`role-option-${role.id}`}
        onClick={() => {
          updatePlayerRole(activeDraftPlayerId, isCurrent ? '' : role.id);
          onClose();
        }}
        className={cn(
          "w-full text-left px-3 py-2.5 text-xs transition-colors flex justify-between items-center",
          isPreferred ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-gray-800",
          isCurrent && (isLightModeActive ? "bg-amber-100/80 border-l-2 border-l-amber-600" : "bg-amber-500/10 border-l-2 border-l-amber-500")
        )}
      >
        <div className="flex items-center min-w-0 flex-1 gap-1.5 mr-2">
          <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0">
            <img
              src={`/icons/${role.id}.svg`}
              alt={role.name}
              className="w-3.5 h-3.5 object-contain"
              onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
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
          {isPreferred && (
            <span className="text-[8px] bg-amber-500/25 text-amber-400 px-1 rounded-sm uppercase font-extrabold tracking-wider leading-none shrink-0">
              ★ Pick
            </span>
          )}
          {selectedByPlayer && (
            <span className={cn(
              "text-[8px] px-1 py-0.5 rounded shrink-0 font-medium border",
              isLightModeActive
                ? "bg-gray-100 border-gray-200 text-gray-655"
                : "bg-gray-800/40 border-gray-700/30 text-gray-400"
            )}>
              Taken: {selectedByPlayer.name}
            </span>
          )}
        </div>
        <span className="text-[10px] uppercase font-mono text-gray-650">{role.team[0]}</span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        id="whalebucket-draft-edit-modal"
        className={cn(
          "w-full max-w-sm rounded-lg p-4 space-y-3 max-h-[85vh] flex flex-col shadow-2xl",
          isLightModeActive
            ? "bg-[#fdfaf2] border border-clocktower-blood/30 text-clocktower-night"
            : "bg-gray-900 border border-gray-800"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {onUpdatePronouns && (
              <PronounSelect
                id="draft-player-pronouns-select"
                pronouns={player.pronouns}
                onChange={(pronouns) => onUpdatePronouns(player.id, pronouns)}
                isLightModeActive={isLightModeActive}
                open={pronounsOpen}
                onOpenChange={setPronounsOpen}
              />
            )}
            <h3 className="truncate font-display font-bold text-base text-gray-200 tracking-wider uppercase">
              {player.name}
            </h3>
          </div>
          <CloseButton
            id="close-draft-edit-modal-button"
            onClick={onClose}
            isLightModeActive={isLightModeActive}
          />
        </div>

        {(canBeDrunk || canBeMarionette || canBeLunatic || canBeLilMonsta) && (
          <div className="flex flex-wrap gap-1.5">
            {canBeDrunk && (
              <CharacterModifierButton
                modifier="drunk"
                active={!!player.isTheDrunk}
                onClick={() => togglePlayerTheDrunk(player.id)}
                disabled={isDrunkSelectedElsewhere}
                size="regular"
              />
            )}
            {canBeMarionette && (
              <CharacterModifierButton
                modifier="marionette"
                active={!!player.isTheMarionette}
                onClick={() => togglePlayerTheMarionette(player.id)}
                disabled={isMarionetteSelectedElsewhere}
                size="regular"
              />
            )}
            {canBeLunatic && (
              <CharacterModifierButton
                modifier="lunatic"
                active={!!player.isTheLunatic}
                onClick={() => togglePlayerTheLunatic(player.id)}
                disabled={isLunaticSelectedElsewhere}
                size="regular"
              />
            )}
            {canBeLilMonsta && (
              <CharacterModifierButton
                modifier="lilmonsta"
                active={!!player.isTheLilMonsta}
                onClick={() => togglePlayerTheLilMonsta(player.id)}
                size="regular"
              />
            )}
          </div>
        )}

        <div className="border-t border-gray-800/80" />

        <SearchInput
          label="Search characters"
          placeholder="Search character name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus={!isMobile}
        />

        <div className="overflow-y-auto overscroll-contain flex-1 border border-gray-800 rounded bg-gray-955/40 divide-y divide-gray-800/60 pr-1">
          {preferredRoles.map(role => renderRoleButton(role, true))}
          {otherRoles.map(role => renderRoleButton(role, false))}
          {filteredRoles.length === 0 && (
            <div className="p-3 text-xs text-gray-550 italic text-center">No matching roles found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
