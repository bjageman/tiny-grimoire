import { useState } from 'react';
import type { Player } from '../../../types';
import { cn } from '../../../utils/cn';
import { PLAYABLE_ROLES } from '../../../utils/roleData';

interface AddTravelerCardProps {
  isLightModeActive: boolean;
  title: string;
  name: string;
  onNameChange: (value: string) => void;
  roleId: string;
  onRoleIdChange: (value: string) => void;
  disabled: boolean;
  spectators?: Pick<Player, 'id' | 'name'>[];
  onAdd: (spectatorId?: string) => void;
}

// Traveler name + role picker shown to the storyteller during a game.
export default function AddTravelerCard({ isLightModeActive, title, name, onNameChange, roleId, onRoleIdChange, disabled, spectators = [], onAdd }: AddTravelerCardProps) {
  const [selectedSpectatorId, setSelectedSpectatorId] = useState('');
  const [isSpectatorSearchFocused, setIsSpectatorSearchFocused] = useState(false);
  const selectedSpectator = spectators.find(spectator => spectator.id === selectedSpectatorId);
  const spectatorSuggestions = spectators.filter(spectator => spectator.name.toLowerCase().includes(name.toLowerCase()));

  return (
    <div className={cn(
      'rounded-lg border p-3.5 space-y-3 transition-colors duration-300',
      isLightModeActive
        ? 'bg-white/50 border-gray-300 text-clocktower-night'
        : 'bg-gray-900/40 border-gray-800/80'
    )}>
      <h4 className={cn(
        'text-xs uppercase font-bold tracking-wider',
        isLightModeActive ? 'text-gray-600' : 'text-gray-500'
      )}>{title}</h4>
      <div className="flex flex-col gap-2">
        <div className="relative">
          <input
            id="game-traveler-name-input"
            type="text"
            placeholder="Traveler name..."
            value={name}
            onChange={(e) => {
              onNameChange(e.target.value);
              setSelectedSpectatorId('');
            }}
            onFocus={() => setIsSpectatorSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSpectatorSearchFocused(false), 200)}
            autoCapitalize="words"
            className={cn(
              'w-full rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-clocktower-blood border transition-colors',
              isLightModeActive
                ? 'bg-white border-gray-300 text-clocktower-night'
                : 'bg-gray-955 border-gray-800 text-gray-200'
            )}
          />
          {isSpectatorSearchFocused && spectators.length > 0 && (
            <div className={cn(
              'absolute left-0 right-0 mt-1 border rounded-md shadow-xl z-20 max-h-48 overflow-y-auto',
              isLightModeActive ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'
            )}>
              {spectatorSuggestions.length === 0 ? (
                <div className="p-2 text-xs text-gray-500 italic">No matching spectators</div>
              ) : (
                spectatorSuggestions.map(spectator => (
                  <button
                    key={spectator.id}
                    type="button"
                    onClick={() => {
                      onNameChange(spectator.name);
                      setSelectedSpectatorId(spectator.id);
                      setIsSpectatorSearchFocused(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-xs transition-colors',
                      isLightModeActive
                        ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-950'
                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                    )}
                  >
                    {spectator.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <select
            id="game-traveler-role-select"
            value={roleId}
            onChange={(e) => onRoleIdChange(e.target.value)}
            className={cn(
              'flex-1 rounded px-2 py-1.5 text-xs focus:outline-none border transition-colors',
              isLightModeActive
                ? 'bg-white border-gray-300 text-clocktower-night focus:border-clocktower-blood'
                : 'bg-gray-950 border-gray-800 text-gray-200 focus:border-clocktower-blood'
            )}
          >
            {PLAYABLE_ROLES.filter(r => r.team === 'traveler').map(r => (
              <option key={r.id} value={r.id} className={isLightModeActive ? 'bg-white text-clocktower-night' : 'bg-gray-955 text-gray-200'}>
                {r.name}
              </option>
            ))}
          </select>
          <button
            id="game-add-traveler-button"
            onClick={() => {
              onAdd(selectedSpectator?.id);
              setSelectedSpectatorId('');
            }}
            disabled={disabled && !selectedSpectator}
            className={cn(
              'px-3 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-40 text-white shadow-sm',
              isLightModeActive
                ? 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
                : 'bg-clocktower-traveler hover:bg-purple-400 active:bg-purple-600'
            )}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
