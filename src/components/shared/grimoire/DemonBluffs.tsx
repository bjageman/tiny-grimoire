import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { roleIconFallback } from '../../../utils/roleIcon';
import { useIsMobile } from '../../../hooks/useIsMobile';
import ToggleSwitch from '../ui/ToggleSwitch';
import rolesData from '../../../roles.json';
import officialRoles from '../../../official_roles.json';
import type { Player, Role } from '../../../types';

interface DemonBluffsProps {
  demonBluffs: string[];
  onUpdateDemonBluffs: (bluffs: string[]) => void;
  players: Player[];
  customScriptRoles: Role[] | null;
  grimoireRolesData: Role[];
  isLightModeActive: boolean;
}

const officialRoleAbility = (role: Pick<Role, 'id' | 'ability'>) =>
  role.ability ?? (officialRoles as (Role & { ability?: string })[]).find(r => r.id === role.id)?.ability;

const TEAM_LABEL: Record<Role['team'], string> = {
  townsfolk: 'Townsfolk', outsider: 'Outsider', minion: 'Minion', demon: 'Demon', traveler: 'Traveler',
};
const TEAM_TEXT: Record<Role['team'], string> = {
  townsfolk: 'text-blue-400', outsider: 'text-emerald-400', minion: 'text-red-400', demon: 'text-red-600', traveler: 'text-purple-400',
};
const TEAM_OVERLAY: Record<Role['team'], { border: string; bg: string; text: string }> = {
  townsfolk: { border: 'border-blue-500/50', bg: 'bg-blue-950/60', text: 'text-blue-300' },
  outsider: { border: 'border-emerald-500/50', bg: 'bg-emerald-950/60', text: 'text-emerald-300' },
  minion: { border: 'border-red-500/50', bg: 'bg-red-950/60', text: 'text-red-300' },
  demon: { border: 'border-red-700/50', bg: 'bg-red-950/80', text: 'text-red-400' },
  traveler: { border: 'border-purple-500/50', bg: 'bg-purple-950/60', text: 'text-purple-300' },
};

// Storyteller's three demon-bluff slots plus the full-screen "show the demon" reveal overlay.
export default function DemonBluffs({ demonBluffs, onUpdateDemonBluffs, players, customScriptRoles, grimoireRolesData, isLightModeActive }: DemonBluffsProps) {
  const isMobile = useIsMobile();
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Good roles not assigned to any player — candidates for demon bluffs.
  const assignedRoleIds = useMemo(() => new Set(
    players.flatMap(p => p.roleIds && p.roleIds.length > 0 ? p.roleIds : (p.roleId ? [p.roleId] : []))
  ), [players]);

  const candidates = useMemo(() => {
    const base = customScriptRoles || (rolesData as Role[]);
    const goodRoles = base.filter(r => r.team === 'townsfolk' || r.team === 'outsider');
    const pool = showAll ? goodRoles : goodRoles.filter(r => !assignedRoleIds.has(r.id));
    return [...pool].sort((a, b) => a.name.localeCompare(b.name));
  }, [customScriptRoles, assignedRoleIds, showAll]);

  const filtered = useMemo(() => {
    if (!search.trim()) return candidates;
    const q = search.toLowerCase();
    return candidates.filter(r => r.name.toLowerCase().includes(q) || officialRoleAbility(r)?.toLowerCase().includes(q));
  }, [candidates, search]);

  useEffect(() => {
    if (pickerSlot !== null && !isMobile) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [pickerSlot, isMobile]);

  const setBluff = (slot: number, roleId: string) => {
    const next = [...demonBluffs];
    next[slot] = roleId;
    onUpdateDemonBluffs(next);
    setPickerSlot(null);
    setSearch('');
  };

  const clearBluff = (slot: number) => {
    const arr = [...demonBluffs];
    arr[slot] = '';
    onUpdateDemonBluffs(arr);
  };

  return (
    <>
      <div className="rounded-lg border p-3.5 space-y-2.5 bg-gray-900 border-gray-700">
        <div className="flex items-center justify-between">
          <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400">Demon Bluffs</h4>
          {demonBluffs.some(b => b) && (
            <button
              type="button"
              onClick={() => setOverlayOpen(true)}
              className="text-xs font-bold px-2 py-0.5 rounded bg-clocktower-blood text-white hover:opacity-90 transition-opacity"
            >
              Show Demon
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          {[0, 1, 2].map(slot => {
            const roleId = demonBluffs[slot] || '';
            const role = roleId ? grimoireRolesData.find(r => r.id === roleId) : null;
            return (
              <div key={slot} className="relative">
                {pickerSlot === slot ? (
                  <div className="rounded border p-2 space-y-1.5 bg-gray-950 border-gray-700">
                    <div className="flex items-center gap-1.5">
                      <Search size={11} className="text-gray-400 shrink-0" />
                      <input
                        ref={searchRef}
                        type="text"
                        placeholder="Search roles..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 text-xs bg-transparent focus:outline-none text-white placeholder-gray-500"
                      />
                      <button type="button" onClick={() => { setPickerSlot(null); setSearch(''); }}>
                        <X size={12} className="text-gray-400 hover:text-gray-200" />
                      </button>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-0.5">
                      {filtered.map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setBluff(slot, r.id)}
                          className="w-full text-left text-xs px-2 py-1 rounded transition-colors hover:bg-gray-800 text-gray-200"
                        >
                          <span className="font-medium">{r.name}</span>
                          <span className={cn('ml-1 text-[10px] font-semibold', TEAM_TEXT[r.team])}>
                            {TEAM_LABEL[r.team]}
                          </span>
                        </button>
                      ))}
                      {filtered.length === 0 && (
                        <p className="text-xs text-gray-500 px-2 py-1">No matching roles</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPickerSlot(slot)}
                      className={cn(
                        'flex-1 text-left text-xs px-2.5 py-1.5 rounded border transition-colors',
                        role
                          ? 'border-gray-700 bg-gray-800 text-white font-medium'
                          : 'border-dashed border-gray-700 text-gray-500 hover:border-gray-500'
                      )}
                    >
                      {role ? (
                        <span className="flex items-center gap-1.5">
                          <div className="w-5 h-5 shrink-0 rounded-full overflow-hidden bg-white flex items-center justify-center p-0.5">
                            <img key={role.id} src={`/icons/${role.id}.svg`} alt={role.name} className="w-full h-full object-contain" onError={roleIconFallback(role, role.team === 'minion' || role.team === 'demon')} />
                          </div>
                          <span>{role.name}</span>
                          <span className={cn('text-[10px] font-semibold', TEAM_TEXT[role.team])}>
                            {TEAM_LABEL[role.team]}
                          </span>
                        </span>
                      ) : (
                        `Bluff ${slot + 1}…`
                      )}
                    </button>
                    {role && (
                      <button
                        type="button"
                        onClick={() => clearBluff(slot)}
                        className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                        title="Clear"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none pt-0.5">
          <ToggleSwitch
            checked={showAll}
            onChange={setShowAll}
            isLightModeActive={isLightModeActive}
          />
          <span className="font-semibold">Lunatic Mode</span>
        </label>
      </div>

      {overlayOpen && createPortal(
        <div
          id="demon-bluffs-overlay"
          className="fixed inset-0 z-50 bg-gray-950 flex flex-col items-center justify-center gap-8 p-8 cursor-pointer"
          onClick={() => setOverlayOpen(false)}
        >
          <p className="text-gray-400 text-xs uppercase tracking-widest font-bold select-none">Demon Bluffs — tap to close</p>
          <div className="flex flex-col gap-5 w-full max-w-sm">
            {[0, 1, 2].map(slot => {
              const roleId = demonBluffs[slot] || '';
              const role = roleId ? grimoireRolesData.find(r => r.id === roleId) : null;
              const overlayColor = role ? TEAM_OVERLAY[role.team] : null;
              return (
                <div
                  key={slot}
                  className={cn(
                    'rounded-xl border-2 px-5 py-4 flex items-center gap-4',
                    overlayColor ? `${overlayColor.border} ${overlayColor.bg}` : 'border-gray-800 bg-gray-900/50'
                  )}
                >
                  {role ? (
                    <>
                      <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden bg-white flex items-center justify-center p-1">
                        <img
                          key={role.id}
                          src={`/icons/${role.id}.svg`}
                          alt={role.name}
                          className="w-full h-full object-contain"
                          onError={roleIconFallback(role, role.team === 'minion' || role.team === 'demon')}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-2xl font-extrabold', overlayColor?.text)}>{role.name}</p>
                        {officialRoleAbility(role) && (
                          <p className="text-sm text-gray-300 mt-1 leading-snug">{officialRoleAbility(role)}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-600 text-lg">—</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
