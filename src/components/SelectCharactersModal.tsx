import React, { useEffect, useMemo } from 'react';
import { X, Shuffle, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Role } from '../types';
import { useScrollLock } from '../hooks/useScrollLock';
import { computeBalance } from '../utils/computeBalance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  roles: Role[];
  playerCount: number;
  isLightModeActive: boolean;
  onAssign: (selectedRoles: Role[]) => void;
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const ICON_ID: Record<string, string> = {
  villageidiot2: 'villageidiot',
  villageidiot3: 'villageidiot',
};
const iconId = (id: string) => ICON_ID[id] ?? id;

const TEAMS = [
  { key: 'townsfolk', label: '🔵 Townsfolk', color: 'text-clocktower-townsfolk', border: 'border-clocktower-townsfolk/20' },
  { key: 'outsider',  label: '🔵 Outsiders', color: 'text-clocktower-outsider',  border: 'border-clocktower-outsider/20'  },
  { key: 'minion',    label: '🔴 Minions',   color: 'text-clocktower-minion',    border: 'border-clocktower-minion/20'    },
  { key: 'demon',     label: '🔴 Demons',    color: 'text-clocktower-demon',     border: 'border-clocktower-demon/20'     },
] as const;

export default function SelectCharactersModal({ isOpen, onClose, roles, playerCount, isLightModeActive, onAssign, selectedIds, setSelectedIds }: Props) {
  const assignableRoles = useMemo(() => roles.filter(r => r.team !== 'traveler'), [roles]);

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const byTeam = useMemo(
    () => Object.fromEntries(TEAMS.map(t => [t.key, assignableRoles.filter(r => r.team === t.key)])),
    [assignableRoles]
  );

  const selectedRoles = useMemo(() => assignableRoles.filter(r => selectedIds.has(r.id)), [assignableRoles, selectedIds]);

  const balance = useMemo(
    () => playerCount >= 5 ? computeBalance(selectedRoles, playerCount) : null,
    [selectedRoles, playerCount]
  );

  const toggleRole = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleTeam = (teamKey: string) => {
    const teamRoles = byTeam[teamKey as keyof typeof byTeam];
    const allSelected = teamRoles.every(r => selectedIds.has(r.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) teamRoles.forEach(r => next.delete(r.id));
      else teamRoles.forEach(r => next.add(r.id));
      return next;
    });
  };

  const selectAll   = () => setSelectedIds(new Set(assignableRoles.map(r => r.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const canAssign = playerCount >= 5 && selectedIds.size >= playerCount;

  const handleAssign = () => { onAssign(selectedRoles); onClose(); };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full max-w-2xl rounded-lg flex flex-col shadow-2xl max-h-[90vh]",
          isLightModeActive ? "bg-[#fdfaf2] border border-amber-900/10 text-gray-800" : "bg-gray-900 border border-gray-800 text-gray-150"
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center gap-4 px-5 pt-5 pb-4 shrink-0">
          <h3 className={cn("font-display font-bold text-xl tracking-wider", isLightModeActive ? "text-clocktower-blood" : "text-white")}>
            Select Characters to Assign
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={cn("p-1.5 rounded-full transition-colors", isLightModeActive ? "text-gray-500 hover:bg-gray-200 hover:text-gray-800" : "text-gray-400 hover:bg-gray-800 hover:text-white")}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain flex-1 px-5 space-y-4 pb-4 pt-1">
          {/* Global select controls */}
          <div className="flex items-center justify-between">
            <span className={cn("text-xs font-semibold", isLightModeActive ? "text-gray-600" : "text-gray-400")}>
              {selectedIds.size} of {assignableRoles.length} characters
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className={cn("text-[11px] font-semibold px-2.5 py-1 rounded border transition-colors", isLightModeActive ? "border-gray-300 text-gray-600 hover:bg-gray-100" : "border-gray-700 text-gray-400 hover:bg-gray-800")}
              >
                Select All
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className={cn("text-[11px] font-semibold px-2.5 py-1 rounded border transition-colors", isLightModeActive ? "border-gray-300 text-gray-600 hover:bg-gray-100" : "border-gray-700 text-gray-400 hover:bg-gray-800")}
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Role list by team */}
          <div className="space-y-4">
            {TEAMS.map(({ key, label, color, border }) => {
              const teamRoles = byTeam[key as keyof typeof byTeam];
              if (teamRoles.length === 0) return null;
              const allTeamSelected = teamRoles.every(r => selectedIds.has(r.id));

              const actual   = balance?.counts[key as keyof typeof balance.counts] ?? 0;
              const expected = balance
                ? key === 'townsfolk' ? balance.expectedTownsfolkLabel
                : key === 'outsider'  ? balance.expectedOutsiderLabel
                : key === 'minion'    ? String(balance.expectedMinion)
                :                       balance.expectedDemonLabel
                : null;
              const isValid = balance
                ? key === 'townsfolk' ? balance.isTownsfolkValid
                : key === 'outsider'  ? balance.isOutsiderValid
                : key === 'minion'    ? balance.isMinionValid
                :                       balance.isDemonValid
                : false;

              return (
                <div key={key}>
                  <div className={cn("flex items-center justify-between border-b pb-1 mb-2", border)}>
                    <h4 className={cn("text-xs uppercase font-bold tracking-wider flex items-center gap-2", color)}>
                      {label}
                      {expected !== null && (
                        <span className={cn(
                          "font-mono font-bold normal-case tracking-normal text-[11px]",
                          isValid ? color : (isLightModeActive ? "text-amber-700" : "text-yellow-500")
                        )}>
                          {actual}/{expected}
                        </span>
                      )}
                    </h4>
                    <button
                      type="button"
                      onClick={() => toggleTeam(key)}
                      className={cn("text-[10px] font-semibold transition-colors opacity-70 hover:opacity-100", color)}
                    >
                      {allTeamSelected ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {teamRoles.map(role => {
                      const checked = selectedIds.has(role.id);
                      return (
                        <label
                          key={role.id}
                          className={cn(
                            "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all select-none",
                            checked
                              ? isLightModeActive
                                ? "border-gray-400 bg-white shadow-sm"
                                : "border-gray-600 bg-gray-800"
                              : isLightModeActive
                                ? "border-gray-200 bg-white/50 opacity-40"
                                : "border-gray-800 bg-gray-955/40 opacity-40"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRole(role.id)}
                            className="shrink-0 w-3.5 h-3.5"
                          />
                          <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                            <img
                              src={`/icons/${iconId(role.id)}.svg`}
                              alt=""
                              className="w-3.5 h-3.5 object-contain"
                              onError={e => { e.currentTarget.parentElement!.style.display = 'none'; }}
                            />
                          </span>
                          <span className={cn("font-semibold text-xs truncate", isLightModeActive ? "text-gray-900" : "text-gray-100")}>
                            {role.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className={cn("px-5 py-4 border-t shrink-0 space-y-3", isLightModeActive ? "border-gray-200" : "border-gray-800")}>
          {balance && (balance.modifications.length > 0 || balance.jinxWarnings.length > 0) && (
            <div className="space-y-1.5">
              {balance.modifications.map((m, idx) => (
                <span key={idx} className={cn(
                  "inline-block mr-1 text-[9px] border px-1.5 py-0.5 rounded font-medium",
                  isLightModeActive ? "bg-clocktower-blood/5 border-clocktower-blood/20 text-clocktower-blood" : "bg-clocktower-blood/10 border-clocktower-blood/30 text-clocktower-parchment/80"
                )}>
                  {m}
                </span>
              ))}
              {balance.jinxWarnings.map((w, idx) => (
                <div key={idx} className={cn("text-[10px] flex items-center gap-1 font-medium", isLightModeActive ? "text-amber-700" : "text-yellow-500")}>
                  <AlertTriangle size={10} /> {w}
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={handleAssign}
            disabled={!canAssign}
            className="w-full bg-clocktower-blood hover:bg-red-800 text-white py-2.5 rounded text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Shuffle size={14} /> Randomly Assign
          </button>
        </div>
      </div>
    </div>
  );
}
