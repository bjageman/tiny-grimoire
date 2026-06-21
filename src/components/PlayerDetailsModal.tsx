import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Pencil, X, Search } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Role } from '../types';
import officialRoles from '../official_roles.json';

interface Player {
  id: string;
  name: string;
  roleId?: string;
  isDead?: boolean;
  isDrunkOrPoisoned?: boolean;
  isEvil?: boolean;
  isTheLilMonsta?: boolean;
  hasDeadVote?: boolean;
}

interface PlayerDetailsModalProps {
  player: Player;
  players: Player[];
  currentIndex: number;
  roleObj: Role | undefined;
  filteredModalRoles: Role[];
  isSearchingRole: boolean;
  modalRoleSearch: string;
  isLightModeActive: boolean;
  onClose: () => void;
  onPrevPlayer: () => void;
  onNextPlayer: () => void;
  onUpdateName: (id: string, name: string) => void;
  onUpdateRole: (id: string, roleId: string) => void;
  onToggleDead: (id: string) => void;
  onToggleDeadVote?: (id: string) => void;
  onToggleDrunkOrPoisoned: (id: string) => void;
  onToggleEvil: (id: string) => void;
  onToggleLilMonsta?: (id: string) => void;
  onSetSearchingRole: (v: boolean) => void;
  onSetModalRoleSearch: (v: string) => void;
  isLilMonstaGame?: boolean;
}

export default function PlayerDetailsModal({
  player: p,
  players,
  currentIndex,
  roleObj,
  filteredModalRoles,
  isSearchingRole,
  modalRoleSearch,
  isLightModeActive,
  onClose,
  onPrevPlayer,
  onNextPlayer,
  onUpdateName,
  onUpdateRole,
  onToggleDead,
  onToggleDeadVote,
  onToggleDrunkOrPoisoned,
  onToggleEvil,
  onToggleLilMonsta,
  onSetSearchingRole,
  onSetModalRoleSearch,
  isLilMonstaGame = false,
}: PlayerDetailsModalProps) {
  const modalNameInputRef = useRef<HTMLInputElement | null>(null);

  const defaultEvil = roleObj ? (roleObj.team === 'minion' || roleObj.team === 'demon') : false;
  const isEvil = p.isEvil !== undefined ? p.isEvil : defaultEvil;
  const officialRole = roleObj ? officialRoles.find(r => r.id === roleObj.id) : undefined;


  const teamFill = (team: Role['team']) => ({
    townsfolk: 'fill-clocktower-townsfolk',
    outsider: 'fill-clocktower-outsider',
    minion: 'fill-clocktower-minion',
    demon: 'fill-clocktower-demon',
    traveler: 'fill-clocktower-traveler',
  }[team] ?? 'fill-gray-500');

  const navBtnClass = cn(
    'absolute top-1/2 -translate-y-1/2 p-2.5 rounded-full border transition-all duration-200 z-10 shadow-lg hover:scale-110',
    isLightModeActive
      ? 'bg-white/80 border-gray-300 text-gray-700 hover:bg-white hover:text-clocktower-blood hover:border-clocktower-blood/40'
      : 'bg-gray-900/80 border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-700'
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      {/* Modal card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative border w-full max-w-sm md:max-w-xl rounded-lg pt-4 pb-6 px-5 space-y-3.5 shadow-2xl transition-colors duration-300',
          isLightModeActive
            ? 'bg-clocktower-parchment border-clocktower-blood/20 text-clocktower-night'
            : 'bg-gray-900 border-gray-800 text-clocktower-parchment'
        )}
      >
        {/* Nav arrows — vertically centered on left/right edges of card */}
        <button
          id="detail-prev-player-button"
          type="button"
          onClick={onPrevPlayer}
          className={cn(navBtnClass, 'left-0 -translate-x-1/2 md:-translate-x-full md:-left-3')}
          title="Previous player"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          id="detail-next-player-button"
          type="button"
          onClick={onNextPlayer}
          className={cn(navBtnClass, 'right-0 translate-x-1/2 md:translate-x-full md:-right-3')}
          title="Next player"
        >
          <ChevronRight size={22} />
        </button>

        {/* Row 1: Name (editable) + X close */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 group min-w-0 flex-1">
            <button
              type="button"
              onClick={() => modalNameInputRef.current?.focus()}
              className={cn(
                'p-1 rounded focus:outline-none transition-colors shrink-0',
                isLightModeActive ? 'hover:bg-black/5' : 'hover:bg-white/10'
              )}
              title="Edit name"
            >
              <Pencil
                size={13}
                className={cn(
                  'opacity-30 group-hover:opacity-75 transition-opacity',
                  isLightModeActive ? 'text-clocktower-night' : 'text-white'
                )}
              />
            </button>
            <div className="min-w-0 flex-1">
              <input
                ref={modalNameInputRef}
                type="text"
                value={p.name}
                onChange={(e) => onUpdateName(p.id, e.target.value)}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                autoCapitalize="words"
                className={cn(
                  'font-bold text-xl bg-transparent border-b border-transparent focus:border-clocktower-blood focus:outline-none w-full transition-all duration-200',
                  isLightModeActive ? 'text-clocktower-night' : 'text-white'
                )}
                placeholder="Player Name"
              />
              <p className={cn('text-[11px] font-medium mt-0', isLightModeActive ? 'text-gray-500' : 'text-gray-400')}>
                Player {currentIndex + 1} of {players.length}
              </p>
            </div>
          </div>
          <button
            id="detail-close-button"
            type="button"
            onClick={onClose}
            className={cn(
              'p-1.5 rounded-lg border transition-colors shrink-0',
              isLightModeActive
                ? 'border-gray-300 text-gray-600 hover:bg-gray-100'
                : 'border-gray-700 text-gray-400 hover:bg-gray-800'
            )}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Character section */}
        <div className="py-3 border-t border-b border-dashed border-gray-300/20">
          {isSearchingRole ? (
            <div className="space-y-3 animate-fadeIn">
              {/* Search bar + cancel */}
              <div className="flex items-center gap-2">
                <div className={cn(
                  'flex items-center border rounded px-2.5 py-1.5 text-sm flex-1',
                  isLightModeActive ? 'bg-white border-gray-300' : 'bg-gray-950 border-gray-800'
                )}>
                  <Search size={14} className="text-gray-500 mr-2 shrink-0" />
                  <input
                    id="detail-role-search-input"
                    type="text"
                    placeholder="Search character name..."
                    className={cn(
                      'bg-transparent flex-1 outline-none text-sm',
                      isLightModeActive ? 'text-clocktower-night' : 'text-white'
                    )}
                    value={modalRoleSearch}
                    onChange={(e) => onSetModalRoleSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <button
                  id="detail-cancel-role-search-button"
                  type="button"
                  onClick={() => { onSetSearchingRole(false); onSetModalRoleSearch(''); }}
                  className={cn(
                    'px-3 py-1.5 rounded border text-xs font-semibold transition-colors shrink-0',
                    isLightModeActive
                      ? 'border-gray-300 text-gray-600 hover:bg-gray-100'
                      : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                  )}
                >
                  Cancel
                </button>
              </div>
              {/* Role list */}
              <RoleList
                hasRole={!!p.roleId}
                roles={filteredModalRoles}
                players={players}
                currentPlayerId={p.id}
                isLightModeActive={isLightModeActive}
                onSelect={(roleId) => {
                  onUpdateRole(p.id, roleId);
                  onSetSearchingRole(false);
                  onSetModalRoleSearch('');
                }}
                onClear={() => {
                  onUpdateRole(p.id, '');
                  onSetSearchingRole(false);
                  onSetModalRoleSearch('');
                }}
              />
            </div>
          ) : (
            /* Character display — click to open search */
            <button
              id="detail-change-role-button"
              type="button"
              onClick={() => onSetSearchingRole(true)}
              className={cn(
                'w-full flex flex-col items-center justify-center py-4 rounded-xl border border-transparent transition-all duration-200 hover:scale-[1.02]',
                isLightModeActive
                  ? 'hover:bg-black/5 hover:border-gray-300/40'
                  : 'hover:bg-white/5 hover:border-gray-800/40'
              )}
            >
              {roleObj ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative w-36 h-36 flex items-center justify-center select-none">
                    {/* The SVG containing the token background, inner rings, and curved text */}
                    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl absolute inset-0 z-10">
                      <defs>
                        {/* Top text path (arcing upwards, clockwise from 9 to 3 o'clock) */}
                        <path id="topTextPath" d="M 32,100 A 68,68 0 0,1 168,100" fill="none" />
                        {/* Bottom text path (arcing downwards, clockwise from 3 to 9 o'clock) */}
                        <path id="bottomTextPath" d="M 168,100 A 68,68 0 0,1 32,100" fill="none" />
                      </defs>
                      
                      {/* Token background circle */}
                      <circle cx="100" cy="100" r="90" fill="#ffffff" stroke="#d4d4d8" strokeWidth="6" />
                      {/* Inner ring for aesthetic detail wrapping the central icon */}
                      <circle cx="100" cy="100" r="58" fill="none" stroke="#e4e4e7" strokeWidth="1" strokeDasharray="3 3" />
                      
                      {/* Curved character name at the top */}
                      <text className={cn("font-bold text-[18px] tracking-wider uppercase", teamFill(roleObj.team))}>
                        <textPath href="#topTextPath" startOffset="50%" textAnchor="middle">
                          {roleObj.name}
                        </textPath>
                      </text>
                      
                      {/* Curved character type at the bottom */}
                      <text className={cn("font-bold text-[11px] tracking-widest uppercase", teamFill(roleObj.team))}>
                        <textPath href="#bottomTextPath" startOffset="50%" textAnchor="middle">
                          {roleObj.team}
                        </textPath>
                      </text>
                    </svg>
                    
                    {/* Centered character icon */}
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      <div className="w-[47%] h-[47%] flex items-center justify-center">
                        <img
                          src={`/icons/${roleObj.id}.svg`}
                          alt={roleObj.name}
                          className="w-full h-full object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2 py-1">
                  <div className={cn(
                    'w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center text-4xl font-light transition-colors',
                    isLightModeActive
                      ? 'border-gray-300 text-gray-400 bg-gray-50'
                      : 'border-gray-800 text-gray-600 bg-gray-950/40'
                  )}>
                    ?
                  </div>
                  <div className="text-center">
                    <p className={cn('text-lg font-semibold', isLightModeActive ? 'text-gray-500' : 'text-gray-400')}>
                      No Character Assigned
                    </p>
                    <p className="text-xs opacity-50 mt-0.5">Click to select a character</p>
                  </div>
                </div>
              )}
            </button>
          )}
          {roleObj && officialRole?.ability && (
            <div className="text-center px-4 mt-2">
              <p className={cn(
                'text-xs leading-relaxed italic font-medium',
                isLightModeActive ? 'text-gray-650' : 'text-gray-300'
              )}>
                "{officialRole.ability}"
              </p>
            </div>
          )}
        </div>

        {/* Status toggles */}
        <div className="flex items-center gap-2">
          <button
            id="detail-status-toggle-button"
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleDead(p.id); }}
            className={cn(
              'px-4 py-2 rounded text-xs font-bold border transition-all shadow-sm flex-1',
              !p.isDead
                ? 'bg-clocktower-outsider border-clocktower-outsider/40 text-white hover:bg-emerald-600'
                : 'bg-clocktower-blood border-clocktower-blood/40 text-white hover:bg-red-800'
            )}
          >
            {p.isDead ? 'Dead' : 'Alive'}
          </button>
          <button
            id="detail-alignment-toggle-button"
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleEvil(p.id); }}
            className={cn(
              'px-4 py-2 rounded text-xs font-bold border transition-all shadow-sm flex-1',
              !isEvil
                ? 'bg-clocktower-townsfolk border-clocktower-townsfolk/40 text-white hover:bg-blue-600'
                : 'bg-clocktower-minion border-clocktower-minion/40 text-white hover:bg-red-500'
            )}
          >
            {isEvil ? '👿 Evil' : '😇 Good'}
          </button>
          <button
            id="detail-drunk-poisoned-toggle-button"
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleDrunkOrPoisoned(p.id); }}
            className={cn(
              'px-4 py-2 rounded text-xs font-bold border transition-all shadow-sm flex-1 flex items-center justify-center gap-1',
              p.isDrunkOrPoisoned
                ? 'bg-purple-600 border-purple-600/40 text-white hover:bg-purple-700'
                : isLightModeActive
                  ? 'bg-white border-gray-300 text-gray-400 hover:text-gray-600'
                  : 'bg-gray-950/40 border-gray-800 text-gray-550 hover:text-gray-300'
            )}
          >
            🤢 Drunk/Poisoned
          </button>
        </div>

        {(p.isDead || isLilMonstaGame) && (
          <div className="flex items-center gap-2">
            {p.isDead && (
              <button
                id="detail-vote-token-toggle"
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleDeadVote?.(p.id); }}
                className={cn(
                  'px-3 py-2 rounded text-[11px] font-bold border transition-all shadow-sm flex-1 flex items-center justify-center gap-1',
                  p.hasDeadVote
                    ? 'bg-amber-600 border-amber-600/40 text-white hover:bg-amber-700'
                    : isLightModeActive
                      ? 'bg-white border-gray-300 text-gray-400 hover:text-gray-655'
                      : 'bg-gray-955 border-gray-800 text-gray-550 hover:text-gray-300'
                )}
              >
                🗳️ {p.hasDeadVote ? 'Vote: Active' : 'Vote: Spent'}
              </button>
            )}

            {isLilMonstaGame && (
              <button
                id="detail-lilmonsta-toggle-button"
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleLilMonsta?.(p.id); }}
                className={cn(
                  'px-3 py-2 rounded text-[11px] font-bold border transition-all shadow-sm flex-1 flex items-center justify-center gap-1',
                  p.isTheLilMonsta
                    ? 'bg-clocktower-demon border-clocktower-demon/40 text-white font-black hover:bg-red-800'
                    : isLightModeActive
                      ? 'bg-white border-gray-300 text-gray-400 hover:text-gray-600'
                      : 'bg-gray-955/40 border-gray-800 text-gray-550 hover:text-gray-300'
                )}
              >
                😈 Lil' Monsta
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Internal sub-component ──────────────────────────────────────────────────

interface RoleListProps {
  hasRole: boolean;
  roles: Role[];
  players: Player[];
  currentPlayerId: string;
  isLightModeActive: boolean;
  onSelect: (roleId: string) => void;
  onClear: () => void;
}

function RoleList({ hasRole, roles, players, currentPlayerId, isLightModeActive, onSelect, onClear }: RoleListProps) {
  const teamColor = (team: Role['team']) => ({
    townsfolk: 'text-clocktower-townsfolk',
    outsider: 'text-clocktower-outsider',
    minion: 'text-clocktower-minion',
    demon: 'text-clocktower-demon',
    traveler: 'text-clocktower-traveler',
  }[team] ?? '');

  return (
    <div className={cn(
      'overflow-y-auto max-h-32 md:max-h-36 border rounded divide-y pr-1',
      isLightModeActive
        ? 'border-gray-300 bg-white/50 divide-gray-200'
        : 'border-gray-800 bg-gray-950/40 divide-gray-800'
    )}>
      {hasRole && (
        <button
          id="detail-clear-role-button"
          type="button"
          onClick={onClear}
          className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-xs text-red-500 font-semibold border-b transition-colors"
          style={{ borderColor: isLightModeActive ? '#e5e7eb' : '#1f2937' }}
        >
          × Clear Character
        </button>
      )}
      {roles.map((role) => {
        const takenBy = players.find((pl) => pl.roleId === role.id && pl.id !== currentPlayerId);
        const currentPlayer = players.find((pl) => pl.id === currentPlayerId);
        const isCurrent = role.id === currentPlayer?.roleId;
        return (
          <button
            id={`detail-role-option-${role.id}`}
            key={role.id}
            type="button"
            onClick={() => onSelect(role.id)}
            className={cn(
              'w-full text-left px-3 py-2 text-xs transition-colors flex justify-between items-center',
              isCurrent
                ? (isLightModeActive ? 'bg-amber-100/80 border-l-2 border-l-amber-600' : 'bg-amber-500/10 border-l-2 border-l-amber-500')
                : (isLightModeActive ? 'hover:bg-gray-100 text-clocktower-night' : 'hover:bg-gray-800 text-gray-200')
            )}
          >
            <div className="flex items-center min-w-0 flex-1 gap-2 mr-2">
              <span className="w-5.5 h-5.5 bg-white rounded-full flex items-center justify-center shrink-0">
                <img
                  src={`/icons/${role.id}.svg`}
                  alt={role.name}
                  className="w-4 h-4 object-contain"
                  onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
                />
              </span>
              <span className={cn(
                'font-semibold text-xs truncate',
                isCurrent
                  ? (isLightModeActive ? 'text-gray-950 font-bold' : 'text-white font-bold')
                  : teamColor(role.team)
              )}>
                {role.name} {isCurrent && '✓'}
              </span>
              {takenBy && (
                <span className={cn(
                  'text-[8px] px-1 py-0.5 rounded shrink-0 font-medium border',
                  isLightModeActive
                    ? 'bg-gray-100 border-gray-200 text-gray-500'
                    : 'bg-gray-800/40 border-gray-700 text-gray-400'
                )}>
                  Taken: {takenBy.name}
                </span>
              )}
            </div>
            <span className="text-[9px] uppercase font-mono opacity-50">{role.team[0]}</span>
          </button>
        );
      })}
      {roles.length === 0 && (
        <div className="p-3 text-xs text-gray-500 italic text-center">No matching roles found.</div>
      )}
    </div>
  );
}
