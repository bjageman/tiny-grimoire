import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../../../hooks/useScrollLock';
import { useEscapeKey } from '../../../hooks/useEscapeKey';
import { X, Settings, Link2 } from 'lucide-react';
import { cn } from '../../../utils/cn';
import RoleIcon from '../ui/RoleIcon';
import SearchInput from '../ui/SearchInput';
import CloseButton from '../ui/CloseButton';
import { inPlayRoleIds } from '../../../utils/scriptUtils';
import { scriptJinxes } from '../../../utils/jinxUtils';
import ToggleSwitch from '../ui/ToggleSwitch';
import CharacterDetailModal from './CharacterDetailModal';
import { ABILITY_BY_ID, PLAYABLE_ROLES } from '../../../utils/roleData';
import type { AnyRole, LoricRole, Player, Role } from '../../../types';

const abilityFor = (role: AnyRole) => role.ability ?? ABILITY_BY_ID.get(role.id) ?? '';

const NO_LORIC_ROLES: LoricRole[] = [];

const allTravelers = PLAYABLE_ROLES.filter(r => r.team === 'traveler');

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scriptName: string;
  roles: Role[];
  scriptLoricRoles?: LoricRole[];
  scriptAuthor?: string;
  isLightModeActive: boolean;
  /** Storyteller-only features (Notes prompts, the in-play filter). Omitted in player game notes. */
  isStoryteller?: boolean;
  /** Seated players, used to work out which characters are actually in play. */
  players?: Player[];
}

const TEAMS = [
  { key: 'townsfolk', label: '🔵 Townsfolk', color: 'text-clocktower-townsfolk', border: 'border-clocktower-townsfolk/15', hover: 'hover:border-clocktower-townsfolk/30' },
  { key: 'outsider',  label: '🔵 Outsiders', color: 'text-clocktower-outsider',  border: 'border-clocktower-outsider/15',  hover: 'hover:border-clocktower-outsider/30'  },
  { key: 'minion',    label: '🔴 Minions',   color: 'text-clocktower-minion',    border: 'border-clocktower-minion/15',    hover: 'hover:border-clocktower-minion/30'    },
  { key: 'demon',     label: '🔴 Demons',    color: 'text-clocktower-demon',     border: 'border-clocktower-demon/15',     hover: 'hover:border-clocktower-demon/30'     },
  { key: 'traveler',  label: '🟣 Travelers', color: 'text-clocktower-traveler',  border: 'border-clocktower-traveler/15',  hover: 'hover:border-clocktower-traveler/30'  },
] as const;

const TEAM_HOVER: Record<string, string> = Object.fromEntries(TEAMS.map(t => [t.key, t.hover]));

export default function ScriptCharactersModal({ isOpen, onClose, scriptName, roles, scriptLoricRoles = NO_LORIC_ROLES, scriptAuthor, isLightModeActive, isStoryteller = false, players = [] }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<AnyRole | null>(null);
  const [sortAlphabetically, setSortAlphabetically] = useState(() => {
    return localStorage.getItem('botc-sort-alphabetically') === 'true';
  });
  const [showDetail, setShowDetail] = useState(() => {
    return localStorage.getItem('botc-script-show-detail') === 'true';
  });
  const [showAllTravelers, setShowAllTravelers] = useState(() => {
    return localStorage.getItem('botc-script-show-all-travelers') === 'true';
  });
  const [showFabledLorics, setShowFabledLorics] = useState(() => {
    return localStorage.getItem('botc-script-show-fabled-lorics') !== 'false';
  });
  const [bigFont, setBigFont] = useState(() => {
    return localStorage.getItem('botc-script-big-font') === 'true';
  });
  const [groupByType, setGroupByType] = useState(() => {
    return localStorage.getItem('botc-script-group-by-type') !== 'false';
  });
  const [doubleColumn, setDoubleColumn] = useState(() => {
    return localStorage.getItem('botc-script-double-column') !== 'false';
  });
  const [inPlayOnly, setInPlayOnly] = useState(() => {
    return localStorage.getItem('botc-script-in-play-only') === 'true';
  });
  const [listJinxes, setListJinxes] = useState(() => {
    return localStorage.getItem('botc-script-list-jinxes') !== 'false';
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleBoxRef = useRef<HTMLDivElement>(null);

  const handleToggleSort = (val: boolean) => {
    setSortAlphabetically(val);
    localStorage.setItem('botc-sort-alphabetically', String(val));
  };

  const handleToggleDetail = (val: boolean) => {
    setShowDetail(val);
    localStorage.setItem('botc-script-show-detail', String(val));
  };

  const handleToggleAllTravelers = (val: boolean) => {
    setShowAllTravelers(val);
    localStorage.setItem('botc-script-show-all-travelers', String(val));
  };

  const handleToggleFabledLorics = (val: boolean) => {
    setShowFabledLorics(val);
    localStorage.setItem('botc-script-show-fabled-lorics', String(val));
  };

  const handleToggleBigFont = (val: boolean) => {
    setBigFont(val);
    localStorage.setItem('botc-script-big-font', String(val));
  };

  const handleToggleGroupByType = (val: boolean) => {
    setGroupByType(val);
    localStorage.setItem('botc-script-group-by-type', String(val));
  };

  const handleToggleInPlayOnly = (val: boolean) => {
    setInPlayOnly(val);
    localStorage.setItem('botc-script-in-play-only', String(val));
  };

  const handleToggleDoubleColumn = (val: boolean) => {
    setDoubleColumn(val);
    localStorage.setItem('botc-script-double-column', String(val));
  };

  const handleToggleListJinxes = (val: boolean) => {
    setListJinxes(val);
    localStorage.setItem('botc-script-list-jinxes', String(val));
  };

  useScrollLock(isOpen);

  // The nested character details modal handles its own Escape, so only the settings popover is layered here.
  useEscapeKey(() => {
    if (settingsOpen) setSettingsOpen(false);
    else { onClose(); setSearchTerm(''); }
  }, isOpen);

  useEffect(() => {
    if (!settingsOpen) return;
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [settingsOpen]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const fit = () => {
      const title = titleRef.current;
      const box = titleBoxRef.current;
      if (!title || !box) return;
      title.style.fontSize = '';
      const base = parseFloat(getComputedStyle(title).fontSize);
      const natural = title.scrollWidth;
      const available = box.clientWidth;
      if (natural > available && available > 0) {
        title.style.fontSize = `${Math.max(base * (available / natural), 12)}px`;
      }
    };
    fit();
    const box = titleBoxRef.current;
    if (!box || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [isOpen, scriptName]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  // Gate on the role too, so a stored preference can never filter a player's view.
  const showInPlayOnly = isStoryteller && inPlayOnly;

  // Characters actually in play — drives the storyteller's in-play filter.
  const inPlayIds = useMemo(() => inPlayRoleIds(players), [players]);

  const effectiveRoles = useMemo(() => {
    const withTravelers = showAllTravelers
      ? [...roles, ...allTravelers.filter(t => !roles.some(r => r.id === t.id))]
      : roles;
    const playableRoles = withTravelers.filter(role => TEAMS.some(team => team.key === role.team));
    if (!showInPlayOnly) return playableRoles;
    return playableRoles.filter(r => inPlayIds.has(r.id));
  }, [roles, showAllTravelers, showInPlayOnly, inPlayIds]);

  const filteredRoles = useMemo(() => {
    if (!searchTerm.trim()) return effectiveRoles;
    const term = searchTerm.toLowerCase();
    return effectiveRoles.filter(r => r.name.toLowerCase().includes(term) || r.team.toLowerCase().includes(term));
  }, [effectiveRoles, searchTerm]);

  const byTeam = useMemo(() => {
    const grouped = Object.fromEntries(TEAMS.map(t => [t.key, filteredRoles.filter(r => r.team === t.key)]));
    if (sortAlphabetically) {
      for (const key of Object.keys(grouped)) {
        grouped[key].sort((a, b) => a.name.localeCompare(b.name));
      }
    }
    return grouped;
  }, [filteredRoles, sortAlphabetically]);

  const flatRoles = useMemo(() => {
    const list = [...filteredRoles];
    if (sortAlphabetically) list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [filteredRoles, sortAlphabetically]);

  const filteredLoricRoles = useMemo(() => {
    if (!showFabledLorics) return [];
    const term = searchTerm.trim().toLowerCase();
    const list = scriptLoricRoles.filter(role => role.id !== 'djinn' && (role.name.toLowerCase().includes(term) || role.team.includes(term)));
    if (sortAlphabetically) list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [scriptLoricRoles, showFabledLorics, searchTerm, sortAlphabetically]);

  const isEmpty = filteredRoles.length === 0 && filteredLoricRoles.length === 0;

  // Built off effectiveRoles so the traveler and in-play toggles carry over; search matches either side of a pair.
  const jinxes = useMemo(() => {
    if (!listJinxes) return [];
    const found = scriptJinxes(effectiveRoles);
    const term = searchTerm.trim().toLowerCase();
    if (!term) return found;
    return found.filter(j => j.roles.some(r => r.name.toLowerCase().includes(term)));
  }, [listJinxes, effectiveRoles, searchTerm]);

  const handleClose = () => { onClose(); setSearchTerm(''); };

  const roleLayoutClass = doubleColumn
    ? cn("gap-2 sm:columns-2", showDetail ? "columns-1" : "columns-2")
    : cn("grid gap-2 sm:grid-cols-1", showDetail ? "grid-cols-1" : "grid-cols-2");

  const renderRoleIcon = (role: AnyRole, alt: string) => (
    <span className="w-6 h-6 bg-white rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
      <RoleIcon key={role.id} role={role} alt={alt} className={cn("w-[92%] h-[92%]", role.team === 'fabled' ? "brightness-[0.45] saturate-[0.85]" : role.team === 'loric' && "brightness-[0.65] saturate-[0.85]")} />
    </span>
  );

  const renderRoleCard = (role: AnyRole) => {
    const hover = TEAM_HOVER[role.team] ?? '';
    return (
      <button
        key={role.id}
        type="button"
        onClick={() => setSelectedRole(role)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all duration-200 w-full hover:scale-[1.01] cursor-pointer focus:outline-none",
          doubleColumn && "mb-2 break-inside-avoid",
          isLightModeActive
            ? `bg-white/80 border-gray-200/60 hover:bg-white ${hover} hover:shadow-sm`
            : `bg-gray-955/65 border-gray-850/45 hover:bg-gray-850/80 ${hover}`
        )}
      >
        {renderRoleIcon(role, role.name)}
        <span className={cn("min-w-0 flex-1 leading-snug", bigFont ? "text-[13px]" : "text-[11px]", !showDetail && "truncate")}>
          <span className={cn("font-bold", bigFont ? "text-sm" : "text-xs", isLightModeActive ? "text-gray-900" : "text-gray-100")}>{role.name}</span>
          {showDetail && abilityFor(role) && (
            <span className={cn("whitespace-pre-line", isLightModeActive ? "text-gray-600" : "text-gray-400")}> — {abilityFor(role)}</span>
          )}
        </span>
      </button>
    );
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Character list modal */}
      <div
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm"
        onClick={handleClose}
      >
        <div
          className={cn(
            "w-full max-w-2xl rounded-lg p-5 flex flex-col shadow-2xl max-h-[92vh] sm:max-h-[85vh]",
            isLightModeActive ? "bg-[#fdfaf2] border border-amber-900/10 text-gray-800" : "bg-gray-900 border border-gray-800 text-gray-150"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start gap-4 mb-4">
            <div ref={titleBoxRef} className="min-w-0 flex-1">
              <h3 ref={titleRef} className={cn("font-display font-bold text-xl leading-tight tracking-wider whitespace-nowrap inline-block max-w-full", isLightModeActive ? "text-clocktower-blood" : "text-white")}>
                {scriptName}
              </h3>
              {scriptAuthor && <p className={cn("text-xs font-medium mt-0.5", isLightModeActive ? "text-black" : "text-white")}>by {scriptAuthor}</p>}
            </div>
            <CloseButton
              onClick={handleClose}
              isLightModeActive={isLightModeActive}
              aria-label="Close modal"
            />
          </div>

          <div className="flex flex-row gap-3 mb-4 items-center justify-between">
            <SearchInput
              id="script-search-input"
              label="Search by name or type"
              placeholder="Search by name or type"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              iconSize={16}
              containerClassName="flex-1 rounded-lg"
              className="w-full"
            >
              {searchTerm && (
                <button type="button" aria-label="Clear search" onClick={() => setSearchTerm('')} className="text-gray-500 hover:text-gray-700">
                  <X size={14} />
                </button>
              )}
            </SearchInput>
            <div className="relative shrink-0" ref={settingsRef}>
              <button
                type="button"
                onClick={() => setSettingsOpen(o => !o)}
                aria-label="View settings"
                aria-expanded={settingsOpen}
                className={cn(
                  "p-2 rounded-lg border transition-colors",
                  settingsOpen
                    ? "border-clocktower-blood text-clocktower-blood"
                    : isLightModeActive
                      ? "border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400"
                      : "border-gray-700 text-gray-400 hover:text-gray-100 hover:border-gray-600"
                )}
              >
                <Settings size={16} />
              </button>
              {settingsOpen && (
                <div
                  className={cn(
                    "absolute right-0 top-full mt-2 z-10 w-56 rounded-lg border shadow-xl p-2 space-y-1",
                    isLightModeActive ? "bg-[#fdfaf2] border-amber-900/15" : "bg-gray-900 border-gray-800"
                  )}
                >
                  <label className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-md select-none cursor-pointer hover:bg-gray-500/10">
                    <span className={cn("text-xs font-semibold", isLightModeActive ? "text-gray-700" : "text-gray-300")}>
                      Detail
                    </span>
                    <ToggleSwitch
                      id="script-show-detail-checkbox"
                      checked={showDetail}
                      onChange={handleToggleDetail}
                      isLightModeActive={isLightModeActive}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-md select-none cursor-pointer hover:bg-gray-500/10">
                    <span className={cn("text-xs font-semibold", isLightModeActive ? "text-gray-700" : "text-gray-300")}>
                      Sort A-Z
                    </span>
                    <ToggleSwitch
                      id="script-sort-alphabetically-checkbox"
                      checked={sortAlphabetically}
                      onChange={handleToggleSort}
                      isLightModeActive={isLightModeActive}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-md select-none cursor-pointer hover:bg-gray-500/10">
                    <span className={cn("text-xs font-semibold", isLightModeActive ? "text-gray-700" : "text-gray-300")}>
                      Bigger Font
                    </span>
                    <ToggleSwitch
                      id="script-big-font-checkbox"
                      checked={bigFont}
                      onChange={handleToggleBigFont}
                      isLightModeActive={isLightModeActive}
                    />
                  </label>
                  <label className="hidden sm:flex items-center justify-between gap-3 px-2 py-1.5 rounded-md select-none cursor-pointer hover:bg-gray-500/10">
                    <span className={cn("text-xs font-semibold", isLightModeActive ? "text-gray-700" : "text-gray-300")}>
                      2 Columns
                    </span>
                    <ToggleSwitch
                      id="script-double-column-checkbox"
                      checked={doubleColumn}
                      onChange={handleToggleDoubleColumn}
                      isLightModeActive={isLightModeActive}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-md select-none cursor-pointer hover:bg-gray-500/10">
                    <span className={cn("text-xs font-semibold", isLightModeActive ? "text-gray-700" : "text-gray-300")}>
                      Group By Type
                    </span>
                    <ToggleSwitch
                      id="script-group-by-type-checkbox"
                      checked={groupByType}
                      onChange={handleToggleGroupByType}
                      isLightModeActive={isLightModeActive}
                    />
                  </label>
                  <div className={cn("flex items-center gap-2 px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider", isLightModeActive ? "text-gray-500" : "text-gray-400")}>
                    <span className={cn("h-px flex-1", isLightModeActive ? "bg-gray-300" : "bg-gray-700")} />
                    <span>Display</span>
                    <span className={cn("h-px flex-1", isLightModeActive ? "bg-gray-300" : "bg-gray-700")} />
                  </div>
                  {isStoryteller && (
                    <label className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-md select-none cursor-pointer hover:bg-gray-500/10">
                      <span className={cn("text-xs font-semibold", isLightModeActive ? "text-gray-700" : "text-gray-300")}>
                        In Play Only
                      </span>
                      <ToggleSwitch
                        id="script-in-play-only-checkbox"
                        checked={inPlayOnly}
                        onChange={handleToggleInPlayOnly}
                        isLightModeActive={isLightModeActive}
                      />
                    </label>
                  )}
                  <label className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-md select-none cursor-pointer hover:bg-gray-500/10">
                    <span className={cn("text-xs font-semibold", isLightModeActive ? "text-gray-700" : "text-gray-300")}>
                      Fabled/Lorics
                    </span>
                    <ToggleSwitch
                      id="script-show-fabled-lorics-checkbox"
                      checked={showFabledLorics}
                      onChange={handleToggleFabledLorics}
                      isLightModeActive={isLightModeActive}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-md select-none cursor-pointer hover:bg-gray-500/10">
                    <span className={cn("text-xs font-semibold", isLightModeActive ? "text-gray-700" : "text-gray-300")}>
                      Jinxes
                    </span>
                    <ToggleSwitch
                      id="script-list-jinxes-checkbox"
                      checked={listJinxes}
                      onChange={handleToggleListJinxes}
                      isLightModeActive={isLightModeActive}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-md select-none cursor-pointer hover:bg-gray-500/10">
                    <span className={cn("text-xs font-semibold", isLightModeActive ? "text-gray-700" : "text-gray-300")}>
                      All Travelers
                    </span>
                    <ToggleSwitch
                      id="script-show-all-travelers-checkbox"
                      checked={showAllTravelers}
                      onChange={handleToggleAllTravelers}
                      isLightModeActive={isLightModeActive}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-y-auto overscroll-contain flex-1 space-y-5 pr-1 select-none">
            {groupByType ? (
              TEAMS.map(({ key, label, color, border }) => {
                const teamRoles = byTeam[key];
                if (teamRoles.length === 0) return null;
                return (
                  <div key={key} className="space-y-2">
                    <h4 className={cn("text-xs uppercase font-bold tracking-wider border-b pb-1 flex items-center gap-1.5", color, border)}>
                      {label} <span className="text-[10px] text-gray-500 font-normal font-mono">({teamRoles.length})</span>
                    </h4>
                    <div className={roleLayoutClass} data-testid="script-role-layout">
                      {teamRoles.map(renderRoleCard)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={roleLayoutClass} data-testid="script-role-layout">
                {flatRoles.map(renderRoleCard)}
              </div>
            )}
            {filteredLoricRoles.length > 0 && (
              <div id="script-fabled-lorics-section" className="space-y-2">
                <h4 className="text-xs uppercase font-bold tracking-wider border-b border-yellow-700/20 pb-1 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-yellow-700" />
                  <span className="text-yellow-700">Fabled</span>
                  <span className="text-gray-500">&amp;</span>
                  <span className="text-green-700">Lorics</span>
                  <span className="text-[10px] text-gray-500 font-normal font-mono">({filteredLoricRoles.length})</span>
                </h4>
                <div className={roleLayoutClass}>
                  {filteredLoricRoles.map(renderRoleCard)}
                </div>
              </div>
            )}
            {jinxes.length > 0 && (
              <div id="script-jinxes-section" className="space-y-2">
                <h4 className={cn(
                  "text-xs uppercase font-bold tracking-wider border-b pb-1 flex items-center gap-1.5",
                  isLightModeActive ? "text-clocktower-blood border-clocktower-blood/15" : "text-clocktower-gold border-clocktower-gold/15"
                )}>
                  🔗 Jinxes <span className="text-[10px] text-gray-500 font-normal font-mono">({jinxes.length})</span>
                </h4>
                <ul className="space-y-2">
                  {jinxes.map(({ roles: [first, second], reason }) => (
                    <li
                      key={`${first.id}-${second.id}`}
                      className={cn(
                        "px-3 py-2 rounded-lg border",
                        isLightModeActive ? "bg-white/80 border-gray-200/60" : "bg-gray-955/65 border-gray-850/45"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        {renderRoleIcon(first, '')}
                        <span className={cn("font-bold", bigFont ? "text-sm" : "text-xs", isLightModeActive ? "text-gray-900" : "text-gray-100")}>{first.name}</span>
                        <Link2 size={12} className="text-gray-500 shrink-0" />
                        {renderRoleIcon(second, '')}
                        <span className={cn("font-bold", bigFont ? "text-sm" : "text-xs", isLightModeActive ? "text-gray-900" : "text-gray-100")}>{second.name}</span>
                      </div>
                      <p className={cn("mt-1 leading-snug select-text", bigFont ? "text-[13px]" : "text-[11px]", isLightModeActive ? "text-gray-600" : "text-gray-400")}>{reason}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {isEmpty && (
              <div className="text-center py-8 text-sm text-gray-500 italic">No matching characters found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Role detail modal */}
      {selectedRole && (
        <CharacterDetailModal
          role={selectedRole}
          isLightModeActive={isLightModeActive}
          onClose={() => setSelectedRole(null)}
          enableStorytellerNotes={isStoryteller}
          backdropId="script-character-details-backdrop"
          modalId="script-character-details-modal"
        />
      )}
    </>,
    document.body
  );
}
