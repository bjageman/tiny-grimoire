import { useState } from 'react';
import { Plus, Search, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useScrollLock } from '../../hooks/useScrollLock';
import { roleIconFallback } from '../../utils/roleIcon';
import rolesData from '../../roles.json';
import type { Role } from '../../types';

type PrefTeam = 'townsfolk' | 'outsider' | 'minion' | 'demon';
type Prefs = Record<PrefTeam, string[]>;

interface PreferencesScreenProps {
  isLight: boolean;
  isMobile: boolean;
  prefs: Prefs;
  setPrefs: React.Dispatch<React.SetStateAction<Prefs>>;
  togglePreference: (team: PrefTeam, roleId: string) => void;
  excludedRoleIds: string[];
  onSubmit: () => void;
}

// Whale Bucket join flow: pick one preferred character per team, with a searchable select modal.
export default function PreferencesScreen({ isLight, isMobile, prefs, setPrefs, togglePreference, excludedRoleIds, onSubmit }: PreferencesScreenProps) {
  const [activePrefSelect, setActivePrefSelect] = useState<{ team: PrefTeam } | null>(null);
  useScrollLock(!!activePrefSelect);
  const [prefSearchTerm, setPrefSearchTerm] = useState('');

  return (
    <>
      <div className={cn(
        "border rounded-lg p-6 space-y-5 shadow-xl w-full max-w-md",
        isLight ? "bg-white border-gray-200" : "bg-gray-900/60 border-gray-800"
      )}>
        <div>
          <h2 className="font-display text-base font-bold text-center tracking-wider uppercase">Submit Your Preferences</h2>
          <p className="text-xs text-gray-500 text-center mt-0.5">Select one character in each category (optional)</p>
        </div>

        <div className="space-y-3.5">
          {(['townsfolk', 'outsider', 'minion', 'demon'] as const).map((team) => {
            const selectedRoleId = prefs[team][0];
            const selectedRole = selectedRoleId ? (rolesData as Role[]).find(r => r.id === selectedRoleId) : null;
            return (
              <div key={team} className="space-y-1.5">
                <label className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  team === 'townsfolk' && "text-clocktower-townsfolk",
                  team === 'outsider' && "text-clocktower-outsider",
                  team === 'minion' && "text-clocktower-minion",
                  team === 'demon' && "text-clocktower-demon"
                )}>
                  {team} Preference
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setActivePrefSelect({ team });
                    setPrefSearchTerm('');
                  }}
                  className={cn(
                    "w-full flex items-center justify-between border px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.01]",
                    selectedRole
                      ? isLight
                        ? "bg-white border-gray-300 shadow-sm"
                        : "bg-gray-900 border-gray-800 shadow-sm"
                      : isLight
                        ? "bg-gray-50 border-dashed border-gray-300 hover:bg-gray-100 text-gray-400"
                        : "bg-gray-950 border-dashed border-gray-800 hover:bg-gray-900/50 text-gray-500"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {selectedRole ? (
                      <>
                        <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center shrink-0 border border-gray-200 shadow-sm">
                          <img src={`/icons/${selectedRole.id}.svg`} alt={selectedRole.name} className="w-4 h-4 object-contain" />
                        </span>
                        <span className={cn(
                          "font-bold text-sm truncate",
                          team === 'townsfolk' && "text-clocktower-townsfolk",
                          team === 'outsider' && "text-clocktower-outsider",
                          team === 'minion' && "text-clocktower-minion",
                          team === 'demon' && "text-clocktower-demon"
                        )}>
                          {selectedRole.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} className="shrink-0" />
                        <span className="text-xs font-semibold">Select {team} preference...</span>
                      </>
                    )}
                  </div>
                  {selectedRole ? (
                    <span className="text-[10px] text-gray-400 hover:underline uppercase font-bold shrink-0">Change</span>
                  ) : (
                    <Search size={14} className="shrink-0" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={onSubmit}
          className="w-full bg-clocktower-blood text-white rounded-lg py-3 font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 mt-2 shadow-sm"
        >
          <Sparkles size={16} />
          <span>Submit Character Preferences</span>
        </button>
      </div>

      {activePrefSelect && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={cn(
            "border w-full max-w-sm rounded-lg p-4 space-y-4 max-h-[80vh] flex flex-col shadow-2xl transition-all duration-300",
            isLight ? "bg-white border-gray-250 text-gray-800" : "bg-gray-900 border-gray-800 text-gray-100"
          )}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className={cn(
                  "font-bold text-base font-serif",
                  isLight ? "text-clocktower-night" : "text-white"
                )}>
                  Select {activePrefSelect.team === 'townsfolk' ? 'Townsfolk' : activePrefSelect.team === 'outsider' ? 'Outsiders' : activePrefSelect.team === 'minion' ? 'Minions' : 'Demons'}
                </h3>
                <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                  For your {activePrefSelect.team} preference
                </p>
              </div>
              <button
                onClick={() => setActivePrefSelect(null)}
                className="text-xs text-clocktower-blood hover:underline font-bold"
              >
                Done
              </button>
            </div>

            <div className={cn(
              "flex items-center border rounded-lg px-2.5 text-xs py-1",
              isLight ? "bg-gray-50 border-gray-300 focus-within:border-clocktower-blood" : "bg-gray-950 border-gray-800 focus-within:border-clocktower-blood"
            )}>
              <Search size={14} className="text-gray-500 mr-2 flex-shrink-0" />
              <input
                type="text"
                autoFocus={!isMobile}
                placeholder="Search character name..."
                className="bg-transparent flex-1 outline-none text-xs placeholder-gray-500 h-8 w-full"
                value={prefSearchTerm}
                onChange={(e) => setPrefSearchTerm(e.target.value)}
              />
            </div>

            <div className={cn(
              "overflow-y-auto overscroll-contain flex-1 border rounded bg-gray-955/20 divide-y pr-1",
              isLight ? "border-gray-200 divide-gray-150" : "border-gray-855 divide-gray-800/60"
            )}>
              {(rolesData as Role[])
                .filter(r => r.team === activePrefSelect.team && !excludedRoleIds.includes(r.id) && r.name.toLowerCase().includes(prefSearchTerm.toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(role => {
                  const isSelected = prefs[activePrefSelect.team].includes(role.id);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        togglePreference(activePrefSelect.team, role.id);
                        setActivePrefSelect(null);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 text-xs transition-colors flex justify-between items-center",
                        isSelected
                          ? isLight ? "bg-red-50/50" : "bg-clocktower-blood/10"
                          : isLight ? "hover:bg-gray-50" : "hover:bg-gray-850"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0 border border-gray-100 shadow-sm">
                          <img
                            src={`/icons/${role.id}.svg`}
                            alt={role.name}
                            className="w-3.5 h-3.5 object-contain"
                            onError={roleIconFallback(role, role.team === 'minion' || role.team === 'demon')}
                          />
                        </span>
                        <span className={cn(
                          "font-bold text-xs truncate",
                          role.team === 'townsfolk' && "text-clocktower-townsfolk",
                          role.team === 'outsider' && "text-clocktower-outsider",
                          role.team === 'minion' && "text-clocktower-minion",
                          role.team === 'demon' && "text-clocktower-demon",
                        )}>
                          {role.name}
                        </span>
                      </div>
                      {isSelected ? (
                        <span className="text-[9px] bg-clocktower-blood/10 text-clocktower-blood border border-clocktower-blood/20 px-1.5 py-0.5 rounded font-black">
                          ✓ SELECTED
                        </span>
                      ) : (
                        <span className="text-[9px] text-gray-400 font-bold">+ SELECT</span>
                      )}
                    </button>
                  );
                })}
            </div>

            <div className="flex justify-between items-center pt-2.5 border-t border-gray-250 dark:border-gray-800">
              <button
                type="button"
                onClick={() => {
                  setPrefs(prev => ({ ...prev, [activePrefSelect.team]: [] }));
                  setActivePrefSelect(null);
                }}
                className="text-xs text-gray-500 hover:text-red-500 hover:underline"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={() => {
                  const available = (rolesData as Role[]).filter(r => r.team === activePrefSelect.team);
                  if (available.length > 0) {
                    const randIdx = Math.floor(Math.random() * available.length);
                    setPrefs(prev => ({ ...prev, [activePrefSelect.team]: [available[randIdx].id] }));
                  }
                  setActivePrefSelect(null);
                }}
                className="text-xs text-clocktower-townsfolk hover:underline font-semibold"
              >
                Select Random
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
