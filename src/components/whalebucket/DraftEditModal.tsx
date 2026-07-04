import { Search } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useIsMobile } from '../../hooks/useIsMobile';
import { cn } from '../../utils/cn';
import type { Player } from '../../WhaleBucket';
import type { Role } from '../../types';
import { TEAM_ORDER } from '../../types';
import rolesData from '../../roles.json';

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
  isLightModeActive,
  onClose,
}: WhaleBucketDraftEditModalProps) {
  useScrollLock();
  const isMobile = useIsMobile();

  const index = players.findIndex(p => p.id === activeDraftPlayerId);
  const player = players[index];
  if (!player) return null;

  const roleObj = (rolesData as Role[]).find(r => r.id === player.roleId);
  const isTownsfolk = roleObj?.team === 'townsfolk';
  const isGood = roleObj?.team === 'townsfolk' || roleObj?.team === 'outsider';

  const N = players.length;
  const leftNeighbor = players[(index - 1 + N) % N];
  const rightNeighbor = players[(index + 1) % N];
  const leftRoleObj = (rolesData as Role[]).find(r => r.id === leftNeighbor?.roleId);
  const rightRoleObj = (rolesData as Role[]).find(r => r.id === rightNeighbor?.roleId);
  const isNextToDemon = (leftRoleObj?.team === 'demon' && !leftNeighbor?.isTheLunatic)
    || (rightRoleObj?.team === 'demon' && !rightNeighbor?.isTheLunatic);

  const canBeDrunk = player.isTheDrunk || isTownsfolk;
  const canBeMarionette = player.isTheMarionette || (isGood && isNextToDemon);
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

  const filteredRoles = (rolesData as Role[]).filter(r =>
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
        onClick={() => updatePlayerRole(activeDraftPlayerId, role.id)}
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
        <div className="flex justify-between items-center">
          <h3 className="font-display font-bold text-sm text-gray-200 tracking-wider uppercase">
            {player.name}
          </h3>
          <button id="close-draft-edit-modal-button" onClick={onClose} className="text-xs text-gray-500 underline">
            Close
          </button>
        </div>

        {(canBeDrunk || canBeMarionette || canBeLunatic || canBeLilMonsta) && (
          <div className="flex flex-wrap gap-1.5">
            {canBeDrunk && (
              <button
                type="button"
                disabled={isDrunkSelectedElsewhere}
                onClick={() => togglePlayerTheDrunk(player.id)}
                className={cn(
                  "px-2.5 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed",
                  player.isTheDrunk
                    ? "bg-yellow-600 border-yellow-755 text-black font-black"
                    : "bg-gray-955 border-gray-855 text-gray-500 hover:text-gray-400"
                )}
              >
                <span className="w-4 h-4 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                  <img
                    src="/icons/drunk.svg"
                    alt=""
                    className="w-3 h-3 object-contain"
                    onError={e => { e.currentTarget.parentElement!.style.display = 'none'; }}
                  />
                </span>
                The Drunk
              </button>
            )}
            {canBeMarionette && (
              <button
                type="button"
                disabled={isMarionetteSelectedElsewhere}
                onClick={() => togglePlayerTheMarionette(player.id)}
                className={cn(
                  "px-2.5 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed",
                  player.isTheMarionette
                    ? "bg-clocktower-minion border-clocktower-minion/40 text-white font-black"
                    : "bg-gray-955 border-gray-855 text-gray-500 hover:text-gray-400"
                )}
              >
                <span className="w-4 h-4 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                  <img
                    src="/icons/marionette.svg"
                    alt=""
                    className="w-3 h-3 object-contain"
                    onError={e => { e.currentTarget.parentElement!.style.display = 'none'; }}
                  />
                </span>
                The Marionette
              </button>
            )}
            {canBeLunatic && (
              <button
                type="button"
                disabled={isLunaticSelectedElsewhere}
                onClick={() => togglePlayerTheLunatic(player.id)}
                className={cn(
                  "px-2.5 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed",
                  player.isTheLunatic
                    ? "bg-clocktower-outsider border-clocktower-outsider/40 text-white font-black"
                    : "bg-gray-955 border-gray-855 text-gray-500 hover:text-gray-400"
                )}
              >
                <span className="w-4 h-4 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                  <img
                    src="/icons/lunatic.svg"
                    alt=""
                    className="w-3 h-3 object-contain"
                    onError={e => { e.currentTarget.parentElement!.style.display = 'none'; }}
                  />
                </span>
                The Lunatic
              </button>
            )}
            {canBeLilMonsta && (
              <button
                type="button"
                onClick={() => togglePlayerTheLilMonsta(player.id)}
                className={cn(
                  "px-2.5 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1",
                  player.isTheLilMonsta
                    ? "bg-clocktower-demon border-clocktower-demon/40 text-white font-black"
                    : "bg-gray-955 border-gray-855 text-gray-500 hover:text-gray-400"
                )}
              >
                <span className="w-4 h-4 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                  <img
                    src="/icons/lilmonsta.svg"
                    alt=""
                    className="w-3.5 h-3.5 object-contain"
                    onError={e => { e.currentTarget.parentElement!.style.display = 'none'; }}
                  />
                </span>
                Lil' Monsta
              </button>
            )}
          </div>
        )}

        <div className="border-t border-gray-800/80" />

        <div className="flex items-center bg-white border border-gray-300 rounded px-3 py-2 text-sm shrink-0">
          <Search size={14} className="text-gray-400 mr-2" />
          <input
            type="text"
            autoFocus={!isMobile}
            placeholder="Search character name..."
            className="bg-transparent flex-1 outline-none text-xs text-gray-900 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

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
