import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { Search, X, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';
import { roleIconFallback } from '../../utils/roleIcon';
import ToggleSwitch from './ToggleSwitch';
import CharacterDetailModal from './CharacterDetailModal';
import officialRoles from '../../official_roles.json';
import rolesData from '../../roles.json';
import type { Role } from '../../types';

const officialAbility = new Map(
  (officialRoles as Array<{ id: string; ability?: string }>).map(r => [r.id, r.ability])
);

const abilityFor = (role: Role) => role.ability ?? officialAbility.get(role.id) ?? '';

const allTravelers = (rolesData as Role[]).filter(r => r.team === 'traveler');

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scriptName: string;
  roles: Role[];
  scriptAuthor?: string;
  isLightModeActive: boolean;
}

const TEAMS = [
  { key: 'townsfolk', label: '🔵 Townsfolk', color: 'text-clocktower-townsfolk', border: 'border-clocktower-townsfolk/15', hover: 'hover:border-clocktower-townsfolk/30' },
  { key: 'outsider',  label: '🔵 Outsiders', color: 'text-clocktower-outsider',  border: 'border-clocktower-outsider/15',  hover: 'hover:border-clocktower-outsider/30'  },
  { key: 'minion',    label: '🔴 Minions',   color: 'text-clocktower-minion',    border: 'border-clocktower-minion/15',    hover: 'hover:border-clocktower-minion/30'    },
  { key: 'demon',     label: '🔴 Demons',    color: 'text-clocktower-demon',     border: 'border-clocktower-demon/15',     hover: 'hover:border-clocktower-demon/30'     },
  { key: 'traveler',  label: '🟣 Travelers', color: 'text-clocktower-traveler',  border: 'border-clocktower-traveler/15',  hover: 'hover:border-clocktower-traveler/30'  },
] as const;

export default function ScriptCharactersModal({ isOpen, onClose, scriptName, roles, scriptAuthor, isLightModeActive }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [sortAlphabetically, setSortAlphabetically] = useState(() => {
    return localStorage.getItem('botc-sort-alphabetically') === 'true';
  });
  const [showDetail, setShowDetail] = useState(() => {
    return localStorage.getItem('botc-script-show-detail') === 'true';
  });
  const [showAllTravelers, setShowAllTravelers] = useState(() => {
    return localStorage.getItem('botc-script-show-all-travelers') === 'true';
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

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (settingsOpen) setSettingsOpen(false);
        else if (selectedRole) setSelectedRole(null);
        else { onClose(); setSearchTerm(''); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, selectedRole, settingsOpen, onClose]);

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

  const effectiveRoles = useMemo(() => {
    if (!showAllTravelers) return roles;
    const missing = allTravelers.filter(t => !roles.some(r => r.id === t.id));
    return [...roles, ...missing];
  }, [roles, showAllTravelers]);

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

  const isEmpty = TEAMS.every(t => byTeam[t.key].length === 0);

  const handleClose = () => { onClose(); setSearchTerm(''); };

  if (!isOpen) return null;

  return (
    <>
      {/* Character list modal */}
      <div
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={handleClose}
      >
        <div
          className={cn(
            "w-full max-w-2xl rounded-lg p-5 flex flex-col shadow-2xl max-h-[85vh]",
            isLightModeActive ? "bg-[#fdfaf2] border border-amber-900/10 text-gray-800" : "bg-gray-900 border border-gray-800 text-gray-150"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start gap-4 mb-4">
            <div ref={titleBoxRef} className="min-w-0 flex-1">
              <h3 ref={titleRef} className={cn("font-display font-bold text-xl leading-tight tracking-wider whitespace-nowrap inline-block max-w-full", isLightModeActive ? "text-clocktower-blood" : "text-white")}>
                {scriptName}
              </h3>
              {scriptAuthor && <p className="text-xs font-medium text-gray-500 mt-0.5">by {scriptAuthor}</p>}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className={cn("p-1.5 rounded-full transition-colors", isLightModeActive ? "text-gray-500 hover:bg-gray-250/50 hover:text-gray-800" : "text-gray-400 hover:bg-gray-800 hover:text-white")}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-row gap-3 mb-4 items-center justify-between">
            <div className="flex-1 flex items-center rounded-lg px-3 py-2 text-sm border bg-white border-gray-300 focus-within:border-clocktower-blood">
              <Search size={16} className="text-gray-500 mr-2 flex-shrink-0" />
              <input
                id="script-search-input"
                type="text"
                placeholder="Search by name or type"
                className="bg-transparent flex-1 outline-none text-xs text-gray-900 placeholder-gray-400 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm('')} className="text-gray-500 hover:text-gray-700">
                  <X size={14} />
                </button>
              )}
            </div>
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
                    "absolute right-0 top-full mt-2 z-10 w-44 rounded-lg border shadow-xl p-2 space-y-1",
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
                      Sort A–Z
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
                      Travelers
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
            {TEAMS.map(({ key, label, color, border, hover }) => {
              const teamRoles = byTeam[key];
              if (teamRoles.length === 0) return null;
              return (
                <div key={key} className="space-y-2">
                  <h4 className={cn("text-xs uppercase font-bold tracking-wider border-b pb-1 flex items-center gap-1.5", color, border)}>
                    {label} <span className="text-[10px] text-gray-500 font-normal font-mono">({teamRoles.length})</span>
                  </h4>
                  <div className={cn("grid gap-2", showDetail ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2")}>
                    {teamRoles.map(role => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={cn(
                          "flex gap-2 px-3 py-2 rounded-lg border text-left transition-all duration-200 w-full hover:scale-[1.01] cursor-pointer focus:outline-none",
                          showDetail ? "items-start" : "items-center",
                          isLightModeActive
                            ? `bg-white/80 border-gray-200/60 hover:bg-white ${hover} hover:shadow-sm`
                            : `bg-gray-955/65 border-gray-850/45 hover:bg-gray-850/80 ${hover}`
                        )}
                      >
                        <span className={cn("w-6 h-6 bg-white rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-sm border border-gray-100", showDetail && "mt-0.5")}>
                          <img key={role.id} src={`/icons/${role.id}.svg`} alt={role.name} className="w-[75%] h-[75%] object-contain"
                            onError={roleIconFallback(role, role.team === 'minion' || role.team === 'demon')} />
                        </span>
                        <span className={cn("min-w-0 flex-1 text-[11px] leading-snug", !showDetail && "truncate")}>
                          <span className={cn("font-bold text-xs", isLightModeActive ? "text-gray-900" : "text-gray-100")}>{role.name}</span>
                          {showDetail && abilityFor(role) && (
                            <span className={cn(isLightModeActive ? "text-gray-600" : "text-gray-400")}> — {abilityFor(role)}</span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
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
          backdropId="script-character-details-backdrop"
          modalId="script-character-details-modal"
        />
      )}
    </>
  );
}
