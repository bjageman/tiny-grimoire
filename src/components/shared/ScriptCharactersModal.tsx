import { useState, useEffect, useMemo } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { Search, X, Scroll } from 'lucide-react';
import { cn } from '../../utils/cn';
import { roleIconFallback } from '../../utils/roleIcon';
import type { Role } from '../../types';
import officialRoles from '../../official_roles.json';

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

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedRole) setSelectedRole(null);
        else { onClose(); setSearchTerm(''); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, selectedRole, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  const filteredRoles = useMemo(() => {
    if (!searchTerm.trim()) return roles;
    const term = searchTerm.toLowerCase();
    return roles.filter(r => r.name.toLowerCase().includes(term) || r.team.toLowerCase().includes(term));
  }, [roles, searchTerm]);

  const byTeam = useMemo(() =>
    Object.fromEntries(TEAMS.map(t => [t.key, filteredRoles.filter(r => r.team === t.key)])),
    [filteredRoles]
  );

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
            <div>
              <h3 className={cn("font-display font-bold text-xl leading-tight tracking-wider", isLightModeActive ? "text-clocktower-blood" : "text-white")}>
                <Scroll size={20} className={cn("inline-block align-middle mr-2 -mt-1", isLightModeActive ? "text-clocktower-blood" : "text-clocktower-townsfolk")} />
                {scriptName}
                {scriptAuthor && <span className="text-xs font-medium text-gray-500 ml-2 align-middle">by {scriptAuthor}</span>}
              </h3>
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

          <div className="flex items-center rounded-lg px-3 py-2 text-sm mb-4 border bg-white border-gray-300 focus-within:border-clocktower-blood">
            <Search size={16} className="text-gray-500 mr-2 flex-shrink-0" />
            <input
              id="script-search-input"
              type="text"
              placeholder="Search character by name or type..."
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

          <div className="overflow-y-auto overscroll-contain flex-1 space-y-5 pr-1 select-none">
            {TEAMS.map(({ key, label, color, border, hover }) => {
              const teamRoles = byTeam[key];
              if (teamRoles.length === 0) return null;
              return (
                <div key={key} className="space-y-2">
                  <h4 className={cn("text-xs uppercase font-bold tracking-wider border-b pb-1 flex items-center gap-1.5", color, border)}>
                    {label} <span className="text-[10px] text-gray-500 font-normal font-mono">({teamRoles.length})</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {teamRoles.map(role => (
                      <button
                        type="button"
                        key={role.id}
                        onClick={() => setSelectedRole(role)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all duration-200 w-full hover:scale-[1.02] cursor-pointer focus:outline-none",
                          isLightModeActive
                            ? `bg-white/80 border-gray-200/60 hover:bg-white ${hover} hover:shadow-sm`
                            : `bg-gray-955/65 border-gray-850/45 hover:bg-gray-850/80 ${hover}`
                        )}
                      >
                        <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                          <img key={role.id} src={`/icons/${role.id}.svg`} alt={role.name} className="w-4.5 h-4.5 object-contain"
                            onError={roleIconFallback(role, role.team === 'minion' || role.team === 'demon')} />
                        </span>
                        <span className={cn("font-bold text-xs truncate", isLightModeActive ? "text-gray-900" : "text-gray-100")}>{role.name}</span>
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
      {selectedRole && (() => {
        const abilityText = selectedRole.ability
          ?? (officialRoles as Array<{ id: string; ability?: string }>).find(r => r.id === selectedRole.id)?.ability
          ?? "Ability description not found.";
        const t = selectedRole.team;
        return (
          <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setSelectedRole(null)}>
            <div
              className={cn("w-full max-w-sm rounded-2xl p-6 text-center relative shadow-2xl", isLightModeActive ? "bg-[#fdfaf2] border-2 border-amber-900/15 text-gray-800" : "bg-gray-900 border border-gray-800 text-gray-150")}
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" onClick={() => setSelectedRole(null)} className={cn("absolute top-4 right-4 p-1.5 rounded-full transition-colors", isLightModeActive ? "text-gray-500 hover:bg-gray-200 hover:text-gray-800" : "text-gray-400 hover:bg-gray-800 hover:text-white")} aria-label="Close details">
                <X size={18} />
              </button>
              <div className={cn(
                "w-24 h-24 mx-auto rounded-full bg-white flex items-center justify-center shadow-lg border-4 transition-transform duration-300 hover:rotate-6 mt-2",
                t === 'townsfolk' && "border-clocktower-townsfolk shadow-clocktower-townsfolk/20",
                t === 'outsider'  && "border-clocktower-outsider shadow-clocktower-outsider/20",
                t === 'minion'    && "border-clocktower-minion shadow-clocktower-minion/20",
                t === 'demon'     && "border-clocktower-demon shadow-clocktower-demon/20",
                t === 'traveler'  && "border-clocktower-traveler shadow-clocktower-traveler/20",
              )}>
                <img key={selectedRole.id} src={`/icons/${selectedRole.id}.svg`} alt={selectedRole.name} className="w-16 h-16 object-contain" onError={roleIconFallback(selectedRole, t === 'minion' || t === 'demon')} />
              </div>
              <h4 className={cn(
                "text-2xl font-black mt-4 tracking-wide",
                t === 'townsfolk' && "text-clocktower-townsfolk",
                t === 'outsider'  && "text-clocktower-outsider",
                t === 'minion'    && "text-clocktower-minion",
                t === 'demon'     && "text-clocktower-demon",
                t === 'traveler'  && "text-clocktower-traveler",
              )}>{selectedRole.name}</h4>
              <span className={cn(
                "inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mt-2",
                t === 'townsfolk' && "bg-clocktower-townsfolk/10 text-clocktower-townsfolk border border-clocktower-townsfolk/20",
                t === 'outsider'  && "bg-clocktower-outsider/10 text-clocktower-outsider border border-clocktower-outsider/20",
                t === 'minion'    && "bg-clocktower-minion/10 text-clocktower-minion border border-clocktower-minion/20",
                t === 'demon'     && "bg-clocktower-demon/10 text-clocktower-demon border border-clocktower-demon/20",
                t === 'traveler'  && "bg-clocktower-traveler/10 text-clocktower-traveler border border-clocktower-traveler/20",
              )}>{selectedRole.team}</span>
              <div className={cn("mt-5 p-4 rounded-xl border leading-relaxed text-sm select-text text-center font-medium", isLightModeActive ? "bg-white border-amber-900/10 text-gray-700 shadow-sm" : "bg-gray-955/60 border-gray-800 text-gray-300")}>{abilityText}</div>
              <button type="button" onClick={() => setSelectedRole(null)} className={cn(
                "w-full mt-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all duration-200 hover:opacity-90 active:scale-[0.98]",
                t === 'townsfolk' && "bg-clocktower-townsfolk shadow-clocktower-townsfolk/20",
                t === 'outsider'  && "bg-clocktower-outsider shadow-clocktower-outsider/20",
                t === 'minion'    && "bg-clocktower-minion shadow-clocktower-minion/20",
                t === 'demon'     && "bg-clocktower-demon shadow-clocktower-demon/20",
                t === 'traveler'  && "bg-clocktower-traveler shadow-clocktower-traveler/20",
              )}>Close Details</button>
            </div>
          </div>
        );
      })()}
    </>
  );
}
