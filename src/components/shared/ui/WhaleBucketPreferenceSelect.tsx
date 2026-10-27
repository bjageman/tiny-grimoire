import { useState } from 'react';
import type { Role } from '../../../types';
import { cn } from '../../../utils/cn';
import { getWhaleBucketPreferenceTeam } from '../../../utils/whaleBucketPreferences';
import { useEscapeKey } from '../../../hooks/useEscapeKey';
import CloseButton from './CloseButton';
import CharacterOptionRow from './CharacterOptionRow';
import RoleIcon from './RoleIcon';
import SearchInput from './SearchInput';

const TEAM_LABELS: Record<Role['team'], string> = {
  townsfolk: 'Townsfolk', outsider: 'Outsider', minion: 'Minion', demon: 'Demon', traveler: 'Traveler',
};
const TEAM_COLORS: Record<Role['team'], string> = {
  townsfolk: 'text-clocktower-townsfolk', outsider: 'text-clocktower-outsider', minion: 'text-clocktower-minion', demon: 'text-clocktower-demon', traveler: 'text-clocktower-traveler',
};

interface PreferenceSelectButtonProps {
  team: Role['team'];
  selectedRole?: Role;
  onClick: () => void;
}

export function PreferenceSelectButton({ team, selectedRole, onClick }: PreferenceSelectButtonProps) {
  return (
    <button
      type="button"
      aria-label={`Select ${team} preference`}
      onClick={onClick}
      className="w-full flex items-center justify-between bg-gray-955/40 px-4 py-3 sm:px-3 sm:py-2 rounded border border-gray-855 hover:bg-gray-900/40 hover:border-gray-800 transition-all"
    >
      <span className={cn('text-[10px] sm:text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border border-current/30', TEAM_COLORS[team])}>
        {TEAM_LABELS[team]}
      </span>
      <span className="flex items-center gap-1.5 min-w-0 ml-2">
        {selectedRole ? (
          <>
            <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0">
              <RoleIcon role={selectedRole} className="w-3.5 h-3.5" />
            </span>
            <span className={cn('text-sm sm:text-xs font-semibold truncate', TEAM_COLORS[selectedRole.team])}>{selectedRole.name}</span>
          </>
        ) : (
          <span className="text-sm sm:text-xs text-gray-500 italic">No preference</span>
        )}
        <span className="text-xs sm:text-[10px] text-gray-550 underline ml-1 shrink-0">Change</span>
      </span>
    </button>
  );
}

interface WhaleBucketPreferencePickerProps {
  team: Role['team'];
  currentRoleId?: string;
  roles: Role[];
  excludedRoleIds: string[];
  isLightModeActive: boolean;
  isMobile: boolean;
  onBack: () => void;
  onClose: () => void;
  onSelect: (roleId: string) => void;
  onClear: () => void;
  onRandom: (roleId: string) => void;
}

export default function WhaleBucketPreferencePicker({ team, currentRoleId, roles, excludedRoleIds, isLightModeActive, isMobile, onBack, onClose, onSelect, onClear, onRandom }: WhaleBucketPreferencePickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  useEscapeKey(onClose);
  const availableRoles = roles.filter(role => getWhaleBucketPreferenceTeam(role) === team && !excludedRoleIds.includes(role.id));
  const filteredRoles = availableRoles.filter(role => role.name.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Select ${TEAM_LABELS[team]}`}
        className={cn(
          'w-full max-w-sm rounded-lg p-4 space-y-3 max-h-[85vh] flex flex-col shadow-2xl',
          isLightModeActive ? 'bg-[#fdfaf2] border border-clocktower-blood/30 text-clocktower-night' : 'bg-gray-900 border border-gray-800'
        )}
        onClick={event => event.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <div>
            <button type="button" onClick={onBack} className="text-xs text-gray-500 hover:underline">&larr; Back</button>
            <h3 className="font-display font-bold text-sm text-white tracking-wider uppercase mt-1">Select {TEAM_LABELS[team]}</h3>
          </div>
          <CloseButton onClick={onClose} isLightModeActive={isLightModeActive} />
        </div>
        <SearchInput label="Search characters" placeholder="Search character name..." value={searchTerm} onChange={event => setSearchTerm(event.target.value)} autoFocus={!isMobile} containerClassName="px-2.5" />
        <div className="overflow-y-auto overscroll-contain flex-1 border border-gray-800 rounded bg-gray-955/40 divide-y divide-gray-800/60 pr-1">
          {filteredRoles.map(role => {
            const selected = role.id === currentRoleId;
            return (
              <CharacterOptionRow
                key={role.id}
                role={role}
                selected={selected}
                isLightModeActive={isLightModeActive}
                variant="preference"
                onClick={() => { onSelect(role.id); onBack(); }}
                className={cn(
                  'transition-colors',
                  isLightModeActive ? 'hover:bg-amber-50' : 'hover:bg-gray-800',
                  selected && (isLightModeActive ? 'bg-amber-50' : 'bg-gray-800/30')
                )}
                trailing={selected ? (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded font-black border shrink-0',
                    isLightModeActive ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  )}>✓ ACTIVE</span>
                ) : (
                  <span className="text-[9px] text-gray-650 font-mono shrink-0">+ ADD</span>
                )}
              >
              </CharacterOptionRow>
            );
          })}
          {filteredRoles.length === 0 && <div className="p-4 text-xs text-gray-500 italic text-center">No characters found.</div>}
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-gray-800">
          <button type="button" onClick={() => { onClear(); onBack(); }} className="text-xs text-gray-500 hover:text-red-400 hover:underline">Clear Selection</button>
          <button
            type="button"
            disabled={availableRoles.length === 0}
            onClick={() => {
              if (availableRoles.length > 0) onRandom(availableRoles[Math.floor(Math.random() * availableRoles.length)].id);
              onBack();
            }}
            className="text-xs text-clocktower-townsfolk hover:underline font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >Select Random</button>
        </div>
      </div>
    </div>
  );
}
