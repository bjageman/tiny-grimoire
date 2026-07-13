import { useRef, useMemo, useState } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useBufferedField } from '../../hooks/useBufferedField';
import { ChevronLeft, ChevronRight, X, Search } from 'lucide-react';
import { cn } from '../../utils/cn';
import { roleIconFallback } from '../../utils/roleIcon';
import { TEAM_ORDER, type Role } from '../../types';
import rolesData from '../../roles.json';
import officialRoles from '../../official_roles.json';
import DialogModal from './DialogModal';
import ToggleSwitch from './ToggleSwitch';
import CharacterDetailModal from './CharacterDetailModal';
import { useDialog } from '../../hooks/useDialog';

interface Player {
  id: string;
  name: string;
  roleId?: string;
  roleIds?: string[];
  isDead?: boolean;
  isDrunkOrPoisoned?: boolean;
  isEvil?: boolean;
  isTheDrunk?: boolean;
  isTheMarionette?: boolean;
  isTheLunatic?: boolean;
  isTheLilMonsta?: boolean;
  hasDeadVote?: boolean;
  notes?: string;
  pronouns?: string;
}

interface PlayerDetailsModalProps {
  player: Player;
  players: Player[];
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
  allowMultipleRoles?: boolean;
  onUpdateRoles?: (id: string, roleIds: string[]) => void;
  isSynced?: boolean;
  onUpdateNotes?: (id: string, notes: string) => void;
  onUpdatePronouns?: (id: string, pronouns: string) => void;
  onLogEvent?: (msg: string) => void;
  /** Full current-script role list (including custom/homebrew roles), used to resolve candidate role tokens in allowMultipleRoles mode. */
  allRoles?: Role[];
}

const PRONOUN_OPTIONS = ['He/Him', 'She/Her', 'They/Them', 'Ask Me'];

export default function PlayerDetailsModal({
  player: p,
  players,
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
  allowMultipleRoles = false,
  onUpdateRoles,
  isSynced = false,
  onUpdateNotes,
  onUpdatePronouns,
  onLogEvent,
  allRoles = [],
}: PlayerDetailsModalProps) {
  useScrollLock();
  const originalName = useRef('');
  const originalNotes = useRef('');
  const [editedName, setEditedName] = useBufferedField(p.id, p.name, onUpdateName);
  const [editedNotes, setEditedNotes] = useBufferedField(p.id, p.notes ?? '', (id, notes) => onUpdateNotes?.(id, notes));
  const isMobile = useIsMobile();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [sortAlphabetically, setSortAlphabetically] = useState(() => {
    return localStorage.getItem('botc-sort-alphabetically') === 'true';
  });

  const handleToggleSort = (val: boolean) => {
    setSortAlphabetically(val);
    localStorage.setItem('botc-sort-alphabetically', String(val));
  };

  const displayRolesList = useMemo(() => {
    return [...filteredModalRoles].sort((a, b) => {
      // 1. Currently assigned role(s) float to the top
      const isCurrentA = allowMultipleRoles ? (p.roleIds ?? []).includes(a.id) : a.id === p.roleId;
      const isCurrentB = allowMultipleRoles ? (p.roleIds ?? []).includes(b.id) : b.id === p.roleId;
      if (isCurrentA && !isCurrentB) return -1;
      if (!isCurrentA && isCurrentB) return 1;

      // 2. Keep teams separated
      const orderA = TEAM_ORDER[a.team] ?? 99;
      const orderB = TEAM_ORDER[b.team] ?? 99;
      if (orderA !== orderB) return orderA - orderB;

      // 3. Sort within team
      if (allowMultipleRoles && sortAlphabetically) {
        return a.name.localeCompare(b.name);
      } else {
        // Sort by script JSON order (using allRoles)
        const indexA = allRoles.findIndex((r) => r.id === a.id);
        const indexB = allRoles.findIndex((r) => r.id === b.id);
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        return a.name.localeCompare(b.name);
      }
    });
  }, [filteredModalRoles, sortAlphabetically, allowMultipleRoles, allRoles, p.roleId, p.roleIds]);

  const modalNameInputRef = useRef<HTMLInputElement | null>(null);
  const { dialogProps, showAlert } = useDialog();

  const defaultEvil = roleObj ? (roleObj.team === 'minion' || roleObj.team === 'demon') : false;
  const isEvil = p.isEvil !== undefined ? p.isEvil : defaultEvil;
  const officialRole = roleObj ? officialRoles.find(r => r.id === roleObj.id) : undefined;
  const roleAbility = roleObj?.ability ?? officialRole?.ability;

  const resolveRole = (roleId: string) =>
    allRoles.find(r => r.id === roleId) ?? (rolesData as Role[]).find(r => r.id === roleId);

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

  // Setup multiple roles array or single role array
  const displayRoles = useMemo(() => {
    if (allowMultipleRoles && p.roleIds && p.roleIds.length > 0) {
      return p.roleIds;
    }
    if (p.roleId) return [p.roleId];
    if (p.isTheDrunk) return ['drunk'];
    if (p.isTheMarionette) return ['marionette'];
    if (p.isTheLunatic) return ['lunatic'];
    if (p.isTheLilMonsta) return ['lilmonsta'];
    return [];
  }, [allowMultipleRoles, p.roleIds, p.roleId, p.isTheDrunk, p.isTheMarionette, p.isTheLunatic, p.isTheLilMonsta]);

  return (
    <>
    <DialogModal {...dialogProps} isLightModeActive={isLightModeActive} />
    <div
      id={allowMultipleRoles ? "tracker-player-details-backdrop" : "host-player-details-backdrop"}
      onClick={onClose}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      {/* Modal card */}
      <div
        id={allowMultipleRoles ? "tracker-player-details-modal" : "host-player-details-modal"}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-md rounded-2xl border p-6 flex flex-col gap-6 shadow-2xl transition-colors duration-300 group',
          isLightModeActive
            ? 'bg-[#fdfaf2] border-clocktower-blood/30 text-clocktower-night'
            : 'bg-gray-900 border-gray-800 text-clocktower-parchment'
        )}
      >
        {/* Navigations buttons */}
        {players.length > 1 && (
          <button
            id="detail-prev-player-button"
            type="button"
            onClick={(e) => { e.stopPropagation(); onPrevPlayer(); }}
            className={cn(navBtnClass, '-left-5 md:-left-7')}
            title="Previous Player"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {players.length > 1 && (
          <button
            id="detail-next-player-button"
            type="button"
            onClick={(e) => { e.stopPropagation(); onNextPlayer(); }}
            className={cn(navBtnClass, '-right-5 md:-right-7')}
            title="Next Player"
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Top title and close */}
        <div className="flex justify-between items-start w-full">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <input
                id="detail-player-name-input"
                ref={modalNameInputRef}
                type="text"
                value={editedName}
                disabled={isSynced}
                onChange={(e) => setEditedName(e.target.value)}
                onFocus={(e) => { originalName.current = e.target.value; e.target.select(); }}
                onBlur={(e) => { if (onLogEvent && e.target.value.trim() && e.target.value !== originalName.current) onLogEvent(`${originalName.current} renamed to ${e.target.value}`); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); onClose(); } }}
                autoCapitalize="words"
                className={cn(
                  'font-bold text-xl bg-white rounded-md px-2.5 py-1 border border-transparent focus:border-clocktower-blood focus:outline-none w-full transition-all duration-200 text-clocktower-night',
                  isSynced && 'cursor-default pointer-events-none hover:border-transparent'
                )}
                placeholder="Player Name"
              />
              {isSynced ? (
                p.pronouns && (
                  <p className={cn('text-sm font-medium mt-0 pb-0 -mb-5 pt-1 px-3', isLightModeActive ? 'text-gray-500' : 'text-gray-400')}>
                    {p.pronouns}
                  </p>
                )
              ) : !allowMultipleRoles && onUpdatePronouns && (
                <select
                  id="detail-player-pronouns-select"
                  value={p.pronouns || ''}
                  onChange={(e) => onUpdatePronouns(p.id, e.target.value)}
                  className={cn(
                    'rounded px-1.5 py-1 mt-1.5 text-sm font-medium border focus:outline-none focus:border-clocktower-blood transition-colors cursor-pointer',
                    isLightModeActive
                      ? 'bg-white border-gray-300 text-gray-600'
                      : 'bg-gray-800/50 border-gray-700 text-gray-400'
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
              {!isSynced && onUpdateNotes && (
                <input
                  type="text"
                  placeholder="Notes..."
                  value={editedNotes}
                  onFocus={(e) => { originalNotes.current = e.target.value; }}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  onBlur={(e) => { if (onLogEvent && e.target.value.trim() && e.target.value !== originalNotes.current) onLogEvent(`Note — ${p.name}: ${e.target.value}`); }}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  className={cn(
                    'w-full mt-1.5 rounded px-2 py-1.5 -mb-2 text-xs border focus:outline-none focus:border-clocktower-blood/60 transition-colors',
                    isLightModeActive
                      ? 'bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400'
                      : 'bg-gray-800/50 border-gray-700 text-gray-300 placeholder-gray-500'
                  )}
                />
              )}
            </div>
          </div>
          <button
            id="detail-close-button"
            type="button"
            onClick={onClose}
            className={cn(
              'p-2 ml-2 rounded-lg border transition-colors shrink-0 shadow-sm',
              isLightModeActive
                ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                : 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700'
            )}
            title="Close"
          >
            <X size={20} />
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
                  isLightModeActive ? 'bg-white border-gray-300' : 'bg-white border-gray-300'
                )}>
                  <Search size={14} className="text-gray-500 mr-2 shrink-0" />
                  <input
                    id="detail-role-search-input"
                    type="text"
                    placeholder="Search character name..."
                    className={cn(
                      'bg-transparent flex-1 outline-none text-sm',
                      isLightModeActive ? 'text-clocktower-night' : 'text-gray-900'
                    )}
                    value={modalRoleSearch}
                    onChange={(e) => onSetModalRoleSearch(e.target.value)}
                    autoFocus={!isMobile}
                  />
                </div>
                {allowMultipleRoles ? (
                  <label className="flex flex-col sm:flex-row-reverse items-center gap-1 sm:gap-2 select-none cursor-pointer shrink-0">
                    <span className={cn("text-[10px] font-semibold leading-none", isLightModeActive ? "text-gray-600" : "text-gray-400")}>
                      Sort
                    </span>
                    <ToggleSwitch
                      id="tracker-sort-alphabetically-checkbox"
                      checked={sortAlphabetically}
                      onChange={handleToggleSort}
                      isLightModeActive={isLightModeActive}
                    />
                  </label>
                ) : (
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
                )}
              </div>
              <RoleList
                hasRole={allowMultipleRoles ? !!(p.roleIds && p.roleIds.length > 0) : (p.isTheDrunk || p.isTheMarionette || p.isTheLunatic || !!p.roleId)}
                roles={displayRolesList}
                players={players}
                currentPlayerId={p.id}
                isLightModeActive={isLightModeActive}
                allowMultipleRoles={allowMultipleRoles}
                roleIds={p.roleIds || []}
                onSelect={(roleId) => {
                  if (allowMultipleRoles && onUpdateRoles) {
                    const currentRoles = p.roleIds || [];
                    if (currentRoles.includes(roleId)) {
                      onUpdateRoles(p.id, currentRoles.filter(id => id !== roleId));
                    } else {
                      if (currentRoles.length >= 3) {
                        showAlert("You can select up to 3 candidate characters per player.");
                        return;
                      }
                      onUpdateRoles(p.id, [...currentRoles, roleId]);
                    }
                    onSetSearchingRole(false);
                    onSetModalRoleSearch('');
                  } else {
                    onUpdateRole(p.id, roleId);
                    onSetSearchingRole(false);
                    onSetModalRoleSearch('');
                  }
                }}
                onClear={() => {
                  if (allowMultipleRoles && onUpdateRoles) {
                    onUpdateRoles(p.id, []);
                  } else {
                    onUpdateRole(p.id, '');
                  }
                  onSetSearchingRole(false);
                  onSetModalRoleSearch('');
                }}
              />
            </div>
          ) : (
            /* Character display */
            allowMultipleRoles ? (
              <div className="w-full flex flex-col items-center justify-center py-4 rounded-xl border border-transparent relative">
                {displayRoles.length > 0 ? (
                  <div className="flex flex-col items-center space-y-3 w-full">
                    {/* Player Tracker Row Layout with separate buttons */}
                    <div className="flex flex-row justify-center items-center gap-4 select-none w-full flex-wrap">
                      {displayRoles.map((roleId) => {
                        const rObj = resolveRole(roleId);
                        if (!rObj) return null;
                        return (
                          <div key={roleId} className="relative w-24 h-24 shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedRole(rObj)}
                              title={`${rObj.name} - View Details`}
                              className="w-full h-full relative transition-all duration-200 hover:scale-105 active:scale-95 rounded-full shadow-md hover:shadow-lg outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 cursor-pointer"
                            >
                              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md absolute inset-0 z-10">
                                <defs>
                                  <path id={`topTextPath-${roleId}`} d="M 32,100 A 68,68 0 0,1 168,100" fill="none" />
                                  <path id={`bottomTextPath-${roleId}`} d="M 168,100 A 68,68 0 0,1 32,100" fill="none" />
                                </defs>
                                <circle cx="100" cy="100" r="90" fill="#ffffff" stroke="#d4d4d8" strokeWidth="6" />
                                <circle cx="100" cy="100" r="58" fill="none" stroke="#e4e4e7" strokeWidth="1" strokeDasharray="3 3" />
                                <text className={cn("font-bold text-[18px] tracking-wider uppercase", teamFill(rObj.team))}>
                                  <textPath href={`#topTextPath-${roleId}`} startOffset="50%" textAnchor="middle">
                                    {rObj.name}
                                  </textPath>
                                </text>
                                <text className={cn("font-bold text-[11px] tracking-widest uppercase", teamFill(rObj.team))}>
                                  <textPath href={`#bottomTextPath-${roleId}`} startOffset="50%" textAnchor="middle">
                                    {rObj.team}
                                  </textPath>
                                </text>
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                                <div className="w-[80%] h-[80%] flex items-center justify-center">
                                  <img
                                    key={rObj.id}
                                    src={`/icons/${rObj.id}.svg`}
                                    alt={rObj.name}
                                    className="w-full h-full object-contain"
                                    onError={roleIconFallback(rObj, rObj.team === 'minion' || rObj.team === 'demon')}
                                  />
                                </div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateRoles?.(p.id, displayRoles.filter(id => id !== roleId));
                              }}
                              title="Remove character"
                              className={cn(
                                "absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all shadow border text-xs font-bold z-30 cursor-pointer hover:scale-110 active:scale-95 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0",
                                isLightModeActive
                                  ? "bg-white border-gray-300 text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                                  : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700"
                              )}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                      {displayRoles.length < 3 && (
                        <button
                          type="button"
                          onClick={() => onSetSearchingRole(true)}
                          className={cn(
                            'w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center text-2xl font-light transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm',
                            isLightModeActive
                              ? 'border-gray-300 text-gray-400 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
                              : 'border-gray-800 text-gray-600 bg-gray-955/40 hover:bg-gray-900/40 hover:border-gray-700'
                          )}
                          title="Add candidate character"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2 py-1">
                    <button
                      type="button"
                      onClick={() => onSetSearchingRole(true)}
                      className={cn(
                        'w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center text-2xl font-light transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm',
                        isLightModeActive
                          ? 'border-gray-300 text-gray-400 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
                          : 'border-gray-800 text-gray-600 bg-gray-955/40 hover:bg-gray-900/40 hover:border-gray-700'
                      )}
                      title="Add candidate character"
                    >
                      +
                    </button>
                    <div className="text-center">
                      <p className={cn('text-sm font-semibold', isLightModeActive ? 'text-gray-500' : 'text-gray-400')}>
                        No Character Candidates Selected
                      </p>
                      <p className="text-[10px] opacity-50 mt-0.5">Click the slot to select characters</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Standard grimoire single button or display */
              displayRoles.length > 0 ? (
                <button
                  id="detail-change-role-button"
                  type="button"
                  onClick={() => onSetSearchingRole(true)}
                  className={cn(
                    'w-full flex flex-col items-center justify-center py-4 rounded-xl border border-transparent transition-all duration-200 relative cursor-pointer',
                    isLightModeActive
                      ? 'hover:scale-[1.02] hover:bg-black/5 hover:border-gray-300/40'
                      : 'hover:scale-[1.02] hover:bg-white/5 hover:border-gray-800/40'
                  )}
                >
                  <div className="flex flex-col items-center space-y-3 w-full">
                    <div className="relative flex items-center justify-center select-none w-36 h-36">
                      {displayRoles.map((roleId) => {
                        const rObj = resolveRole(roleId);
                        if (!rObj) return null;
                        return (
                          <div key={roleId} className="absolute inset-0">
                            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl absolute inset-0 z-10">
                              <defs>
                                <path id={`topTextPath-${roleId}`} d="M 32,100 A 68,68 0 0,1 168,100" fill="none" />
                                <path id={`bottomTextPath-${roleId}`} d="M 168,100 A 68,68 0 0,1 32,100" fill="none" />
                              </defs>
                              <circle cx="100" cy="100" r="90" fill="#ffffff" stroke="#d4d4d8" strokeWidth="6" />
                              <circle cx="100" cy="100" r="58" fill="none" stroke="#e4e4e7" strokeWidth="1" strokeDasharray="3 3" />
                              <text className={cn("font-bold text-[18px] tracking-wider uppercase", teamFill(rObj.team))}>
                                <textPath href={`#topTextPath-${roleId}`} startOffset="50%" textAnchor="middle">
                                  {rObj.name}
                                </textPath>
                              </text>
                              <text className={cn("font-bold text-[11px] tracking-widest uppercase", teamFill(rObj.team))}>
                                <textPath href={`#bottomTextPath-${roleId}`} startOffset="50%" textAnchor="middle">
                                  {rObj.team}
                                </textPath>
                              </text>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                              <div className="w-[80%] h-[80%] flex items-center justify-center">
                                <img
                                  key={rObj.id}
                                  src={`/icons/${rObj.id}.svg`}
                                  alt={rObj.name}
                                  className="w-full h-full object-contain"
                                  onError={roleIconFallback(rObj, rObj.team === 'minion' || rObj.team === 'demon')}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </button>
              ) : (
                <button
                  id="detail-change-role-button"
                  type="button"
                  onClick={() => onSetSearchingRole(true)}
                  className={cn(
                    'w-full flex flex-col items-center justify-center py-4 rounded-xl border border-transparent transition-all duration-200 relative',
                    isLightModeActive
                      ? 'hover:scale-[1.02] hover:bg-black/5 hover:border-gray-300/40'
                      : 'hover:scale-[1.02] hover:bg-white/5 hover:border-gray-800/40'
                  )}
                >
                  <div className="flex flex-col items-center space-y-2 py-1">
                    <div className={cn(
                      'w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center text-4xl font-light transition-colors',
                      isLightModeActive
                        ? 'border-gray-300 text-gray-400 bg-gray-50'
                        : 'border-gray-800 text-gray-600 bg-gray-955/40'
                    )}>
                      ?
                    </div>
                    <div className="text-center">
                      <p className={cn('text-lg font-semibold', isLightModeActive ? 'text-gray-500' : 'text-gray-400')}>
                        No Character Assigned
                      </p>
                      <p className="text-xs opacity-50 mt-0.5">Click to select character</p>
                    </div>
                  </div>
                </button>
              )
            )
          )}

           {/* Ability text display (only for standard single role mode) */}
           {!allowMultipleRoles && roleObj && roleAbility && !isSearchingRole && (
             <div className="text-center px-4 mt-2">
               <p className={cn(
                 'text-xs leading-relaxed italic font-medium',
                 isLightModeActive ? 'text-gray-650' : 'text-gray-300'
               )}>
                 "{roleAbility}"
               </p>
             </div>
           )}
         </div>

         {/* Status toggles - hidden when name is hidden */}
         {/* Status toggles */}
         <div className="flex items-center gap-2">
           <button
             id="detail-status-toggle-button"
             type="button"
             disabled={isSynced}
             onClick={(e) => { e.stopPropagation(); onToggleDead(p.id); }}
             className={cn(
               'px-4 py-2 rounded text-xs font-bold border transition-all shadow-sm flex-1',
               isSynced && 'opacity-60 cursor-not-allowed hover:bg-transparent',
               !isSynced && (!p.isDead
                 ? 'bg-clocktower-outsider border-clocktower-outsider/40 text-white hover:bg-emerald-600'
                 : 'bg-clocktower-blood border-clocktower-blood/40 text-white hover:bg-red-800'),
               isSynced && (p.isDead
                 ? 'bg-clocktower-blood/70 border-clocktower-blood/30 text-white'
                 : 'bg-clocktower-outsider/70 border-clocktower-outsider/30 text-white')
             )}
             title={isSynced ? "Status is synced from Storyteller" : undefined}
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
             {isEvil ? 'Evil' : 'Good'}
           </button>
           {!allowMultipleRoles && (
             <button
               id="detail-drunk-poisoned-toggle-button"
               type="button"
               onClick={(e) => { e.stopPropagation(); onToggleDrunkOrPoisoned(p.id); }}
               className={cn(
                 'px-4 py-2 rounded text-xs font-bold border transition-all shadow-sm flex-1 flex items-center justify-center gap-1',
                 p.isDrunkOrPoisoned
                   ? 'bg-purple-600 border-purple-600/40 text-white hover:bg-purple-700'
                   : isLightModeActive
                     ? 'bg-white border-gray-300 text-gray-400 hover:text-gray-655'
                     : 'bg-gray-955 border-gray-800 text-gray-555 hover:text-gray-300'
               )}
             >
               Droisoned
             </button>
           )}
         </div>

         {(p.isDead || isLilMonstaGame) && (
           <div className="flex items-center gap-2">
             {p.isDead && (
               <button
                 id="detail-vote-token-toggle"
                 type="button"
                 disabled={isSynced}
                 onClick={(e) => { e.stopPropagation(); onToggleDeadVote?.(p.id); }}
                 className={cn(
                   'px-3 py-2 rounded text-[11px] font-bold border transition-all shadow-sm flex-1 flex items-center justify-center gap-1',
                   isSynced && 'opacity-60 cursor-not-allowed',
                   !isSynced && (p.hasDeadVote
                     ? 'bg-amber-600 border-amber-600/40 text-white hover:bg-amber-700'
                     : isLightModeActive
                       ? 'bg-white border-gray-300 text-gray-400 hover:text-gray-655'
                       : 'bg-gray-955 border-gray-800 text-gray-555 hover:text-gray-300'),
                   isSynced && (p.hasDeadVote
                     ? 'bg-amber-600/70 border-amber-600/30 text-white'
                     : isLightModeActive
                       ? 'bg-gray-100 border-gray-250 text-gray-400'
                       : 'bg-gray-900 border-gray-850 text-gray-500')
                 )}
                 title={isSynced ? "Dead vote token is synced from Storyteller" : undefined}
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
                 <span className="w-4 h-4 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                   <img
                     src="/icons/lilmonsta.svg"
                     alt=""
                     className="w-3 h-3 object-contain"
                     onError={e => { e.currentTarget.parentElement!.style.display = 'none'; }}
                   />
                 </span>
                 Lil' Monsta
               </button>
             )}
           </div>
         )}
        </div>
      </div>
      {/* Inline role details modal */}
      {selectedRole && (
        <CharacterDetailModal
          role={selectedRole}
          isLightModeActive={isLightModeActive}
          onClose={() => setSelectedRole(null)}
          onRemove={() => {
            if (allowMultipleRoles) {
              onUpdateRoles?.(p.id, displayRoles.filter(id => id !== selectedRole.id));
            } else {
              onUpdateRole(p.id, '');
            }
            setSelectedRole(null);
          }}
          backdropId="character-details-backdrop"
          modalId="character-details-modal"
          animate
        />
      )}
     </>
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
  allowMultipleRoles?: boolean;
  roleIds?: string[];
}

function RoleList({
  hasRole,
  roles,
  players,
  currentPlayerId,
  isLightModeActive,
  onSelect,
  onClear,
  allowMultipleRoles = false,
  roleIds = [],
}: RoleListProps) {
  const teamColor = (team: Role['team']) => ({
    townsfolk: 'text-clocktower-townsfolk',
    outsider: 'text-clocktower-outsider',
    minion: 'text-clocktower-minion',
    demon: 'text-clocktower-demon',
    traveler: 'text-clocktower-traveler',
  }[team] ?? '');

  return (
    <div className={cn(
      'overflow-y-auto overscroll-contain max-h-60 md:max-h-72 border rounded divide-y pr-1',
      isLightModeActive
        ? 'border-gray-300 bg-white/50 divide-gray-200'
        : 'border-gray-800 bg-gray-950/40 divide-gray-800'
    )}>
      {hasRole && !allowMultipleRoles && (
        <button
          id="detail-clear-role-button"
          type="button"
          onClick={onClear}
          className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-xs text-red-500 font-semibold border-b transition-colors"
          style={{ borderColor: isLightModeActive ? '#e5e7eb' : '#1f2937' }}
        >
          × Clear Character{allowMultipleRoles ? 's' : ''}
        </button>
      )}
      {roles.map((role) => {
        const takenBy = players.find((pl) => 
          (allowMultipleRoles ? pl.roleIds?.includes(role.id) : pl.roleId === role.id) && 
          pl.id !== currentPlayerId
        );
        const currentPlayer = players.find((pl) => pl.id === currentPlayerId);
        const isCurrent = allowMultipleRoles
          ? roleIds.includes(role.id)
          : role.id === currentPlayer?.roleId;

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
                  key={role.id}
                  src={`/icons/${role.id}.svg`}
                  alt={role.name}
                  className="w-4 h-4 object-contain"
                  onError={roleIconFallback(role, role.team === 'minion' || role.team === 'demon')}
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
