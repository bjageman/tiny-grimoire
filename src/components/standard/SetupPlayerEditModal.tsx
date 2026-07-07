import { useScrollLock } from '../../hooks/useScrollLock';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useBufferedField } from '../../hooks/useBufferedField';
import { Search, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { roleIconFallback } from '../../utils/roleIcon';
import type { Player, Role } from '../../types';

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

const PRONOUN_OPTIONS = ['He/Him', 'She/Her', 'They/Them', 'Ask Me'];

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
  onClose,
  isSecondary,
}: SetupPlayerEditModalProps) {
  useScrollLock();
  const isMobile = useIsMobile();

  const player = players.find(p => p.id === activePlayerId);
  const index = players.findIndex(p => p.id === activePlayerId);

  const [editedName, setEditedName] = useBufferedField(activePlayerId, player?.name ?? '', updatePlayerName);

  if (!player) return null;

  const roleObj = selectionRoles.find(r => r.id === player.roleId);

  const hasDrunkInScript = !customScriptRoles || customScriptRoles.some(r => r.id === 'drunk');
  const hasMarionetteInScript = !customScriptRoles || customScriptRoles.some(r => r.id === 'marionette');
  const hasLunaticInScript = !customScriptRoles || customScriptRoles.some(r => r.id === 'lunatic');
  const hasLilMonstaInScript = !customScriptRoles || customScriptRoles.some(r => r.id === 'lilmonsta');

  const N = players.length;
  const leftNeighbor = players[(index - 1 + N) % N];
  const rightNeighbor = players[(index + 1) % N];
  const leftRoleObj = selectionRoles.find(r => r.id === leftNeighbor?.roleId);
  const rightRoleObj = selectionRoles.find(r => r.id === rightNeighbor?.roleId);
  const isNextToDemon = (leftRoleObj?.team === 'demon' && !leftNeighbor?.isTheLunatic)
    || (rightRoleObj?.team === 'demon' && !rightNeighbor?.isTheLunatic);

  const isGood = roleObj?.team === 'townsfolk' || roleObj?.team === 'outsider';
  const canBeDrunk = player.isTheDrunk || (roleObj?.team === 'townsfolk' && hasDrunkInScript);
  const canBeMarionette = player.isTheMarionette || (isGood && isNextToDemon && hasMarionetteInScript);
  const canBeLunatic = player.isTheLunatic || (roleObj?.team === 'demon' && hasLunaticInScript);
  const canBeLilMonsta = player.isTheLilMonsta || (roleObj?.team === 'minion' && hasLilMonstaInScript);

  const isDrunkSelectedElsewhere = players.some(pl => pl.id !== player.id && pl.isTheDrunk);
  const isMarionetteSelectedElsewhere = players.some(pl => pl.id !== player.id && pl.isTheMarionette);
  const isLunaticSelectedElsewhere = players.some(pl => pl.id !== player.id && pl.isTheLunatic);

  const filteredRoles = selectionRoles
    .filter(r =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.team.toLowerCase().includes(searchTerm.toLowerCase())
    )
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
        <div className="flex justify-between items-center">
          <h3 className="font-display font-bold text-sm text-gray-200 tracking-wider uppercase">
            Edit Player
          </h3>
          <button id="close-player-edit-modal-button" onClick={onClose} className="text-xs text-gray-500 underline">
            Close
          </button>
        </div>

        <div className="flex items-center gap-3">
          {(() => {
            const isSecondaryDevice = !!isSecondary;
            return (
              <>
                <button
                  id="remove-player-button"
                  type="button"
                  disabled={isSecondaryDevice}
                  onClick={() => { if (!isSecondaryDevice) { removePlayer(player.id); onClose(); } }}
                  className={cn(
                    "shrink-0 p-2 rounded border border-gray-800 transition-colors",
                    isSecondaryDevice 
                      ? "text-gray-700 border-gray-800/45 cursor-not-allowed opacity-40" 
                      : "text-gray-500 hover:text-red-500 hover:border-red-500/40"
                  )}
                  title={isSecondaryDevice ? "This action is disabled on secondary devices." : "Remove player"}
                >
                  <Trash2 size={16} />
                </button>
                <input
                  id="edit-player-name-input"
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); onClose(); } }}
                  autoFocus={!isMobile}
                  autoCapitalize="words"
                  placeholder="Player name"
                  className="flex-1 min-w-0 bg-gray-955 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-clocktower-blood text-sm font-semibold"
                />
              </>
            );
          })()}
        </div>

        {onUpdatePronouns && (
          <select
            id="setup-player-pronouns-select"
            value={player.pronouns || ''}
            onChange={(e) => onUpdatePronouns(player.id, e.target.value)}
            className={cn(
              'rounded px-2 py-1.5 text-xs font-medium border focus:outline-none focus:border-clocktower-blood transition-colors cursor-pointer self-start',
              isLightModeActive
                ? 'bg-white border-gray-300 text-gray-600'
                : 'bg-gray-955 border-gray-800 text-gray-400'
            )}
          >
            <option value="" className={isLightModeActive ? 'bg-white text-gray-600' : 'bg-gray-955 text-gray-400'}>Pronouns</option>
            {PRONOUN_OPTIONS.map(option => (
              <option key={option} value={option} className={isLightModeActive ? 'bg-white text-clocktower-night' : 'bg-gray-955 text-gray-200'}>
                {option}
              </option>
            ))}
          </select>
        )}

        {(canBeDrunk || canBeMarionette || canBeLunatic || canBeLilMonsta) && (
          <div className="flex flex-wrap justify-end gap-1.5">
            {canBeDrunk && (
              <button
                id={`toggle-drunk-button-${player.id}`}
                type="button"
                disabled={isDrunkSelectedElsewhere}
                onClick={() => togglePlayerTheDrunk(player.id)}
                className={cn(
                  "px-2.5 py-1 rounded text-[14px] font-bold border transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed",
                  player.isTheDrunk
                    ? "bg-yellow-600 border-yellow-755 text-black font-black"
                    : "bg-gray-955 border-gray-855 text-gray-500 hover:text-gray-400"
                )}
              >
                <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                  <img
                    src="/icons/drunk.svg"
                    alt=""
                    className="w-3.5 h-3.5 object-contain"
                    onError={e => { e.currentTarget.parentElement!.style.display = 'none'; }}
                  />
                </span>
                The Drunk
              </button>
            )}
            {canBeMarionette && (
              <button
                id={`toggle-marionette-button-${player.id}`}
                type="button"
                disabled={isMarionetteSelectedElsewhere}
                onClick={() => togglePlayerTheMarionette(player.id)}
                className={cn(
                  "px-2.5 py-1 rounded text-[14px] font-bold border transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed",
                  player.isTheMarionette
                    ? "bg-clocktower-minion border-clocktower-minion/40 text-white font-black"
                    : "bg-gray-955 border-gray-855 text-gray-500 hover:text-gray-400"
                )}
              >
                <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                  <img
                    src="/icons/marionette.svg"
                    alt=""
                    className="w-3.5 h-3.5 object-contain"
                    onError={e => { e.currentTarget.parentElement!.style.display = 'none'; }}
                  />
                </span>
                The Marionette
              </button>
            )}
            {canBeLunatic && (
              <button
                id={`toggle-lunatic-button-${player.id}`}
                type="button"
                disabled={isLunaticSelectedElsewhere}
                onClick={() => togglePlayerTheLunatic(player.id)}
                className={cn(
                  "px-2.5 py-1 rounded text-[14px] font-bold border transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed",
                  player.isTheLunatic
                    ? "bg-clocktower-outsider border-clocktower-outsider/40 text-white font-black"
                    : "bg-gray-955 border-gray-855 text-gray-500 hover:text-gray-400"
                )}
              >
                <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                  <img
                    src="/icons/lunatic.svg"
                    alt=""
                    className="w-3.5 h-3.5 object-contain"
                    onError={e => { e.currentTarget.parentElement!.style.display = 'none'; }}
                  />
                </span>
                The Lunatic
              </button>
            )}
            {canBeLilMonsta && (
              <button
                id={`toggle-lilmonsta-button-${player.id}`}
                type="button"
                onClick={() => togglePlayerTheLilMonsta(player.id)}
                className={cn(
                  "px-2.5 py-1 rounded text-[14px] font-bold border transition-all flex items-center gap-1",
                  player.isTheLilMonsta
                    ? "bg-clocktower-demon border-clocktower-demon/40 text-white font-black"
                    : "bg-gray-955 border-gray-855 text-gray-500 hover:text-gray-400"
                )}
              >
                <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
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

        <div id="role-search-wrapper" className="flex items-center bg-white border border-gray-300 rounded px-3 py-2 text-sm shrink-0">
          <Search size={14} className="text-gray-400 mr-2" />
          <input
            id="role-search-input"
            type="text"
            placeholder="Search character name..."
            className="bg-transparent flex-1 outline-none text-xs text-gray-900 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div id="role-list" className="overflow-y-auto overscroll-contain flex-1 border border-gray-800 rounded bg-gray-955/40 divide-y divide-gray-800/60 pr-1">
          {filteredRoles.map(role => {
            const selectedByPlayer = players.find(pl => pl.roleId === role.id && pl.id !== activePlayerId);
            const isCurrent = role.id === player.roleId;
            return (
              <button
                id={`role-option-${role.id}`}
                key={role.id}
                onClick={() => { updatePlayerRole(activePlayerId, role.id); onClose(); }}
                className={cn(
                  "w-full text-left px-3 py-2.5 hover:bg-gray-800 text-xs transition-colors flex justify-between items-center",
                  isCurrent && (isLightModeActive ? "bg-amber-100/80 border-l-2 border-l-amber-600" : "bg-amber-500/10 border-l-2 border-l-amber-500")
                )}
              >
                <div className="flex items-center min-w-0 flex-1 gap-1.5 mr-2">
                  <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0">
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
                      Taken: {selectedByPlayer.name}
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
